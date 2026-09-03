<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportAssignment extends Model
{
    protected $fillable = [
        'report_id',
        'officer_id',
        'assigned_by',
        'notes',
        'status',
        'assigned_at',
        'accepted_at',
        'completed_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'accepted_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function officer()
    {
        return $this->belongsTo(Officer::class);
    }

    public function assigner()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function officerProfile()
    {
        return $this->hasOneThrough(User::class, Officer::class, 'id', 'id', 'officer_id', 'user_id');
    }
}
