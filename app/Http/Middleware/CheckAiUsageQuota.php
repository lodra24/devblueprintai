<?php

namespace App\Http\Middleware;

use App\Models\AiRun;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAiUsageQuota
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $ip = $request->ip();

        if ($user && $user->has_unlimited_access) {
            return $next($request);
        }

        $guestLimit = config('blueprint.limits.usage.guest_daily_limit', 3);
        $userLimit = config('blueprint.limits.usage.user_daily_limit', 10);

        $query = AiRun::where('created_at', '>=', now()->subDay());

        if ($user) {
            $query->whereHas('project', fn ($q) => $q->where('user_id', $user->id));
            $limit = $userLimit;
        } else {
            $query->where('ip_address', $ip);
            $limit = $guestLimit;
        }

        if ($query->count() >= $limit) {
            $message = $user
                ? "Daily usage limit reached ({$limit}/day). Check back tomorrow or contact support."
                : "Guest usage limit reached ({$limit}/day). Please sign in for more.";

            return response()->json(['message' => $message], 429);
        }

        return $next($request);
    }
}
