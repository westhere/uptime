<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'monitor_id',
        'notify_down',
        'notify_slow',
        'notify_recover',
    ];

    protected function casts(): array
    {
        return [
            'notify_down' => 'boolean',
            'notify_slow' => 'boolean',
            'notify_recover' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function monitor(): BelongsTo
    {
        return $this->belongsTo(Monitor::class);
    }
}
