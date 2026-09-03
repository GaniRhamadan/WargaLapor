<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Officer extends Model
{
    protected $fillable = [
        'user_id',
        'department',
        'unit',
        'area_coverage',
        'active_tasks_count',
        'completed_tasks_count',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignments()
    {
        return $this->hasMany(ReportAssignment::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'user_id');
    }
}
