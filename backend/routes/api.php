<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\ResultController;
use App\Http\Resources\UserResource;
use App\Models\Language;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/v1/health', fn () => response()->json(['data' => ['name' => 'CodeLab API', 'status' => 'ok']]))->name('api.health');
Route::prefix('v1')->middleware(['auth:sanctum', 'active'])->group(function (): void {
    Route::get('/me', fn (Request $request) => new UserResource($request->user()));
    Route::middleware('verified')->group(function (): void {
        Route::get('/student/dashboard', fn (Request $request) => new UserResource($request->user()))->middleware('can:student-dashboard');
        Route::get('/instructor/dashboard', fn (Request $request) => new UserResource($request->user()))->middleware('can:instructor-dashboard');
        Route::apiResource('classrooms', ClassroomController::class)->except(['destroy']);
        Route::post('/classroom-joins', [ClassroomController::class, 'join'])->middleware('throttle:classroom-joins');
        Route::get('/classrooms/{classroom}/invitation', [ClassroomController::class, 'invitation']);
        Route::put('/classrooms/{classroom}/invitation', [ClassroomController::class, 'rotate'])->middleware('throttle:30,1');
        Route::delete('/classrooms/{classroom}/invitation', [ClassroomController::class, 'revoke']);
        Route::get('/classrooms/{classroom}/memberships', [ClassroomController::class, 'members']);
        Route::patch('/classrooms/{classroom}/memberships/{membership}', [ClassroomController::class, 'updateMember']);
        Route::apiResource('classrooms.activities', ActivityController::class);
        Route::get('/classrooms/{classroom}/activities/{activity}/test-cases', [ActivityController::class, 'tests']);
        Route::post('/classrooms/{classroom}/activities/{activity}/test-cases', [ActivityController::class, 'changeTest']);
        Route::match(['patch', 'delete'], '/classrooms/{classroom}/activities/{activity}/test-cases/{test}', [ActivityController::class, 'changeTest']);

        foreach (['runs', 'submissions'] as $kind) {
            Route::post('/classrooms/{classroom}/activities/{activity}/'.$kind, [AssessmentController::class, 'store'])->defaults('kind', $kind)->middleware('throttle:'.($kind === 'runs' ? 'practice' : 'assessment'));
            Route::get('/classrooms/{classroom}/activities/{activity}/'.$kind, [AssessmentController::class, 'index'])->defaults('kind', $kind);
            Route::get('/classrooms/{classroom}/activities/{activity}/'.$kind.'/{record}', [AssessmentController::class, 'show'])->defaults('kind', $kind);
        }
        Route::put('/classrooms/{classroom}/activities/{activity}/submissions/{submission}/feedback', [ResultController::class, 'feedback']);
        Route::get('/classrooms/{classroom}/results', [ResultController::class, 'index']);
        Route::get('/languages', fn () => response()->json(['data' => Language::where('enabled', true)->get()->map(fn ($language) => ['id' => (string) $language->id, 'display_name' => $language->display_name, 'runtime_version' => $language->runtime_version, 'execution_available' => false])]));
    });
});
