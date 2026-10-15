<?php

namespace App\Console\Commands;

use App\Models\PracticeRun;
use Illuminate\Console\Command;

class RecoverEvaluations extends Command
{
    protected $signature = 'codelab:recover-evaluations';

    protected $description = 'Remove expired legacy practice records; execution is deferred';

    public function handle(): int
    {
        PracticeRun::where('expires_at', '<', now())->whereIn('state', ['graded', 'system_error'])->delete();

        return self::SUCCESS;
    }
}
