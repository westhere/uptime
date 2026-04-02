<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_page_renders(): void
    {
        $this->get('/register')->assertStatus(200);
    }

    public function test_user_can_register(): void
    {
        $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
        ])->assertRedirect('/dashboard');

        $this->assertDatabaseHas('users', ['email' => 'test@example.com', 'is_admin' => false]);
    }

    public function test_login_page_renders(): void
    {
        $this->get('/login')->assertStatus(200);
    }

    public function test_user_can_login(): void
    {
        $user = User::factory()->create(['password' => 'Password1!']);

        $this->post('/login', ['email' => $user->email, 'password' => 'Password1!'])
            ->assertRedirect('/dashboard');

        $this->assertAuthenticatedAs($user);
    }

    public function test_wrong_password_is_rejected(): void
    {
        $user = User::factory()->create(['password' => 'correct-password']);

        $this->post('/login', ['email' => $user->email, 'password' => 'wrong-password'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_authenticated_user_is_redirected_from_login(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/login')->assertRedirect('/dashboard');
    }

    public function test_unauthenticated_user_is_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/logout')->assertRedirect('/');

        $this->assertGuest();
    }
}
