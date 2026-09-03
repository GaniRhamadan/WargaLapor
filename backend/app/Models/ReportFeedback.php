<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportFeedback extends Model
{
    protected $table = 'report_feedback';

    protected $fillable = [
        'report_id',
        'user_id',
        'rating',
        'comments',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
