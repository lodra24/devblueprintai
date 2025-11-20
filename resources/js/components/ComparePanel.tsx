import React, { useEffect, useMemo, useState } from "react";
import { Project, UserStory } from "@/types";
import CompareTableView from "./compare/CompareTableView";
import CompareStackView from "./compare/CompareStackView";
import { SelectedStory } from "./compare/compareTypes";

interface ComparePanelProps {
    project: Project;
}

type ViewMode = "table" | "stack";

const ComparePanel: React.FC<ComparePanelProps> = ({ project }) => {
    const stories: SelectedStory[] = useMemo(() => {
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
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth >= 1024 : true
    );

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
            prev.filter((id) =>
                filteredStories.some(({ story }) => story.id === id)
            )
        );
    }, [filteredStories]);

    const toggleStorySelection = (storyId: string) => {
        setSelectedStoryIds((prev) =>
            prev.includes(storyId)
                ? prev.filter((id) => id !== storyId)
                : [...prev, storyId]
        );
    };

    const removeSelectedStory = (storyId: string) => {
        setSelectedStoryIds((prev) => prev.filter((id) => id !== storyId));
    };

    const selectedStories = useMemo(() => {
        return stories.filter(({ story }) =>
            selectedStoryIds.includes(story.id)
        );
    }, [stories, selectedStoryIds]);

    const handleToggleAngle = (angle: string) => {
        setAngleFilters((prev) =>
            prev.includes(angle)
                ? prev.filter((item) => item !== angle)
                : [...prev, angle]
        );
    };

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const mql = window.matchMedia("(min-width: 1024px)");
        const handleChange = () => {
            setIsDesktop(mql.matches);
            if (!mql.matches) {
                setViewMode("stack");
            }
        };
        handleChange();
        mql.addEventListener("change", handleChange);
        return () => mql.removeEventListener("change", handleChange);
    }, []);

    const renderComparisonView = () => {
        if (selectedStories.length < 2) {
            return (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-center text-sm text-stone">
                    <p>Select at least two variations to compare.</p>
                </div>
            );
        }

        const activeView = isDesktop ? viewMode : "stack";
        return activeView === "table"
            ? (
                <CompareTableView
                    selectedStories={selectedStories}
                    onRemove={removeSelectedStory}
                />
            )
            : (
                <CompareStackView
                    selectedStories={selectedStories}
                    onRemove={removeSelectedStory}
                />
            );
    };

    return (
        <section className="surface-panel surface-panel--muted flex flex-col gap-6 p-6 text-ink shadow-deep">
            <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="font-display text-2xl font-semibold text-ink">
                        Compare Variations
                    </h2>
                    <p className="text-sm text-stone">
                        Select two or more variations to inspect their copy side
                        by side.
                    </p>
                </div>
                {isDesktop && (
                    <div className="inline-flex items-center gap-1 rounded-full border border-stone/20 bg-white p-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                        <button
                            type="button"
                            className={`rounded-full px-3 py-1 transition ${
                                viewMode === "table"
                                    ? "bg-ink text-white shadow-sm"
                                    : "text-stone"
                            }`}
                            onClick={() => setViewMode("table")}
                        >
                            Table
                        </button>
                        <button
                            type="button"
                            className={`rounded-full px-3 py-1 transition ${
                                viewMode === "stack"
                                    ? "bg-ink text-white shadow-sm"
                                    : "text-stone"
                            }`}
                            onClick={() => setViewMode("stack")}
                        >
                            Reader
                        </button>
                    </div>
                )}
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div className="min-w-0 space-y-6 rounded-2xl border border-stone/20 bg-white/95 p-4 shadow-sm">
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-stone/70">
                            Filters
                        </h3>
                        <div className="mt-3 space-y-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone/70">
                                    Angle
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {angles.length === 0 ? (
                                        <span className="text-xs text-stone">
                                            No angles available.
                                        </span>
                                    ) : (
                                        angles.map((angle) => {
                                            const isActive =
                                                angleFilters.includes(angle);
                                            return (
                                                <button
                                                    type="button"
                                                    key={angle}
                                                    onClick={() =>
                                                        handleToggleAngle(angle)
                                                    }
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                        isActive
                                                            ? "border border-accent/40 bg-accent text-white shadow-deep"
                                                            : "border border-stone/20 bg-pastel-lilac text-ink/80 hover:border-accent/30"
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
                                <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.2em] text-stone/70">
                                    Priority
                                    <select
                                        value={priorityFilter}
                                        onChange={(event) =>
                                            setPriorityFilter(
                                                event.target.value as
                                                    | UserStory["priority"]
                                                    | "all"
                                            )
                                        }
                                        className="mt-1 rounded-xl border border-stone/20 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                                    >
                                        <option value="all">All</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </label>

                                <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.2em] text-stone/70">
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
                                        className="mt-1 rounded-xl border border-stone/20 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                                    >
                                        <option value="all">All</option>
                                        <option value="over">Over limit</option>
                                        <option value="within">
                                            Within limit
                                        </option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-stone/70">
                            Variations
                        </h3>
                        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-2">
                            {filteredStories.length === 0 ? (
                                <p className="rounded-2xl border border-stone/20 bg-frost px-3 py-3 text-xs text-stone">
                                    No variations match the selected filters.
                                </p>
                            ) : (
                                filteredStories.map(({ story, varId }) => {
                                    const isChecked = selectedStoryIds.includes(
                                        story.id
                                    );
                                    const over =
                                        (story.derived_fields
                                            ?.over_limit_count ?? 0) > 0;
                                    return (
                                        <label
                                            key={story.id}
                                            className={`flex cursor-pointer items-center justify-between rounded-2xl border px-3 py-2 text-sm transition ${
                                                isChecked
                                                    ? "border-accent/40 bg-pastel-lilac"
                                                    : "border-stone/20 bg-white hover:border-accent/30"
                                            }`}
                                        >
                                            <div>
                                                <span className="font-semibold text-ink">
                                                    {varId}
                                                </span>
                                                <p className="text-xs text-stone/70">
                                                    Priority: {story.priority}
                                                    {over
                                                        ? " - Over limit"
                                                        : ""}
                                                </p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() =>
                                                    toggleStorySelection(
                                                        story.id
                                                    )
                                                }
                                                className="h-4 w-4 accent-ink"
                                            />
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="min-w-0 rounded-2xl border border-stone/20 bg-white/95 p-4 shadow-sm">
                    {renderComparisonView()}
                </div>
            </div>
        </section>
    );
};

export default ComparePanel;
