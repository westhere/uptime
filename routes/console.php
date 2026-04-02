<?php

use App\Jobs\CheckMonitorJob;
use App\Models\Monitor;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    Monitor::where('is_active', true)->each(function (Monitor $monitor) {
        if ($monitor->isDueForCheck()) {
            CheckMonitorJob::dispatch($monitor);
        }
    });
})->everyMinute()->name('dispatch-monitor-checks')->withoutOverlapping();

Schedule::command('monitors:prune')->daily()->name('prune-old-checks');
