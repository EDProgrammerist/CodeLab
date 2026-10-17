<?php

namespace Tests\Feature;

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ClassroomController;
use App\Models\Activity;
use App\Models\Classroom;
use App\Models\Submission;
use App\Models\User;
use App\Services\AssessmentWorkflow;
use App\Services\ClassroomWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Tests\TestCase;

/** Opt-in real InnoDB contention checks, isolated from the working codelab database. */
class ClassroomConcurrencyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (getenv('CODELAB_TEST_MYSQL') !== '1') {
            $this->markTestSkipped('Opt-in separate MySQL concurrency database.');
        }
        if (! function_exists('pcntl_fork')) {
            $this->markTestSkipped('Requires the Linux PHP container.');
        }
        config(['database.default' => 'mysql', 'database.connections.mysql.database' => 'codelab_phase4_test']);
        DB::purge('mysql');
        $this->assertSame('codelab_phase4_test', DB::connection()->getDatabaseName());
        Artisan::call('migrate', ['--database' => 'mysql', '--force' => true]);
    }

    private function request(User $user, array $data): Request
    {
        Auth::guard('web')->setUser($user);
        $request = Request::create('/api/v1/test', 'POST', $data);
        $request->setUserResolver(fn () => $user);

        return $request;
    }

    /** Parent owns the row while the child performs a real competing application mutation. */
    private function contend(Classroom $classroom, \Closure $childAction, \Closure $parentAction): array
    {
        DB::disconnect();
        $pair = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
        $pid = pcntl_fork();
        if ($pid === 0) {
            fclose($pair[0]);
            fgets($pair[1]);
            DB::purge('mysql');
            try {
                $childAction();
                $result = ['status' => 200];
            } catch (HttpExceptionInterface $e) {
                $result = ['status' => $e->getStatusCode()];
            } catch (\Throwable $e) {
                $result = ['status' => 500, 'exception' => get_class($e)];
            }
            fwrite($pair[1], json_encode($result)."\n");
            fclose($pair[1]);
            exit(0);
        }
        $this->assertGreaterThan(0, $pid);
        fclose($pair[1]);
        DB::purge('mysql');
        DB::beginTransaction();
        try {
            Classroom::whereKey($classroom->id)->lockForUpdate()->firstOrFail();
            fwrite($pair[0], "go\n");
            stream_set_timeout($pair[0], 1);
            $early = fgets($pair[0]);
            $this->assertFalse($early, 'Competing mutation must wait for the classroom lock.');
            $parentAction();
            DB::commit();
        } finally {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
        }
        stream_set_timeout($pair[0], 10);
        $result = fgets($pair[0]);
        fclose($pair[0]);
        pcntl_waitpid($pid, $status);
        $this->assertNotFalse($result, 'Competing mutation must finish after commit.');

        return json_decode($result, true, 512, JSON_THROW_ON_ERROR);
    }

    public function test_join_waits_for_publication_and_creates_exactly_one_assigned_allocation(): void
    {
        $classroom = Classroom::factory()->create(['term_end_date' => now()->addYear()->format('Y-m-d')]);
        $owner = $classroom->instructor;
        $student = User::factory()->create();
        $activity = Activity::factory()->create(['classroom_id' => $classroom->id]);
        $activity->tests()->createMany([['position' => 1, 'visibility' => 'public', 'stdin' => '', 'expected_stdout' => ''], ['position' => 2, 'visibility' => 'hidden', 'stdin' => '', 'expected_stdout' => '']]);
        $code = 'RACE'.bin2hex(random_bytes(8));
        DB::table('classroom_invitations')->insert(['classroom_id' => $classroom->id, 'code_digest' => app(ClassroomWorkflow::class)->codeDigest($code), 'expires_at' => now()->addDay(), 'created_at' => now(), 'updated_at' => now()]);
        $result = $this->contend($classroom,
            fn () => app(ClassroomController::class)->join($this->request($student, ['invitation_code' => $code])),
            fn () => app(ActivityController::class)->update($this->request($owner, ['status' => 'published']), $classroom, (string) $activity->id));
        $this->assertSame(200, $result['status']);
        $membership = $classroom->memberships()->where('student_id', $student->id)->sole();
        $this->assertSame(1, DB::table('activity_allocations')->where('activity_id', $activity->id)->where('membership_id', $membership->id)->where('status', 'assigned')->count());
    }

    public function test_waiting_test_edit_rechecks_suite_lock_after_commit(): void
    {
        $classroom = Classroom::factory()->create();
        $owner = $classroom->instructor;
        $activity = Activity::factory()->create(['classroom_id' => $classroom->id]);
        $result = $this->contend($classroom,
            fn () => app(ActivityController::class)->update($this->request($owner, ['tests' => []]), $classroom, (string) $activity->id),
            function () use ($activity): void {
                $locked = Activity::whereKey($activity->id)->lockForUpdate()->firstOrFail();
                $locked->test_suite_locked_at = now();
                $locked->save();
            });
        $this->assertSame(409, $result['status']);
        $this->assertNotNull($activity->fresh()->test_suite_locked_at);
    }

    public function test_competing_submissions_are_both_saved_without_attempt_limits(): void
    {
        $this->assertSubmissionContention(false);
    }

    public function test_competing_identical_retry_returns_one_submission(): void
    {
        $this->assertSubmissionContention(true);
    }

    private function assertSubmissionContention(bool $sameKey): void
    {
        $classroom = Classroom::factory()->create();
        $student = User::factory()->create();
        $member = $classroom->memberships()->create(['student_id' => $student->id, 'status' => 'active', 'joined_at' => now()]);
        $activity = Activity::factory()->create(['classroom_id' => $classroom->id, 'status' => 'published', 'published_at' => now(), 'submission_limit' => 1]);
        DB::table('activity_allocations')->insert(['activity_id' => $activity->id, 'membership_id' => $member->id, 'status' => 'assigned', 'reason' => 'publication', 'decided_at' => now()]);
        $parentKey = (string) Str::uuid();
        $childKey = $sameKey ? $parentKey : (string) Str::uuid();
        $admit = function (string $key) use ($student, $activity, $classroom): void {
            $request = $this->request($student, ['source_code' => 'public class Main {}', 'language_id' => $activity->language_id]);
            $request->headers->set('Idempotency-Key', $key);
            app(AssessmentWorkflow::class)->admit($request, $classroom, (string) $activity->id, 'submissions');
        };
        $result = $this->contend($classroom, fn () => $admit($childKey), fn () => $admit($parentKey));
        $this->assertSame(200, $result['status']);
        $records = Submission::where('activity_id', $activity->id)->get();
        $this->assertCount($sameKey ? 1 : 2, $records);
        $this->assertSame(1, $records->first()->attempt_number);
        $this->assertNull($records->first()->score);
    }
}
