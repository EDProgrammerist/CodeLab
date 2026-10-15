<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function normalizeEmail(Request $request): void
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => Str::lower(trim($request->input('email')))]);
        }
    }

    private function passwordRules(): array
    {
        return ['required', 'string', 'min:12', 'max:72', 'confirmed', function (string $attribute, mixed $value, \Closure $fail): void {
            if (is_string($value) && strlen($value) > 72) {
                $fail('The password must not exceed 72 bytes.');
            }
        }];
    }

    public function register(Request $request): JsonResponse
    {
        abort_if(Auth::check(), 409, 'Sign out before registering another account.');
        $this->normalizeEmail($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'], 'email' => ['required', 'email', 'max:254', 'unique:users,email'],
            'password' => $this->passwordRules(), 'student_number' => ['nullable', 'string', 'max:50', 'unique:users,student_number'],
            'role' => ['prohibited'], 'email_verified_at' => ['prohibited'], 'disabled_at' => ['prohibited'], 'id' => ['prohibited'], 'instructor_id' => ['prohibited'],
        ]);
        $user = new User;
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->password = $data['password'];
        $user->role = 'student';
        $user->student_number = $data['student_number'] ?? null;
        $user->save();
        Auth::login($user);
        $request->session()->regenerate();
        $request->session()->put('password_hash_web', Auth::guard('web')->hashPasswordForCookie($user->getAuthPassword()));
        event(new Registered($user));

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    public function login(Request $request): UserResource
    {
        abort_if(Auth::check(), 409, 'You are already signed in.');
        $this->normalizeEmail($request);
        $data = $request->validate(['email' => ['required', 'email', 'max:254'], 'password' => ['required', 'string', 'max:72']]);
        if (! Auth::attempt(['email' => $data['email'], 'password' => $data['password'], 'disabled_at' => null])) {
            throw ValidationException::withMessages(['email' => ['These credentials do not match our records.']]);
        }
        $request->session()->regenerate();

        $request->session()->put('password_hash_web', Auth::guard('web')->hashPasswordForCookie($request->user()->getAuthPassword()));

        return new UserResource($request->user());
    }

    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function forgot(Request $request): JsonResponse
    {
        $this->normalizeEmail($request);
        $data = $request->validate(['email' => ['required', 'email', 'max:254']]);
        Password::sendResetLink(['email' => $data['email'], 'disabled_at' => null]);

        return response()->json(['message' => 'If an eligible account exists, a password reset link has been sent.']);
    }

    public function reset(Request $request): JsonResponse
    {
        $this->normalizeEmail($request);
        $data = $request->validate(['email' => ['required', 'email', 'max:254'], 'token' => ['required', 'string', 'max:255'], 'password' => $this->passwordRules()]);
        $status = Password::reset([...$data, 'disabled_at' => null], function (User $user, string $password): void {
            DB::transaction(function () use ($user, $password): void {
                $user->password = Hash::make($password);
                $user->setRememberToken(Str::random(60));
                $user->save();
                DB::table('sessions')->where('user_id', $user->id)->delete();
            });
            event(new PasswordReset($user));
        });
        if ($status !== Password::PasswordReset) {
            throw ValidationException::withMessages(['email' => ['This reset link is invalid or expired. Request a new one.']]);
        }
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Password updated. Sign in with your new password.']);
    }

    public function resend(Request $request): JsonResponse
    {
        if (! $request->user()->hasVerifiedEmail()) {
            $request->user()->sendEmailVerificationNotification();
        }

        return response()->json(['message' => 'A verification link has been sent if your email needs verification.']);
    }

    public function verify(EmailVerificationRequest $request): RedirectResponse
    {
        $request->fulfill();

        return redirect('/verify-email?verified=1');
    }
}
