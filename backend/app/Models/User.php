<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'nik',
        'role',
        'avatar',
        'status',
        'failed_login_attempts',
        'lockout_until',
        'email_verified_at',
        'phone_verified_at',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'lockout_until' => 'datetime',
            'failed_login_attempts' => 'integer',
            'password' => 'hashed',
        ];
    }

    public function isVerified(): bool
    {
        return !is_null($this->email_verified_at) || !is_null($this->phone_verified_at);
    }

    public function isLocked(): bool
    {
        return $this->lockout_until && $this->lockout_until->isFuture();
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOfficer(): bool
    {
        return $this->role === 'officer';
    }

    public function isCitizen(): bool
    {
        return $this->role === 'citizen';
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    public function officerProfile()
    {
        return $this->hasOne(Officer::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }
}
