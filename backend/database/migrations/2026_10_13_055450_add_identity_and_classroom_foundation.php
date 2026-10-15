<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['student', 'instructor'])->default('student');
            $table->string('student_number', 50)->nullable()->unique();
            $table->timestamp('disabled_at')->nullable();
        });
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instructor_id')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->string('course_code', 50);
            $table->string('section_label', 50);
            $table->unsignedSmallInteger('academic_year_start');
            $table->unsignedSmallInteger('academic_year_end');
            $table->enum('semester', ['First', 'Second', 'Summer']);
            $table->date('term_end_date');
            $table->string('timezone')->default('Asia/Manila');
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });
        Schema::create('classroom_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->restrictOnDelete();
            $table->foreignId('student_id')->constrained('users')->restrictOnDelete();
            $table->enum('status', ['active', 'removed'])->default('active');
            $table->timestamp('joined_at');
            $table->timestamp('removed_at')->nullable();
            $table->timestamps();
            $table->unique(['classroom_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classroom_memberships');
        Schema::dropIfExists('classrooms');
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['student_number']);
            $table->dropColumn(['role', 'student_number', 'disabled_at']);
        });
    }
};
