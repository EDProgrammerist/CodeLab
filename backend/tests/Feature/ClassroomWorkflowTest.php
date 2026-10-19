<?php

namespace Tests\Feature;

use App\Http\Middleware\RequireCsrfToken;
use App\Models\Activity;
use App\Models\Classroom;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ClassroomWorkflowTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function payload(): array
    {
        return ['title' => 'Programming 1', 'course_code' => 'CC101', 'section_label' => '1-A', 'academic_year_start' => 2026, 'academic_year_end' => 2027, 'semester' => 'First', 'term_end_date' => '2027-03-31', 'timezone' => 'Asia/Manila', 'schedules' => [['class_session' => 'oc', 'day_of_week' => 1, 'starts_at' => '09:00', 'ends_at' => '10:00'], ['class_session' => 'lab', 'day_of_week' => 2, 'starts_at' => '13:00', 'ends_at' => '16:00']]];
    }

    public function test_year_levels_are_saved_and_validated(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'instructor']));
        foreach (['First', 'Second', 'Third', 'Fourth'] as $level) {
            $this->postJson('/api/v1/classrooms', [...$this->payload(), 'year_level' => $level])->assertCreated()->assertJsonPath('data.year_level', $level);
        }
        $this->postJson('/api/v1/classrooms', [...$this->payload(), 'year_level' => 'Fifth'])->assertUnprocessable()->assertJsonValidationErrors('year_level');
    }

    public function test_only_owner_can_delete_classroom_and_all_access_is_removed(): void
    {
        $class = Classroom::factory()->create();
        $activity = Activity::factory()->create(['classroom_id' => $class->id]);
        $student = User::factory()->create();
        $class->memberships()->create(['student_id' => $student->id, 'status' => 'active', 'joined_at' => now()]);
        $base = '/api/v1/classrooms/'.$class->id;
        $this->deleteJson($base)->assertUnauthorized();
        $this->actingAs($student)->deleteJson($base)->assertNotFound();
        $this->actingAs(User::factory()->create(['role' => 'instructor']))->deleteJson($base)->assertNotFound();
        $this->actingAs($class->instructor);
        $code = $this->putJson($base.'/invitation', ['expires_at' => now()->addHour()->toISOString()])->assertOk()->json('data.invitation_code');
        $this->deleteJson($base)->assertNoContent();
        $this->assertSoftDeleted('classrooms', ['id' => $class->id]);
        $this->assertDatabaseHas('activities', ['id' => $activity->id]);
        $this->assertNotNull(DB::table('classroom_invitations')->where('classroom_id', $class->id)->value('revoked_at'));
        $this->getJson('/api/v1/classrooms')->assertJsonCount(0, 'data');
        $this->getJson($base)->assertNotFound();
        $this->getJson($base.'/activities/'.$activity->id)->assertNotFound();
        $this->actingAs($student)->getJson('/api/v1/classrooms')->assertJsonCount(0, 'data');
        $this->postJson('/api/v1/classroom-joins', ['invitation_code' => $code])->assertNotFound();
        $this->postJson($base.'/activities/'.$activity->id.'/submissions', [])->assertNotFound();
    }

    public function test_section_semester_and_years_are_sufficient_to_create_a_classroom(): void
    {
        $instructor = User::factory()->create(['role' => 'instructor']);
        $this->actingAs($instructor)->postJson('/api/v1/classrooms', [
            'section_label' => 'BSIT 1-A', 'semester' => 'First',
            'academic_year_start' => 2026, 'academic_year_end' => 2027,
        ])->assertCreated()->assertJsonPath('data.title', 'BSIT 1-A')
            ->assertJsonPath('data.timezone', 'Asia/Manila')->assertJsonPath('data.term_end_date', '2027-12-31');
        $this->assertDatabaseHas('classrooms', ['instructor_id' => $instructor->id, 'section_label' => 'BSIT 1-A']);
    }

    public function test_summer_cannot_be_selected(): void
    {
        $class = Classroom::factory()->create();
        $this->actingAs($class->instructor)->patchJson('/api/v1/classrooms/'.$class->id, ['semester' => 'Summer'])->assertUnprocessable()->assertJsonValidationErrors('semester');
        $this->assertSame('First', $class->fresh()->semester);
    }

    public function test_owner_creates_classroom_with_weekly_schedules_and_private_lists(): void
    {
        $owner = User::factory()->create(['role' => 'instructor']);
        $other = User::factory()->create(['role' => 'instructor']);
        $this->getJson('/api/v1/classrooms')->assertUnauthorized();
        $created = $this->actingAs($owner)->postJson('/api/v1/classrooms', $this->payload())->assertCreated()->assertJsonCount(2, 'data.schedules');
        $id = $created->json('data.id');
        $this->assertDatabaseHas('classrooms', ['id' => $id, 'instructor_id' => $owner->id]);
        $this->assertDatabaseHas('audit_events', ['action' => 'classroom.created']);
        $this->actingAs($other)->getJson('/api/v1/classrooms')->assertJsonCount(0, 'data');
        $this->patchJson('/api/v1/classrooms/'.$id, ['title' => 'Steal'])->assertNotFound();
        $this->actingAs(User::factory()->create())->postJson('/api/v1/classrooms', $this->payload())->assertForbidden();
        $this->actingAs($owner)->postJson('/api/v1/classrooms', [...$this->payload(), 'instructor_id' => $other->id])->assertUnprocessable()->assertJsonValidationErrors('instructor_id');
    }

    public function test_calendar_and_overlapping_weekly_slots_are_validated(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'instructor']));
        $this->postJson('/api/v1/classrooms', [...$this->payload(), 'academic_year_end' => 2030])->assertUnprocessable()->assertJsonValidationErrors('academic_year_end');
        $this->postJson('/api/v1/classrooms', [...$this->payload(), 'timezone' => 'Not/AZone'])->assertUnprocessable()->assertJsonValidationErrors('timezone');
        $this->postJson('/api/v1/classrooms', [...$this->payload(), 'schedules' => [['class_session' => 'lab', 'day_of_week' => 1, 'starts_at' => '10:00', 'ends_at' => '09:00']]])->assertUnprocessable()->assertJsonValidationErrors('schedules.0.ends_at');
        $this->postJson('/api/v1/classrooms', [...$this->payload(), 'schedules' => [$this->payload()['schedules'][0], $this->payload()['schedules'][0]]])->assertUnprocessable()->assertJsonValidationErrors('schedules');
    }

    public function test_invitation_rotation_expiry_revocation_and_removed_membership(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 13));
        $class = Classroom::factory()->create();
        $owner = $class->instructor;
        $student = User::factory()->create();
        $path = '/api/v1/classrooms/'.$class->id;
        $first = $this->actingAs($owner)->putJson($path.'/invitation', ['expires_at' => now()->addDay()->toISOString()])->assertOk()->json('data.invitation_code');
        $second = $this->putJson($path.'/invitation', ['expires_at' => now()->addDay()->toISOString()])->assertOk()->json('data.invitation_code');
        $this->assertNotSame($first, $second);
        $this->assertDatabaseMissing('classroom_invitations', ['code_digest' => $second]);
        $this->getJson($path.'/invitation')->assertJsonMissingPath('data.invitation_code')->assertJsonMissingPath('data.code_digest');
        $this->actingAs($student)->postJson('/api/v1/classroom-joins', ['invitation_code' => $first])->assertUnprocessable();
        $member = $this->postJson('/api/v1/classroom-joins', ['invitation_code' => $second])->assertCreated()->json('data.id');
        $this->postJson('/api/v1/classroom-joins', ['invitation_code' => $second])->assertOk()->assertJsonPath('data.id', $member);
        $this->assertDatabaseCount('classroom_memberships', 1);
        $this->actingAs($owner)->patchJson($path.'/memberships/'.$member, ['status' => 'removed'])->assertOk();
        $this->actingAs($student)->getJson($path)->assertNotFound();
        $this->postJson('/api/v1/classroom-joins', ['invitation_code' => $second])->assertConflict();
        $joined = DB::table('classroom_memberships')->value('joined_at');
        $this->actingAs($owner)->patchJson($path.'/memberships/'.$member, ['status' => 'active'])->assertOk();
        $this->assertSame($joined, DB::table('classroom_memberships')->value('joined_at'));
        $this->travel(2)->days();
        $this->actingAs($student)->postJson('/api/v1/classroom-joins', ['invitation_code' => $second])->assertUnprocessable();
        $this->actingAs($owner)->deleteJson($path.'/invitation')->assertNoContent();
        $this->assertNotNull(DB::table('classroom_invitations')->value('revoked_at'));
    }

    public function test_archive_preserves_history_and_blocks_writes_and_nested_membership_ids(): void
    {
        $class = Classroom::factory()->create();
        $other = Classroom::factory()->create();
        $member = $other->memberships()->create(['student_id' => User::factory()->create()->id, 'status' => 'active', 'joined_at' => now()]);
        $path = '/api/v1/classrooms/'.$class->id;
        $this->actingAs($class->instructor)->patchJson($path.'/memberships/'.$member->id, ['status' => 'removed'])->assertNotFound();
        $this->patchJson($path, ['status' => 'archived'])->assertOk()->assertJsonPath('data.status', 'archived');
        $this->getJson($path)->assertOk();
        $this->patchJson($path, ['title' => 'Change'])->assertNotFound();
        $this->putJson($path.'/invitation', ['expires_at' => now()->addDay()->toISOString()])->assertNotFound();
    }

    public function test_late_join_and_reactivation_preserve_allocation_decisions(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 13));
        $class = Classroom::factory()->create();
        $closed = Activity::factory()->create(['classroom_id' => $class->id, 'status' => 'published', 'published_at' => now()->subDays(2), 'deadline_at' => now()->subDay()]);
        $open = Activity::factory()->create(['classroom_id' => $class->id, 'status' => 'published', 'published_at' => now()->subDay()]);
        $code = $this->actingAs($class->instructor)->putJson('/api/v1/classrooms/'.$class->id.'/invitation', ['expires_at' => now()->addDay()->toISOString()])->json('data.invitation_code');
        $student = User::factory()->create();
        $member = $this->actingAs($student)->postJson('/api/v1/classroom-joins', ['invitation_code' => $code])->assertCreated()->json('data.id');
        $this->assertDatabaseHas('activity_allocations', ['activity_id' => $closed->id, 'membership_id' => $member, 'status' => 'not_assigned']);
        $this->assertDatabaseHas('activity_allocations', ['activity_id' => $open->id, 'membership_id' => $member, 'status' => 'assigned']);
        $this->actingAs($class->instructor)->patchJson('/api/v1/classrooms/'.$class->id.'/activities/'.$closed->id, ['deadline_at' => now()->addDay()->toISOString()])->assertOk();
        $this->patchJson('/api/v1/classrooms/'.$class->id.'/memberships/'.$member, ['status' => 'removed'])->assertOk();
        $later = Activity::factory()->create(['classroom_id' => $class->id, 'status' => 'published', 'published_at' => now()]);
        $this->patchJson('/api/v1/classrooms/'.$class->id.'/memberships/'.$member, ['status' => 'active'])->assertOk();
        $this->assertDatabaseHas('activity_allocations', ['activity_id' => $later->id, 'membership_id' => $member, 'status' => 'assigned']);
        $this->assertDatabaseHas('activity_allocations', ['activity_id' => $closed->id, 'membership_id' => $member, 'status' => 'not_assigned']);
    }

    public function test_join_throttles_and_unverified_roles_cannot_enroll(): void
    {
        $this->actingAs(User::factory()->unverified()->create())->postJson('/api/v1/classroom-joins', ['invitation_code' => 'INVALID'])->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'instructor']))->postJson('/api/v1/classroom-joins', ['invitation_code' => 'INVALID'])->assertForbidden();
        $this->actingAs(User::factory()->create());
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/classroom-joins', ['invitation_code' => 'INVALID'])->assertUnprocessable();
        }
        $this->postJson('/api/v1/classroom-joins', ['invitation_code' => 'INVALID'])->assertTooManyRequests()->assertHeader('Retry-After');
    }

    public function test_api_mutations_require_csrf_for_stateful_browser_requests(): void
    {
        $this->app->bind(RequireCsrfToken::class, fn ($app) => new class($app, $app['encrypter']) extends RequireCsrfToken
        {
            protected function runningUnitTests(): bool
            {
                return false;
            }
        });
        $this->actingAs(User::factory()->create(['role' => 'instructor']))
            ->withHeader('Origin', 'http://127.0.0.1:5173')->withHeader('Sec-Fetch-Site', 'same-origin')
            ->postJson('/api/v1/classrooms', $this->payload())->assertStatus(419);
        $this->postJson('/api/v1/profile', ['name' => 'CSRF change'])->assertStatus(419);
        $this->assertDatabaseCount('classrooms', 0);
    }
}
