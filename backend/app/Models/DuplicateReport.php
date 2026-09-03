<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DuplicateReport extends Model
{
    protected $fillable = [
        'report_id',
        'original_report_id',
        'similarity_percentage',
        'distance_meters',
        'comparison_summary',
        'user_action',
    ];

    protected $casts = [
        'similarity_percentage' => 'float',
        'distance_meters' => 'float',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class, 'report_id');
    }

    public function originalReport()
    {
        return $this->belongsTo(Report::class, 'original_report_id');
    }
}
