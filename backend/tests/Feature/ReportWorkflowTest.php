<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Classroom;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class ReportWorkflowTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function fixture(): array
    {
        $this->freezeTime();
        $class = Classroom::factory()->create();
        $student = User::factory()->create();
        $member = $class->memberships()->create(['student_id' => $student->id, 'status' => 'active', 'joined_at' => now()]);
        $activity = Activity::factory()->create(['classroom_id' => $class->id, 'status' => 'published', 'published_at' => now()->subDays(2), 'deadline_at' => now()->subDay()]);
        DB::table('activity_allocations')->insert(['activity_id' => $activity->id, 'membership_id' => $member->id, 'status' => 'assigned', 'reason' => 'publication', 'decided_at' => now()->subDays(2)]);
        $this->actingAs($student);

        return [$class, $student, $member, $activity];
    }

    private function attempt($member, $activity, string $score, int $number): Submission
    {
        return Submission::create(['activity_id' => $activity->id, 'membership_id' => $member->id, 'idempotency_key' => (string) Str::uuid(), 'request_hash' => str_repeat('a', 64), 'source_code' => 'PRIVATE SOURCE', 'source_hash' => str_repeat('b', 64), 'runtime_image_digest' => 'fixture-runtime', 'judge_version' => 'exact-output-v1', 'state' => 'graded', 'score' => $score, 'attempt_number' => $number, 'accepted_at' => now()->subDays(2)->addSeconds($number), 'finished_at' => now()->subDays(2)->addSeconds($number + 1)]);
    }

    public function test_progress_counts_received_code_without_scores_and_excludes_unassigned_work(): void
    {
        [$class, $student, $member, $activity] = $this->fixture();
        $attempt = $this->attempt($member, $activity, '80.00', 1);
        $unassigned = Activity::factory()->create(['classroom_id' => $class->id, 'status' => 'published', 'published_at' => now()]);
        $other = User::factory()->create();
        $class->memberships()->create(['student_id' => $other->id, 'status' => 'active', 'joined_at' => now()]);
        $url = '/api/v1/classrooms/'.$class->id.'/results?grading_period=prelim';
        $r = $this->getJson($url)->assertOk()->assertJsonCount(1, 'data.rows')->assertJsonPath('data.rows.0.cells.0.state', 'completed')->assertJsonPath('data.rows.0.cells.0.latest_submission_id', (string) $attempt->id)->assertJsonPath('data.rows.0.cells.1.state', 'not_assigned')->assertJsonMissingPath('data.rows.0.earned')->assertJsonMissingPath('data.rows.0.cells.0.score')->assertJsonMissingPath('data.activities.0.max_points');
        $this->assertStringNotContainsString('PRIVATE SOURCE', $r->getContent());
        $this->actingAs($other)->getJson($url)->assertJsonPath('data.rows.0.cells.0.state', 'not_assigned');
        $this->actingAs($class->instructor)->getJson($url)->assertJsonCount(2, 'data.rows');
    }

    public function test_feedback_persists_without_changing_grade_and_requires_owner(): void
    {
        [$class,$student,$member,$activity] = $this->fixture();
        $attempt = $this->attempt($member, $activity, '0.00', 1);
        $url = '/api/v1/classrooms/'.$class->id.'/activities/'.$activity->id.'/submissions/'.$attempt->id;
        $this->putJson($url.'/feedback', ['body' => 'Bad'])->assertNotFound();
        $this->actingAs(User::factory()->create(['role' => 'instructor']))->putJson($url.'/feedback', ['body' => 'Bad'])->assertNotFound();
        $this->actingAs($class->instructor)->putJson($url.'/feedback', ['body' => ''])->assertUnprocessable();
        $this->putJson($url.'/feedback', ['body' => 'Check the loop.'])->assertOk();
        $created = DB::table('submission_feedback')->value('created_at');
        $this->travel(1)->minutes();
        $this->putJson($url.'/feedback', ['body' => 'Explain the loop boundary.'])->assertOk();
        $this->assertSame($created, DB::table('submission_feedback')->value('created_at'));
        $this->assertDatabaseHas('submissions', ['id' => $attempt->id, 'score' => '0.00']);
        $this->actingAs($student)->getJson($url)->assertOk()->assertJsonPath('data.feedback.body', 'Explain the loop boundary.');
        $member->update(['status' => 'removed']);
        $this->getJson($url)->assertNotFound();
    }

    public function test_removed_exports_are_unavailable_and_report_filters_still_apply(): void
    {
        [$class] = $this->fixture();
        $url = '/api/v1/classrooms/'.$class->id.'/results';
        $this->getJson($url)->assertUnprocessable();
        $this->getJson($url.'/export?grading_period=prelim')->assertNotFound();
        $this->actingAs($class->instructor)->getJson($url.'/export?grading_period=prelim&format=xlsx')->assertNotFound();
        $this->getJson($url.'?grading_period=final')->assertJsonCount(0, 'data.activities');
        $this->getJson($url.'?grading_period=prelim&class_session=oc')->assertJsonCount(0, 'data.activities');
        $this->actingAs(User::factory()->create(['role' => 'instructor']))->getJson($url.'?grading_period=prelim')->assertNotFound();
    }

    public function test_missed_pending_archived_and_legacy_failed_submission_states(): void
    {
        [$class, $student, $member, $activity] = $this->fixture();
        $attempt = $this->attempt($member, $activity, '0.00', 1);
        $attempt->update(['state' => 'system_error', 'score' => null]);
        $url = '/api/v1/classrooms/'.$class->id.'/results?grading_period=prelim';
        $this->getJson($url)->assertJsonPath('data.rows.0.cells.0.state', 'missed')->assertJsonPath('data.rows.0.cells.0.attempts_used', 0);
        $activity->update(['deadline_at' => now()->addDay()]);
        $this->getJson($url)->assertJsonPath('data.rows.0.cells.0.state', 'pending');
        $activity->forceFill(['status' => 'archived'])->save();
        $this->getJson($url)->assertJsonPath('data.rows.0.cells.0.state', 'missed')->assertJsonPath('data.rows.0.cells.0.closed', true);
        $this->attempt($member, $activity, '0.00', 2);
        $this->getJson($url)->assertJsonPath('data.rows.0.cells.0.state', 'completed');
    }

    public function test_instructor_report_pages_roster(): void
    {
        [$class, $student, $member, $activity] = $this->fixture();
        foreach (User::factory()->count(25)->create() as $extra) {
            $class->memberships()->create(['student_id' => $extra->id, 'status' => 'active', 'joined_at' => now()]);
        }
        $url = '/api/v1/classrooms/'.$class->id.'/results';
        $this->actingAs($class->instructor)->getJson($url.'?grading_period=prelim')->assertJsonCount(25, 'data.rows')->assertJsonPath('data.meta.total', 26);
        $this->getJson($url.'?grading_period=prelim&page=2')->assertJsonCount(1, 'data.rows')->assertJsonPath('data.meta.last_page', 2);

    }
}
