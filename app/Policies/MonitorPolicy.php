<?php

namespace App\Policies;

use App\Models\Monitor;
use App\Models\MonitorShare;
use App\Models\User;

class MonitorPolicy
{
    public function view(User $user, Monitor $monitor): bool
    {
        if ($monitor->user_id === $user->id) {
            return true;
        }

        return MonitorShare::where('monitor_id', $monitor->id)
            ->where('user_id', $user->id)
            ->exists();
    }

    public function update(User $user, Monitor $monitor): bool
    {
        if ($monitor->user_id === $user->id) {
            return true;
        }

        return MonitorShare::where('monitor_id', $monitor->id)
            ->where('user_id', $user->id)
            ->where('permission', 'edit')
            ->exists();
    }

    public function delete(User $user, Monitor $monitor): bool
    {
        return $monitor->user_id === $user->id;
    }

    public function viewReports(User $user, Monitor $monitor): bool
    {
        if ($monitor->user_id === $user->id) {
            return true;
        }

        return MonitorShare::where('monitor_id', $monitor->id)
            ->where('user_id', $user->id)
            ->where('view_reports', true)
            ->exists();
    }
}
