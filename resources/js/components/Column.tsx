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
            className={`flex flex-col rounded-lg bg-gray-800/50 p-4 ${
                density === "compact"
                    ? "gap-3"
                    : density === "cozy"
                      ? "gap-5"
                      : "gap-4"
            }`}
        >
            <div className="px-1">
                <h3 className="text-lg font-bold text-sky-300">{epic.title}</h3>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
                    <MetricPill
                        label="Total"
                        value={metrics.total}
                        colorClass="bg-slate-500/30 text-slate-200"
                    />
                    <MetricPill
                        label="High"
                        value={metrics.high}
                        colorClass="bg-rose-500/20 text-rose-100"
                    />
                    <MetricPill
                        label="Over"
                        value={metrics.over}
                        colorClass="bg-amber-500/20 text-amber-100"
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
        <span className="inline-flex h-2 w-2 rounded-full bg-current opacity-70" />
        <span>{label}</span>
        <span>{value}</span>
    </div>
);

export default Column;
