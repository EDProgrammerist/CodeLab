<?php

namespace Tests\Feature;

use App\Jobs\EvaluateCode;
use App\Models\Activity;
use App\Models\Classroom;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class AssessmentWorkflowTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function fixture(): array
    {
        $this->freezeTime();
        Http::preventStrayRequests();
        Queue::fake();
        $class = Classroom::factory()->create();
        $student = User::factory()->create();
        $member = $class->memberships()->create(['student_id' => $student->id, 'status' => 'active', 'joined_at' => now()]);
        $activity = Activity::factory()->create(['classroom_id' => $class->id, 'status' => 'published', 'published_at' => now(), 'submission_limit' => 2]);
        DB::table('activity_allocations')->insert(['activity_id' => $activity->id, 'membership_id' => $member->id, 'status' => 'assigned', 'reason' => 'publication', 'decided_at' => now()]);
        $this->actingAs($student);

        return [$class, $student, $member, $activity, '/api/v1/classrooms/'.$class->id.'/activities/'.$activity->id];
    }

    private function submit(string $base, Activity $activity, ?string $key = null, array $extra = []): TestResponse
    {
        return $this->postJson($base.'/submissions', [...['language_id' => $activity->language_id, 'source_code' => "  public class Main {}\n"], ...$extra], ['Idempotency-Key' => $key ?? (string) Str::uuid()]);
    }

    public function test_submission_is_saved_without_runner_score_or_queue_and_retries_are_idempotent(): void
    {
        [$class, $student, $member, $activity, $base] = $this->fixture();
        config(['execution.enabled' => true, 'execution.verified' => true]);
        $key = (string) Str::uuid();
        $id = $this->submit($base, $activity, $key)->assertCreated()->assertJsonPath('data.state', 'submitted')->assertJsonMissingPath('data.score')->assertJsonMissingPath('data.results')->json('data.id');
        $this->assertDatabaseHas('submissions', ['id' => $id, 'source_code' => "  public class Main {}\n", 'score' => null, 'state' => 'submitted', 'attempt_number' => 1]);
        $this->submit($base, $activity, $key)->assertOk()->assertJsonPath('data.id', $id);
        $this->submit($base, $activity, $key, ['source_code' => 'changed'])->assertConflict();
        $this->submit($base, $activity)->assertCreated()->assertJsonPath('data.attempt_number', 2);
        $this->submit($base, $activity)->assertConflict();
        $this->assertDatabaseCount('submissions', 2);
        $this->assertNotNull($activity->fresh()->test_suite_locked_at);
        Queue::assertNothingPushed();
        Http::assertNothingSent();
        $this->getJson($base)->assertJsonPath('data.can_submit', false)->assertJsonPath('data.execution_available', false)->assertJsonMissingPath('data.max_points');
    }

    public function test_deadline_assignment_archival_membership_and_source_limits(): void
    {
        [$class, $student, $member, $activity, $base] = $this->fixture();
        $this->submit($base, $activity, null, ['source_code' => str_repeat('x', 65537)])->assertUnprocessable();
        $this->submit($base, $activity, null, ['score' => 100])->assertUnprocessable();
        $activity->update(['deadline_at' => now()->subSecond()]);
        $this->submit($base, $activity)->assertConflict();
        $activity->update(['deadline_at' => now()->addDay()]);
        DB::table('activity_allocations')->where('activity_id', $activity->id)->update(['status' => 'not_assigned']);
        $this->submit($base, $activity)->assertConflict();
        DB::table('activity_allocations')->where('activity_id', $activity->id)->update(['status' => 'assigned']);
        $class->forceFill(['status' => 'archived'])->save();
        $this->submit($base, $activity)->assertConflict();
        $class->forceFill(['status' => 'active'])->save();
        $member->update(['status' => 'removed']);
        $this->submit($base, $activity)->assertNotFound();
        $this->assertDatabaseCount('submissions', 0);
    }

    public function test_student_owner_and_cross_classroom_submission_privacy_and_feedback(): void
    {
        [$class, $student, $member, $activity, $base] = $this->fixture();
        $id = $this->submit($base, $activity)->assertCreated()->json('data.id');
        $url = $base.'/submissions/'.$id;
        $other = User::factory()->create();
        $class->memberships()->create(['student_id' => $other->id, 'status' => 'active', 'joined_at' => now()]);
        $this->actingAs($other)->getJson($url)->assertNotFound();
        $this->getJson($base.'/submissions')->assertJsonCount(0, 'data');
        $this->actingAs(User::factory()->create(['role' => 'instructor']))->getJson($url)->assertNotFound();
        $this->actingAs($class->instructor)->putJson($url.'/feedback', ['body' => 'Explain the loop.', 'score' => 80])->assertUnprocessable();
        $this->putJson($url.'/feedback', ['body' => 'Explain the loop.'])->assertOk();
        $this->actingAs($student)->getJson($url)->assertJsonPath('data.state', 'reviewed')->assertJsonPath('data.feedback.body', 'Explain the loop.')->assertJsonMissingPath('data.score');
        $this->putJson($url.'/feedback', ['body' => 'Forged'])->assertNotFound();
        $otherClass = Classroom::factory()->create(['instructor_id' => $class->instructor_id]);
        $this->actingAs($class->instructor)->getJson('/api/v1/classrooms/'.$otherClass->id.'/activities/'.$activity->id.'/submissions/'.$id)->assertNotFound();
    }

    public function test_runs_remain_disabled_and_old_jobs_cannot_grade(): void
    {
        [$class, $student, $member, $activity, $base] = $this->fixture();
        $id = $this->submit($base, $activity)->assertCreated()->json('data.id');
        $this->postJson($base.'/runs', ['source_code' => 'test'])->assertStatus(503);
        $this->getJson($base.'/runs')->assertStatus(503);
        (new EvaluateCode('submissions', (int) $id))->handle();
        $this->assertNull(Submission::findOrFail($id)->score);
        $this->artisan('codelab:recover-evaluations')->assertSuccessful();
        Queue::assertNothingPushed();
        Http::assertNothingSent();
    }
}
