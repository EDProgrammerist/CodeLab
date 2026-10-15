<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassroomSchedule extends Model
{
    public $timestamps = false;

    protected $fillable = ['class_session', 'day_of_week', 'starts_at', 'ends_at'];

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }
}
