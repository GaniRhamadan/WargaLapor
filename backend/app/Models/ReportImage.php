<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportImage extends Model
{
    protected $fillable = [
        'report_id',
        'image_path',
        'image_type',
        'caption',
        'uploaded_by',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
