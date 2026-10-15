<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

class RequireCsrfToken extends PreventRequestForgery
{
    protected function hasValidOrigin($request): bool
    {
        return false;
    }
}
