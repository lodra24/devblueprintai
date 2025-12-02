import React from "react";
import type { IconProps } from "@/components/icons";
import {
    ColumnIcon,
    CompareIcon,
    CopyIcon,
    DownloadIcon,
    RefreshIcon,
    SaveIcon,
    SpinnerIcon,
} from "@/components/icons";

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

const ICON_MAP: Record<ActionButtonProps["icon"], React.FC<IconProps>> = {
    copy: CopyIcon,
    compare: CompareIcon,
    column: ColumnIcon,
    download: DownloadIcon,
    spinner: SpinnerIcon,
    refresh: RefreshIcon,
    save: SaveIcon,
};

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
    const Icon = ICON_MAP[name] ?? ColumnIcon;

    return <Icon width={14} height={14} />;
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
                <CopyIcon className="text-current" width={14} height={14} />
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
            <CopyIcon className="text-current" width={12} height={12} />
            {copied ? "Copied" : "Copy"}
        </button>
    );
};
