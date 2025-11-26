import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DerivedFields, UserStory } from "@/types";
import { BoardDensity } from "@/types";

interface CardProps {
    story: UserStory;
    epicId: string;
    onSelect?: (story: UserStory) => void;
    density?: BoardDensity;
}

type AssetKey = keyof DerivedFields["assets"];

const ASSET_DEFINITIONS: Array<{
    key: AssetKey;
    label: string;
}> = [
    { key: "google_h1", label: "Google H1" },
    { key: "google_desc", label: "Google Desc" },
    { key: "meta_primary", label: "Meta Primary" },
    { key: "lp_h1", label: "Landing H1" },
    { key: "email_subject", label: "Email Subject" },
    { key: "cta", label: "CTA" },
];

const PRIORITY_STYLES: Record<UserStory["priority"], string> = {
    high: "border border-rose-200 bg-rose-50 text-rose-700",
    medium: "border border-amber-200 bg-amber-50 text-amber-700",
    low: "border border-emerald-200 bg-emerald-50 text-emerald-700",
};

const densityContainerClasses: Record<BoardDensity, string> = {
    compact: "gap-2 p-3",
    comfortable: "gap-3 p-4",
    cozy: "gap-4 p-5",
};

const densityHookClass: Record<BoardDensity, string> = {
    compact: "text-sm",
    comfortable: "text-base",
    cozy: "text-base",
};

const densityCTAClass: Record<BoardDensity, string> = {
    compact: "text-[11px]",
    comfortable: "text-xs",
    cozy: "text-sm",
};

const Card: React.FC<CardProps> = ({
    story,
    epicId,
    onSelect,
    density = "comfortable",
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: story.id,
        data: {
            epicId,
        },
    });

    const derived = story.derived_fields;
    const meta: DerivedFields["meta"] = derived?.meta ?? {};
    const assets: DerivedFields["assets"] = derived?.assets ?? {};
    const limits: DerivedFields["limits"] =
        derived?.limits ?? ({} as DerivedFields["limits"]);
    const charCounts: DerivedFields["char_counts"] =
        derived?.char_counts ?? ({} as DerivedFields["char_counts"]);
    const overLimitSet = new Set<string>(derived?.over_limit_fields ?? []);

    const hookText = assets.hook ?? "";
    const ctaText = assets.cta ?? "";

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const renderAssetChips = () =>
        ASSET_DEFINITIONS.filter(({ key }) => assets[key])
            .filter(({ key }) => key !== "hook" && key !== "cta")
            .map(({ key, label }) => {
                const value = assets[key];
                if (!value) {
                    return null;
                }

                const limit = limits[key as string];
                const count =
                    charCounts[key as string] ??
                    (typeof value === "string" ? value.length : 0);
                const overLimit = overLimitSet.has(key as string);

                return (
                    <div
                        key={key}
                        className={`flex min-w-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                            overLimit
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-stone/20 bg-frost text-ink/70"
                        }`}
                        title={typeof value === "string" ? value : undefined}
                    >
                        <span className="truncate">{label}:</span>
                        <span className="truncate text-ink/60">
                            "{truncatePreview(value)}"
                        </span>
                        {limit !== undefined && (
                            <span
                                className={`ml-auto inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    overLimit
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-stone/20 text-stone"
                                }`}
                            >
                                {count}/{limit}
                            </span>
                        )}
                    </div>
                );
            });

    const handleCardClick = () => {
        if (isDragging) {
            return;
        }
        onSelect?.(story);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleCardClick();
                }
            }}
            className={`flex flex-col rounded-2xl border border-stone/20 bg-white/95 text-ink shadow-deep transition ${densityContainerClasses[density]} ${
                isDragging
                    ? "ring-2 ring-accent/40 opacity-80"
                    : "hover:border-accent/30"
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {meta.var_id && (
                        <span className="rounded-md bg-pastel-mint/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink/80">
                            {meta.var_id}
                        </span>
                    )}
                    <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[story.priority]}`}
                    >
                        {story.priority}
                    </span>
                    {meta.angle_name && (
                        <span className="rounded-full border border-accent/20 bg-pastel-lilac/80 px-2 py-0.5 text-[11px] font-medium text-accent/80">
                            {meta.angle_name}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone/20 bg-white text-stone transition hover:border-accent/30 active:cursor-grabbing"
                    aria-label="Drag story"
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                    {...attributes}
                    {...listeners}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-current"
                    >
                        <path
                            d="M10 4H14M10 9H14M10 14H14M10 19H14"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>

            <div className="space-y-3">
                <div
                    className={`font-semibold text-ink ${densityHookClass[density]}`}
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                    title={hookText || undefined}
                >
                    {hookText || "No hook provided"}
                </div>

                <div
                    className={`flex flex-wrap ${
                        density === "compact" ? "gap-1.5" : "gap-2"
                    }`}
                >
                    {renderAssetChips()}
                </div>
            </div>

            {ctaText && (
                <div
                    className={`mt-2 flex items-center justify-between ${densityCTAClass[density]} text-stone`}
                >
                    <span className="uppercase tracking-wide text-stone/70">
                        CTA
                    </span>
                    <span className="truncate font-medium text-ink" title={ctaText}>
                        {ctaText}
                    </span>
                </div>
            )}
        </div>
    );
};

const truncatePreview = (value: string | null) => {
    if (!value) {
        return "";
    }

    return value.length > 20 ? `${value.slice(0, 20)}...` : value;
};

export default React.memo(Card);
