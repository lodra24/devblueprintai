<?php

use App\Http\Controllers\Api\ClaimProjectController;
use App\Http\Controllers\Api\EpicController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ReorderUserStoryController;
use App\Http\Controllers\Api\UserStoryController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- API Rotaları ---

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::apiResource('projects', ProjectController::class)->only([
    'store', 'show'
]);

Route::post('/projects/claim', [ClaimProjectController::class, '__invoke'])->middleware('auth:sanctum')->name('projects.claim');

// --- CRUD & Reorder Routes ---
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('epics', EpicController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('user-stories', UserStoryController::class)->only(['store', 'update', 'destroy']);
    Route::post('/user-stories/reorder', ReorderUserStoryController::class)->name('user-stories.reorder');
});


// --- Auth Routes ---

Route::post('/register', [RegisteredUserController::class, 'store'])
    ->middleware('guest:sanctum')
    ->name('register');

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('guest:sanctum')
    ->name('login');

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->middleware('guest:sanctum')
    ->name('password.email');

Route::post('/reset-password', [NewPasswordController::class, 'store'])
    ->middleware('guest:sanctum')
    ->name('password.store');

Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
    ->middleware(['auth:sanctum', 'signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
    ->middleware(['auth:sanctum', 'throttle:6,1'])
    ->name('verification.send');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth:sanctum')
    ->name('logout');