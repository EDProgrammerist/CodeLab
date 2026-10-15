<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = ['language_id', 'title', 'instructions', 'grading_period', 'class_session', 'activity_type', 'max_points', 'submission_limit', 'deadline_at'];

    protected function casts(): array
    {
        return ['max_points' => 'decimal:2', 'deadline_at' => 'datetime', 'published_at' => 'datetime', 'archived_at' => 'datetime', 'test_suite_locked_at' => 'datetime'];
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    public function tests(): HasMany
    {
        return $this->hasMany(TestCase::class)->orderBy('position');
    }
}
