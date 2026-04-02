<?php

namespace App\Http\Controllers;

use App\Models\Monitor;
use App\Models\MonitorShare;
use App\Models\NotificationPreference;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MonitorController extends Controller
{
    public function index(Request $request): Response
    {
        return app(DashboardController::class)($request);
    }

    public function create(): Response
    {
        return Inertia::render('Monitors/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:2048'],
            'frequency_minutes' => ['required', 'integer', 'in:1,5,15,30,60'],
        ]);

        $monitor = $request->user()->monitors()->create($validated);

        // Create default notification prefs for owner
        NotificationPreference::create([
            'user_id' => $request->user()->id,
            'monitor_id' => $monitor->id,
            'notify_down' => true,
            'notify_slow' => true,
            'notify_recover' => true,
        ]);

        return redirect()->route('monitors.show', $monitor)->with('success', 'Monitor created.');
    }

    public function show(Request $request, Monitor $monitor): Response
    {
        Gate::authorize('view', $monitor);

        $user = $request->user();
        $isOwner = $monitor->user_id === $user->id;

        $share = $isOwner ? null : MonitorShare::where('monitor_id', $monitor->id)
            ->where('user_id', $user->id)
            ->first();

        $canEdit = $isOwner || ($share && $share->canEdit());

        $notifPref = NotificationPreference::firstOrCreate(
            ['user_id' => $user->id, 'monitor_id' => $monitor->id],
            ['notify_down' => true, 'notify_slow' => true, 'notify_recover' => true]
        );

        $hoursParam = (int) request('hours', 12);
        $hours = in_array($hoursParam, [1, 3, 6, 12, 24, 48, 168, 720]) ? $hoursParam : 12;

        $timeline = $this->buildTimeline($monitor, $hours);

        $incidents = $monitor->incidents()
            ->orderByDesc('started_at')
            ->limit(20)
            ->get()
            ->map(fn ($i) => [
                'id' => $i->id,
                'type' => $i->type,
                'started_at' => $i->started_at->toISOString(),
                'resolved_at' => $i->resolved_at?->toISOString(),
                'duration_seconds' => $i->durationSeconds(),
            ]);

        return Inertia::render('Monitors/Show', [
            'monitor' => [
                'id' => $monitor->id,
                'name' => $monitor->name,
                'url' => $monitor->url,
                'last_status' => $monitor->last_status,
                'last_checked_at' => $monitor->last_checked_at?->toISOString(),
                'frequency_minutes' => $monitor->frequency_minutes,
                'is_active' => $monitor->is_active,
                'uptime_percentage' => $monitor->uptimePercentage($hours),
                'is_owner' => $isOwner,
                'can_edit' => $canEdit,
            ],
            'timeline' => $timeline,
            'incidents' => $incidents,
            'hours' => $hours,
            'notification_preferences' => [
                'notify_down' => $notifPref->notify_down,
                'notify_slow' => $notifPref->notify_slow,
                'notify_recover' => $notifPref->notify_recover,
            ],
        ]);
    }

    public function edit(Monitor $monitor): Response
    {
        Gate::authorize('update', $monitor);

        return Inertia::render('Monitors/Edit', [
            'monitor' => [
                'id' => $monitor->id,
                'name' => $monitor->name,
                'url' => $monitor->url,
                'frequency_minutes' => $monitor->frequency_minutes,
                'is_active' => $monitor->is_active,
            ],
        ]);
    }

    public function update(Request $request, Monitor $monitor): RedirectResponse
    {
        Gate::authorize('update', $monitor);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:2048'],
            'frequency_minutes' => ['required', 'integer', 'in:1,5,15,30,60'],
            'is_active' => ['boolean'],
        ]);

        $monitor->update($validated);

        return redirect()->route('monitors.show', $monitor)->with('success', 'Monitor updated.');
    }

    public function destroy(Monitor $monitor): RedirectResponse
    {
        Gate::authorize('delete', $monitor);

        $monitor->delete();

        return redirect()->route('dashboard')->with('success', 'Monitor deleted.');
    }

    public function updateNotifications(Request $request, Monitor $monitor): RedirectResponse
    {
        Gate::authorize('view', $monitor);

        $validated = $request->validate([
            'notify_down' => ['boolean'],
            'notify_slow' => ['boolean'],
            'notify_recover' => ['boolean'],
        ]);

        NotificationPreference::updateOrCreate(
            ['user_id' => $request->user()->id, 'monitor_id' => $monitor->id],
            $validated
        );

        return back()->with('success', 'Notification preferences updated.');
    }

    private function buildTimeline(Monitor $monitor, int $hours): array
    {
        $from = now()->subHours($hours);

        $checks = $monitor->checks()
            ->where('checked_at', '>=', $from)
            ->orderBy('checked_at')
            ->get();

        if ($checks->isEmpty()) {
            return [];
        }

        // Aggregate by hour
        $grouped = $checks->groupBy(fn ($c) => $c->checked_at->format('Y-m-d H:00:00'));

        return $grouped->map(function ($hourChecks, $hour) {
            $total = $hourChecks->count();
            $up = $hourChecks->where('status', 'up')->count();
            $slow = $hourChecks->where('status', 'slow')->count();
            $down = $hourChecks->where('status', 'down')->count();
            $avgResponse = $hourChecks->whereNotNull('response_time_ms')->avg('response_time_ms');

            $dominantStatus = 'up';
            if ($down > 0) {
                $dominantStatus = 'down';
            } elseif ($slow > 0) {
                $dominantStatus = 'slow';
            }

            return [
                'hour' => $hour,
                'status' => $dominantStatus,
                'up' => $up,
                'slow' => $slow,
                'down' => $down,
                'total' => $total,
                'uptime_pct' => $total > 0 ? round((($up + $slow) / $total) * 100, 1) : 100,
                'avg_response_ms' => $avgResponse ? (int) $avgResponse : null,
            ];
        })->values()->toArray();
    }
}
