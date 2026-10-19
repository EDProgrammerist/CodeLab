<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Classroom extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['title', 'course_code', 'section_label', 'year_level', 'academic_year_start', 'academic_year_end', 'semester', 'term_end_date', 'timezone'];

    protected function casts(): array
    {
        return ['term_end_date' => 'date', 'archived_at' => 'datetime'];
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(ClassroomMembership::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(ClassroomSchedule::class)->orderBy('day_of_week')->orderBy('starts_at');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }
}
