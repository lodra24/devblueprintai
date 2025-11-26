import React, { useEffect, useRef } from "react";
import { CopyButton } from "./ReaderActions";

export interface ReaderPanelFieldProps {
    label: string;
    value?: string | null;
    limit?: number;
    count?: number;
    overLimit?: boolean;
    onCopy: () => void;
    copied: boolean;
    accent?: boolean;
    variant?: "default" | "compact";
    editable?: boolean;
    onChange?: (value: string) => void;
    isDirty?: boolean;
    onRestore?: () => void;
    isEditing?: boolean;
    onEnterEdit?: () => void;
    onExitEdit?: () => void;
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
    editable = false,
    onChange,
    isDirty = false,
    onRestore,
    isEditing = false,
    onEnterEdit,
    onExitEdit,
}) => {
    const hasContent = !!value;
    const effectiveCount =
        typeof count === "number" ? count : value ? value.length : 0;
    const isCompact = variant === "compact";
    const countLabel =
        limit !== undefined
            ? `${effectiveCount}/${limit}`
            : `${effectiveCount} chars`;
    const countClass =
        limit !== undefined && overLimit ? "text-rose-600" : "text-stone";

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height =
                textareaRef.current.scrollHeight + "px";
        }
    }, [isEditing]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
    };

    const renderContent = () => {
        if (!editable || !isEditing) {
            return hasContent ? (
                <div className="animate-in fade-in duration-200">{value}</div>
            ) : (
                <span className="text-stone/70">No content available.</span>
            );
        }

        return (
            <textarea
                ref={textareaRef}
                className="mt-2 block w-full resize-none rounded-xl border border-stone/30 bg-white px-3 py-2 text-sm text-ink outline-none transition-all focus:border-accent/40 focus:ring-2 focus:ring-accent/20 animate-in fade-in zoom-in-95 duration-200"
                value={value ?? ""}
                onChange={handleInput}
                rows={1}
                style={{ overflow: "hidden" }}
                onKeyDown={(event) => {
                    if (event.key === "Escape") {
                        event.stopPropagation();
                        onExitEdit?.();
                    }
                }}
                onBlur={onExitEdit}
            />
        );
    };

    const restoreButton =
        editable && isDirty && onRestore ? (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                }}
                className="text-xs font-semibold text-accent underline-offset-4 hover:underline"
            >
                Restore
            </button>
        ) : null;

    const containerBaseClasses =
        "rounded-2xl border px-4 py-4 transition-all duration-200 ease-out transform cursor-text";
    const containerStateClasses = isEditing
        ? "border-accent/50 bg-white shadow-md ring-1 ring-accent/20 scale-[1.01]"
        : overLimit
        ? "border-rose-200 bg-rose-50 hover:border-rose-300"
        : accent
        ? "border-accent/30 bg-pastel-lilac/70 hover:border-accent/40"
        : "border-stone/20 bg-white hover:border-accent/30 hover:shadow-sm";

    if (isCompact) {
        return (
            <div
                className={`${containerBaseClasses} ${containerStateClasses}`}
                onClick={() => !isEditing && onEnterEdit?.()}
            >
                <div className="mb-2 flex items-start justify-between">
                    <p className="select-none text-xs font-semibold uppercase tracking-[0.2em] text-stone/70">
                        {label}
                    </p>
                    {restoreButton}
                </div>

                <div className="min-h-[1.5em] whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {renderContent()}
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-stone/70 select-none">
                    <span className={countClass}>{countLabel}</span>
                    <div onClick={(e) => e.stopPropagation()}>
                        <CopyButton
                            disabled={!hasContent}
                            onClick={onCopy}
                            copied={copied}
                            variant="icon"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`${containerBaseClasses} ${containerStateClasses}`}
            onClick={() => !isEditing && onEnterEdit?.()}
        >
            <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                    <p className="select-none text-xs font-semibold uppercase tracking-[0.2em] text-stone/70">
                        {label}
                    </p>
                    {restoreButton}
                </div>
                <div className="flex items-center gap-2 select-none">
                    <span className={`text-xs font-semibold ${countClass}`}>
                        {countLabel}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                        <CopyButton
                            disabled={!hasContent}
                            onClick={onCopy}
                            copied={copied}
                        />
                    </div>
                </div>
            </div>
            <div className="min-h-[1.5em] whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {renderContent()}
            </div>
        </div>
    );
};

export default ReaderPanelField;
