<?php

namespace App\Notifications;

use App\Models\Monitor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MonitorSlowNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Monitor $monitor) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("🟡 [{$this->monitor->name}] is SLOW")
            ->greeting('Monitor Alert')
            ->line("Your monitor **{$this->monitor->name}** is responding slowly (over 15 seconds).")
            ->line("URL: {$this->monitor->url}")
            ->line('We will notify you when it returns to normal or goes down.')
            ->action('View Monitor', route("monitors.show", $this->monitor->public_id))
            ->salutation('VOiD Uptime');
    }
}
