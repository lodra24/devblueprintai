// Feature flag controlling the new UI experience.
const rawUiV2Flag = import.meta.env.VITE_UI_V2;
const normalizedUiV2Flag =
    typeof rawUiV2Flag === "string" ? rawUiV2Flag.trim().toLowerCase() : undefined;

export const UI_V2_FEATURE_FLAG =
    normalizedUiV2Flag === undefined
        ? true
        : normalizedUiV2Flag === "1" || normalizedUiV2Flag === "true";

export const AD_LIMITS = {
    hook: 60,
    google_h1: 30,
    google_desc: 90,
    meta_primary: 125,
    lp_h1: 60,
    email_subject: 60,
} as const;

export const GUEST_PROJECT_ID_KEY = "guestProjectId";

export const BLUEPRINT_POLLING_INTERVAL_MS = 5000;

export const SMOOTH_PROGRESS_SPEED_FACTOR = 0.00005;
export const SMOOTH_PROGRESS_MIN_TRICKLE = 0.0002;
export const SMOOTH_PROGRESS_FINISH_RATE = 0.1;

export const theme = {
    fonts: {
        display: "'Sora','Inter','system-ui','sans-serif'",
        body: "'Inter','system-ui','sans-serif'",
    },
    colors: {
        ink: "#0F172A",
        stone: "#78716C",
        frost: "#F5F3F0",
        accent: "#6366F1",
    },
};
