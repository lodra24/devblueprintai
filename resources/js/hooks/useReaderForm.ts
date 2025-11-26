import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { DerivedFields, UserStory } from "@/types";
import {
    useRestoreUserStory,
    useUpdateUserStory,
} from "@/hooks/useUserStoryMutations";

type Bucket = "assets" | "reasoning" | "meta";
type AssetKey = keyof DerivedFields["assets"];
type ReasoningKey = Extract<keyof DerivedFields["reasoning"], string>;

type UseReaderFormParams = {
    story: UserStory | null;
    projectId: string;
    assetKeys: ReadonlyArray<AssetKey>;
    reasoningKeys: ReadonlyArray<ReasoningKey>;
};

const sanitizeMeta = (meta: Record<string, any>) =>
    Object.fromEntries(
        Object.entries(meta).filter(([key]) => !key.startsWith("_"))
    );

export const useReaderForm = ({
    story,
    projectId,
    assetKeys,
    reasoningKeys,
}: UseReaderFormParams) => {
    const derived = story?.derived_fields;
    const originalDerived =
        story?.original_derived_fields ?? story?.derived_fields;

    const filterEditableMeta = useCallback(sanitizeMeta, []);

    const [draftAssets, setDraftAssets] = useState<
        Record<string, string | null | undefined>
    >(() => derived?.assets ?? {});
    const [draftReasoning, setDraftReasoning] = useState<
        Record<string, string | null | undefined>
    >(() => derived?.reasoning ?? {});
    const [draftMeta, setDraftMeta] = useState<
        Record<string, string | null | undefined>
    >(() => filterEditableMeta(derived?.meta ?? {}));
    const [recentlyRestored, setRecentlyRestored] = useState(false);

    useEffect(() => {
        setDraftAssets(derived?.assets ?? {});
        setDraftReasoning(derived?.reasoning ?? {});
        setDraftMeta(filterEditableMeta(derived?.meta ?? {}));
        setRecentlyRestored(false);
    }, [story?.id, filterEditableMeta]);

    const updateStoryMutation = useUpdateUserStory(projectId);
    const restoreStoryMutation = useRestoreUserStory(projectId);

    const handleFieldChange = useCallback(
        (bucket: Bucket, key: string, value: string) => {
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
        (bucket: Bucket, key: string) => {
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

    const isFieldDirty = useCallback(
        (bucket: Bucket, key: string) => {
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

        const assetDirty = assetKeys.some((key) =>
            isFieldDirty("assets", key)
        );
        const reasoningDirty = reasoningKeys.some((key) =>
            isFieldDirty("reasoning", key)
        );
        return assetDirty || reasoningDirty;
    }, [assetKeys, reasoningKeys, isFieldDirty, originalDerived]);

    const hasPendingSave = useMemo(() => {
        if (!derived) return false;

        const isDifferent = (
            draftVal: string | null | undefined,
            dbVal: any
        ) => (draftVal ?? "") !== ((dbVal as string) ?? "");

        const assetsChanged = assetKeys.some((key) =>
            isDifferent(draftAssets[key], derived.assets?.[key])
        );

        const reasoningChanged = reasoningKeys.some((key) =>
            isDifferent(draftReasoning[key], derived.reasoning?.[key])
        );

        return assetsChanged || reasoningChanged;
    }, [assetKeys, reasoningKeys, derived, draftAssets, draftReasoning]);

    useEffect(() => {
        if (hasUnsavedChanges) {
            setRecentlyRestored(false);
        }
    }, [hasUnsavedChanges]);

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

        const compareBuckets = (
            bucket: "assets" | "reasoning",
            keys: ReadonlyArray<string>
        ) =>
            keys.every((key) => {
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

        return (
            compareBuckets("assets", assetKeys) &&
            compareBuckets("reasoning", reasoningKeys)
        );
    }, [assetKeys, reasoningKeys, derived, originalDerived]);

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

    const computeCount = useCallback(
        (value: string | null | undefined, fallback?: number) => {
            if (typeof value === "string") return value.length;
            if (typeof fallback === "number") return fallback;
            return 0;
        },
        []
    );

    return {
        derived,
        originalDerived,
        draftAssets,
        draftReasoning,
        draftMeta,
        recentlyRestored,
        setRecentlyRestored,
        handleFieldChange,
        handleFieldRestore,
        isFieldDirty,
        hasUnsavedChanges,
        hasPendingSave,
        isPersistedContentIdentical,
        handleSave,
        handleRestoreOriginal,
        updateStoryMutation,
        restoreStoryMutation,
        computeCount,
        filterEditableMeta,
    };
};
