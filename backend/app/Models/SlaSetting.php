<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SlaSetting extends Model
{
    protected $fillable = [
        'priority',
        'response_time_hours',
        'resolution_time_hours',
        'description',
    ];
}
