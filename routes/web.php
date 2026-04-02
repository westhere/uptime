<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\MonitorController;
use App\Http\Controllers\ProfileController;
use App\Http\Middleware\AdminMiddleware;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    // Monitors
    Route::resource('monitors', MonitorController::class);
    Route::patch('/monitors/{monitor}/notifications', [MonitorController::class, 'updateNotifications'])
        ->name('monitors.notifications.update');

    // Invitations
    Route::get('/monitors/{monitor}/invitations', [InvitationController::class, 'index'])
        ->name('monitors.invitations.index');
    Route::post('/monitors/{monitor}/invitations', [InvitationController::class, 'store'])
        ->name('monitors.invitations.store');
    Route::patch('/shares/{share}', [InvitationController::class, 'updateShare'])
        ->name('shares.update');
    Route::delete('/shares/{share}', [InvitationController::class, 'destroyShare'])
        ->name('shares.destroy');

    // Accept invitation (must be logged in)
    Route::get('/invitations/{token}/accept', [InvitationController::class, 'accept'])
        ->name('invitations.accept');
    Route::post('/invitations/{token}/confirm', [InvitationController::class, 'confirm'])
        ->name('invitations.confirm');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin routes
Route::middleware(['auth', AdminMiddleware::class])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'index'])->name('dashboard');
    Route::delete('/users/{user}', [AdminController::class, 'destroyUser'])->name('users.destroy');
});

require __DIR__.'/auth.php';
