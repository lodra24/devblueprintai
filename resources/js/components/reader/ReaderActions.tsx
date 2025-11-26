import React from "react";

export interface ActionButtonProps {
    label: string;
    onClick: () => void;
    icon:
        | "copy"
        | "compare"
        | "column"
        | "download"
        | "spinner"
        | "refresh"
        | "save";
    variant?: "primary" | "secondary";
    disabled?: boolean;
    className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    label,
    onClick,
    icon,
    variant = "primary",
    disabled = false,
    className = "",
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
        } ${className}`}
    >
        <ActionIcon name={icon} />
        {label}
    </button>
);

export const ActionIcon: React.FC<{ name: ActionButtonProps["icon"] }> = ({
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
        case "refresh":
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M4 4v6h6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M20 20v-6h-6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M20 10V9a5 5 0 0 0-5-5H9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M4 14v1a5 5 0 0 0 5 5h6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        case "save":
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M5 21h14a1 1 0 001-1V8.414a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0015.586 4H5a1 1 0 00-1 1v15a1 1 0 001 1z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9 17h6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9 4v5h6V4"
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

export interface CopyButtonProps {
    onClick: () => void;
    copied: boolean;
    disabled?: boolean;
    variant?: "default" | "icon";
}

export const CopyButton: React.FC<CopyButtonProps> = ({
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
