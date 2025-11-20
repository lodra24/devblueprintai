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
    onDownloadCsv?: () => void;
    isDownloading?: boolean;
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
    onDownloadCsv,
    isDownloading,
}) => {
    const derived = story?.derived_fields;
    const overLimitSet = useMemo(
        () => new Set<string>(derived?.over_limit_fields ?? []),
        [derived?.over_limit_fields]
    );
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const root = document.documentElement;
        const originalOverflow = root.style.overflow;
        const originalPaddingRight = root.style.paddingRight;

        if (isOpen) {
            const scrollBarWidth = window.innerWidth - root.clientWidth;
            root.style.overflow = "hidden";
            if (scrollBarWidth > 0) {
                root.style.paddingRight = `${scrollBarWidth}px`;
            }
        } else {
            root.style.overflow = originalOverflow || "";
            root.style.paddingRight = originalPaddingRight || "";
        }

        return () => {
            root.style.overflow = originalOverflow || "";
            root.style.paddingRight = originalPaddingRight || "";
        };
    }, [isOpen]);
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

    const footer = (
        <div className="mt-auto border-t border-stone/20 bg-stone-50/50 p-6">
            <div className="flex flex-wrap justify-end gap-3">
                {derived && (
                    <ActionButton
                        label={copiedKey === "ALL" ? "Copied!" : "Copy Details"}
                        onClick={handleCopyAll}
                        icon="copy"
                        variant="secondary"
                    />
                )}
                {onDownloadCsv && (
                    <ActionButton
                        label={isDownloading ? "Exporting..." : "Download CSV"}
                        onClick={onDownloadCsv}
                        icon={isDownloading ? "spinner" : "download"}
                        variant="primary"
                        disabled={isDownloading}
                    />
                )}
            </div>
        </div>
    );

    return (
        <div
            className={`fixed inset-0 z-40 transition ${
                isOpen ? "pointer-events-auto" : "pointer-events-none"
            }`}
        >
            <div
                className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0"
                }`}
                onClick={onClose}
            />
            <aside
                className={`absolute right-0 top-0 h-full w-full max-w-xl transform transition-transform duration-300 ease-out ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                } border-l border-stone/20 bg-white text-ink shadow-deep`}
            >
                <div className="flex h-full flex-col">
                    <header className="flex items-start justify-between border-b border-stone/20 px-6 py-5">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone">
                                {story?.derived_fields?.meta?.var_id && (
                                    <span className="rounded bg-pastel-lilac px-2 py-0.5 font-semibold text-ink">
                                        {story.derived_fields.meta.var_id}
                                    </span>
                                )}
                                {story?.derived_fields?.meta?.angle_name && (
                                    <span className="rounded-full border border-accent/20 bg-pastel-lilac/80 px-2 py-0.5 text-[11px] font-medium text-accent/80">
                                        {story.derived_fields.meta.angle_name}
                                    </span>
                                )}
                            </div>
                            <h2 className="font-display text-xl font-semibold text-ink">
                                {story?.derived_fields?.assets?.hook ??
                                    "No hook available"}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                                {story && (
                                    <>
                                        <span
                                            className={`rounded-full px-2 py-0.5 ${
                                                story.priority === "high"
                                                    ? "border border-rose-200 bg-rose-50 text-rose-700"
                                                    : story.priority ===
                                                      "medium"
                                                    ? "border border-amber-200 bg-amber-50 text-amber-700"
                                                    : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                            }`}
                                        >
                                            Priority: {story.priority}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="rounded-xl border border-stone/20 bg-white/90 p-2 text-stone transition hover:border-accent/40"
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
                                            variant="compact"
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
                                                    variant="compact"
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-stone/20 bg-frost px-4 py-6 text-sm text-stone">
                                Select a story to inspect its details.
                            </div>
                        )}
                    </div>
                    {footer}
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
    variant?: "default" | "compact";
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
    variant = "default",
}) => {
    const hasContent = !!value;
    const effectiveCount =
        typeof count === "number" ? count : value ? value.length : 0;
    const isCompact = variant === "compact";
    const countLabel =
        limit !== undefined ? `${effectiveCount}/${limit}` : `${effectiveCount} chars`;
    const countClass =
        limit !== undefined && overLimit ? "text-rose-600" : "text-stone";

    if (isCompact) {
        return (
            <div
                className={`rounded-2xl border px-4 py-4 transition ${
                    overLimit
                        ? "border-rose-200 bg-rose-50"
                        : accent
                        ? "border-accent/30 bg-pastel-lilac/70"
                        : "border-stone/20 bg-white"
                }`}
            >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone/70">
                    {label}
                </p>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {hasContent ? (
                        value
                    ) : (
                        <span className="text-stone/70">No content available.</span>
                    )}
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-stone/70">
                    <span className={countClass}>{countLabel}</span>
                    <CopyButton
                        disabled={!hasContent}
                        onClick={onCopy}
                        copied={copied}
                        variant="icon"
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-2xl border px-4 py-4 transition ${
                overLimit
                    ? "border-rose-200 bg-rose-50"
                    : accent
                    ? "border-accent/30 bg-pastel-lilac/70"
                    : "border-stone/20 bg-white"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone/70">
                        {label}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${countClass}`}>
                        {countLabel}
                    </span>
                    <CopyButton
                        disabled={!hasContent}
                        onClick={onCopy}
                        copied={copied}
                    />
                </div>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {hasContent ? (
                    value
                ) : (
                    <span className="text-stone/70">No content available.</span>
                )}
            </div>
        </div>
    );
};

interface CopyButtonProps {
    onClick: () => void;
    copied: boolean;
    disabled?: boolean;
    variant?: "default" | "icon";
}

const CopyButton: React.FC<CopyButtonProps> = ({
    onClick,
    copied,
    disabled,
    variant = "default",
}) => {
    if (variant === "icon") {
        return (
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-[0px] shadow-sm transition ${
                    disabled
                        ? "cursor-not-allowed border-stone/20 bg-stone/10 text-stone/40"
                        : copied
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-stone/20 bg-white text-stone hover:border-accent/40"
                }`}
                aria-label={copied ? "Field copied" : "Copy field"}
                title={copied ? "Copied!" : "Copy"}
            >
                <svg
                    width="14"
                    height="14"
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
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
                disabled
                    ? "cursor-not-allowed border-stone/20 bg-stone/10 text-stone/50"
                    : copied
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-stone/20 bg-white text-stone hover:border-accent/30"
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
};

interface ActionButtonProps {
    label: string;
    onClick: () => void;
    icon: "copy" | "compare" | "column" | "download" | "spinner";
    variant?: "primary" | "secondary";
    disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
    label,
    onClick,
    icon,
    variant = "primary",
    disabled = false,
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            disabled
                ? "cursor-not-allowed border-transparent bg-stone/20 text-stone/60"
                : variant === "primary"
                ? "bg-ink text-white hover:opacity-90"
                : "border border-stone/20 bg-white text-stone hover:border-accent/30"
        }`}
    >
        <ActionIcon name={icon} />
        {label}
    </button>
);

const ActionIcon: React.FC<{ name: ActionButtonProps["icon"] }> = ({ name }) => {
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
        case "download":
            return (
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
            );
        case "spinner":
            return (
                <svg
                    className="animate-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
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
