<?php

namespace App\Jobs;

use App\Models\Monitor;
use App\Models\MonitorCheck;
use App\Models\MonitorIncident;
use App\Models\NotificationPreference;
use App\Notifications\MonitorDownNotification;
use App\Notifications\MonitorRecoveredNotification;
use App\Notifications\MonitorSlowNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Throwable;

class CheckMonitorJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly Monitor $monitor) {}

    public function handle(): void
    {
        $previousStatus = $this->monitor->last_status;
        $startTime = microtime(true);
        $status = 'down';
        $responseTimeMs = null;
        $httpStatusCode = null;
        $errorMessage = null;

        try {
            $response = Http::timeout(30)
                ->withOptions(['allow_redirects' => true])
                ->get($this->monitor->url);

            $responseTimeMs = (int) ((microtime(true) - $startTime) * 1000);
            $httpStatusCode = $response->status();

            if ($response->status() !== 200) {
                $status = 'down';
                $errorMessage = "HTTP {$httpStatusCode}";
            } elseif ($responseTimeMs >= 15000) {
                $status = 'slow';
            } else {
                $status = 'up';
            }
        } catch (Throwable $e) {
            $responseTimeMs = (int) ((microtime(true) - $startTime) * 1000);
            $errorMessage = $e->getMessage();
            $status = 'down';
        }

        MonitorCheck::create([
            'monitor_id' => $this->monitor->id,
            'status' => $status,
            'response_time_ms' => $responseTimeMs,
            'http_status_code' => $httpStatusCode,
            'error_message' => $errorMessage,
            'checked_at' => now(),
        ]);

        $this->monitor->update([
            'last_status' => $status,
            'last_checked_at' => now(),
        ]);

        $this->handleIncidents($previousStatus, $status);
    }

    private function handleIncidents(string $previousStatus, string $newStatus): void
    {
        $wasHealthy = $previousStatus === 'up' || $previousStatus === 'pending';
        $wasUnhealthy = in_array($previousStatus, ['down', 'slow']);
        $isUnhealthy = in_array($newStatus, ['down', 'slow']);
        $isHealthy = $newStatus === 'up';

        if ($isUnhealthy && ($wasHealthy || $previousStatus !== $newStatus)) {
            // Close any existing open incident of a different type
            MonitorIncident::where('monitor_id', $this->monitor->id)
                ->whereNull('resolved_at')
                ->update(['resolved_at' => now()]);

            // Open a new incident
            MonitorIncident::create([
                'monitor_id' => $this->monitor->id,
                'type' => $newStatus,
                'started_at' => now(),
            ]);

            $this->notifyUsers($newStatus === 'down' ? 'down' : 'slow');
        }

        if ($isHealthy && $wasUnhealthy) {
            // Resolve all open incidents
            MonitorIncident::where('monitor_id', $this->monitor->id)
                ->whereNull('resolved_at')
                ->update(['resolved_at' => now()]);

            $this->notifyUsers('recover');
        }
    }

    private function notifyUsers(string $event): void
    {
        $users = $this->getUsersToNotify($event);

        foreach ($users as $user) {
            $notification = match ($event) {
                'down' => new MonitorDownNotification($this->monitor),
                'slow' => new MonitorSlowNotification($this->monitor),
                'recover' => new MonitorRecoveredNotification($this->monitor),
            };

            $user->notify($notification);
        }
    }

    private function getUsersToNotify(string $event): \Illuminate\Support\Collection
    {
        $column = match ($event) {
            'down' => 'notify_down',
            'slow' => 'notify_slow',
            'recover' => 'notify_recover',
        };

        $prefs = NotificationPreference::with('user')
            ->where('monitor_id', $this->monitor->id)
            ->where($column, true)
            ->get();

        $userIds = $prefs->pluck('user_id');

        // Always include the owner if they have a preference set; if not, include them by default
        $ownerHasPref = $prefs->contains('user_id', $this->monitor->user_id);
        if (! $ownerHasPref) {
            $userIds->push($this->monitor->user_id);
        }

        return \App\Models\User::whereIn('id', $userIds->unique())->get();
    }
}
