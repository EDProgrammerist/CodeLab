<?php

use App\Http\Middleware\EnsureAccountActive;
use App\Http\Middleware\RequireCsrfToken;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->trimStrings(except: ['stdin', 'expected_stdout', 'tests.*.stdin', 'tests.*.expected_stdout', 'source_code', 'custom_stdin']);
        $middleware->web(replace: [PreventRequestForgery::class => RequireCsrfToken::class]);
        $middleware->append(SecurityHeaders::class);
        $middleware->alias(['active' => EnsureAccountActive::class]);
        $middleware->redirectGuestsTo('/login');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        $exceptions->respond(function (Response $response) {
            if (request()->is('auth/email/verify/*') && ! request()->expectsJson() && in_array($response->getStatusCode(), [403, 429], true)) {
                $reason = $response->getStatusCode() === 429 ? 'too-many-requests' : 'invalid-link';

                return redirect('/verify-email?error='.$reason)->withHeaders(['Cache-Control' => 'no-store']);
            }
            if ((request()->is('api/*') || request()->expectsJson()) && $response->getStatusCode() >= 400) {
                $status = $response->getStatusCode();
                $body = json_decode($response->getContent(), true) ?? [];
                $codes = [401 => 'unauthenticated', 403 => 'forbidden', 404 => 'not_found', 419 => 'csrf_expired', 422 => 'validation_failed', 429 => 'rate_limited'];
                $message = $status >= 500 ? 'The service is temporarily unavailable.' : ($body['message'] ?? 'Request could not be completed.');

                return response()->json(['code' => $codes[$status] ?? 'request_failed', 'message' => $message, 'errors' => $body['errors'] ?? (object) [], 'request_id' => request()->attributes->get('request_id')], $status)->withHeaders(array_filter(['Retry-After' => $response->headers->get('Retry-After'), 'Cache-Control' => 'no-store']));
            }

            return $response;
        });
    })->create();
