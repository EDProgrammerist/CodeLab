<?php

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

Route::get('/v1/health', function (): JsonResponse {
    return response()->json(['data' => ['name' => 'CodeLab API', 'status' => 'ok']]);
})->name('api.health');
