<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiAnalysis extends Model
{
    protected $fillable = [
        'report_id',
        'category_suggested',
        'severity',
        'priority',
        'confidence',
        'hazard_level',
        'summary',
        'recommendation',
        'raw_response',
        'is_fallback',
    ];

    protected $casts = [
        'confidence' => 'float',
        'raw_response' => 'array',
        'is_fallback' => 'boolean',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }
}
