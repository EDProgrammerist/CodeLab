<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Submission;
use App\Services\ClassroomWorkflow;
use App\Services\GradeReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResultController extends Controller
{
    public function index(Request $request, Classroom $classroom, GradeReport $reports): JsonResponse
    {
        return response()->json(['data' => $reports->build($request, $classroom)]);
    }

    public function feedback(Request $request, Classroom $classroom, string $activity, string $submission, ClassroomWorkflow $workflow): JsonResponse
    {
        return DB::transaction(function () use ($request, $classroom, $activity, $submission, $workflow) {
            $classroom = $workflow->lock($classroom->id);
            $classroom->activities()->whereKey($activity)->firstOrFail();
            $record = Submission::where('activity_id', $activity)->findOrFail($submission);
            $data = $request->validate(['body' => ['required', 'string', 'max:5000'], 'score' => ['prohibited']]);
            DB::table('submission_feedback')->upsert([['submission_id' => $record->id, 'instructor_id' => $request->user()->id, 'body' => $data['body'], 'created_at' => now(), 'updated_at' => now()]], ['submission_id'], ['instructor_id', 'body', 'updated_at']);
            $workflow->audit($request, $classroom, 'feedback.updated', 'submission', $record->id);

            return response()->json(['message' => 'Feedback saved.']);
        });
    }
}
