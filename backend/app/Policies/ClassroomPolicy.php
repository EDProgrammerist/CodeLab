<?php

namespace App\Policies;

use App\Models\Classroom;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\DB;

class ClassroomPolicy
{
    public function view(User $user, Classroom $classroom): Response
    {
        $allowed = ! $user->disabled_at && $user->hasVerifiedEmail() && (
            ($user->role === 'instructor' && $classroom->instructor_id === $user->id) ||
            ($user->role === 'student' && DB::table('classroom_memberships')->where('classroom_id', $classroom->id)->where('student_id', $user->id)->where('status', 'active')->exists())
        );

        return $allowed ? Response::allow() : Response::denyAsNotFound();
    }

    public function delete(User $user, Classroom $classroom): Response
    {
        return ! $user->disabled_at && $user->hasVerifiedEmail() && $user->role === 'instructor' && $classroom->instructor_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }

    public function update(User $user, Classroom $classroom): Response
    {
        return ! $user->disabled_at && $user->hasVerifiedEmail() && $user->role === 'instructor' && $classroom->instructor_id === $user->id && $classroom->status === 'active' ? Response::allow() : Response::denyAsNotFound();
    }
}
