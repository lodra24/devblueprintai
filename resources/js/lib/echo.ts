// Dosya: resources/js/lib/echo.ts

import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Laravel Echo's Reverb/Pusher broadcaster expects this to be globally available.
(window as any).Pusher = Pusher;

const apiUrl = import.meta.env.VITE_API_URL ?? window.location.origin;
const resolvedApiUrl = new URL(apiUrl, window.location.origin);

const getXsrfToken = (): string | undefined => {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : undefined;
};

const resolvedHost =
    import.meta.env.VITE_REVERB_HOST || resolvedApiUrl.hostname;

const resolvedScheme =
    import.meta.env.VITE_REVERB_SCHEME || resolvedApiUrl.protocol.replace(":", "");

const parsedPort = Number(import.meta.env.VITE_REVERB_PORT);
const resolvedPort = Number.isFinite(parsedPort) && parsedPort > 0
    ? parsedPort
    : resolvedScheme === "https"
        ? 443
        : 80;

const authEndpointUrl = new URL("/broadcasting/auth", resolvedApiUrl).toString();

const echoConfig = {
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: resolvedHost,
    wsPort: resolvedPort,
    wssPort: resolvedPort, // Reverb uses the same port for ws and wss
    forceTLS: resolvedScheme === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: authEndpointUrl,
    auth: {
        withCredentials: true,
        headers: {
            "X-XSRF-TOKEN": getXsrfToken() ?? "",
        },
    },
};

const echoInstance = new Echo(echoConfig as any);

export default echoInstance;
