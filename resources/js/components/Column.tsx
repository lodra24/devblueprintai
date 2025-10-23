import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Epic, UserStory } from "@/types";
import Card from "./Card";

interface ColumnProps {
    epic: Epic;
}

const Column: React.FC<ColumnProps> = ({ epic }) => {
    const { setNodeRef } = useDroppable({
        id: epic.id,
    });

    return (
        <div
            ref={setNodeRef}
            className="bg-gray-800/50 rounded-lg p-4 flex flex-col gap-4"
        >
            <h3 className="font-bold text-lg text-sky-300 px-1">
                {epic.title}
            </h3>

            <SortableContext
                id={epic.id}
                items={epic.user_stories.map((story) => story.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-3">
                    {epic.user_stories.map((story: UserStory) => (
                        <Card key={story.id} story={story} epicId={epic.id} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
};

export default Column;
