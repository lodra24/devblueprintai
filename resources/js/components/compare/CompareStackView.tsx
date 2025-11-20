import React from "react";
import { ASSET_COLUMNS, SelectedStory } from "./compareTypes";

interface CompareStackViewProps {
    selectedStories: SelectedStory[];
    onRemove: (storyId: string) => void;
}

const CompareStackView: React.FC<CompareStackViewProps> = ({
    selectedStories,
    onRemove,
}) => (
    <div className="space-y-4">
        {selectedStories.map(({ story, varId }) => {
            const df = story.derived_fields;
            const overSet = new Set<string>(df?.over_limit_fields ?? []);
            const limits = df?.limits ?? {};
            const counts = df?.char_counts ?? {};

            return (
                <article
                    key={story.id}
                    className="rounded-3xl border border-stone/20 bg-white p-5 text-sm shadow-sm"
                >
                    <header className="flex flex-wrap items-center gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone/70">
                                Variation
                            </p>
                            <h3 className="font-display text-xl text-ink">
                                {varId}
                            </h3>
                        </div>
                        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone/70">
                            <span className="rounded-full border border-stone/30 px-3 py-1 text-ink/80">
                                Priority: {story.priority}
                            </span>
                            {(story.derived_fields?.over_limit_count ?? 0) >
                                0 && (
                                <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
                                    Over limit
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => onRemove(story.id)}
                                className="rounded-full border border-stone/30 px-3 py-1 text-stone transition hover:border-rose-300 hover:text-rose-700"
                            >
                                Remove
                            </button>
                        </div>
                    </header>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {ASSET_COLUMNS.map(({ key, label }) => {
                            const value = df?.assets?.[key] ?? "";
                            const limit = limits[key];
                            const count =
                                counts[key] ??
                                (typeof value === "string"
                                    ? value.length
                                    : 0);
                            const over = overSet.has(key);

                            return (
                                <div
                                    key={key}
                                    className={`rounded-2xl border px-4 py-3 transition ${
                                        over
                                            ? "border-rose-200 bg-rose-50"
                                            : "border-stone/20 bg-white"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone/70">
                                                {label}
                                            </p>
                                        </div>
                                        {limit !== undefined && (
                                            <span
                                                className={`text-xs font-semibold ${
                                                    over
                                                        ? "text-rose-600"
                                                        : "text-stone"
                                                }`}
                                            >
                                                {count}/{limit}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-ink">
                                        {value || (
                                            <span className="text-stone/60">
                                                -
                                            </span>
                                        )}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </article>
            );
        })}
    </div>
);

export default CompareStackView;
