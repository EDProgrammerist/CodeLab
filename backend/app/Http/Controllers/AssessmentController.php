<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\PracticeRun;
use App\Services\AssessmentWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AssessmentController extends Controller
{
    public function __construct(private AssessmentWorkflow $workflow) {}

    public function store(Request $request, Classroom $classroom, string $activity, string $kind): JsonResponse
    {
        [$record,$created] = $this->workflow->admit($request, $classroom, $activity, $kind);

        return response()->json(['data' => $this->workflow->serialize($record, false)], $created ? 201 : 200)->header('Location', '/api/v1/classrooms/'.$classroom->id.'/activities/'.$activity.'/'.$kind.'/'.$record->id);
    }

    public function index(Request $request, Classroom $classroom, string $activity, string $kind): JsonResponse
    {
        Gate::authorize('view', $classroom);
        abort_if($kind === 'runs', 503, 'Run Java is deferred.');
        $classroom->activities()->whereKey($activity)->firstOrFail();
        $model = $this->workflow->model($kind);
        $query = $model::where('activity_id', $activity);
        $owner = $request->user()->role === 'instructor';
        if (! $owner || $kind === 'runs') {
            $query->whereHas('membership', fn ($q) => $q->where('student_id', $request->user()->id));
        }
        if ($kind === 'runs') {
            $query->where('expires_at', '>', now());
        }
        $rows = $query->orderByDesc('id')->paginate(25);

        return response()->json(['data' => $rows->map(fn ($r) => [...$this->workflow->serialize($r, $owner, false), ...($owner ? ['student_name' => $r->membership->student->name] : [])]), 'meta' => ['current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'total' => $rows->total()]]);
    }

    public function show(Request $request, Classroom $classroom, string $activity, string $record, string $kind): JsonResponse
    {
        Gate::authorize('view', $classroom);
        abort_if($kind === 'runs', 503, 'Run Java is deferred.');
        $classroom->activities()->whereKey($activity)->firstOrFail();
        $model = $this->workflow->model($kind);
        $row = $model::where('activity_id', $activity)->findOrFail($record);
        $owner = $request->user()->role === 'instructor';
        abort_unless(($owner && $kind !== 'runs') || $row->membership->student_id === $request->user()->id, 404);
        abort_if($row instanceof PracticeRun && $row->expires_at->isPast(), 404);

        return response()->json(['data' => $this->workflow->serialize($row, $owner)]);
    }
}
