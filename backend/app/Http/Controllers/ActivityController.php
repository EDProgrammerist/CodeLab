<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Models\Classroom;
use App\Services\ActivityWorkflow;
use App\Services\ClassroomWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ActivityController extends Controller
{
    public function __construct(private ClassroomWorkflow $classrooms, private ActivityWorkflow $workflow) {}

    private function find(Request $request, Classroom $classroom, string $id, bool $lock = false): Activity
    {
        Gate::authorize('view', $classroom);
        $query = $classroom->activities()->whereKey($id);
        if ($request->user()->role !== 'instructor') {
            $query->whereNotNull('published_at');
        }
        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->firstOrFail();
    }

    public function index(Request $request, Classroom $classroom): AnonymousResourceCollection
    {
        Gate::authorize('view', $classroom);
        $filters = $request->validate(['grading_period' => ['sometimes', 'in:prelim,midterm,semi_final,final'], 'class_session' => ['sometimes', 'in:oc,lab'], 'activity_type' => ['sometimes', 'in:activity,assignment'], 'status' => ['sometimes', 'in:draft,published,archived']]);
        $query = $classroom->activities()->with(['classroom', 'language']);
        if ($request->user()->role !== 'instructor') {
            $query->whereNotNull('published_at');
        }
        foreach ($filters as $field => $value) {
            $query->where($field, $value);
        }

        return ActivityResource::collection($query->orderByDesc('id')->paginate(25));
    }

    public function show(Request $request, Classroom $classroom, string $activity): ActivityResource
    {
        return new ActivityResource($this->find($request, $classroom, $activity));
    }

    public function store(Request $request, Classroom $classroom): JsonResponse
    {
        return DB::transaction(function () use ($request, $classroom) {
            $classroom = $this->classrooms->lock($classroom->id);
            $data = $this->workflow->validate($request, $classroom);
            abort_if(($data['status'] ?? null) === 'archived', 422, 'New work must be published or a draft.');
            $activity = $classroom->activities()->create($data);
            $activity->refresh();
            if (isset($data['tests'])) {
                $this->workflow->replaceTests($activity, $data['tests']);
            }
            if (($data['status'] ?? null) === 'published') {
                $this->publish($classroom, $activity);
                $this->workflow->digest($activity);
            }
            $this->classrooms->audit($request, $classroom, 'activity.created', 'activity', $activity->id);

            return (new ActivityResource($activity))->response()->setStatusCode(201);
        });
    }

    public function update(Request $request, Classroom $classroom, string $activity): ActivityResource
    {
        return DB::transaction(function () use ($request, $classroom, $activity) {
            $classroom = $this->classrooms->lock($classroom->id);
            $activity = $this->find($request, $classroom, $activity, true);
            abort_if($activity->status === 'archived', 409, 'Archived work cannot be changed or reopened.');
            $data = $this->workflow->validate($request, $classroom, $activity);
            if ($activity->published_at) {
                foreach (['title', 'instructions', 'grading_period', 'class_session', 'activity_type', 'language_id'] as $field) {
                    abort_if(isset($data[$field]) && (string) $data[$field] !== (string) $activity->$field, 409, 'Published activity content is fixed. Create a replacement activity.');
                }
                abort_if(isset($data['deadline_at']) && $data['deadline_at']->lt($activity->deadline_at), 409, 'A published deadline may only be extended.');
                abort_if(isset($data['max_points']) && (float) $activity->max_points > 0 && (float) $data['max_points'] !== (float) $activity->max_points, 409, 'Published points are fixed.');
            }
            $activity->fill($data);
            $activity->save();
            if (isset($data['tests'])) {
                $this->workflow->replaceTests($activity, $data['tests']);
            }
            $publishing = ($data['status'] ?? null) === 'published' && ! $activity->published_at;
            if ($publishing) {
                $this->publish($classroom, $activity);
            }
            if (($data['status'] ?? null) === 'archived') {
                $activity->status = 'archived';
                $activity->archived_at = now();
                $activity->save();
            }
            if ($activity->published_at) {
                $this->workflow->digest($activity);
            }
            $this->classrooms->audit($request, $classroom, $publishing ? 'activity.published' : 'activity.updated', 'activity', $activity->id, ['fields' => array_keys($data)]);

            return new ActivityResource($activity);
        });
    }

    private function publish(Classroom $classroom, Activity $activity): void
    {
        abort_unless((float) $activity->max_points > 0, 422, 'Set activity points before publishing.');
        abort_unless($activity->deadline_at->gt(now()), 422, 'Publication requires a future deadline.');
        $this->workflow->assertSuite($activity);
        $activity->status = 'published';
        $activity->published_at = now();
        $activity->save();
        foreach ($classroom->memberships()->where('status', 'active')->orderBy('id')->lockForUpdate()->get() as $member) {
            $this->classrooms->allocate($member, $activity);
        }
    }

    public function destroy(Request $request, Classroom $classroom, string $activity): Response
    {
        DB::transaction(function () use ($request, $classroom, $activity) {
            $classroom = $this->classrooms->lock($classroom->id);
            $activity = $this->find($request, $classroom, $activity, true);
            abort_unless($activity->status === 'draft', 409, 'Only drafts can be deleted.');
            $this->classrooms->audit($request, $classroom, 'activity.deleted', 'activity', $activity->id);
            $activity->delete();
        });

        return response()->noContent();
    }

    public function tests(Request $request, Classroom $classroom, string $activity): JsonResponse
    {
        Gate::authorize('instructor-dashboard');
        $activity = $this->find($request, $classroom, $activity);

        return response()->json(['data' => $activity->tests()->get()->map(fn ($test) => ['id' => (string) $test->id, ...$test->only(['position', 'visibility', 'stdin', 'expected_stdout', 'explanation'])])]);
    }

    public function changeTest(Request $request, Classroom $classroom, string $activity, ?string $test = null): JsonResponse
    {
        return DB::transaction(function () use ($request, $classroom, $activity, $test) {
            $classroom = $this->classrooms->lock($classroom->id);
            $activity = $this->find($request, $classroom, $activity, true);
            abort_if($activity->status === 'archived' || $activity->test_suite_locked_at, 409, 'This test suite is locked.');
            $row = $test ? $activity->tests()->whereKey($test)->firstOrFail() : null;
            if ($request->isMethod('delete')) {
                $row->delete();
            } else {
                $rules = $this->workflow->testRules();
                if ($row) {
                    foreach ($rules as &$ruleset) {
                        $ruleset = array_map(fn ($rule) => in_array($rule, ['required', 'present'], true) ? 'sometimes' : $rule, $ruleset);
                    } unset($ruleset);
                }
                $data = $request->validate($rules);
                $data = $this->workflow->normalizeTests([$row ? [...$row->only(['position', 'visibility', 'stdin', 'expected_stdout', 'explanation']), ...$data] : $data])[0];
                abort_if($activity->tests()->where('position', $data['position'])->when($row, fn ($q) => $q->where('id', '!=', $row->id))->exists(), 422, 'Test position is already used.');
                if ($row) {
                    $row->update($data);
                } else {
                    abort_if($activity->tests()->count() >= 20, 422, 'At most 20 tests are allowed.');
                    $row = $activity->tests()->create($data);
                }
            }
            if ($activity->published_at) {
                $this->workflow->assertSuite($activity);
                $this->workflow->digest($activity);
            }
            $this->classrooms->audit($request, $classroom, 'tests.updated', 'activity', $activity->id);

            return response()->json(['data' => ['activity_id' => (string) $activity->id]]);
        });
    }
}
