<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    protected $table = 'submissions';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['accepted_at' => 'datetime', 'started_at' => 'datetime', 'finished_at' => 'datetime', 'lease_expires_at' => 'datetime', 'last_dispatched_at' => 'datetime', 'expires_at' => 'datetime', 'results' => 'array', 'public_tests_snapshot' => 'array', 'score' => 'decimal:2'];
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    public function membership(): BelongsTo
    {
        return $this->belongsTo(ClassroomMembership::class, 'membership_id');
    }
}
