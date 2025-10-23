import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UserStory } from "@/types";

interface CardProps {
    story: UserStory;
    epicId: string;
}

const Card: React.FC<CardProps> = ({ story, epicId }) => {
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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`p-4 bg-gray-800 rounded-lg shadow-md cursor-grab active:cursor-grabbing ${
                isDragging ? "opacity-50" : ""
            }`}
        >
            <p className="text-sm text-gray-200">{story.content}</p>
        </div>
    );
};

export default Card;
