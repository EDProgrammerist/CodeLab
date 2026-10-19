<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfileController extends Controller
{
    public function update(Request $request): UserResource
    {
        $user = $request->user();
        $student = $user->role === 'student';
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'student_number' => $student ? ['required', 'string', 'max:50', Rule::unique('users')->ignore($user->id)] : ['prohibited'],
            'section' => $student ? ['nullable', 'string', 'max:50'] : ['prohibited'],
            'photo' => ['sometimes', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:max_width=2048,max_height=2048'],
            'role' => ['prohibited'], 'email' => ['prohibited'], 'email_verified_at' => ['prohibited'],
            'profile_photo_path' => ['prohibited'], 'id' => ['prohibited'],
        ]);
        $newPath = null;
        if ($request->hasFile('photo')) {
            $newPath = $request->file('photo')->store('profiles', 'local');
            abort_unless($newPath, 503, 'Photo could not be saved. Please try again.');
        }
        $oldPath = null;
        try {
            $user = DB::transaction(function () use ($user, $data, $student, $newPath, &$oldPath) {
                $user = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
                $user->name = $data['name'];
                if ($student) {
                    $user->student_number = $data['student_number'];
                    $user->section = $data['section'] ?? null;
                }
                if ($newPath) {
                    $oldPath = $user->profile_photo_path;
                    $user->profile_photo_path = $newPath;
                }
                $user->save();

                return $user;
            });
        } catch (\Throwable $exception) {
            if ($newPath) {
                Storage::disk('local')->delete($newPath);
            }
            throw $exception;
        }
        if ($oldPath) {
            Storage::disk('local')->delete($oldPath);
        }

        return new UserResource($user);
    }

    public function photo(Request $request): StreamedResponse
    {
        $path = $request->user()->profile_photo_path;
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path, null, [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
