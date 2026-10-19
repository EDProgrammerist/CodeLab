<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function photo(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('avatar.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='));
    }

    public function test_profile_requires_an_active_verified_session(): void
    {
        $this->postJson('/api/v1/profile', ['name' => 'New name'])->assertUnauthorized();
        $this->getJson('/api/v1/profile/photo')->assertUnauthorized();
        $this->actingAs(User::factory()->unverified()->create())->postJson('/api/v1/profile', ['name' => 'New name'])->assertForbidden();
        $this->actingAs(User::factory()->create(['disabled_at' => now()]))->postJson('/api/v1/profile', ['name' => 'New name'])->assertUnauthorized();
    }

    public function test_student_can_update_own_profile_but_not_role_or_another_user(): void
    {
        $user = User::factory()->create(['student_number' => 'S-1']);
        $other = User::factory()->create(['student_number' => 'S-2']);
        $this->actingAs($user)->postJson('/api/v1/profile', ['name' => 'Updated student', 'student_number' => 'S-3', 'section' => 'BSIT-2A'])->assertOk()->assertJsonPath('data.section', 'BSIT-2A')->assertJsonPath('data.name', 'Updated student');
        $this->assertDatabaseHas('users', ['id' => $other->id, 'student_number' => 'S-2']);
        $this->postJson('/api/v1/profile', ['name' => 'Student', 'student_number' => 'S-2'])->assertUnprocessable()->assertJsonValidationErrors('student_number');
        $this->postJson('/api/v1/profile', ['name' => 'Student'])->assertUnprocessable()->assertJsonValidationErrors('student_number');
        $this->postJson('/api/v1/profile', ['name' => 'Student', 'student_number' => 'S-3', 'role' => 'instructor', 'id' => $other->id])->assertUnprocessable()->assertJsonValidationErrors(['role', 'id']);
        $this->assertSame('student', $user->fresh()->role);
    }

    public function test_instructor_profile_and_private_photo_replacement(): void
    {
        Storage::fake('local');
        $user = User::factory()->create(['role' => 'instructor']);
        $response = $this->actingAs($user)->post('/api/v1/profile', ['name' => 'Instructor', 'photo' => $this->photo()], ['Accept' => 'application/json'])->assertOk();
        $old = $user->fresh()->profile_photo_path;
        Storage::disk('local')->assertExists($old);
        $response->assertJsonMissingPath('data.profile_photo_path');
        $firstUrl = $response->json('data.photo_url');
        $this->actingAs($user->fresh())->get($firstUrl)->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('Content-Type', 'image/png');
        $this->post('/api/v1/profile', ['name' => 'Instructor', 'photo' => $this->photo()], ['Accept' => 'application/json'])->assertOk();
        Storage::disk('local')->assertMissing($old);
        Storage::disk('local')->assertExists($user->fresh()->profile_photo_path);
        $this->postJson('/api/v1/profile', ['name' => 'Instructor', 'student_number' => 'FAKE', 'section' => 'A'])->assertUnprocessable()->assertJsonValidationErrors(['student_number', 'section']);
        $this->actingAs(User::factory()->create())->getJson($firstUrl)->assertNotFound();
    }

    public function test_unsafe_photos_are_rejected_without_changing_profile(): void
    {
        Storage::fake('local');
        $user = User::factory()->create(['role' => 'instructor']);
        foreach ([UploadedFile::fake()->createWithContent('bad.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), UploadedFile::fake()->create('huge.png', 2049, 'image/png')] as $photo) {
            $this->actingAs($user)->post('/api/v1/profile', ['name' => 'Changed', 'photo' => $photo], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('photo');
        }
        $this->assertSame($user->name, $user->fresh()->name);
        $this->assertEmpty(Storage::disk('local')->allFiles());
    }
}
