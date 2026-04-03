<?php

namespace App\Http\Controllers;

use App\Models\Monitor;
use App\Models\MonitorCheck;
use App\Models\MonitorIncident;
use App\Models\MonitorShare;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        [$from, $to, $isCustom, $preset] = $this->parseRange($request);

        // All monitors the user owns or has report access to
        $ownedIds = $user->monitors()->pluck('id');
        $sharedIds = MonitorShare::where('user_id', $user->id)
            ->where('view_reports', true)
            ->pluck('monitor_id');

        $allIds = $ownedIds->merge($sharedIds)->unique()->all();

        $monitors = Monitor::whereIn('id', $allIds)
            ->with('owner')
            ->orderBy('name')
            ->get();

        $stats = $this->bulkStats($monitors->pluck('id')->all(), $from, $to);

        $monitorData = $monitors->map(fn ($m) => array_merge(
            [
                'id'         => $m->public_id,
                'name'       => $m->name,
                'url'        => $m->url,
                'last_status' => $m->last_status,
                'is_owner'   => $m->user_id === $user->id,
                'owner_name' => $m->user_id !== $user->id ? $m->owner->name : null,
            ],
            $stats[$m->id] ?? $this->emptyStats()
        ));

        return Inertia::render('Reports/Index', [
            'monitors'   => $monitorData,
            'preset'     => $preset,
            'range_from' => $from->toDateString(),
            'range_to'   => $to->toDateString(),
            'is_custom'  => $isCustom,
        ]);
    }

    public function show(Request $request, Monitor $monitor): Response
    {
        Gate::authorize('viewReports', $monitor);

        [$from, $to, $isCustom, $preset] = $this->parseRange($request);

        $checks = $monitor->checks()
            ->where('checked_at', '>=', $from)
            ->where('checked_at', '<=', $to)
            ->orderBy('checked_at')
            ->get(['status', 'response_time_ms', 'checked_at', 'http_status_code']);

        $total = $checks->count();
        $up    = $checks->where('status', 'up')->count();
        $slow  = $checks->where('status', 'slow')->count();
        $down  = $checks->where('status', 'down')->count();

        $responseTimes = $checks->whereNotNull('response_time_ms')->pluck('response_time_ms');

        $incidents = $monitor->incidents()
            ->where('started_at', '>=', $from)
            ->where('started_at', '<=', $to)
            ->orderByDesc('started_at')
            ->get();

        // For ongoing incidents, count time to now as downtime
        $totalDowntimeSeconds = (int) $incidents->sum(
            fn ($i) => $i->durationSeconds() ?? now()->diffInSeconds($i->started_at)
        );

        return Inertia::render('Reports/Show', [
            'monitor' => [
                'id'          => $monitor->public_id,
                'name'        => $monitor->name,
                'url'         => $monitor->url,
                'last_status' => $monitor->last_status,
            ],
            'stats' => [
                'total_checks'           => $total,
                'uptime_pct'             => $total > 0 ? round((($up + $slow) / $total) * 100, 2) : null,
                'up'                     => $up,
                'slow'                   => $slow,
                'down'                   => $down,
                'avg_response_ms'        => $responseTimes->count() > 0 ? (int) round($responseTimes->avg()) : null,
                'min_response_ms'        => $responseTimes->count() > 0 ? (int) $responseTimes->min() : null,
                'max_response_ms'        => $responseTimes->count() > 0 ? (int) $responseTimes->max() : null,
                'incident_count'         => $incidents->count(),
                'total_downtime_seconds' => $totalDowntimeSeconds,
            ],
            'timeline' => $this->buildTimeline($checks, $from, $to),
            'response_timeline' => $this->buildResponseTimeline($checks, $from, $to),
            'incidents' => $incidents->map(fn ($i) => [
                'id'               => $i->id,
                'type'             => $i->type,
                'started_at'       => $i->started_at->toISOString(),
                'resolved_at'      => $i->resolved_at?->toISOString(),
                'duration_seconds' => $i->durationSeconds(),
            ]),
            'preset'     => $preset,
            'range_from' => $from->toDateString(),
            'range_to'   => $to->toDateString(),
            'is_custom'  => $isCustom,
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function parseRange(Request $request): array
    {
        $validPresets = ['30', '90', '180', '365'];

        if ($request->filled('from') && $request->filled('to')) {
            $from = Carbon::parse($request->from)->startOfDay();
            $to   = Carbon::parse($request->to)->endOfDay();
            $to   = $to->isFuture() ? now() : $to;
            $from = $from->gte($to) ? $to->copy()->subDays(30)->startOfDay() : $from;
            return [$from, $to, true, 'custom'];
        }

        $preset = in_array($request->get('preset'), $validPresets) ? $request->get('preset') : '30';
        return [now()->subDays((int) $preset)->startOfDay(), now(), false, $preset];
    }

    private function buildTimeline($checks, Carbon $from, Carbon $to): array
    {
        if ($checks->isEmpty()) {
            return [];
        }

        $days = (int) ceil($from->diffInDays($to));

        if ($days <= 31) {
            $grouped    = $checks->groupBy(fn ($c) => $c->checked_at->format('Y-m-d'));
            $bucketLabel = 'day';
            $formatFn   = fn ($b) => Carbon::parse($b)->format('M j');
        } elseif ($days <= 90) {
            $grouped    = $checks->groupBy(fn ($c) => $c->checked_at->copy()->startOfWeek()->format('Y-m-d'));
            $bucketLabel = 'week';
            $formatFn   = fn ($b) => 'w/c ' . Carbon::parse($b)->format('M j');
        } else {
            $grouped    = $checks->groupBy(fn ($c) => $c->checked_at->format('Y-m'));
            $bucketLabel = 'month';
            $formatFn   = fn ($b) => Carbon::parse($b . '-01')->format('M Y');
        }

        return $grouped->map(function ($bucketChecks, $bucket) use ($bucketLabel, $formatFn) {
            $total   = $bucketChecks->count();
            $up      = $bucketChecks->where('status', 'up')->count();
            $slow    = $bucketChecks->where('status', 'slow')->count();
            $down    = $bucketChecks->where('status', 'down')->count();
            $avgResp = $bucketChecks->whereNotNull('response_time_ms')->avg('response_time_ms');

            return [
                'bucket'          => $bucket,
                'label'           => $formatFn($bucket),
                'bucket_label'    => $bucketLabel,
                'up'              => $up,
                'slow'            => $slow,
                'down'            => $down,
                'total'           => $total,
                'uptime_pct'      => $total > 0 ? round((($up + $slow) / $total) * 100, 1) : 100,
                'avg_response_ms' => $avgResp ? (int) round($avgResp) : null,
            ];
        })->values()->toArray();
    }

    /**
     * Finer-grained timeline purely for the response time chart:
     *   ≤ 31 days  → hourly buckets
     *   ≤ 90 days  → 4-hourly buckets
     *   > 90 days  → daily buckets
     */
    private function buildResponseTimeline($checks, Carbon $from, Carbon $to): array
    {
        if ($checks->isEmpty()) {
            return [];
        }

        $days = (int) ceil($from->diffInDays($to));

        if ($days <= 31) {
            $grouped  = $checks->groupBy(fn ($c) => $c->checked_at->format('Y-m-d H:00:00'));
            $formatFn = fn ($b) => Carbon::parse($b)->format('M j H:i');
        } elseif ($days <= 90) {
            $grouped  = $checks->groupBy(function ($c) {
                $block = (int) floor((int) $c->checked_at->format('H') / 4) * 4;
                return $c->checked_at->format('Y-m-d ') . str_pad($block, 2, '0', STR_PAD_LEFT) . ':00:00';
            });
            $formatFn = fn ($b) => Carbon::parse($b)->format('M j H:i');
        } else {
            $grouped  = $checks->groupBy(fn ($c) => $c->checked_at->format('Y-m-d'));
            $formatFn = fn ($b) => Carbon::parse($b)->format('M j');
        }

        return $grouped
            ->map(function ($bucketChecks, $bucket) use ($formatFn) {
                $withTime = $bucketChecks->whereNotNull('response_time_ms');
                if ($withTime->isEmpty()) {
                    return null;
                }
                return [
                    'bucket'          => $bucket,
                    'label'           => $formatFn($bucket),
                    'avg_response_ms' => (int) round($withTime->avg('response_time_ms')),
                    'min_response_ms' => (int) $withTime->min('response_time_ms'),
                    'max_response_ms' => (int) $withTime->max('response_time_ms'),
                ];
            })
            ->filter()
            ->values()
            ->toArray();
    }

    private function bulkStats(array $monitorIds, Carbon $from, Carbon $to): array
    {
        if (empty($monitorIds)) {
            return [];
        }

        $checks = MonitorCheck::whereIn('monitor_id', $monitorIds)
            ->where('checked_at', '>=', $from)
            ->where('checked_at', '<=', $to)
            ->get(['monitor_id', 'status', 'response_time_ms']);

        $incidents = MonitorIncident::whereIn('monitor_id', $monitorIds)
            ->where('started_at', '>=', $from)
            ->where('started_at', '<=', $to)
            ->get(['monitor_id']);

        $result = [];
        foreach ($monitorIds as $id) {
            $mc   = $checks->where('monitor_id', $id);
            $total = $mc->count();
            $up   = $mc->where('status', 'up')->count();
            $slow = $mc->where('status', 'slow')->count();
            $rt   = $mc->whereNotNull('response_time_ms')->pluck('response_time_ms');

            $result[$id] = [
                'total_checks'    => $total,
                'uptime_pct'      => $total > 0 ? round((($up + $slow) / $total) * 100, 1) : null,
                'avg_response_ms' => $rt->count() > 0 ? (int) round($rt->avg()) : null,
                'incident_count'  => $incidents->where('monitor_id', $id)->count(),
            ];
        }

        return $result;
    }

    private function emptyStats(): array
    {
        return [
            'total_checks'    => 0,
            'uptime_pct'      => null,
            'avg_response_ms' => null,
            'incident_count'  => 0,
        ];
    }
}
