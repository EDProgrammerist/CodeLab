<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['submissions', 'practice_runs'] as $name) {
            Schema::create($name, function (Blueprint $t) use ($name) {
                $t->id();
                $t->foreignId('activity_id')->constrained()->restrictOnDelete();
                $t->foreignId('membership_id')->constrained('classroom_memberships')->restrictOnDelete();
                $t->uuid('idempotency_key');
                $t->string('request_hash', 64);
                $t->mediumText('source_code');
                $t->string('source_hash', 64);
                $t->string('runtime_image_digest');
                $t->string('judge_version');
                $t->string('assessment_digest', 64)->nullable();
                $t->string('state', 20)->default('queued');
                $t->string('outcome', 40)->nullable();
                $t->decimal('score', 7, 2)->nullable();
                $t->unsignedInteger('attempt_number')->nullable();
                $t->timestamp('accepted_at');
                $t->timestamp('started_at')->nullable();
                $t->timestamp('finished_at')->nullable();
                $t->unsignedInteger('execution_generation')->default(0);
                $t->timestamp('lease_expires_at')->nullable();
                $t->timestamp('last_dispatched_at')->nullable();
                $t->string('system_error_code', 40)->nullable();
                $t->text('compiler_diagnostics')->nullable();
                $t->json('results')->nullable();
                if ($name === 'practice_runs') {
                    $t->string('mode', 10);
                    $t->json('public_tests_snapshot');
                    $t->timestamp('expires_at');
                }
                $t->timestamps();
                $t->unique(['membership_id', 'idempotency_key']);
                $t->index(['state', 'lease_expires_at']);
                $t->index(['activity_id', 'membership_id', 'accepted_at']);
                if ($name === 'submissions') {
                    $t->unique(['activity_id', 'membership_id', 'attempt_number']);
                }
            });
        }
        Schema::create('submission_feedback', function (Blueprint $t) {
            $t->id();
            $t->foreignId('submission_id')->unique()->constrained()->restrictOnDelete();
            $t->foreignId('instructor_id')->constrained('users')->restrictOnDelete();
            $t->text('body');
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submission_feedback');
        Schema::dropIfExists('practice_runs');
        Schema::dropIfExists('submissions');
    }
};
