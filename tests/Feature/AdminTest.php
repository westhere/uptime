<?php

namespace Tests\Feature;

use App\Models\Monitor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_admin_panel(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)
            ->get('/admin')
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Admin/Dashboard'));
    }

    public function test_regular_user_cannot_access_admin_panel(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->get('/admin')->assertForbidden();
    }

    public function test_guest_cannot_access_admin_panel(): void
    {
        $this->get('/admin')->assertRedirect('/login');
    }

    public function test_admin_panel_shows_user_stats(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        User::factory()->count(3)->create(['is_admin' => false]);

        $this->actingAs($admin)
            ->get('/admin')
            ->assertInertia(fn ($page) => $page
                ->where('stats.total_users', 3)
            );
    }

    public function test_admin_can_delete_user(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($admin)
            ->delete("/admin/users/{$user->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_cannot_delete_another_admin(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $otherAdmin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)
            ->delete("/admin/users/{$otherAdmin->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $otherAdmin->id]);
    }

    public function test_regular_user_cannot_delete_users(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $target = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)
            ->delete("/admin/users/{$target->id}")
            ->assertForbidden();
    }

    public function test_admin_panel_shows_monitor_stats(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        Monitor::factory()->count(2)->create(['user_id' => $user->id, 'is_active' => true, 'last_status' => 'up']);
        Monitor::factory()->create(['user_id' => $user->id, 'is_active' => true, 'last_status' => 'down']);

        $this->actingAs($admin)
            ->get('/admin')
            ->assertInertia(fn ($page) => $page
                ->where('stats.total_monitors', 3)
                ->where('stats.active_monitors', 3)
                ->where('stats.monitors_down', 1)
            );
    }

    public function test_deleting_user_also_deletes_their_monitors(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        $monitor = Monitor::factory()->create(['user_id' => $user->id]);

        $this->actingAs($admin)->delete("/admin/users/{$user->id}");

        $this->assertDatabaseMissing('monitors', ['id' => $monitor->id]);
    }
}
