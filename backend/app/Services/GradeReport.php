<?php

namespace App\Services;

use App\Models\Classroom;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class GradeReport
{
    public function build(Request $request, Classroom $classroom): array
    {
        Gate::authorize('view', $classroom);
        $filters = $request->validate(['grading_period' => ['required', 'in:prelim,midterm,semi_final,final'], 'class_session' => ['sometimes', 'in:oc,lab'], 'activity_type' => ['sometimes', 'in:activity,assignment']]);

        return DB::transaction(function () use ($request, $classroom, $filters) {
            $query = $classroom->activities()->whereNotNull('published_at');
            foreach ($filters as $field => $value) {
                $query->where($field, $value);
            }
            $activities = $query->orderBy('id')->get();
            $membersQuery = $classroom->memberships()->with('student')->when($request->user()->role === 'student', fn ($q) => $q->where('student_id', $request->user()->id))->orderBy('id');
            $pages = $request->user()->role === 'instructor' ? $membersQuery->paginate(25) : null;
            $members = $pages ? $pages->getCollection() : $membersQuery->get();
            $submissions = Submission::whereIn('activity_id', $activities->modelKeys())->whereIn('membership_id', $members->modelKeys())->select(['id', 'activity_id', 'membership_id', 'state', 'accepted_at'])->orderBy('accepted_at')->orderBy('id')->get()->groupBy(fn ($s) => $s->membership_id.':'.$s->activity_id);
            $allocations = DB::table('activity_allocations')->whereIn('activity_id', $activities->modelKeys())->get()->keyBy(fn ($a) => $a->membership_id.':'.$a->activity_id);
            $rows = [];
            foreach ($members as $member) {
                $cells = [];
                foreach ($activities as $activity) {
                    $key = $member->id.':'.$activity->id;
                    $assigned = ($allocations[$key]->status ?? 'not_assigned') === 'assigned';
                    $attempts = $submissions->get($key, collect());
                    $received = $attempts->where('state', '!=', 'system_error');
                    $latest = $received->last();
                    $closed = $classroom->status === 'archived' || $activity->status === 'archived' || now()->gt($activity->deadline_at);
                    $state = ! $assigned ? 'not_assigned' : ($latest ? 'completed' : ($closed ? 'missed' : 'pending'));
                    $cells[] = ['activity_id' => (string) $activity->id, 'state' => $state,
                        'latest_submission_id' => $latest ? (string) $latest->id : null,
                        'attempts_used' => $received->count(), 'closed' => $closed,
                        'last_submission_at' => $latest?->accepted_at->toISOString()];
                }
                $rows[] = ['membership_id' => (string) $member->id, 'name' => $member->student->name, 'email' => $member->student->email, 'membership_status' => $member->status, 'cells' => $cells];
            }

            return ['classroom' => ['id' => (string) $classroom->id, 'title' => $classroom->title, 'timezone' => $classroom->timezone], 'generated_at' => now()->toISOString(), 'filters' => $filters, 'activities' => $activities->map(fn ($a) => ['id' => (string) $a->id, 'title' => $a->title, 'status' => $a->status])->all(), 'rows' => $rows, 'meta' => $pages ? ['current_page' => $pages->currentPage(), 'last_page' => $pages->lastPage(), 'total' => $pages->total()] : null];
        });
    }
}
