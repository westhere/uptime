<?php

namespace App\Notifications;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MonitorInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Invitation $invitation) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $inviterName = $this->invitation->invitedBy->name;
        $monitorName = $this->invitation->monitor->name;
        $acceptUrl = url("/invitations/{$this->invitation->token}/accept");

        return (new MailMessage)
            ->subject("{$inviterName} has invited you to monitor {$monitorName}")
            ->greeting('You have been invited!')
            ->line("{$inviterName} has invited you to view the monitor **{$monitorName}** on VOiD Uptime.")
            ->line('Click the button below to accept the invitation. This link expires in 7 days.')
            ->action('Accept Invitation', $acceptUrl)
            ->salutation('VOiD Uptime');
    }
}
