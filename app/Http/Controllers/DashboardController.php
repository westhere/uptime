<?php

namespace App\Http\Controllers;

use App\Models\MonitorCheck;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $owned   = $user->monitors()->with('openIncident')->orderBy('name')->get();
        $shares  = $user->monitorShares()->with(['monitor.openIncident', 'monitor.owner'])->get();

        $allMonitors = $owned->concat($shares->map->monitor)->unique('id');
        $timelines   = $this->buildMiniTimelines($allMonitors->pluck('id')->all());

        $ownedMonitors = $owned->map(
            fn ($m) => $this->formatMonitor($m, $timelines[$m->id] ?? [])
        );

        $sharedMonitors = $shares->map(fn ($share) => array_merge(
            $this->formatMonitor($share->monitor, $timelines[$share->monitor->id] ?? []),
            ['permission' => $share->permission, 'owner' => $share->monitor->owner->name]
        ));

        return Inertia::render('Dashboard', [
            'ownedMonitors'  => $ownedMonitors,
            'sharedMonitors' => $sharedMonitors,
        ]);
    }

    private function formatMonitor($monitor, array $timeline): array
    {
        return [
            'id'             => $monitor->public_id,
            'name'           => $monitor->name,
            'url'            => $monitor->url,
            'last_status'    => $monitor->last_status,
            'is_active'      => $monitor->is_active,
            'has_open_incident' => $monitor->openIncident !== null,
            'timeline'       => $timeline,
        ];
    }

    /**
     * Build 15-minute-bucket timelines for the last 24 h for all given monitor IDs.
     * Single query — no N+1.
     *
     * @param  int[]  $monitorIds
     * @return array<int, array>  keyed by monitor_id
     */
    private function buildMiniTimelines(array $monitorIds): array
    {
        if (empty($monitorIds)) {
            return [];
        }

        $since = now()->subHours(6);

        $checks = MonitorCheck::whereIn('monitor_id', $monitorIds)
            ->where('checked_at', '>=', $since)
            ->orderBy('checked_at')
            ->get(['monitor_id', 'status', 'checked_at']);

        // Group by monitor_id, then bucket into 15-min slots
        $byMonitor = $checks->groupBy('monitor_id');

        $result = [];
        foreach ($byMonitor as $monitorId => $monitorChecks) {
            $bucketed = $monitorChecks->groupBy(function ($c) {
                $floored = (int) floor((int) $c->checked_at->format('i') / 5) * 5;
                return $c->checked_at->format('Y-m-d H:') . str_pad($floored, 2, '0', STR_PAD_LEFT) . ':00';
            });

            $result[$monitorId] = $bucketed->map(function ($bucketChecks) {
                $total = $bucketChecks->count();
                $up    = $bucketChecks->where('status', 'up')->count();
                $slow  = $bucketChecks->where('status', 'slow')->count();
                $down  = $bucketChecks->where('status', 'down')->count();

                $status = 'up';
                if ($down > 0) $status = 'down';
                elseif ($slow > 0) $status = 'slow';

                return [
                    'status'     => $status,
                    'uptime_pct' => $total > 0 ? round((($up + $slow) / $total) * 100, 1) : 100,
                ];
            })->values()->all();
        }

        return $result;
    }
}
