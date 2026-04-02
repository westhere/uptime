<?php

namespace App\Http\Controllers;

use App\Models\Monitor;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_users' => User::where('is_admin', false)->count(),
                'total_monitors' => Monitor::count(),
                'active_monitors' => Monitor::where('is_active', true)->count(),
                'monitors_down' => Monitor::where('last_status', 'down')->count(),
                'monitors_slow' => Monitor::where('last_status', 'slow')->count(),
            ],
            'users' => User::where('is_admin', false)
                ->withCount('monitors')
                ->orderBy('created_at', 'desc')
                ->paginate(20)
                ->through(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'monitors_count' => $u->monitors_count,
                    'created_at' => $u->created_at->toDateString(),
                ]),
        ]);
    }

    public function destroyUser(User $user): RedirectResponse
    {
        if ($user->is_admin) {
            abort(403, 'Cannot delete admin users.');
        }

        $user->delete();

        return back()->with('success', 'User removed from the system.');
    }
}
