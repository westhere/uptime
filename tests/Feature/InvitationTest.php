<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\Monitor;
use App\Models\MonitorShare;
use App\Models\User;
use App\Notifications\MonitorInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class InvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_send_invitation(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)
            ->post("/monitors/{$monitor->public_id}/invitations", [
                'email' => 'invitee@example.com',
                'permission' => 'view',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('invitations', [
            'monitor_id' => $monitor->id,
            'email' => 'invitee@example.com',
            'permission' => 'view',
        ]);

        Notification::assertSentOnDemand(MonitorInvitationNotification::class);
    }

    public function test_non_owner_cannot_send_invitation(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($stranger)
            ->post("/monitors/{$monitor->public_id}/invitations", [
                'email' => 'invitee@example.com',
                'permission' => 'view',
            ])
            ->assertForbidden();
    }

    public function test_cannot_invite_monitor_owner(): void
    {
        $owner = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)
            ->post("/monitors/{$monitor->public_id}/invitations", [
                'email' => $owner->email,
                'permission' => 'view',
            ])
            ->assertSessionHasErrors('email');
    }

    public function test_duplicate_pending_invitation_is_rejected(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)->post("/monitors/{$monitor->public_id}/invitations", [
            'email' => 'invitee@example.com',
            'permission' => 'view',
        ]);

        $this->actingAs($owner)
            ->post("/monitors/{$monitor->public_id}/invitations", [
                'email' => 'invitee@example.com',
                'permission' => 'view',
            ])
            ->assertSessionHasErrors('email');
    }

    public function test_accept_invitation_page_renders(): void
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create(['email' => 'invitee@example.com']);
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $invitation = Invitation::create([
            'monitor_id' => $monitor->id,
            'invited_by' => $owner->id,
            'email' => $invitee->email,
            'permission' => 'view',
            'token' => Invitation::generateToken(),
            'expires_at' => now()->addDays(7),
        ]);

        $this->actingAs($invitee)
            ->get("/invitations/{$invitation->token}/accept")
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Invitations/Accept'));
    }

    public function test_user_can_accept_invitation(): void
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create(['email' => 'invitee@example.com']);
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $invitation = Invitation::create([
            'monitor_id' => $monitor->id,
            'invited_by' => $owner->id,
            'email' => $invitee->email,
            'permission' => 'edit',
            'token' => Invitation::generateToken(),
            'expires_at' => now()->addDays(7),
        ]);

        $this->actingAs($invitee)
            ->post("/invitations/{$invitation->token}/confirm")
            ->assertRedirect("/monitors/{$monitor->public_id}");

        $this->assertDatabaseHas('monitor_shares', [
            'monitor_id' => $monitor->id,
            'user_id' => $invitee->id,
            'permission' => 'edit',
        ]);

        $this->assertDatabaseHas('invitations', [
            'id' => $invitation->id,
        ]);

        $this->assertNotNull($invitation->fresh()->accepted_at);
    }

    public function test_expired_invitation_shows_expired_page(): void
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create(['email' => 'invitee@example.com']);
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $invitation = Invitation::create([
            'monitor_id' => $monitor->id,
            'invited_by' => $owner->id,
            'email' => $invitee->email,
            'permission' => 'view',
            'token' => Invitation::generateToken(),
            'expires_at' => now()->subDay(),
        ]);

        $this->actingAs($invitee)
            ->get("/invitations/{$invitation->token}/accept")
            ->assertInertia(fn ($page) => $page->component('Invitations/Expired'));
    }

    public function test_wrong_user_cannot_accept_invitation(): void
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create(['email' => 'invitee@example.com']);
        $wrongUser = User::factory()->create(['email' => 'wrong@example.com']);
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $invitation = Invitation::create([
            'monitor_id' => $monitor->id,
            'invited_by' => $owner->id,
            'email' => $invitee->email,
            'permission' => 'view',
            'token' => Invitation::generateToken(),
            'expires_at' => now()->addDays(7),
        ]);

        $this->actingAs($wrongUser)
            ->post("/invitations/{$invitation->token}/confirm")
            ->assertSessionHasErrors('email');

        $this->assertDatabaseMissing('monitor_shares', [
            'monitor_id' => $monitor->id,
            'user_id' => $wrongUser->id,
        ]);
    }

    public function test_owner_can_update_share_permission(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $share = MonitorShare::create([
            'monitor_id' => $monitor->id,
            'user_id' => $viewer->id,
            'permission' => 'view',
        ]);

        $this->actingAs($owner)
            ->patch("/shares/{$share->id}", ['permission' => 'edit'])
            ->assertRedirect();

        $this->assertDatabaseHas('monitor_shares', ['id' => $share->id, 'permission' => 'edit']);
    }

    public function test_owner_can_remove_share(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $share = MonitorShare::create([
            'monitor_id' => $monitor->id,
            'user_id' => $viewer->id,
            'permission' => 'view',
        ]);

        $this->actingAs($owner)
            ->delete("/shares/{$share->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('monitor_shares', ['id' => $share->id]);
    }
}
