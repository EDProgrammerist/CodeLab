<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => (string) $this->id, 'name' => $this->name, 'email' => $this->email, 'role' => $this->role, 'student_number' => $this->student_number, 'email_verified_at' => $this->email_verified_at?->toISOString()];
    }
}
