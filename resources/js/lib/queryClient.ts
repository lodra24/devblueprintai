import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

// Only retry on 5xx server errors or network issues.
// Do not retry on 4xx client errors (e.g., 404 Not Found, 403 Forbidden);
// these are unlikely to succeed on retry.
const retry = (failureCount: number, error: unknown): boolean => {
    // Give up after 3 attempts
    if (failureCount >= 3) {
        return false;
    }

    if (error instanceof AxiosError) {
        // Network error (server unreachable)
        if (!error.response) {
            return true;
        }

        // Retry on 5xx server errors
        if (error.response.status >= 500 && error.response.status <= 599) {
            return true;
        }
    }

    // In all other cases (including 4xx) do not retry
    return false;
};

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // How long data is considered "stale".
            // Until then, data is served from cache without network calls.
            staleTime: 30 * 1000, // 30 seconds

            // How long inactive data stays cached.
            // Garbage Collection Time.
            gcTime: 5 * 60 * 1000, // 5 minutes

            // Retry logic on error
            retry,

            // Refetch when the user refocuses the window.
            // Disabled in development to avoid constant refetch; enabled in production.
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
        },
    },
});
