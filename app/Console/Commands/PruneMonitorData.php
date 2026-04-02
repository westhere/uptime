<?php

namespace App\Console\Commands;

use App\Models\MonitorCheck;
use App\Models\MonitorIncident;
use Illuminate\Console\Command;

class PruneMonitorData extends Command
{
    protected $signature = 'monitors:prune';
    protected $description = 'Delete monitor checks and incidents older than 4 years (GDPR retention policy)';

    public function handle(): int
    {
        $cutoff = now()->subYears(4);

        $checks = MonitorCheck::where('checked_at', '<', $cutoff)->delete();
        $incidents = MonitorIncident::where('started_at', '<', $cutoff)->delete();

        $this->info("Pruned {$checks} checks and {$incidents} incidents older than 4 years.");

        return self::SUCCESS;
    }
}
