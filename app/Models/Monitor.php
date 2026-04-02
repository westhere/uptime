<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Monitor extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'name',
        'url',
        'frequency_minutes',
        'is_active',
        'last_status',
        'last_checked_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (Monitor $monitor) {
            $monitor->public_id = Str::random(12);
        });
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'last_checked_at' => 'datetime',
            'frequency_minutes' => 'integer',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function shares(): HasMany
    {
        return $this->hasMany(MonitorShare::class);
    }

    public function checks(): HasMany
    {
        return $this->hasMany(MonitorCheck::class);
    }

    public function incidents(): HasMany
    {
        return $this->hasMany(MonitorIncident::class);
    }

    public function openIncident(): HasOne
    {
        return $this->hasOne(MonitorIncident::class)->whereNull('resolved_at')->latest('started_at');
    }

    public function notificationPreferences(): HasMany
    {
        return $this->hasMany(NotificationPreference::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    public function isDueForCheck(): bool
    {
        if ($this->last_checked_at === null) {
            return true;
        }

        return $this->last_checked_at->addMinutes($this->frequency_minutes)->isPast();
    }

    public function uptimePercentage(int $hours = 24): float
    {
        $from = now()->subHours($hours);
        $checks = $this->checks()->where('checked_at', '>=', $from)->get();

        if ($checks->isEmpty()) {
            return 100.0;
        }

        $upCount = $checks->whereIn('status', ['up', 'slow'])->count();

        return round(($upCount / $checks->count()) * 100, 2);
    }
}
