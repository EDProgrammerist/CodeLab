<?php

namespace Database\Factories;

use App\Models\Classroom;
use App\Models\Language;
use Illuminate\Database\Eloquent\Factories\Factory;

class ActivityFactory extends Factory
{
    public function definition(): array
    {
        return ['classroom_id' => Classroom::factory(), 'language_id' => fn () => Language::where('slug', 'java-21')->firstOrFail()->id, 'title' => 'Sum of integers', 'instructions' => 'Read two integers and print their sum.', 'grading_period' => 'prelim', 'class_session' => 'lab', 'activity_type' => 'activity', 'max_points' => '100.00', 'submission_limit' => 5, 'deadline_at' => now()->addDay(), 'status' => 'draft'];
    }
}
