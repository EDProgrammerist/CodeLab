<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Classroom;
use App\Models\Language;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ActivityWorkflowTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function payload(): array
    {
        return ['title' => 'Sum', 'instructions' => 'Read and add.', 'grading_period' => 'prelim', 'class_session' => 'lab', 'activity_type' => 'assignment', 'language_id' => (string) Language::firstOrFail()->id, 'max_points' => 100, 'deadline_at' => '2026-11-01T12:00:00+08:00', 'tests' => [['position' => 1, 'visibility' => 'public', 'stdin' => " 2 3\n", 'expected_stdout' => "5\n", 'explanation' => 'Example'], ['position' => 2, 'visibility' => 'hidden', 'stdin' => 'PRIVATE INPUT', 'expected_stdout' => 'PRIVATE OUTPUT', 'explanation' => 'SECRET EXPLANATION']]];
    }

    public function test_create_and_publish_is_atomic_and_allocates_students(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 13));
        $class = Classroom::factory()->create();
        $student = User::factory()->create();
        $member = $class->memberships()->create(['student_id' => $student->id, 'status' => 'active', 'joined_at' => now()]);
        $base = '/api/v1/classrooms/'.$class->id.'/activities';
        $this->actingAs($class->instructor);
        $this->postJson($base, [...$this->payload(), 'status' => 'published', 'deadline_at' => '2026-10-12T00:00:00Z'])->assertUnprocessable();
        $this->assertDatabaseCount('activities', 0);
        $id = $this->postJson($base, [...$this->payload(), 'status' => 'published', 'tests' => []])->assertCreated()->assertJsonPath('data.status', 'published')->json('data.id');
        $this->assertDatabaseHas('activity_allocations', ['activity_id' => $id, 'membership_id' => $member->id, 'status' => 'assigned']);
        $this->actingAs($student)->getJson($base.'/'.$id)->assertOk()->assertJsonPath('data.instructions', 'Read and add.');
        $this->postJson($base, [...$this->payload(), 'status' => 'published'])->assertNotFound();
    }

    public function test_publication_allocations_hidden_serialization_and_whitespace(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 13));
        $class = Classroom::factory()->create();
        $student = User::factory()->create();
        $member = $class->memberships()->create(['student_id' => $student->id, 'status' => 'active', 'joined_at' => now()]);
        $base = '/api/v1/classrooms/'.$class->id.'/activities';
        $id = $this->actingAs($class->instructor)->postJson($base, $this->payload())->assertCreated()->json('data.id');
        $this->assertDatabaseHas('test_cases', ['activity_id' => $id, 'stdin' => " 2 3\n", 'expected_stdout' => "5\n"]);
        $this->actingAs($student)->getJson($base)->assertJsonCount(0, 'data');
        $this->getJson($base.'/'.$id)->assertNotFound();
        $this->actingAs($class->instructor)->patchJson($base.'/'.$id, ['status' => 'published'])->assertOk();
        $this->assertDatabaseHas('activity_allocations', ['activity_id' => $id, 'membership_id' => $member->id, 'status' => 'assigned']);
        $this->patchJson('/api/v1/classrooms/'.$class->id, ['semester' => 'Second'])->assertConflict();
        $response = $this->actingAs($student)->getJson($base.'/'.$id)->assertOk()->assertJsonPath('data.allocation_status', 'assigned')->assertJsonCount(1, 'data.public_examples')->assertJsonMissingPath('data.tests')->assertJsonMissingPath('data.assessment_digest');
        $this->assertStringNotContainsString('PRIVATE', $response->getContent());
        $this->assertStringNotContainsString('SECRET', $response->getContent());
        $this->getJson($base.'/'.$id.'/test-cases')->assertForbidden();
        $this->getJson($base.'?status=draft')->assertJsonCount(0, 'data');
        $this->patchJson($base.'/'.$id, ['title' => 'Hijack'])->assertNotFound();
    }

    public function test_publication_validation_and_published_freeze_extensions_and_suite_lock(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 13));
        $class = Classroom::factory()->create();
        $base = '/api/v1/classrooms/'.$class->id.'/activities';
        $this->actingAs($class->instructor);
        $this->postJson($base, [...$this->payload(), 'submission_limit' => 5])->assertUnprocessable()->assertJsonValidationErrors('submission_limit');
        $this->postJson($base, [...$this->payload(), 'deadline_at' => '2026-11-01T12:00:00'])->assertUnprocessable()->assertJsonValidationErrors('deadline_at');
        $id = $this->postJson($base, [...$this->payload(), 'tests' => []])->assertCreated()->json('data.id');
        $this->patchJson($base.'/'.$id, ['status' => 'published'])->assertOk()->assertJsonPath('data.max_points', '100.00');
        $this->patchJson($base.'/'.$id, ['tests' => $this->payload()['tests'], 'status' => 'published'])->assertOk();
        $digest = Activity::findOrFail($id)->assessment_digest;
        $this->patchJson($base.'/'.$id, ['title' => 'Changed'])->assertConflict();
        $this->patchJson($base.'/'.$id, ['max_points' => 99])->assertConflict();
        $this->patchJson($base.'/'.$id, ['deadline_at' => '2026-10-31T00:00:00Z'])->assertConflict();
        $this->patchJson($base.'/'.$id, ['deadline_at' => '2026-11-02T00:00:00Z'])->assertOk();
        $tests = $this->payload()['tests'];
        $tests[1]['expected_stdout'] = 'Corrected';
        $this->patchJson($base.'/'.$id, ['tests' => $tests])->assertOk();
        $this->assertNotSame($digest, Activity::findOrFail($id)->assessment_digest);
        $hidden = Activity::findOrFail($id)->tests()->where('visibility', 'hidden')->first();
        // Examples are optional; private examples are no longer required for grading.
        Activity::whereKey($id)->update(['test_suite_locked_at' => now()]);
        $this->patchJson($base.'/'.$id, ['tests' => $tests])->assertConflict();
        $this->patchJson($base.'/'.$id.'/test-cases/'.$hidden->id, ['expected_stdout' => 'Cheat'])->assertConflict();
        $this->deleteJson($base.'/'.$id)->assertConflict();
        $this->patchJson($base.'/'.$id, ['status' => 'archived'])->assertOk();
        $this->patchJson($base.'/'.$id, ['status' => 'published'])->assertConflict();
    }

    public function test_nested_activity_and_test_scope_and_draft_delete(): void
    {
        $class = Classroom::factory()->create();
        $other = Classroom::factory()->create(['instructor_id' => $class->instructor_id]);
        $activity = Activity::factory()->create(['classroom_id' => $other->id]);
        $base = '/api/v1/classrooms/'.$class->id.'/activities';
        $this->actingAs($class->instructor)->getJson($base.'/'.$activity->id)->assertNotFound();
        $this->patchJson($base.'/'.$activity->id, ['title' => 'Bad scope'])->assertNotFound();
        $this->deleteJson($base.'/'.$activity->id)->assertNotFound();
        $local = Activity::factory()->create(['classroom_id' => $class->id]);
        $test = $activity->tests()->create(['position' => 1, 'visibility' => 'public', 'stdin' => '', 'expected_stdout' => '']);
        $this->patchJson($base.'/'.$local->id.'/test-cases/'.$test->id, ['stdin' => 'Bad'])->assertNotFound();
        $this->deleteJson($base.'/'.$local->id)->assertNoContent();
        $this->assertDatabaseMissing('activities', ['id' => $local->id]);
        $this->actingAs(User::factory()->create(['role' => 'instructor']))->getJson($base)->assertNotFound();
    }

    public function test_test_bounds_unique_positions_and_empty_outputs_are_enforced(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 13));
        $class = Classroom::factory()->create();
        $base = '/api/v1/classrooms/'.$class->id.'/activities';
        $this->actingAs($class->instructor);
        $cases = [['grading_period', 'unknown'], ['class_session', 'lecture'], ['activity_type', 'quiz'], ['max_points', '0'], ['max_points', '1000.01'], ['language_id', 999], ['instructions', str_repeat('x', 20001)], ['deadline_at', '2028-01-01T00:00:00Z']];
        foreach ($cases as [$field,$value]) {
            $this->postJson($base, [...$this->payload(), $field => $value])->assertUnprocessable()->assertJsonValidationErrors($field);
        }
        $tests = $this->payload()['tests'];
        $tests[1]['position'] = 1;
        $this->postJson($base, [...$this->payload(), 'tests' => $tests])->assertUnprocessable()->assertJsonValidationErrors('tests');
        $tests = $this->payload()['tests'];
        $tests[0]['stdin'] = str_repeat('x', 65537);
        $this->postJson($base, [...$this->payload(), 'tests' => $tests])->assertUnprocessable()->assertJsonValidationErrors('tests.0.stdin');
        $tests = $this->payload()['tests'];
        $tests[0]['stdin'] = '';
        $tests[0]['expected_stdout'] = '';
        $id = $this->postJson($base, [...$this->payload(), 'tests' => $tests])->assertCreated()->json('data.id');
        $this->assertDatabaseHas('test_cases', ['activity_id' => $id, 'position' => 1, 'stdin' => '', 'expected_stdout' => '']);
        $this->postJson($base.'/'.$id.'/test-cases', ['position' => 3, 'visibility' => 'public', 'stdin' => 'x', 'expected_stdout' => 'x'])->assertOk();
        $this->postJson($base.'/'.$id.'/test-cases', ['position' => 3, 'visibility' => 'public', 'stdin' => 'x', 'expected_stdout' => 'x'])->assertUnprocessable();
        $test = Activity::findOrFail($id)->tests()->where('position', 3)->first();
        $this->patchJson($base.'/'.$id.'/test-cases/'.$test->id, ['explanation' => 'Updated'])->assertOk();
        $this->assertDatabaseHas('test_cases', ['id' => $test->id, 'explanation' => 'Updated']);
        $this->deleteJson($base.'/'.$id.'/test-cases/'.$test->id)->assertOk();
        $this->assertDatabaseMissing('test_cases', ['id' => $test->id]);
    }

    public function test_expired_publication_and_archived_drafts_are_never_visible_to_students(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 13));
        $class = Classroom::factory()->create();
        $base = '/api/v1/classrooms/'.$class->id.'/activities';
        $student = User::factory()->create();
        $class->memberships()->create(['student_id' => $student->id, 'status' => 'active', 'joined_at' => now()]);
        $id = $this->actingAs($class->instructor)->postJson($base, [...$this->payload(), 'deadline_at' => '2026-10-12T00:00:00Z'])->assertCreated()->json('data.id');
        $this->patchJson($base.'/'.$id, ['status' => 'published'])->assertUnprocessable();
        $this->patchJson($base.'/'.$id, ['status' => 'archived'])->assertOk();
        $this->actingAs($student)->getJson($base)->assertJsonCount(0, 'data');
        $this->getJson($base.'/'.$id)->assertNotFound();
    }
}
