<?php

namespace Tests\Feature;

use App\Jobs\CheckMonitorJob;
use App\Models\Monitor;
use App\Models\MonitorIncident;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Notifications\MonitorDownNotification;
use App\Notifications\MonitorRecoveredNotification;
use App\Notifications\MonitorSlowNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CheckMonitorJobTest extends TestCase
{
    use RefreshDatabase;

    private function makeMonitor(array $attrs = []): Monitor
    {
        $user = User::factory()->create();
        $monitor = Monitor::factory()->create(array_merge(['user_id' => $user->id], $attrs));

        NotificationPreference::create([
            'user_id' => $user->id,
            'monitor_id' => $monitor->id,
            'notify_down' => true,
            'notify_slow' => true,
            'notify_recover' => true,
        ]);

        return $monitor;
    }

    public function test_up_response_records_up_status(): void
    {
        Http::fake(['*' => Http::response('OK', 200)]);

        $monitor = $this->makeMonitor(['last_status' => 'pending']);

        CheckMonitorJob::dispatchSync($monitor);

        $monitor->refresh();
        $this->assertEquals('up', $monitor->last_status);
        $this->assertDatabaseHas('monitor_checks', [
            'monitor_id' => $monitor->id,
            'status' => 'up',
            'http_status_code' => 200,
        ]);
    }

    public function test_http_error_response_records_down_status(): void
    {
        Http::fake(['*' => Http::response('Not Found', 404)]);

        $monitor = $this->makeMonitor(['last_status' => 'up']);

        CheckMonitorJob::dispatchSync($monitor);

        $monitor->refresh();
        $this->assertEquals('down', $monitor->last_status);
        $this->assertDatabaseHas('monitor_checks', [
            'monitor_id' => $monitor->id,
            'status' => 'down',
            'http_status_code' => 404,
        ]);
    }

    public function test_non_200_status_is_classed_as_down(): void
    {
        Http::fake(['*' => Http::response('Created', 201)]);

        $monitor = $this->makeMonitor(['last_status' => 'up']);

        CheckMonitorJob::dispatchSync($monitor);

        $monitor->refresh();
        $this->assertEquals('down', $monitor->last_status);
    }

    public function test_down_site_creates_incident(): void
    {
        Http::fake(['*' => Http::response('Error', 500)]);

        $monitor = $this->makeMonitor(['last_status' => 'up']);

        CheckMonitorJob::dispatchSync($monitor);

        $this->assertDatabaseHas('monitor_incidents', [
            'monitor_id' => $monitor->id,
            'type' => 'down',
            'resolved_at' => null,
        ]);
    }

    public function test_recovery_resolves_incident(): void
    {
        Http::fake(['*' => Http::response('OK', 200)]);

        $monitor = $this->makeMonitor(['last_status' => 'down']);

        MonitorIncident::create([
            'monitor_id' => $monitor->id,
            'type' => 'down',
            'started_at' => now()->subMinutes(5),
        ]);

        CheckMonitorJob::dispatchSync($monitor);

        $this->assertDatabaseMissing('monitor_incidents', [
            'monitor_id' => $monitor->id,
            'resolved_at' => null,
        ]);
    }

    public function test_down_notifies_user(): void
    {
        Notification::fake();
        Http::fake(['*' => Http::response('Error', 503)]);

        $monitor = $this->makeMonitor(['last_status' => 'up']);

        CheckMonitorJob::dispatchSync($monitor);

        Notification::assertSentTo($monitor->owner, MonitorDownNotification::class);
    }

    public function test_recovery_notifies_user(): void
    {
        Notification::fake();
        Http::fake(['*' => Http::response('OK', 200)]);

        $monitor = $this->makeMonitor(['last_status' => 'down']);

        MonitorIncident::create([
            'monitor_id' => $monitor->id,
            'type' => 'down',
            'started_at' => now()->subMinutes(5),
        ]);

        CheckMonitorJob::dispatchSync($monitor);

        Notification::assertSentTo($monitor->owner, MonitorRecoveredNotification::class);
    }

    public function test_no_notification_when_status_unchanged(): void
    {
        Notification::fake();
        Http::fake(['*' => Http::response('OK', 200)]);

        $monitor = $this->makeMonitor(['last_status' => 'up']);

        CheckMonitorJob::dispatchSync($monitor);

        Notification::assertNothingSent();
    }

    public function test_last_checked_at_is_updated(): void
    {
        Http::fake(['*' => Http::response('OK', 200)]);

        $monitor = $this->makeMonitor(['last_checked_at' => null]);

        CheckMonitorJob::dispatchSync($monitor);

        $this->assertNotNull($monitor->fresh()->last_checked_at);
    }
}
