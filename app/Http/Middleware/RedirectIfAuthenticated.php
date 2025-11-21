<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                // If the request expects JSON, return JSON; otherwise redirect.
                // Note: 400 Bad Request or 409 Conflict may be more appropriate than 200 OK,
                // but Breeze defaults to 200.
                return $request->expectsJson()
                    ? response()->json(['message' => 'Already authenticated.'], Response::HTTP_OK)
                    : redirect('/dashboard'); // Fallback for web requests
            }
        }

        return $next($request);
    }
}
