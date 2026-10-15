<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/** Retired job tombstone: safely drain old queued jobs without executing or grading code. */
class EvaluateCode implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $kind, public int $recordId) {}

    public function handle(): void {}
}
