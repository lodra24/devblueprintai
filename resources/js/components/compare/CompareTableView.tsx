import React from "react";
import { ASSET_COLUMNS, AssetKey, SelectedStory } from "./compareTypes";

interface CompareTableViewProps {
    selectedStories: SelectedStory[];
    onRemove: (storyId: string) => void;
}

export const CompareTableView: React.FC<CompareTableViewProps> = ({
    selectedStories,
    onRemove,
}) => (
    <div className="relative">
        <div className="h-scroll w-full relative z-[1] pb-2">
            <table className="min-w-[1100px] border-separate border-spacing-y-3 text-sm text-ink">
                <thead>
                    <tr>
                        <th className="sticky left-0 z-10 rounded-l-xl bg-white px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-stone shadow-[1px_0_0_rgba(15,23,42,0.08)]">
                            Variation
                        </th>
                        {ASSET_COLUMNS.map(({ key, label }) => (
                            <th
                                key={key}
                                className="min-w-[240px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-stone/80"
                            >
                                {label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {selectedStories.map(({ story, varId }) => {
                        const df = story.derived_fields;
                        const limits = df?.limits ?? {};
                        const counts = df?.char_counts ?? {};
                        const overSet = new Set<string>(
                            df?.over_limit_fields ?? []
                        );

                        return (
                            <tr key={story.id}>
                                <th className="sticky left-0 z-10 rounded-l-xl bg-white px-4 py-4 text-left text-sm font-semibold text-ink shadow-[1px_0_0_rgba(15,23,42,0.08)]">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span>{varId}</span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onRemove(story.id)
                                                }
                                                className="text-xs font-semibold uppercase tracking-[0.2em] text-stone/70 hover:text-ink"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="text-xs uppercase tracking-[0.2em] text-stone/60">
                                            Priority: {story.priority}
                                            {(story.derived_fields
                                                ?.over_limit_count ?? 0) > 0
                                                ? " - Over limit"
                                                : ""}
                                        </div>
                                    </div>
                                </th>
                                {ASSET_COLUMNS.map(({ key }) => (
                                    <AssetCell
                                        key={key}
                                        assetKey={key}
                                        limits={limits}
                                        counts={counts}
                                        overSet={overSet}
                                        story={story}
                                    />
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
);

const AssetCell: React.FC<{
    assetKey: AssetKey;
    limits: Record<string, number>;
    counts: Record<string, number>;
    overSet: Set<string>;
    story: SelectedStory["story"];
}> = ({ assetKey, limits, counts, overSet, story }) => {
    const df = story.derived_fields;
    const value = df?.assets?.[assetKey] ?? "";
    const limit = limits[assetKey];
    const count =
        counts[assetKey] ??
        (typeof value === "string" ? value.length : 0);
    const over = overSet.has(assetKey);

    return (
        <td
            className={`align-top rounded-xl border px-4 py-4 text-sm leading-relaxed ${
                over ? "border-rose-200 bg-rose-50" : "border-stone/15 bg-white"
            }`}
        >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-stone/70">
                <span>Content</span>
                {limit !== undefined && (
                    <span className={over ? "text-rose-600" : "text-stone"}>
                        {count}/{limit}
                    </span>
                )}
            </div>
            <div className="mt-2 whitespace-pre-wrap text-ink">
                {value || (
                    <span className="text-stone/60">-</span>
                )}
            </div>
        </td>
    );
};

export default CompareTableView;
