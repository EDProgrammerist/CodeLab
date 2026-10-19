<?php

namespace Tests\Feature;

use App\Http\Middleware\RequireCsrfToken;
use App\Models\Classroom;
use App\Models\User;
use App\Policies\ClassroomPolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_malformed_email_fields_are_validation_errors_not_server_errors(): void
    {
        $this->postJson('/auth/login', ['email' => ['unexpected'], 'password' => 'Long-test-password-42'])->assertUnprocessable();
        $this->postJson('/auth/forgot-password', ['email' => ['unexpected']])->assertUnprocessable();
    }

    public function test_bearer_tokens_cannot_authenticate_or_trigger_token_storage_queries(): void
    {
        $this->withToken('not-a-supported-credential')->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_stateful_spa_session_reaches_the_api_with_sanctum_session_middleware(): void
    {
        $user = User::factory()->create(['password' => 'Stateful-password-42']);
        $this->withHeader('Origin', 'http://127.0.0.1:5173')->postJson('/auth/login', ['email' => $user->email, 'password' => 'Stateful-password-42'])->assertOk();
        $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.id', (string) $user->id);
        $this->getJson('/api/v1/student/dashboard')->assertOk();
    }

    private function registration(array $extra = []): array
    {
        return array_merge(['student_number' => 'S-100', 'name' => 'Test Student', 'email' => 'student@example.test', 'password' => 'Long-test-password-42', 'password_confirmation' => 'Long-test-password-42'], $extra);
    }

    public function test_student_number_is_required(): void
    {
        $this->postJson('/auth/register', $this->registration(['student_number' => null]))->assertUnprocessable()->assertJsonValidationErrors('student_number');
        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_creates_unverified_student_and_sends_mail(): void
    {
        Notification::fake();
        $this->postJson('/auth/register', $this->registration(['email' => 'STUDENT@EXAMPLE.TEST', 'student_number' => 'S-101']))->assertCreated()->assertJsonPath('data.role', 'student')->assertJsonPath('data.email_verified_at', null)->assertJsonMissingPath('data.password');
        $user = User::firstOrFail();
        $this->assertTrue(Hash::check('Long-test-password-42', $user->password));
        $this->assertDatabaseHas('users', ['email' => 'student@example.test', 'student_number' => 'S-101', 'role' => 'student']);
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->getJson('/api/v1/student/dashboard')->assertForbidden();
    }

    public function test_registration_rejects_role_and_verification_escalation(): void
    {
        $this->postJson('/auth/register', $this->registration(['role' => 'instructor', 'email_verified_at' => now()->toISOString()]))->assertUnprocessable()->assertJsonValidationErrors(['role', 'email_verified_at']);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_rejects_duplicates_and_weak_passwords(): void
    {
        User::factory()->create(['email' => 'student@example.test', 'student_number' => 'S-101']);
        $this->postJson('/auth/register', $this->registration(['student_number' => 'S-101', 'password' => 'short', 'password_confirmation' => 'different']))->assertUnprocessable()->assertJsonValidationErrors(['email', 'student_number', 'password']);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_login_rotates_session_and_returns_only_safe_profile(): void
    {
        $user = User::factory()->create(['password' => 'Long-test-password-42']);
        $this->withSession(['marker' => true]);
        $before = session()->getId();
        $response = $this->postJson('/auth/login', ['email' => strtoupper($user->email), 'password' => 'Long-test-password-42'])->assertOk();
        $this->assertNotSame($before, session()->getId());
        $this->assertSame(['id', 'name', 'email', 'role', 'student_number', 'section', 'photo_url', 'email_verified_at'], array_keys($response->json('data')));
        $this->assertAuthenticatedAs($user);
    }

    public function test_bad_and_disabled_credentials_receive_generic_errors(): void
    {
        $user = User::factory()->create(['disabled_at' => now(), 'password' => 'Long-test-password-42']);
        $a = $this->postJson('/auth/login', ['email' => $user->email, 'password' => 'Long-test-password-42'])->assertUnprocessable();
        $b = $this->postJson('/auth/login', ['email' => 'absent@example.test', 'password' => 'Long-test-password-42'])->assertUnprocessable();
        $this->assertSame($a->json('errors'), $b->json('errors'));
        $this->assertGuest();
    }

    public function test_dashboard_enforces_authentication_and_role(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
        $student = User::factory()->create();
        $this->actingAs($student)->getJson('/api/v1/student/dashboard')->assertOk();
        $this->getJson('/api/v1/instructor/dashboard')->assertForbidden();
        $instructor = User::factory()->create(['role' => 'instructor']);
        $this->actingAs($instructor)->getJson('/api/v1/instructor/dashboard')->assertOk();
        $this->getJson('/api/v1/student/dashboard')->assertForbidden();
        $instructor->forceFill(['disabled_at' => now()])->save();
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_logout_invalidates_session_and_private_responses_are_not_cached(): void
    {
        $this->actingAs(User::factory()->create())->getJson('/api/v1/me')->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $this->postJson('/auth/logout')->assertNoContent();
        $this->assertGuest('web');
        Auth::forgetGuards();
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_signed_verification_is_bound_to_user_and_expires(): void
    {
        $user = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->id, 'hash' => sha1($user->email)], absolute: false);
        $this->actingAs(User::factory()->create())->getJson($url)->assertForbidden();
        $this->actingAs($user)->getJson($url.'&tampered=1')->assertForbidden();
        $this->travel(61)->minutes();
        $this->getJson($url)->assertForbidden();
        $this->travelBack();
        $this->get($url)->assertRedirect('/verify-email?verified=1');
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_browser_verification_errors_offer_recovery_without_verifying_the_wrong_account(): void
    {
        $recipient = User::factory()->unverified()->create();
        $other = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $recipient->id, 'hash' => sha1($recipient->email)], absolute: false);
        $this->actingAs($other)->get($url)->assertRedirect('/verify-email?error=invalid-link');
        $this->assertNull($recipient->fresh()->email_verified_at);
        $this->assertNull($other->fresh()->email_verified_at);
        $this->actingAs($recipient)->get($url.'&tampered=1')->assertRedirect('/verify-email?error=invalid-link');
        $this->assertNull($recipient->fresh()->email_verified_at);
    }

    public function test_resend_throttling_does_not_block_a_valid_verification_link(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();
        $this->actingAs($user);
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/auth/email/verification-notification')->assertOk();
        }
        $this->postJson('/auth/email/verification-notification')->assertTooManyRequests();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->id, 'hash' => sha1($user->email)], absolute: false);
        for ($i = 0; $i < 3; $i++) {
            $this->get($url)->assertRedirect('/verify-email?verified=1');
        }
        $this->get($url)->assertRedirect('/verify-email?error=too-many-requests');
        $this->getJson($url)->assertTooManyRequests();
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_verification_resend_is_authenticated_and_throttled(): void
    {
        Notification::fake();
        $this->postJson('/auth/email/verification-notification')->assertUnauthorized();
        $user = User::factory()->unverified()->create();
        $this->actingAs($user);
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/auth/email/verification-notification')->assertOk();
        }
        $this->postJson('/auth/email/verification-notification')->assertTooManyRequests();
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_recovery_is_neutral_and_reset_revokes_sessions_and_token(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $a = $this->postJson('/auth/forgot-password', ['email' => $user->email])->assertOk();
        $b = $this->postJson('/auth/forgot-password', ['email' => 'missing@example.test'])->assertOk();
        $this->assertSame($a->json(), $b->json());
        Notification::assertSentTo($user, ResetPassword::class);
        $token = Password::createToken($user);
        DB::table('sessions')->insert(['id' => 'old-session', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);
        $data = ['token' => $token, 'email' => $user->email, 'password' => 'Changed-password-42', 'password_confirmation' => 'Changed-password-42'];
        $this->postJson('/auth/reset-password', $data)->assertOk();
        $this->assertTrue(Hash::check('Changed-password-42', $user->fresh()->password));
        $this->assertDatabaseMissing('sessions', ['id' => 'old-session']);
        $this->postJson('/auth/reset-password', $data)->assertUnprocessable();
    }

    public function test_reset_rejects_wrong_account_expired_and_bad_tokens(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $token = Password::createToken($user);
        $data = ['token' => $token, 'email' => $other->email, 'password' => 'Changed-password-42', 'password_confirmation' => 'Changed-password-42'];
        $this->postJson('/auth/reset-password', $data)->assertUnprocessable();
        $this->travel(61)->minutes();
        $data['email'] = $user->email;
        $this->postJson('/auth/reset-password', $data)->assertUnprocessable();
        $data['token'] = 'invalid';
        $this->postJson('/auth/reset-password', $data)->assertUnprocessable();
    }

    public function test_login_and_registration_are_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/auth/login', ['email' => 'missing@example.test', 'password' => 'Wrong-password-42'])->assertUnprocessable();
        }
        $this->postJson('/auth/login', ['email' => 'missing@example.test', 'password' => 'Wrong-password-42'])->assertTooManyRequests()->assertHeader('Retry-After');
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/auth/register', [])->assertUnprocessable();
        }
        $this->postJson('/auth/register', [])->assertTooManyRequests();
    }

    public function test_csrf_middleware_rejects_missing_and_wrong_tokens_even_same_origin(): void
    {
        $this->app->bind(RequireCsrfToken::class, fn ($app) => new class($app, $app['encrypter']) extends RequireCsrfToken
        {
            protected function runningUnitTests(): bool
            {
                return false;
            }
        });
        $this->withHeader('Sec-Fetch-Site', 'same-origin')->postJson('/auth/login', [])->assertStatus(419);
        $this->withSession(['_token' => 'correct-token'])->withHeader('X-CSRF-TOKEN', 'wrong-token')->postJson('/auth/logout')->assertStatus(419);
        $this->withHeader('X-CSRF-TOKEN', 'correct-token')->postJson('/auth/logout')->assertNoContent();
    }

    public function test_instructor_provisioning_has_no_shared_password_or_public_endpoint(): void
    {
        Notification::fake();
        $this->artisan('codelab:provision-instructor', ['email' => 'teacher@example.test', '--name' => 'Test Teacher'])->assertSuccessful();
        $user = User::where('email', 'teacher@example.test')->firstOrFail();
        $this->assertSame('instructor', $user->role);
        $this->assertNull($user->email_verified_at);
        Notification::assertSentTo($user, ResetPassword::class);
        $this->artisan('codelab:provision-instructor', ['email' => 'teacher@example.test', '--name' => 'Duplicate'])->assertFailed();
        $this->postJson('/auth/instructors', [])->assertNotFound();
    }

    public function test_classroom_policy_covers_owners_members_removed_students_and_strangers(): void
    {
        $classroom = Classroom::factory()->create();
        $owner = User::findOrFail($classroom->instructor_id);
        $student = User::factory()->create();
        $stranger = User::factory()->create();
        $otherOwner = User::factory()->create(['role' => 'instructor']);
        DB::table('classroom_memberships')->insert(['classroom_id' => $classroom->id, 'student_id' => $student->id, 'status' => 'active', 'joined_at' => now()]);
        $policy = new ClassroomPolicy;
        $this->assertTrue($policy->view($owner, $classroom)->allowed());
        $this->assertTrue($policy->update($owner, $classroom)->allowed());
        $this->assertTrue($policy->view($student, $classroom)->allowed());
        $this->assertFalse($policy->update($student, $classroom)->allowed());
        $this->assertFalse($policy->view($stranger, $classroom)->allowed());
        $this->assertFalse($policy->view($otherOwner, $classroom)->allowed());
        $this->actingAs($otherOwner)->getJson('/api/v1/classrooms/'.$classroom->id)->assertNotFound();
        $this->actingAs($student)->getJson('/api/v1/classrooms/'.$classroom->id)->assertOk()->assertJsonMissingPath('data.instructor_id');
        DB::table('classroom_memberships')->where('student_id', $student->id)->update(['status' => 'removed']);
        $this->getJson('/api/v1/classrooms/'.$classroom->id)->assertNotFound();
        $classroom->status = 'archived';
        $this->assertFalse($policy->update($owner, $classroom)->allowed());
    }
}
