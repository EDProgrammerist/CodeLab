<?php

namespace App\Http\Resources;

use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $owner = $request->user()->role === 'instructor';
        $data = ['id' => (string) $this->id, 'classroom_id' => (string) $this->classroom_id, 'language_id' => (string) $this->language_id,
            ...$this->resource->only(['title', 'instructions', 'grading_period', 'class_session', 'activity_type', 'submission_limit', 'status']),
            'deadline_at' => $this->deadline_at->toISOString(), 'published_at' => $this->published_at?->toISOString(), 'timezone' => $this->classroom->timezone,
            'language' => ['id' => (string) $this->language_id, 'display_name' => $this->language->display_name, 'runtime_version' => $this->language->runtime_version],
            'server_time' => now()->toISOString(), 'execution_available' => false];
        if ($owner) {
            $data['test_suite_locked_at'] = $this->test_suite_locked_at?->toISOString();
            $data['can_edit_tests'] = ! $this->test_suite_locked_at && $this->status !== 'archived' && $this->classroom->status === 'active';
            $data['tests'] = $this->tests()->get()->map(fn ($test) => ['id' => (string) $test->id, ...$test->only(['position', 'visibility', 'stdin', 'expected_stdout', 'explanation'])]);
        } else {
            $allocation = DB::table('activity_allocations')->join('classroom_memberships', 'classroom_memberships.id', '=', 'activity_allocations.membership_id')->where('activity_id', $this->id)->where('student_id', $request->user()->id)->value('activity_allocations.status');
            $data['allocation_status'] = $allocation ?? 'not_assigned';
            $data['public_examples'] = $this->tests()->where('visibility', 'public')->get(['position', 'stdin', 'expected_stdout', 'explanation']);
            $memberId = DB::table('classroom_memberships')->where('classroom_id', $this->classroom_id)->where('student_id', $request->user()->id)->value('id');
            $scope = Submission::where('activity_id', $this->id)->where('membership_id', $memberId);
            $data['attempts_used'] = (clone $scope)->where('state', '!=', 'system_error')->count();
            $data['remaining_attempts'] = max(0, $this->submission_limit - $data['attempts_used']);
            $open = $this->status === 'published' && $this->classroom->status === 'active' && now()->lte($this->deadline_at) && $data['allocation_status'] === 'assigned';
            $data['can_run'] = false;
            $data['can_submit'] = $open && $data['remaining_attempts'] > 0;
            $data['submission_unavailable_reason'] = ! $open ? 'This activity is closed or not assigned.' : (! $data['can_submit'] ? 'No submission attempts remain.' : null);
        }

        return $data;
    }
}
