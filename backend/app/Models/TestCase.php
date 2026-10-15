<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestCase extends Model
{
    protected $fillable = ['position', 'visibility', 'stdin', 'expected_stdout', 'explanation'];

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }
}
