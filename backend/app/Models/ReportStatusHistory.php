<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportStatusHistory extends Model
{
    protected $fillable = [
        'report_id',
        'status',
        'actor_id',
        'actor_name',
        'actor_role',
        'notes',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
