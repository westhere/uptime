<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'nathan@voidapps.co.uk'],
            [
                'name' => 'Nathan',
                'password' => 'Password1!',
                'is_admin' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
