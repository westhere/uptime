<?php

namespace Tests\Feature;

use App\Models\Monitor;
use App\Models\MonitorShare;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonitorTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_shows_owned_monitors(): void
    {
        $user = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $user->id, 'name' => 'My Site']);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->has('ownedMonitors', 1)
                ->where('ownedMonitors.0.name', 'My Site')
            );
    }

    public function test_create_monitor_page_renders(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/monitors/create')->assertStatus(200);
    }

    public function test_user_can_create_monitor(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/monitors', [
                'name' => 'Example Site',
                'url' => 'https://example.com',
                'frequency_minutes' => 5,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('monitors', [
            'user_id' => $user->id,
            'name' => 'Example Site',
            'url' => 'https://example.com',
            'frequency_minutes' => 5,
        ]);
    }

    public function test_monitor_gets_public_id_on_create(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/monitors', [
            'name' => 'Test',
            'url' => 'https://example.com',
            'frequency_minutes' => 5,
        ]);

        $monitor = Monitor::where('user_id', $user->id)->first();
        $this->assertNotNull($monitor->public_id);
        $this->assertEquals(12, strlen($monitor->public_id));
    }

    public function test_monitor_url_uses_public_id(): void
    {
        $user = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get("/monitors/{$monitor->public_id}")
            ->assertStatus(200);
    }

    public function test_monitor_cannot_be_accessed_by_numeric_id(): void
    {
        $user = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $user->id]);

        // Numeric ID should 404 (route key is public_id, not id)
        $this->actingAs($user)
            ->get("/monitors/{$monitor->id}")
            ->assertStatus(404);
    }

    public function test_user_can_update_own_monitor(): void
    {
        $user = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->patch("/monitors/{$monitor->public_id}", [
                'name' => 'Updated Name',
                'url' => 'https://updated.com',
                'frequency_minutes' => 15,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('monitors', ['id' => $monitor->id, 'name' => 'Updated Name']);
    }

    public function test_user_cannot_update_another_users_monitor(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other)
            ->patch("/monitors/{$monitor->public_id}", [
                'name' => 'Hacked',
                'url' => 'https://hacked.com',
                'frequency_minutes' => 5,
                'is_active' => true,
            ])
            ->assertForbidden();
    }

    public function test_user_can_delete_own_monitor(): void
    {
        $user = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->delete("/monitors/{$monitor->public_id}")
            ->assertRedirect('/dashboard');

        $this->assertDatabaseMissing('monitors', ['id' => $monitor->id]);
    }

    public function test_user_cannot_delete_another_users_monitor(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other)
            ->delete("/monitors/{$monitor->public_id}")
            ->assertForbidden();
    }

    public function test_create_monitor_validates_url(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/monitors', [
                'name' => 'Bad URL',
                'url' => 'not-a-url',
                'frequency_minutes' => 5,
            ])
            ->assertSessionHasErrors('url');
    }

    public function test_create_monitor_validates_frequency(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/monitors', [
                'name' => 'Bad Frequency',
                'url' => 'https://example.com',
                'frequency_minutes' => 999,
            ])
            ->assertSessionHasErrors('frequency_minutes');
    }

    public function test_notification_prefs_created_with_monitor(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/monitors', [
            'name' => 'Test',
            'url' => 'https://example.com',
            'frequency_minutes' => 5,
        ]);

        $monitor = Monitor::where('user_id', $user->id)->first();

        $this->assertDatabaseHas('notification_preferences', [
            'user_id' => $user->id,
            'monitor_id' => $monitor->id,
        ]);
    }

    public function test_shared_user_can_view_monitor(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        MonitorShare::create([
            'monitor_id' => $monitor->id,
            'user_id' => $viewer->id,
            'permission' => 'view',
        ]);

        $this->actingAs($viewer)
            ->get("/monitors/{$monitor->public_id}")
            ->assertStatus(200);
    }

    public function test_shared_view_user_cannot_edit_monitor(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        MonitorShare::create([
            'monitor_id' => $monitor->id,
            'user_id' => $viewer->id,
            'permission' => 'view',
        ]);

        $this->actingAs($viewer)
            ->patch("/monitors/{$monitor->public_id}", [
                'name' => 'Attempted Edit',
                'url' => 'https://example.com',
                'frequency_minutes' => 5,
                'is_active' => true,
            ])
            ->assertForbidden();
    }

    public function test_shared_edit_user_can_edit_monitor(): void
    {
        $owner = User::factory()->create();
        $editor = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        MonitorShare::create([
            'monitor_id' => $monitor->id,
            'user_id' => $editor->id,
            'permission' => 'edit',
        ]);

        $this->actingAs($editor)
            ->patch("/monitors/{$monitor->public_id}", [
                'name' => 'Edited Name',
                'url' => 'https://example.com',
                'frequency_minutes' => 5,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('monitors', ['id' => $monitor->id, 'name' => 'Edited Name']);
    }

    public function test_unshared_user_cannot_view_monitor(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($stranger)
            ->get("/monitors/{$monitor->public_id}")
            ->assertForbidden();
    }

    public function test_shared_monitors_appear_on_dashboard(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $owner->id, 'name' => 'Shared Monitor']);

        MonitorShare::create([
            'monitor_id' => $monitor->id,
            'user_id' => $viewer->id,
            'permission' => 'view',
        ]);

        $this->actingAs($viewer)
            ->get('/dashboard')
            ->assertInertia(fn ($page) => $page
                ->has('sharedMonitors', 1)
                ->where('sharedMonitors.0.name', 'Shared Monitor')
            );
    }
}
