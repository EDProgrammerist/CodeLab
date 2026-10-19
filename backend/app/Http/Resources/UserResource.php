<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => (string) $this->id, 'name' => $this->name, 'email' => $this->email, 'role' => $this->role, 'student_number' => $this->student_number, 'section' => $this->section, 'photo_url' => $this->profile_photo_path ? '/api/v1/profile/photo?v='.hash('sha256', $this->profile_photo_path) : null, 'email_verified_at' => $this->email_verified_at?->toISOString()];
    }
}
