<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassroomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => (string) $this->id, ...$this->resource->only(['title', 'course_code', 'section_label', 'academic_year_start', 'academic_year_end', 'semester', 'timezone', 'status']),
            'term_end_date' => $this->term_end_date->format('Y-m-d'),
            'schedules' => $this->schedules->map(fn ($slot) => $slot->only(['class_session', 'day_of_week', 'starts_at', 'ends_at']))];
    }
}
