<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['name' => 'CodeLab API']));
Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('login');
    Route::post('/forgot-password', [AuthController::class, 'forgot'])->middleware('throttle:recovery');
    Route::post('/reset-password', [AuthController::class, 'reset'])->middleware('throttle:recovery');
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::middleware(['auth', 'active', 'auth.session'])->group(function (): void {
        Route::post('/email/verification-notification', [AuthController::class, 'resend'])->middleware('throttle:verification');
        Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verify'])->middleware(['signed:relative', 'throttle:verification-link'])->name('verification.verify');
    });
});
