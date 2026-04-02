<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonitorIncident extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'monitor_id',
        'type',
        'started_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function monitor(): BelongsTo
    {
        return $this->belongsTo(Monitor::class);
    }

    public function isResolved(): bool
    {
        return $this->resolved_at !== null;
    }

    public function durationSeconds(): ?int
    {
        if ($this->resolved_at === null) {
            return null;
        }

        return $this->started_at->diffInSeconds($this->resolved_at);
    }
}
