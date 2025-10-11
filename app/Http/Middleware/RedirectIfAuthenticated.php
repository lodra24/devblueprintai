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
                // API isteği ise JSON yanıtı dön, değilse yönlendir.
                // Not: 200 OK yerine 400 Bad Request veya 409 Conflict daha anlamlı olabilir, 
                // ancak Breeze'in varsayılanı genelde 200'dür.
                return $request->expectsJson()
                            ? response()->json(['message' => 'Already authenticated.'], Response::HTTP_OK) 
                            : redirect('/dashboard'); // Web istekleri için fallback
            }
        }

        return $next($request);
    }
}