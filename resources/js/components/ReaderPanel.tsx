import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import FocusTrap from "focus-trap-react";
import { CloseIcon } from "@/components/icons";
import { DerivedFields, UserStory } from "@/types";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ReaderPanelField from "@/components/reader/ReaderPanelField";
import {
    ActionButton,
    ActionIcon,
} from "@/components/reader/ReaderActions";
import { useReaderForm } from "@/hooks/useReaderForm";

interface ReaderPanelProps {
    story: UserStory | null;
    isOpen: boolean;
    onClose: () => void;
    onDownloadCsv?: () => void;
    isDownloading?: boolean;
    projectId: string;
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

const ASSET_FIELD_KEYS = [
    ...PRIMARY_ASSET_FIELDS.map((f) => f.key),
    CTA_FIELD.key,
];
const REASONING_FIELD_KEYS = REASONING_FIELDS.map((f) => f.key);

const ReaderPanel: React.FC<ReaderPanelProps> = ({
    story,
    isOpen,
    onClose,
    onDownloadCsv,
    isDownloading,
    projectId,
}) => {
    const {
        derived,
        draftAssets,
        draftReasoning,
        recentlyRestored,
        setRecentlyRestored,
        handleFieldChange,
        handleFieldRestore,
        isFieldDirty,
        hasPendingSave,
        isPersistedContentIdentical,
        handleSave,
        handleRestoreOriginal,
        updateStoryMutation,
        restoreStoryMutation,
        computeCount,
    } = useReaderForm({
        story,
        projectId,
        assetKeys: ASSET_FIELD_KEYS,
        reasoningKeys: REASONING_FIELD_KEYS,
    });

    const limits = derived?.limits ?? {};
    const charCounts = derived?.char_counts ?? {};

    const [activeField, setActiveField] = useState<string | null>(null);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const copyTimeoutRef = useRef<number | null>(null);
    const panelRef = useRef<HTMLElement | null>(null);

    const fieldId = useCallback(
        (bucket: "assets" | "reasoning" | "meta", key: string) =>
            `${bucket}:${key}`,
        []
    );

    const handleAttemptClose = useCallback(() => {
        if (hasPendingSave) {
            setShowCloseConfirm(true);
        } else {
            onClose();
        }
    }, [hasPendingSave, onClose]);

    const handleConfirmClose = useCallback(() => {
        setShowCloseConfirm(false);
        onClose();
    }, [onClose]);

    const handleCancelClose = useCallback(() => {
        setShowCloseConfirm(false);
    }, []);

    useEffect(() => {
        setRecentlyRestored(false);
        setActiveField(null);
    }, [story?.id, isOpen, setRecentlyRestored]);

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

    useEffect(() => {
        if (!isOpen) {
            return;
        }
    }, [isOpen]);

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
                if (!showCloseConfirm) {
                    handleAttemptClose();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, showCloseConfirm, handleAttemptClose]);

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
            const value = draftAssets?.[key];
            if (value) {
                parts.push(`${label}: ${value}`);
            }
        }

        for (const { key, label } of REASONING_FIELDS) {
            const value = draftReasoning?.[key];
            if (value) {
                parts.push(`${label}: ${value}`);
            }
        }

        if (parts.length === 0) {
            return;
        }

        copyToClipboard("ALL", parts.join("\n\n"));
    }, [copyToClipboard, derived, draftAssets, draftReasoning]);

    const canServerRestore =
        !!story?.original_content &&
        !isPersistedContentIdentical &&
        !recentlyRestored;

    const footer = (
        <div className="mt-auto border-t border-stone/20 bg-stone-50/50 p-6">
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-2">
                    {derived && (
                        <ActionButton
                            label={copiedKey === "ALL" ? "Copied!" : "Copy"}
                            onClick={handleCopyAll}
                            icon="copy"
                            variant="secondary"
                            className="w-full justify-center sm:w-auto"
                        />
                    )}
                    {onDownloadCsv && (
                        <ActionButton
                            label={isDownloading ? "Exporting..." : "CSV"}
                            onClick={onDownloadCsv}
                            icon={isDownloading ? "spinner" : "download"}
                            variant="secondary"
                            disabled={isDownloading}
                            className="w-full justify-center sm:w-auto"
                        />
                    )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    {canServerRestore && (
                        <button
                            type="button"
                            onClick={handleRestoreOriginal}
                            disabled={restoreStoryMutation.isPending}
                            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-600 transition hover:bg-rose-50 hover:underline disabled:opacity-50 sm:w-auto sm:justify-start"
                            title="Revert to original AI content"
                        >
                            {restoreStoryMutation.isPending ? (
                                <ActionIcon name="spinner" />
                            ) : (
                                <ActionIcon name="refresh" />
                            )}
                            <span className="sm:hidden">Revert to Original</span>
                            <span className="hidden sm:inline">Revert to AI</span>
                        </button>
                    )}

                    <div className="w-full sm:w-auto">
                        <ActionButton
                            label={
                                updateStoryMutation.isPending
                                    ? "Saving..."
                                    : "Save Changes"
                            }
                            onClick={handleSave}
                            icon={updateStoryMutation.isPending ? "spinner" : "save"}
                            variant="primary"
                            disabled={
                                !hasPendingSave ||
                                updateStoryMutation.isPending ||
                                !story
                            }
                            className="w-full justify-center sm:w-auto"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div
                className={`fixed inset-0 z-40 transition ${
                    isOpen ? "pointer-events-auto" : "pointer-events-none"
                }`}
            >
                <div
                    className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${
                        isOpen ? "opacity-100" : "opacity-0"
                    }`}
                    onClick={handleAttemptClose}
                />
                <FocusTrap
                    active={isOpen}
                    focusTrapOptions={{
                        fallbackFocus: () => panelRef.current ?? document.body,
                        allowOutsideClick: true,
                        returnFocusOnDeactivate: true,
                        escapeDeactivates: false,
                    }}
                >
                    <aside
                        ref={panelRef}
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
                            onClick={handleAttemptClose}
                            aria-label="Close reader panel"
                        >
                                <CloseIcon width={18} height={18} />
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
                                                            draftAssets[key] ?? ""
                                                        }
                                                        limit={limits[key]}
                                                        count={computeCount(
                                                            draftAssets[key],
                                                            charCounts[key]
                                                        )}
                                                        overLimit={
                                                            limits[key] !==
                                                                undefined &&
                                                            computeCount(
                                                                draftAssets[key],
                                                                charCounts[key]
                                                            ) > (limits[key] ?? 0)
                                                        }
                                                        onCopy={() =>
                                                            copyToClipboard(
                                                                key,
                                                                draftAssets[key] ??
                                                                    undefined
                                                            )
                                                        }
                                                        copied={copiedKey === key}
                                                        editable
                                                        onChange={(value) =>
                                                            handleFieldChange(
                                                                "assets",
                                                                key,
                                                                value
                                                            )
                                                        }
                                                        isDirty={isFieldDirty(
                                                            "assets",
                                                            key
                                                        )}
                                                        onRestore={() =>
                                                            handleFieldRestore(
                                                                "assets",
                                                                key
                                                            )
                                                        }
                                                        isEditing={
                                                            activeField ===
                                                            fieldId("assets", key)
                                                        }
                                                        onEnterEdit={() =>
                                                            setActiveField(
                                                                fieldId(
                                                                    "assets",
                                                                    key
                                                                )
                                                            )
                                                        }
                                                        onExitEdit={() =>
                                                            setActiveField(null)
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <ReaderPanelField
                                                label={CTA_FIELD.label}
                                                value={
                                                    draftAssets[CTA_FIELD.key] ?? ""
                                                }
                                                limit={limits[CTA_FIELD.key]}
                                                count={computeCount(
                                                    draftAssets[CTA_FIELD.key],
                                                    charCounts[CTA_FIELD.key]
                                                )}
                                                overLimit={
                                                    limits[CTA_FIELD.key] !==
                                                        undefined &&
                                                    computeCount(
                                                        draftAssets[CTA_FIELD.key],
                                                        charCounts[CTA_FIELD.key]
                                                    ) >
                                                        (limits[CTA_FIELD.key] ?? 0)
                                                }
                                                onCopy={() =>
                                                    copyToClipboard(
                                                        CTA_FIELD.key,
                                                        draftAssets[
                                                            CTA_FIELD.key
                                                        ] ?? undefined
                                                    )
                                                }
                                                copied={
                                                    copiedKey === CTA_FIELD.key
                                                }
                                                accent
                                                variant="compact"
                                                editable
                                                onChange={(value) =>
                                                    handleFieldChange(
                                                        "assets",
                                                        CTA_FIELD.key,
                                                        value
                                                    )
                                                }
                                                isDirty={isFieldDirty(
                                                    "assets",
                                                    CTA_FIELD.key
                                                )}
                                                onRestore={() =>
                                                    handleFieldRestore(
                                                        "assets",
                                                        CTA_FIELD.key
                                                    )
                                                }
                                                isEditing={
                                                    activeField ===
                                                    fieldId("assets", CTA_FIELD.key)
                                                }
                                                onEnterEdit={() =>
                                                    setActiveField(
                                                        fieldId(
                                                            "assets",
                                                            CTA_FIELD.key
                                                        )
                                                    )
                                                }
                                                onExitEdit={() =>
                                                    setActiveField(null)
                                                }
                                            />
                                            {REASONING_FIELDS.map(
                                                ({ key, label }) => (
                                                    <ReaderPanelField
                                                        key={key}
                                                        label={label}
                                                        value={
                                                            draftReasoning[key] ??
                                                            ""
                                                        }
                                                        onCopy={() =>
                                                            copyToClipboard(
                                                                key,
                                                                draftReasoning[
                                                                    key
                                                                ] ?? undefined
                                                            )
                                                        }
                                                        copied={copiedKey === key}
                                                        variant="compact"
                                                        editable
                                                        onChange={(value) =>
                                                            handleFieldChange(
                                                                "reasoning",
                                                                key,
                                                                value
                                                            )
                                                        }
                                                        isDirty={isFieldDirty(
                                                            "reasoning",
                                                            key
                                                        )}
                                                        onRestore={() =>
                                                            handleFieldRestore(
                                                                "reasoning",
                                                                key
                                                            )
                                                        }
                                                        isEditing={
                                                            activeField ===
                                                            fieldId(
                                                                "reasoning",
                                                                key
                                                            )
                                                        }
                                                        onEnterEdit={() =>
                                                            setActiveField(
                                                                fieldId(
                                                                    "reasoning",
                                                                    key
                                                                )
                                                            )
                                                        }
                                                        onExitEdit={() =>
                                                            setActiveField(null)
                                                        }
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
            </FocusTrap>
        </div>

            <ConfirmModal
                open={showCloseConfirm}
                title="Unsaved changes"
                description="You have unsaved changes. Close the panel and discard them?"
                confirmLabel="Discard changes"
                cancelLabel="Keep editing"
                onConfirm={handleConfirmClose}
                onCancel={handleCancelClose}
            />
        </>
    );
};

export default ReaderPanel;
