<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Report extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'report_number',
        'user_id',
        'category_id',
        'title',
        'description',
        'latitude',
        'longitude',
        'address',
        'province',
        'city',
        'district',
        'subdistrict',
        'priority',
        'status',
        'verification_status',
        'rejection_reason',
        'sla_deadline',
        'is_overdue',
        'verified_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'is_overdue' => 'boolean',
            'sla_deadline' => 'datetime',
            'verified_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(ReportCategory::class, 'category_id');
    }

    public function images()
    {
        return $this->hasMany(ReportImage::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(ReportStatusHistory::class)->orderBy('created_at', 'asc');
    }

    public function aiAnalysis()
    {
        return $this->hasOne(AiAnalysis::class);
    }

    public function duplicateReports()
    {
        return $this->hasMany(DuplicateReport::class, 'report_id');
    }

    public function assignments()
    {
        return $this->hasMany(ReportAssignment::class)->orderBy('created_at', 'desc');
    }

    public function latestAssignment()
    {
        return $this->hasOne(ReportAssignment::class)->latestOfMany();
    }

    public function comments()
    {
        return $this->hasMany(ReportComment::class)->orderBy('created_at', 'asc');
    }

    public function feedback()
    {
        return $this->hasOne(ReportFeedback::class);
    }
}
