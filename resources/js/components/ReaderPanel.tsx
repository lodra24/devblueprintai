import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { DerivedFields, UserStory } from "@/types";
import {
    useRestoreUserStory,
    useUpdateUserStory,
} from "@/hooks/useUserStoryMutations";
import ConfirmModal from "@/components/ui/ConfirmModal";

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

const ReaderPanel: React.FC<ReaderPanelProps> = ({
    story,
    isOpen,
    onClose,
    onDownloadCsv,
    isDownloading,
    projectId,
}) => {
    const derived = story?.derived_fields;
    const originalDerived =
        story?.original_derived_fields ?? story?.derived_fields;
    const sanitizeMeta = (meta: Record<string, any>) =>
        Object.fromEntries(
            Object.entries(meta).filter(([key]) => !key.startsWith("_"))
        );

    const [draftAssets, setDraftAssets] = useState<
        Record<string, string | null | undefined>
    >(() => derived?.assets ?? {});
    const [draftReasoning, setDraftReasoning] = useState<
        Record<string, string | null | undefined>
    >(() => derived?.reasoning ?? {});
    const [draftMeta, setDraftMeta] = useState<
        Record<string, string | null | undefined>
    >(() => sanitizeMeta(derived?.meta ?? {}));
    const [recentlyRestored, setRecentlyRestored] = useState(false);

    const filterEditableMeta = useCallback(sanitizeMeta, []);

    // Reset restore flag and focus when switching stories or opening panel.
    useEffect(() => {
        setRecentlyRestored(false);
        setActiveField(null);
    }, [story?.id, isOpen]);

    const updateStoryMutation = useUpdateUserStory(projectId);
    const restoreStoryMutation = useRestoreUserStory(projectId);

    const handleFieldChange = useCallback(
        (
            bucket: "assets" | "reasoning" | "meta",
            key: string,
            value: string
        ) => {
            setRecentlyRestored(false);
            if (bucket === "assets") {
                setDraftAssets((prev) => ({ ...prev, [key]: value }));
            } else if (bucket === "reasoning") {
                setDraftReasoning((prev) => ({ ...prev, [key]: value }));
            } else {
                setDraftMeta((prev) => ({ ...prev, [key]: value }));
            }
        },
        []
    );

    const handleFieldRestore = useCallback(
        (bucket: "assets" | "reasoning" | "meta", key: string) => {
            const originalValue =
                (originalDerived as any)?.[bucket]?.[key] ?? "";
            if (bucket === "assets") {
                setDraftAssets((prev) => ({ ...prev, [key]: originalValue }));
            } else if (bucket === "reasoning") {
                setDraftReasoning((prev) => ({
                    ...prev,
                    [key]: originalValue,
                }));
            } else {
                setDraftMeta((prev) => ({ ...prev, [key]: originalValue }));
            }
        },
        [originalDerived]
    );

    const computeCount = useCallback(
        (value: string | null | undefined, fallback?: number) => {
            if (typeof value === "string") return value.length;
            if (typeof fallback === "number") return fallback;
            return 0;
        },
        []
    );

    const limits = derived?.limits ?? {};
    const charCounts = derived?.char_counts ?? {};

    const [activeField, setActiveField] = useState<string | null>(null);

    const fieldId = useCallback(
        (bucket: "assets" | "reasoning" | "meta", key: string) =>
            `${bucket}:${key}`,
        []
    );

    const isFieldDirty = useCallback(
        (bucket: "assets" | "reasoning" | "meta", key: string) => {
            const draftValue =
                bucket === "assets"
                    ? draftAssets[key]
                    : bucket === "reasoning"
                    ? draftReasoning[key]
                    : draftMeta[key];
            const originalValue =
                (originalDerived as any)?.[bucket]?.[key] ?? "";

            return (draftValue ?? "") !== (originalValue ?? "");
        },
        [draftAssets, draftMeta, draftReasoning, originalDerived]
    );

    const hasUnsavedChanges = useMemo(() => {
        if (!originalDerived) return false;

        const assetDirty = PRIMARY_ASSET_FIELDS.some(({ key }) =>
            isFieldDirty("assets", key)
        );
        const ctaDirty = isFieldDirty("assets", CTA_FIELD.key);
        const reasoningDirty = REASONING_FIELDS.some(({ key }) =>
            isFieldDirty("reasoning", key)
        );
        return assetDirty || ctaDirty || reasoningDirty;
    }, [isFieldDirty, originalDerived]);

    // Draft vs current DB content (derived); used to enable Save.
    const hasPendingSave = useMemo(() => {
        if (!derived) return false;

        const isDifferent = (
            draftVal: string | null | undefined,
            dbVal: any
        ) => (draftVal ?? "") !== ((dbVal as string) ?? "");

        const assetsChanged = [...PRIMARY_ASSET_FIELDS, CTA_FIELD].some(
            ({ key }) => isDifferent(draftAssets[key], derived.assets?.[key])
        );

        const reasoningChanged = REASONING_FIELDS.some(({ key }) =>
            isDifferent(draftReasoning[key], derived.reasoning?.[key])
        );

        return assetsChanged || reasoningChanged;
    }, [derived, draftAssets, draftReasoning]);

    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

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

    // Compare parsed buckets to see if persisted and original AI content are identical.
    const isPersistedContentIdentical = useMemo(() => {
        if (!derived || !originalDerived) return false;

        const getValue = (
            source:
                | DerivedFields["assets"]
                | DerivedFields["reasoning"]
                | undefined,
            key: string
        ) => {
            const typed = source as Record<string, string | null | undefined>;
            return (typed?.[key] ?? "").trim();
        };

        const compareBuckets = (bucket: "assets" | "reasoning") => {
            const keys =
                bucket === "assets"
                    ? [...PRIMARY_ASSET_FIELDS, CTA_FIELD].map((f) => f.key)
                    : REASONING_FIELDS.map((f) => f.key);

            return keys.every((key) => {
                const current = getValue(
                    bucket === "assets" ? derived.assets : derived.reasoning,
                    key
                );
                const original = getValue(
                    bucket === "assets"
                        ? originalDerived.assets
                        : originalDerived.reasoning,
                    key
                );
                return current === original;
            });
        };

        return compareBuckets("assets") && compareBuckets("reasoning");
    }, [derived, originalDerived]);

    useEffect(() => {
        if (hasUnsavedChanges) {
            setRecentlyRestored(false);
        }
    }, [hasUnsavedChanges]);


    const handleSave = useCallback(() => {
        if (!story) return;
        updateStoryMutation.mutate(
            {
                storyId: story.id,
                assets: draftAssets,
                reasoning: draftReasoning,
                meta: filterEditableMeta(draftMeta),
                priority: story.priority,
            },
            {
                onSuccess: (updated) => {
                    setDraftAssets(updated.derived_fields?.assets ?? {});
                    setDraftReasoning(updated.derived_fields?.reasoning ?? {});
                    setDraftMeta(
                        filterEditableMeta(updated.derived_fields?.meta ?? {})
                    );
                },
            }
        );
    }, [
        draftAssets,
        draftMeta,
        draftReasoning,
        limits,
        story,
        updateStoryMutation,
        filterEditableMeta,
    ]);

    const handleRestoreOriginal = useCallback(() => {
        if (!story) return;
        restoreStoryMutation.mutate(
            { storyId: story.id },
            {
                onSuccess: (updated) => {
                    setDraftAssets(updated.derived_fields?.assets ?? {});
                    setDraftReasoning(updated.derived_fields?.reasoning ?? {});
                    setDraftMeta(updated.derived_fields?.meta ?? {});
                    setRecentlyRestored(true);
                },
            }
        );
    }, [restoreStoryMutation, story]);
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
                            onClick={handleAttemptClose}
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
                                                ) > (limits[CTA_FIELD.key] ?? 0)
                                            }
                                            onCopy={() =>
                                                copyToClipboard(
                                                    CTA_FIELD.key,
                                                    draftAssets[
                                                        CTA_FIELD.key
                                                    ] ?? undefined
                                                )
                                            }
                                            copied={copiedKey === CTA_FIELD.key}
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

const ActionButton: React.FC<ActionButtonProps> = ({
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

export default ReaderPanel;
