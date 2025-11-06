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
