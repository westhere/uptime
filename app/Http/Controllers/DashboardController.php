<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $ownedMonitors = $user->monitors()
            ->with('openIncident')
            ->orderBy('name')
            ->get()
            ->map(fn ($m) => $this->formatMonitor($m));

        $sharedMonitors = $user->monitorShares()
            ->with(['monitor.openIncident', 'monitor.owner'])
            ->get()
            ->map(fn ($share) => array_merge(
                $this->formatMonitor($share->monitor),
                ['permission' => $share->permission, 'owner' => $share->monitor->owner->name]
            ));

        return Inertia::render('Dashboard', [
            'ownedMonitors' => $ownedMonitors,
            'sharedMonitors' => $sharedMonitors,
        ]);
    }

    private function formatMonitor($monitor): array
    {
        return [
            'id' => $monitor->id,
            'name' => $monitor->name,
            'url' => $monitor->url,
            'last_status' => $monitor->last_status,
            'last_checked_at' => $monitor->last_checked_at?->toISOString(),
            'frequency_minutes' => $monitor->frequency_minutes,
            'is_active' => $monitor->is_active,
            'has_open_incident' => $monitor->openIncident !== null,
        ];
    }
}
