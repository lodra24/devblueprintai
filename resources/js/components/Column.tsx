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

export default Column;
