<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class MonitorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->create()->id,
            'name' => $this->faker->company() . ' Website',
            'url' => 'https://' . $this->faker->domainName(),
            'frequency_minutes' => $this->faker->randomElement([1, 5, 15, 30, 60]),
            'is_active' => true,
            'last_status' => 'pending',
            'last_checked_at' => null,
            'public_id' => Str::random(12),
        ];
    }
}
