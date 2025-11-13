import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Epic, UserStory } from "@/types";
import Card from "./Card";
import { BoardDensity } from "@/types";

interface ColumnProps {
    epic: Epic;
    onCardSelect?: (story: UserStory) => void;
    density?: BoardDensity;
}

const Column: React.FC<ColumnProps> = ({ epic, onCardSelect, density = "comfortable" }) => {
    const { setNodeRef } = useDroppable({
        id: epic.id,
    });

    const metrics = epic.user_stories.reduce(
        (acc, story) => {
            acc.total += 1;
            if (story.priority === "high") {
                acc.high += 1;
            }
            if ((story.derived_fields?.over_limit_count ?? 0) > 0) {
                acc.over += 1;
            }
            return acc;
        },
        { total: 0, high: 0, over: 0 }
    );

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col rounded-3xl border border-stone/20 bg-white/90 p-5 text-ink shadow-deep ${
                density === "compact"
                    ? "gap-3"
                    : density === "cozy"
                      ? "gap-5"
                      : "gap-4"
            }`}
        >
            <div>
                <h3 className="font-display text-xl font-semibold text-ink">
                    {epic.title}
                </h3>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone">
                    <MetricPill
                        label="Total"
                        value={metrics.total}
                        colorClass="border border-stone/15 bg-frost text-ink/80"
                    />
                    <MetricPill
                        label="High"
                        value={metrics.high}
                        colorClass="border border-rose-100 bg-rose-50 text-rose-700"
                    />
                    <MetricPill
                        label="Over"
                        value={metrics.over}
                        colorClass="border border-amber-100 bg-amber-50 text-amber-700"
                    />
                </div>
            </div>

            <SortableContext
                id={epic.id}
                items={epic.user_stories.map((story) => story.id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    className={
                        density === "compact"
                            ? "space-y-2"
                            : density === "cozy"
                              ? "space-y-4"
                              : "space-y-3"
                    }
                >
                    {epic.user_stories.map((story: UserStory) => (
                        <Card
                            key={story.id}
                            story={story}
                            epicId={epic.id}
                            onSelect={onCardSelect}
                            density={density}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
};

interface MetricPillProps {
    label: string;
    value: number;
    colorClass: string;
}

const MetricPill: React.FC<MetricPillProps> = ({ label, value, colorClass }) => (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${colorClass}`}>
        <span className="inline-flex h-2 w-2 rounded-full bg-current opacity-60" />
        <span>{label}</span>
        <span className="text-current">{value}</span>
    </div>
);

export default Column;
