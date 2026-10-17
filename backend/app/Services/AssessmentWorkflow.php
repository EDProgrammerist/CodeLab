<?php

namespace App\Services;

use App\Models\Classroom;
use App\Models\PracticeRun;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;

class AssessmentWorkflow
{
    public function model(string $kind): string
    {
        return $kind === 'runs' ? PracticeRun::class : Submission::class;
    }

    public function admit(Request $request, Classroom $classroom, string $activityId, string $kind): array
    {
        Gate::authorize('student-dashboard');
        Gate::authorize('view', $classroom);
        abort_if($kind !== 'submissions', 503, 'Run Java is deferred. Code submissions do not require execution.');
        $data = $request->validate([
            'source_code' => ['required', 'string', function ($attribute, $value, $fail) {
                if (strlen($value) > 65536) {
                    $fail('Source must be at most 64 KiB.');
                }
            }],
            'language_id' => ['required', 'integer'],
            'score' => ['prohibited'], 'state' => ['prohibited'], 'results' => ['prohibited'],
        ]);
        $key = $request->header('Idempotency-Key');
        Validator::make(['key' => $key], ['key' => 'required|uuid'])->validate();
        $hash = hash('sha256', json_encode([$activityId, (string) $data['language_id'], $data['source_code']], JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($request, $classroom, $activityId, $data, $key, $hash) {
            $classroom = Classroom::whereKey($classroom->id)->lockForUpdate()->firstOrFail();
            Gate::authorize('view', $classroom);
            $activity = $classroom->activities()->whereKey($activityId)->lockForUpdate()->firstOrFail();
            $member = $classroom->memberships()->where('student_id', $request->user()->id)->where('status', 'active')->lockForUpdate()->firstOrFail();
            $existing = Submission::where('membership_id', $member->id)->where('idempotency_key', $key)->first();
            if ($existing) {
                abort_unless(hash_equals($existing->request_hash, $hash), 409, 'This request key was already used for different code.');

                return [$existing, false];
            }
            abort_unless($classroom->status === 'active' && $activity->status === 'published', 409, 'This activity is closed.');
            abort_unless(now()->lte($activity->deadline_at), 409, 'The submission deadline has passed.');
            abort_unless(DB::table('activity_allocations')->where('activity_id', $activity->id)->where('membership_id', $member->id)->where('status', 'assigned')->exists(), 409, 'This activity is not assigned to you.');
            abort_unless((string) $activity->language_id === (string) $data['language_id'] && $activity->language->enabled, 409, 'This activity language is unavailable.');
            $scope = Submission::where('activity_id', $activity->id)->where('membership_id', $member->id);
            $activity->test_suite_locked_at ??= now();
            $activity->save();
            $record = Submission::create([
                'activity_id' => $activity->id, 'membership_id' => $member->id,
                'idempotency_key' => $key, 'request_hash' => $hash,
                'source_code' => $data['source_code'], 'source_hash' => hash('sha256', $data['source_code']),
                // Compatibility columns from the retired grading schema; no execution or grade is created.
                'runtime_image_digest' => 'not-executed', 'judge_version' => 'manual-review',
                'accepted_at' => now(), 'state' => 'submitted',
                'attempt_number' => ((clone $scope)->max('attempt_number') ?? 0) + 1,
            ]);

            return [$record, true];
        });
    }

    public function serialize(Submission|PracticeRun $record, bool $owner, bool $detail = true): array
    {
        $feedback = $record instanceof Submission ? DB::table('submission_feedback')->where('submission_id', $record->id)->first() : null;
        $data = [
            'id' => (string) $record->id,
            'state' => $record->state === 'system_error' ? 'not_received' : ($feedback ? 'reviewed' : 'submitted'),
            'max_points' => $record->activity->max_points, 'accepted_at' => $record->accepted_at->toISOString(),
            'feedback' => $feedback ? ['points_awarded' => $feedback->points_awarded === null ? null : number_format((float) $feedback->points_awarded, 2, '.', ''), 'body' => $feedback->body, 'updated_at' => $feedback->updated_at] : null,
        ];
        if ($detail) {
            $data['source_code'] = $record->source_code;
        }

        return $data;
    }
}
