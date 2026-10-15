<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassroomMembership extends Model
{
    protected $fillable = ['student_id', 'status', 'joined_at', 'removed_at'];

    protected function casts(): array
    {
        return ['joined_at' => 'datetime', 'removed_at' => 'datetime'];
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
