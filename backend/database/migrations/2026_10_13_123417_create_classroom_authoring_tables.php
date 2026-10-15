<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classroom_invitations', function (Blueprint $table) {
            $table->foreignId('classroom_id')->primary()->constrained()->restrictOnDelete();
            $table->string('code_digest', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
        Schema::create('classroom_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->string('class_session', 3);
            $table->unsignedTinyInteger('day_of_week');
            $table->time('starts_at');
            $table->time('ends_at');
        });
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('display_name');
            $table->string('runtime_version');
            $table->string('image_digest')->nullable();
            $table->string('judge_version')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamps();
        });
        DB::table('languages')->insert(['slug' => 'java-21', 'display_name' => 'Temurin Java 21', 'runtime_version' => '21', 'enabled' => true, 'created_at' => now(), 'updated_at' => now()]);
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->restrictOnDelete();
            $table->foreignId('language_id')->constrained()->restrictOnDelete();
            $table->string('title', 150);
            $table->text('instructions');
            $table->string('grading_period', 10);
            $table->string('class_session', 3);
            $table->string('activity_type', 10);
            $table->decimal('max_points', 7, 2);
            $table->unsignedTinyInteger('submission_limit')->default(5);
            $table->timestamp('deadline_at');
            $table->string('status', 10)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamp('test_suite_locked_at')->nullable();
            $table->string('assessment_digest', 64)->nullable();
            $table->timestamps();
            $table->index(['classroom_id', 'grading_period', 'status']);
        });
        Schema::create('test_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->string('visibility', 6);
            $table->mediumText('stdin');
            $table->mediumText('expected_stdout');
            $table->text('explanation')->nullable();
            $table->timestamps();
            $table->unique(['activity_id', 'position']);
        });
        Schema::create('activity_allocations', function (Blueprint $table) {
            $table->foreignId('activity_id')->constrained()->restrictOnDelete();
            $table->foreignId('membership_id')->constrained('classroom_memberships')->restrictOnDelete();
            $table->string('status', 12);
            $table->string('reason', 30);
            $table->timestamp('decided_at');
            $table->primary(['activity_id', 'membership_id']);
        });
        Schema::create('audit_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('classroom_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 60);
            $table->string('subject_type', 40);
            $table->string('subject_id', 30);
            $table->uuid('correlation_id')->nullable();
            $table->json('safe_metadata');
            $table->timestamp('occurred_at');
            $table->index(['classroom_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        foreach (['audit_events', 'activity_allocations', 'test_cases', 'activities', 'languages', 'classroom_schedules', 'classroom_invitations'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
