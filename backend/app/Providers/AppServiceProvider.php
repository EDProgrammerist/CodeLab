<?php

namespace App\Providers;

use App\Http\Middleware\RequireCsrfToken;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        config(['sanctum.middleware.validate_csrf_token' => RequireCsrfToken::class]);
        Sanctum::getAccessTokenFromRequestUsing(fn (): ?string => null);
        Gate::define('student-dashboard', fn (User $user): bool => $user->role === 'student' && ! $user->disabled_at);
        Gate::define('instructor-dashboard', fn (User $user): bool => $user->role === 'instructor' && ! $user->disabled_at);
        ResetPassword::createUrlUsing(fn (User $user, string $token): string => rtrim(config('app.url'), '/').'/reset-password?'.http_build_query(['token' => $token, 'email' => $user->email]));
        VerifyEmail::createUrlUsing(fn (User $user): string => rtrim(config('app.url'), '/').URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())], absolute: false));
        RateLimiter::for('practice', fn (Request $r): Limit => Limit::perMinute(6)->by('practice:'.$r->user()->id));
        RateLimiter::for('assessment', fn (Request $r): Limit => Limit::perMinute(12)->by('assessment:'.$r->user()->id));
        RateLimiter::for('classroom-joins', fn (Request $r): array => [Limit::perMinute(5)->by('joins-user:'.$r->user()->id), Limit::perMinute(20)->by('joins-ip:'.$r->ip())]);
        RateLimiter::for('login', fn (Request $r): array => [Limit::perMinute(5)->by('login:'.hash('sha256', Str::lower(trim(is_string($r->input('email')) ? $r->input('email') : ''))).'|'.$r->ip()), Limit::perMinute(30)->by('login-ip:'.$r->ip())]);
        RateLimiter::for('register', fn (Request $r): Limit => Limit::perMinute(5)->by('register:'.$r->ip()));
        RateLimiter::for('recovery', fn (Request $r): array => [Limit::perMinute(5)->by('recovery-ip:'.$r->ip()), Limit::perMinute(3)->by('recovery-email:'.hash('sha256', Str::lower(trim(is_string($r->input('email')) ? $r->input('email') : ''))))]);
        RateLimiter::for('verification', fn (Request $r): Limit => Limit::perMinute(3)->by('verification:'.($r->user()?->id ?? $r->ip())));
        RateLimiter::for('verification-link', fn (Request $r): Limit => Limit::perMinute(3)->by('verification-link:'.($r->user()?->id ?? $r->ip())));
    }
}
