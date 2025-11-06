import React, { useEffect, useMemo, useState } from "react";
import { Project, UserStory } from "@/types";

interface ComparePanelProps {
    project: Project;
}

type AssetKey =
    | "hook"
    | "google_h1"
    | "google_desc"
    | "meta_primary"
    | "lp_h1"
    | "email_subject"
    | "cta";

const ASSET_COLUMNS: Array<{ key: AssetKey; label: string }> = [
    { key: "hook", label: "Hook" },
    { key: "google_h1", label: "Google H1" },
    { key: "google_desc", label: "Google Description" },
    { key: "meta_primary", label: "Meta Primary" },
    { key: "lp_h1", label: "Landing Page H1" },
    { key: "email_subject", label: "Email Subject" },
    { key: "cta", label: "CTA" },
];

const ComparePanel: React.FC<ComparePanelProps> = ({ project }) => {
    const stories = useMemo(() => {
        return project.epics.flatMap((epic) =>
            epic.user_stories.map((story) => {
                const defaultLabel = (() => {
                    const generated = `Story ${story.position ?? ""}`.trim();
                    return generated !== "" ? generated : story.id;
                })();

                return {
                    story,
                    epic,
                    varId: story.derived_fields?.meta?.var_id ?? defaultLabel,
                    angle: story.derived_fields?.meta?.angle_name ?? "Unknown",
                    overLimit:
                        (story.derived_fields?.over_limit_count ?? 0) > 0
                            ? "over"
                            : "within",
                };
            })
        );
    }, [project.epics]);

    const angles = useMemo(() => {
        const set = new Set<string>();
        stories.forEach(({ angle }) => {
            if (angle) {
                set.add(angle);
            }
        });
        return Array.from(set).sort();
    }, [stories]);

    const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
    const [angleFilters, setAngleFilters] = useState<string[]>([]);
    const [priorityFilter, setPriorityFilter] = useState<
        UserStory["priority"] | "all"
    >("all");
    const [overLimitFilter, setOverLimitFilter] = useState<
        "all" | "over" | "within"
    >("all");

    const filteredStories = useMemo(() => {
        return stories.filter(({ story, angle, overLimit }) => {
            if (angleFilters.length > 0 && !angleFilters.includes(angle)) {
                return false;
            }
            if (priorityFilter !== "all" && story.priority !== priorityFilter) {
                return false;
            }
            if (overLimitFilter !== "all" && overLimit !== overLimitFilter) {
                return false;
            }
            return true;
        });
    }, [stories, angleFilters, priorityFilter, overLimitFilter]);

    useEffect(() => {
        setSelectedStoryIds((prev) =>
            prev.filter((id) => filteredStories.some(({ story }) => story.id === id))
        );
    }, [filteredStories]);

    const toggleStorySelection = (storyId: string) => {
        setSelectedStoryIds((prev) =>
            prev.includes(storyId)
                ? prev.filter((id) => id !== storyId)
                : [...prev, storyId]
        );
    };

    const selectedStories = useMemo(() => {
        return stories.filter(({ story }) => selectedStoryIds.includes(story.id));
    }, [stories, selectedStoryIds]);

    const handleToggleAngle = (angle: string) => {
        setAngleFilters((prev) =>
            prev.includes(angle)
                ? prev.filter((item) => item !== angle)
                : [...prev, angle]
        );
    };

    return (
        <section className="mt-16 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
            <header className="mb-6 flex flex-col gap-2">
                <h2 className="text-2xl font-semibold text-slate-100">
                    Compare Variations
                </h2>
                <p className="text-sm text-slate-400">
                    Select two or more variations to inspect their copy side by side.
                </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
                <div className="space-y-6 rounded-xl border border-slate-700/60 bg-slate-900/80 p-4">
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                            Filters
                        </h3>
                        <div className="mt-3 space-y-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Angle
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {angles.length === 0 ? (
                                        <span className="text-xs text-slate-500">
                                            No angles available.
                                        </span>
                                    ) : (
                                        angles.map((angle) => {
                                            const isActive = angleFilters.includes(angle);
                                            return (
                                                <button
                                                    type="button"
                                                    key={angle}
                                                    onClick={() => handleToggleAngle(angle)}
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                        isActive
                                                            ? "bg-indigo-500/20 text-indigo-200 border border-indigo-400/40"
                                                            : "bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700"
                                                    }`}
                                                >
                                                    {angle}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Priority
                                    <select
                                        value={priorityFilter}
                                        onChange={(event) =>
                                            setPriorityFilter(
                                                event.target.value as UserStory["priority"] | "all"
                                            )
                                        }
                                        className="mt-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
                                    >
                                        <option value="all">All</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </label>

                                <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Over limit
                                    <select
                                        value={overLimitFilter}
                                        onChange={(event) =>
                                            setOverLimitFilter(
                                                event.target.value as
                                                    | "all"
                                                    | "over"
                                                    | "within"
                                            )
                                        }
                                        className="mt-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
                                    >
                                        <option value="all">All</option>
                                        <option value="over">Over limit</option>
                                        <option value="within">Within limit</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                            Variations
                        </h3>
                        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-2">
                            {filteredStories.length === 0 ? (
                                <p className="rounded-lg border border-slate-700/60 bg-slate-900/70 px-3 py-3 text-xs text-slate-400">
                                    No variations match the selected filters.
                                </p>
                            ) : (
                                filteredStories.map(({ story, varId }) => {
                                    const isChecked = selectedStoryIds.includes(story.id);
                                    const over =
                                        (story.derived_fields?.over_limit_count ?? 0) > 0;
                                    return (
                                        <label
                                            key={story.id}
                                            className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                                                isChecked
                                                    ? "border-indigo-400/50 bg-indigo-500/10"
                                                    : "border-slate-700/60 bg-slate-900/60 hover:border-slate-600"
                                            }`}
                                        >
                                            <div>
                                                <span className="font-semibold text-slate-200">
                                                    {varId}
                                                </span>
                                                <p className="text-xs text-slate-400">
                                                    Priority: {story.priority} • Status:{" "}
                                                    {story.status}
                                                    {over ? " • Over limit" : ""}
                                                </p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleStorySelection(story.id)}
                                                className="h-4 w-4 accent-indigo-500"
                                            />
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
                    {selectedStories.length < 2 ? (
                        <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
                            <p>Select at least two variations to compare.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-3">
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 z-10 rounded-l-lg bg-slate-900/90 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Variation
                                        </th>
                                        {ASSET_COLUMNS.map(({ key, label }) => (
                                            <th
                                                key={key}
                                                className="min-w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
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
                                                <th className="sticky left-0 z-10 rounded-l-lg bg-slate-900/90 px-4 py-4 text-left text-sm font-semibold text-slate-200 shadow-[1px_0_0_rgba(15,23,42,0.7)]">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span>{varId}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleStorySelection(story.id)
                                                            }
                                                            className="text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </th>
                                                {ASSET_COLUMNS.map(({ key }) => {
                                                    const value = df?.assets?.[key] ?? "";
                                                    const limit = limits[key];
                                                    const count =
                                                        counts[key] ??
                                                        (typeof value === "string"
                                                            ? value.length
                                                            : 0);
                                                    const over = overSet.has(key);

                                                    return (
                                                        <td
                                                            key={key}
                                                            className={`align-top rounded-lg border px-4 py-4 text-sm leading-relaxed ${
                                                                over
                                                                    ? "border-rose-500/60 bg-rose-500/10"
                                                                    : "border-slate-700/60 bg-slate-900/60"
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                                <span>Content</span>
                                                                {limit !== undefined && (
                                                                    <span
                                                                        className={
                                                                            over
                                                                                ? "text-rose-200"
                                                                                : "text-slate-400"
                                                                        }
                                                                    >
                                                                        {count}/{limit}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 whitespace-pre-wrap text-slate-100">
                                                                {value || (
                                                                    <span className="text-slate-500">
                                                                        -
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ComparePanel;
