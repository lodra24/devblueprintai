import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { DerivedFields, UserStory } from "@/types";

interface ReaderPanelProps {
    story: UserStory | null;
    isOpen: boolean;
    onClose: () => void;
}

type AssetKey = keyof DerivedFields["assets"];
type ReasoningKey = Extract<keyof DerivedFields["reasoning"], string>;

const PRIMARY_ASSET_FIELDS: Array<{ key: AssetKey; label: string }> = [
    { key: "hook", label: "Hook" },
    { key: "google_h1", label: "Google Headline 1" },
    { key: "google_desc", label: "Google Description" },
    { key: "meta_primary", label: "Meta Primary Text" },
    { key: "lp_h1", label: "Landing Page H1" },
    { key: "email_subject", label: "Email Subject" },
];

const CTA_FIELD: { key: AssetKey; label: string } = {
    key: "cta",
    label: "Call To Action",
};

const REASONING_FIELDS: Array<{ key: ReasoningKey; label: string }> = [
    { key: "proof", label: "Proof" },
    { key: "objection", label: "Objection" },
];

const ReaderPanel: React.FC<ReaderPanelProps> = ({
    story,
    isOpen,
    onClose,
}) => {
    const derived = story?.derived_fields;
    const overLimitSet = useMemo(
        () => new Set<string>(derived?.over_limit_fields ?? []),
        [derived?.over_limit_fields]
    );
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const copyTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setCopiedKey(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(
        () => () => {
            if (copyTimeoutRef.current) {
                window.clearTimeout(copyTimeoutRef.current);
            }
        },
        []
    );

    const copyToClipboard = useCallback((key: string, text?: string | null) => {
        if (!text) {
            return;
        }

        if (navigator.clipboard) {
            void navigator.clipboard.writeText(text);
        } else {
            // Fallback for environments without clipboard API support.
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try {
                document.execCommand("copy");
            } finally {
                document.body.removeChild(textarea);
            }
        }

        if (copyTimeoutRef.current) {
            window.clearTimeout(copyTimeoutRef.current);
        }
        setCopiedKey(key);
        copyTimeoutRef.current = window.setTimeout(() => {
            setCopiedKey(null);
        }, 1800);
    }, []);

    const handleCopyAll = useCallback(() => {
        if (!derived) {
            return;
        }

        const parts: string[] = [];

        for (const { key, label } of [...PRIMARY_ASSET_FIELDS, CTA_FIELD]) {
            const value = derived.assets?.[key];
            if (value) {
                parts.push(`${label}: ${value}`);
            }
        }

        for (const { key, label } of REASONING_FIELDS) {
            const value = derived.reasoning?.[key];
            if (value) {
                parts.push(`${label}: ${value}`);
            }
        }

        if (parts.length === 0) {
            return;
        }

        copyToClipboard("ALL", parts.join("\n\n"));
    }, [copyToClipboard, derived]);

    const limits = derived?.limits ?? {};
    const charCounts = derived?.char_counts ?? {};

    return (
        <div
            className={`fixed inset-0 z-40 transition ${
                isOpen ? "pointer-events-auto" : "pointer-events-none"
            }`}
        >
            <div
                className={`absolute inset-0 bg-slate-950/60 transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0"
                }`}
                onClick={onClose}
            />
            <aside
                className={`absolute right-0 top-0 h-full w-full max-w-xl transform transition-transform duration-300 ease-out ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                } border-l border-slate-800 bg-slate-900/98 shadow-2xl`}
            >
                <div className="flex h-full flex-col">
                    <header className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                                {story?.derived_fields?.meta?.var_id && (
                                    <span className="rounded bg-slate-800 px-2 py-0.5 font-semibold text-slate-200">
                                        {story.derived_fields.meta.var_id}
                                    </span>
                                )}
                                {story?.derived_fields?.meta?.angle_name && (
                                    <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 font-medium text-indigo-200">
                                        {story.derived_fields.meta.angle_name}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl font-semibold text-slate-100">
                                {story?.derived_fields?.assets?.hook ??
                                    "No hook available"}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                                {story && (
                                    <>
                                        <span
                                            className={`rounded-full px-2 py-0.5 ${
                                                story.priority === "high"
                                                    ? "bg-rose-500/20 text-rose-200 border border-rose-400/50"
                                                    : story.priority ===
                                                      "medium"
                                                    ? "bg-amber-500/20 text-amber-200 border border-amber-400/50"
                                                    : "bg-emerald-500/20 text-emerald-200 border border-emerald-400/50"
                                            }`}
                                        >
                                            Priority: {story.priority}
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 ${
                                                story.status === "done"
                                                    ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/50"
                                                    : story.status ===
                                                      "in_progress"
                                                    ? "bg-sky-500/20 text-sky-200 border border-sky-400/50"
                                                    : "bg-slate-600/30 text-slate-200 border border-slate-500/40"
                                            }`}
                                        >
                                            Status: {story.status}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="rounded-md border border-slate-700 bg-slate-800/70 p-2 text-slate-300 transition hover:bg-slate-700/70"
                            onClick={onClose}
                            aria-label="Close reader panel"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M6 6L18 18M6 18L18 6"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {derived ? (
                            <div className="space-y-6">
                                <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                                    <div className="space-y-4">
                                        {PRIMARY_ASSET_FIELDS.map(
                                            ({ key, label }) => (
                                                <ReaderPanelField
                                                    key={key}
                                                    label={label}
                                                    value={
                                                        derived.assets?.[key]
                                                    }
                                                    limit={limits[key]}
                                                    count={charCounts[key]}
                                                    overLimit={overLimitSet.has(
                                                        key
                                                    )}
                                                    onCopy={() =>
                                                        copyToClipboard(
                                                            key,
                                                            derived.assets?.[
                                                                key
                                                            ] ?? undefined
                                                        )
                                                    }
                                                    copied={copiedKey === key}
                                                />
                                            )
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <ReaderPanelField
                                            label={CTA_FIELD.label}
                                            value={
                                                derived.assets?.[CTA_FIELD.key]
                                            }
                                            limit={limits[CTA_FIELD.key]}
                                            count={charCounts[CTA_FIELD.key]}
                                            overLimit={overLimitSet.has(
                                                CTA_FIELD.key
                                            )}
                                            onCopy={() =>
                                                copyToClipboard(
                                                    CTA_FIELD.key,
                                                    derived.assets?.[
                                                        CTA_FIELD.key
                                                    ] ?? undefined
                                                )
                                            }
                                            copied={copiedKey === CTA_FIELD.key}
                                            accent
                                        />
                                        {REASONING_FIELDS.map(
                                            ({ key, label }) => (
                                                <ReaderPanelField
                                                    key={key}
                                                    label={label}
                                                    value={
                                                        derived.reasoning?.[key]
                                                    }
                                                    onCopy={() =>
                                                        copyToClipboard(
                                                            key,
                                                            derived.reasoning?.[
                                                                key
                                                            ] ?? undefined
                                                        )
                                                    }
                                                    copied={copiedKey === key}
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-6">
                                    <ActionButton
                                        label={
                                            copiedKey === "ALL"
                                                ? "Copied!"
                                                : "Copy All"
                                        }
                                        onClick={handleCopyAll}
                                        icon="copy"
                                    />
                                    <ActionButton
                                        label="Open in Compare"
                                        onClick={() => {}}
                                        icon="compare"
                                        variant="secondary"
                                    />
                                    <ActionButton
                                        label="Jump to Column"
                                        onClick={() => {}}
                                        icon="column"
                                        variant="secondary"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-6 text-sm text-slate-300">
                                Select a story to inspect its details.
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
};

interface ReaderPanelFieldProps {
    label: string;
    value?: string | null;
    limit?: number;
    count?: number;
    overLimit?: boolean;
    onCopy: () => void;
    copied: boolean;
    accent?: boolean;
}

const ReaderPanelField: React.FC<ReaderPanelFieldProps> = ({
    label,
    value,
    limit,
    count,
    overLimit,
    onCopy,
    copied,
    accent = false,
}) => {
    const hasContent = !!value;
    const effectiveCount =
        typeof count === "number" ? count : value ? value.length : 0;

    return (
        <div
            className={`rounded-lg border px-4 py-4 transition ${
                overLimit
                    ? "border-rose-500/60 bg-rose-500/10"
                    : accent
                    ? "border-sky-500/40 bg-sky-500/10"
                    : "border-slate-700/60 bg-slate-800/60"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {label}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {limit !== undefined && (
                        <span
                            className={`text-xs font-semibold ${
                                overLimit ? "text-rose-200" : "text-slate-300"
                            }`}
                        >
                            {effectiveCount}/{limit}
                        </span>
                    )}
                    {limit === undefined && hasContent && (
                        <span className="text-xs font-semibold text-slate-400">
                            {effectiveCount} chars
                        </span>
                    )}
                    <CopyButton
                        disabled={!hasContent}
                        onClick={onCopy}
                        copied={copied}
                    />
                </div>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
                {hasContent ? (
                    value
                ) : (
                    <span className="text-slate-500">
                        No content available.
                    </span>
                )}
            </div>
        </div>
    );
};

interface CopyButtonProps {
    onClick: () => void;
    copied: boolean;
    disabled?: boolean;
}

const CopyButton: React.FC<CopyButtonProps> = ({
    onClick,
    copied,
    disabled,
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
            disabled
                ? "cursor-not-allowed border-slate-700/60 bg-slate-800/50 text-slate-500"
                : copied
                ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-200"
                : "border-slate-700/60 bg-slate-800/80 text-slate-300 hover:bg-slate-800"
        }`}
        aria-label="Copy field"
    >
        <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-current"
        >
            <path
                d="M8 8H16V16H8V8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 4H6C4.89543 4 4 4.89543 4 6V16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
        {copied ? "Copied" : "Copy"}
    </button>
);

interface ActionButtonProps {
    label: string;
    onClick: () => void;
    icon: "copy" | "compare" | "column";
    variant?: "primary" | "secondary";
}

const ActionButton: React.FC<ActionButtonProps> = ({
    label,
    onClick,
    icon,
    variant = "primary",
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            variant === "primary"
                ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                : "border border-slate-700/60 bg-slate-900/50 text-slate-300 hover:bg-slate-800/70"
        }`}
    >
        <ActionIcon name={icon} />
        {label}
    </button>
);

const ActionIcon: React.FC<{ name: ActionButtonProps["icon"] }> = ({
    name,
}) => {
    switch (name) {
        case "copy":
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M8 8H16V16H8V8Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M16 4H6C4.89543 4 4 4.89543 4 6V16"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        case "compare":
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 6H20M12 12H20M12 18H20"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M4 6H6V18H4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        case "column":
        default:
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M5 5H9V19H5V5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M15 5H19V19H15V5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
    }
};

export default ReaderPanel;
