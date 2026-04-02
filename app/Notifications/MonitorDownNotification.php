<?php

namespace App\Notifications;

use App\Models\Monitor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MonitorDownNotification extends Notification implements ShouldQueue
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
            ->subject("🔴 [{$this->monitor->name}] is DOWN")
            ->greeting('Monitor Alert')
            ->line("Your monitor **{$this->monitor->name}** is currently DOWN.")
            ->line("URL: {$this->monitor->url}")
            ->line('We will notify you when it recovers.')
            ->action('View Monitor', url("/monitors/{$this->monitor->id}"))
            ->salutation('VOiD Uptime');
    }
}
