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

        // Support custom date range via from/to params, falling back to preset hours
        $fromParam = request('from');
        $toParam   = request('to');

        if ($fromParam && $toParam) {
            $from  = \Carbon\Carbon::parse($fromParam)->startOfMinute();
            $to    = \Carbon\Carbon::parse($toParam)->startOfMinute();
            // Clamp: to cannot be in the future, from must be before to
            $to    = $to->isFuture() ? now() : $to;
            $from  = $from->gte($to) ? $to->copy()->subHours(1) : $from;
            $hours = (int) ceil($from->diffInHours($to));
            $hours = max($hours, 1);
            $isCustom = true;
        } else {
            $hoursParam = (int) request('hours', 12);
            $hours = in_array($hoursParam, [1, 3, 6, 12, 24, 48, 168, 720]) ? $hoursParam : 12;
            $from  = now()->subHours($hours);
            $to    = now();
            $isCustom = false;
        }

        $timeline = $this->buildTimeline($monitor, $from, $to);

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
                'id' => $monitor->public_id,
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
            'range_from' => $from->toISOString(),
            'range_to' => $to->toISOString(),
            'is_custom' => $isCustom,
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
                'id' => $monitor->public_id,
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

    private function buildTimeline(Monitor $monitor, \Carbon\Carbon $from, \Carbon\Carbon $to): array
    {
        $hours = (int) ceil($from->diffInHours($to));
        $hours = max($hours, 1);

        $checks = $monitor->checks()
            ->where('checked_at', '>=', $from)
            ->where('checked_at', '<=', $to)
            ->orderBy('checked_at')
            ->get();

        if ($checks->isEmpty()) {
            return [];
        }

        // Choose bucket size based on timeframe so shorter ranges show finer detail
        if ($hours <= 1) {
            $format = 'Y-m-d H:i:00';      // per minute
            $bucketLabel = 'minute';
        } elseif ($hours <= 6) {
            $format = 'Y-m-d H:i:00';      // per 5-minute slot
            $bucketLabel = '5 minutes';
            // Round down to nearest 5-minute boundary
            $grouped = $checks->groupBy(function ($c) {
                $floored = (int) floor((int) $c->checked_at->format('i') / 5) * 5;
                return $c->checked_at->format('Y-m-d H:') . str_pad($floored, 2, '0', STR_PAD_LEFT) . ':00';
            });
        } elseif ($hours <= 24) {
            $format = 'Y-m-d H:00:00';     // per 15-minute slot
            $bucketLabel = '15 minutes';
            $grouped = $checks->groupBy(function ($c) {
                $floored = (int) floor((int) $c->checked_at->format('i') / 15) * 15;
                return $c->checked_at->format('Y-m-d H:') . str_pad($floored, 2, '0', STR_PAD_LEFT) . ':00';
            });
        } else {
            $format = 'Y-m-d H:00:00';     // per hour
            $bucketLabel = 'hour';
            $grouped = $checks->groupBy(fn ($c) => $c->checked_at->format($format));
        }

        // For per-minute case (hours <= 1), use simple format groupBy
        if ($hours <= 1) {
            $grouped = $checks->groupBy(fn ($c) => $c->checked_at->format($format));
        }

        return $grouped->map(function ($bucketChecks, $bucket) use ($bucketLabel) {
            $total = $bucketChecks->count();
            $up = $bucketChecks->where('status', 'up')->count();
            $slow = $bucketChecks->where('status', 'slow')->count();
            $down = $bucketChecks->where('status', 'down')->count();
            $avgResponse = $bucketChecks->whereNotNull('response_time_ms')->avg('response_time_ms');

            $dominantStatus = 'up';
            if ($down > 0) {
                $dominantStatus = 'down';
            } elseif ($slow > 0) {
                $dominantStatus = 'slow';
            }

            return [
                'bucket' => $bucket,
                'bucket_label' => $bucketLabel,
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
