<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonitorShare extends Model
{
    protected $fillable = [
        'monitor_id',
        'user_id',
        'permission',
        'view_reports',
    ];

    public function monitor(): BelongsTo
    {
        return $this->belongsTo(Monitor::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function canEdit(): bool
    {
        return $this->permission === 'edit';
    }
}
