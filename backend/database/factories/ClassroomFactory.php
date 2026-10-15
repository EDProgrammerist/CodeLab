<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClassroomFactory extends Factory
{
    public function definition(): array
    {
        return ['instructor_id' => User::factory()->state(['role' => 'instructor']), 'title' => 'Programming laboratory', 'course_code' => 'CC101', 'section_label' => '1-A', 'academic_year_start' => 2026, 'academic_year_end' => 2027, 'semester' => 'First', 'term_end_date' => '2027-01-31', 'timezone' => 'Asia/Manila', 'status' => 'active'];
    }
}
