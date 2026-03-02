<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AdminStatsController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\FacilityController;
use App\Http\Controllers\FeatureTagController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    
    // Emergency route to provision default admin if seeders fail in prod
    Route::get('/setup-admin', function () {
        $admin = \App\Models\User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => 'password', // Auto-hashed by User model casts
                'role' => 'admin',
            ]
        );
        return response()->json(['message' => 'Admin provisioned', 'admin' => $admin]);
    });
});

// Public routes
Route::apiResource('facilities', FacilityController::class)->only(['index', 'show']);
Route::get('/facilities/{facility}/slots', [FacilityController::class, 'slots']);
Route::get('/availability', [BookingController::class, 'checkAvailability']);
Route::get('/available-rooms', [FacilityController::class, 'availableRooms']);
Route::get('/health', fn () => response()->json(['status' => 'ok']));

// Buildings — public read
Route::get('/buildings', [BuildingController::class, 'index']);
Route::get('/buildings/{id}', [BuildingController::class, 'show']);

// Feature tags — public read
Route::get('/feature-tags', [FeatureTagController::class, 'index']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn (\Illuminate\Http\Request $request) => $request->user());

    // Account management
    Route::get('/account', [AccountController::class, 'show']);
    Route::put('/account', [AccountController::class, 'update']);
    Route::delete('/account', [AccountController::class, 'destroy']);

    // Bookings CRUD (regular users)
    Route::apiResource('bookings', BookingController::class);

    // Complaints (users: own; admin sees via admin routes below)
    Route::get('/complaints', [ComplaintController::class, 'index']);
    Route::post('/complaints', [ComplaintController::class, 'store']);

    // Admin-only routes
    Route::middleware('admin')->group(function () {
        // Building management
        Route::post('/buildings', [BuildingController::class, 'store']);
        Route::put('/buildings/{id}', [BuildingController::class, 'update']);
        Route::delete('/buildings/{id}', [BuildingController::class, 'destroy']);

        // Feature tag management
        Route::post('/feature-tags', [FeatureTagController::class, 'store']);
        Route::delete('/feature-tags/{id}', [FeatureTagController::class, 'destroy']);

        // Room (facility) management
        Route::post('/facilities', [FacilityController::class, 'store']);
        Route::put('/facilities/{facility}', [FacilityController::class, 'update']);
        Route::delete('/facilities/{facility}', [FacilityController::class, 'destroy']);

        // Dashboard stats
        Route::get('/admin/stats', [AdminStatsController::class, 'index']);

        // User management
        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::put('/admin/users/{id}/role', [AdminUserController::class, 'updateRole']);

        // Complaint management
        Route::get('/admin/complaints', [ComplaintController::class, 'adminIndex']);
        Route::put('/admin/complaints/{id}', [ComplaintController::class, 'adminUpdate']);
    });
});
