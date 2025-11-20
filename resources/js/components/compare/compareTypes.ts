import { Project, UserStory } from "@/types";

export type AssetKey =
    | "hook"
    | "google_h1"
    | "google_desc"
    | "meta_primary"
    | "lp_h1"
    | "email_subject"
    | "cta";

export const ASSET_COLUMNS: Array<{ key: AssetKey; label: string }> = [
    { key: "hook", label: "Hook" },
    { key: "google_h1", label: "Google H1" },
    { key: "google_desc", label: "Google Description" },
    { key: "meta_primary", label: "Meta Primary" },
    { key: "lp_h1", label: "Landing Page H1" },
    { key: "email_subject", label: "Email Subject" },
    { key: "cta", label: "CTA" },
];

export type SelectedStory = {
    story: UserStory;
    epic: Project["epics"][number];
    varId: string;
    angle: string;
    overLimit: "over" | "within";
};
