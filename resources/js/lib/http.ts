import axios from "axios";

/**
 * Preconfigured Axios instance for API requests.
 * - baseURL: prefixes all requests with '/api'.
 * - withCredentials: required for Sanctum cookie-based auth; sends cookies on cross-origin requests.
 */
export const http = axios.create({
    baseURL: "/api",
    withCredentials: true,
    headers: {
        Accept: "application/json",
    },
});

/**
 * Ensure we have the CSRF cookie from Sanctum before sending any state-changing request.
 */
export const ensureCsrf = () => {
    // Override baseURL because the CSRF endpoint lives at the root, not under /api.
    return http.get("/sanctum/csrf-cookie", {
        baseURL: "/",
    });
};
