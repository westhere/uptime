<?php

namespace App\Http\Controllers;

use App\Models\Invitation;
use App\Models\Monitor;
use App\Models\MonitorShare;
use App\Models\NotificationPreference;
use App\Notifications\MonitorInvitationNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    public function index(Monitor $monitor): Response
    {
        Gate::authorize('update', $monitor);

        $invitations = $monitor->invitations()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($i) => [
                'id' => $i->id,
                'email' => $i->email,
                'permission' => $i->permission,
                'is_accepted' => $i->isAccepted(),
                'is_expired' => $i->isExpired(),
                'is_pending' => $i->isPending(),
                'created_at' => $i->created_at->toISOString(),
                'expires_at' => $i->expires_at->toISOString(),
            ]);

        $shares = $monitor->shares()
            ->with('user')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'user_id' => $s->user_id,
                'name' => $s->user->name,
                'email' => $s->user->email,
                'permission' => $s->permission,
            ]);

        return Inertia::render('Monitors/Invitations', [
            'monitor' => [
                'id' => $monitor->public_id,
                'name' => $monitor->name,
            ],
            'invitations' => $invitations,
            'shares' => $shares,
        ]);
    }

    public function store(Request $request, Monitor $monitor): RedirectResponse
    {
        Gate::authorize('update', $monitor);

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'permission' => ['required', 'in:view,edit'],
        ]);

        // Prevent inviting the owner
        if ($monitor->owner->email === $validated['email']) {
            return back()->withErrors(['email' => 'This user is the monitor owner.']);
        }

        // Check for existing pending invite
        $existing = Invitation::where('monitor_id', $monitor->id)
            ->where('email', $validated['email'])
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        if ($existing) {
            return back()->withErrors(['email' => 'A pending invitation already exists for this email.']);
        }

        $invitation = Invitation::create([
            'monitor_id' => $monitor->id,
            'invited_by' => $request->user()->id,
            'email' => $validated['email'],
            'permission' => $validated['permission'],
            'token' => Invitation::generateToken(),
            'expires_at' => now()->addDays(7),
        ]);

        Notification::route('mail', $validated['email'])
            ->notify(new MonitorInvitationNotification($invitation->load(['invitedBy', 'monitor'])));

        return back()->with('success', 'Invitation sent.');
    }

    public function accept(string $token): Response|RedirectResponse
    {
        $invitation = Invitation::where('token', $token)
            ->with(['monitor', 'invitedBy'])
            ->firstOrFail();

        if ($invitation->isExpired()) {
            return Inertia::render('Invitations/Expired');
        }

        if ($invitation->isAccepted()) {
            return redirect()->route('monitors.show', $invitation->monitor_id);
        }

        return Inertia::render('Invitations/Accept', [
            'invitation' => [
                'token' => $token,
                'monitor_name' => $invitation->monitor->name,
                'invited_by' => $invitation->invitedBy->name,
                'permission' => $invitation->permission,
            ],
        ]);
    }

    public function confirm(Request $request, string $token): RedirectResponse
    {
        $invitation = Invitation::with('monitor')->where('token', $token)->firstOrFail();

        if ($invitation->isExpired() || $invitation->isAccepted()) {
            return redirect()->route('dashboard');
        }

        $user = $request->user();

        if ($user->email !== $invitation->email) {
            return back()->withErrors(['email' => 'This invitation was sent to a different email address.']);
        }

        MonitorShare::updateOrCreate(
            ['monitor_id' => $invitation->monitor_id, 'user_id' => $user->id],
            ['permission' => $invitation->permission]
        );

        NotificationPreference::firstOrCreate(
            ['user_id' => $user->id, 'monitor_id' => $invitation->monitor_id],
            ['notify_down' => true, 'notify_slow' => true, 'notify_recover' => true]
        );

        $invitation->update(['accepted_at' => now()]);

        return redirect()->route('monitors.show', $invitation->monitor->public_id)
            ->with('success', 'Invitation accepted. Welcome to the monitor!');
    }

    public function updateShare(Request $request, MonitorShare $share): RedirectResponse
    {
        Gate::authorize('update', $share->monitor);

        $validated = $request->validate([
            'permission' => ['required', 'in:view,edit'],
        ]);

        $share->update($validated);

        return back()->with('success', 'Permission updated.');
    }

    public function destroyShare(MonitorShare $share): RedirectResponse
    {
        Gate::authorize('update', $share->monitor);

        $share->delete();

        return back()->with('success', 'Access removed.');
    }
}
