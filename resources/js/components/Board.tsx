import React, { useState } from "react";
import {
    DndContext,
    closestCenter,
    DragCancelEvent,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Project, Epic, UserStory } from "@/types";
import Column from "./Column";
import { useReorderUserStory } from "@/hooks/useUserStoryMutations";
import Card from "./Card";

interface BoardProps {
    project: Project;
}

type StoryLocation = {
    story: UserStory;
    epic: Epic;
    index: number;
};

const findStoryLocation = (
    epics: Epic[],
    storyId: string
): StoryLocation | null => {
    for (const epic of epics) {
        const index = epic.user_stories.findIndex((item) => item.id === storyId);
        if (index !== -1) {
            return {
                story: epic.user_stories[index],
                epic,
                index,
            };
        }
    }
    return null;
};

type ReorderIntent = {
    storyId: string;
    targetEpicId: string;
    beforeStoryId: string | null;
    afterStoryId: string | null;
};

const resolveReorderIntent = (
    event: DragEndEvent,
    project: Project
): ReorderIntent | null => {
    const { active, over } = event;

    if (!over) {
        return null;
    }

    const storyId = String(active.id);
    const source = findStoryLocation(project.epics, storyId);

    if (!source) {
        return null;
    }

    const sortableData = over.data.current?.sortable;
    const targetEpicId =
        (typeof sortableData?.containerId === "string"
            ? sortableData.containerId
            : undefined) ?? String(over.id);

    if (sortableData && String(over.id) === storyId) {
        return null;
    }

    const targetEpic = project.epics.find((epic) => epic.id === targetEpicId);

    if (!targetEpic) {
        return null;
    }

    const reorderedIds = targetEpic.user_stories
        .map((story) => story.id)
        .filter((id) => id !== storyId);

    let insertionIndex = reorderedIds.length;

    if (sortableData) {
        const hoveredStoryId = String(over.id);
        const hoverIndex = reorderedIds.indexOf(hoveredStoryId);

        if (hoverIndex !== -1) {
            insertionIndex = hoverIndex;
        }
    }

    reorderedIds.splice(insertionIndex, 0, storyId);

    const beforeStoryId = reorderedIds[insertionIndex + 1] ?? null;
    const afterStoryId = reorderedIds[insertionIndex - 1] ?? null;

    if (targetEpicId === source.epic.id) {
        const currentAfter =
            source.index === 0
                ? null
                : source.epic.user_stories[source.index - 1]?.id ?? null;
        const currentBefore =
            source.index === source.epic.user_stories.length - 1
                ? null
                : source.epic.user_stories[source.index + 1]?.id ?? null;

        const stayingInPlace =
            currentAfter === afterStoryId && currentBefore === beforeStoryId;

        if (stayingInPlace) {
            return null;
        }
    }

    return {
        storyId,
        targetEpicId,
        beforeStoryId,
        afterStoryId,
    };
};

const Board: React.FC<BoardProps> = ({ project }) => {
    const [activeStory, setActiveStory] = useState<UserStory | null>(null);
    const reorderMutation = useReorderUserStory();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const storyId = String(event.active.id);
        const location = findStoryLocation(project.epics, storyId);

        if (location) {
            setActiveStory(location.story);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveStory(null);
        const intent = resolveReorderIntent(event, project);

        if (!intent) {
            return;
        }

        reorderMutation.mutate({
            projectId: project.id,
            ...intent,
        });
    };

    const handleDragCancel = (_event: DragCancelEvent) => {
        setActiveStory(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8 items-start">
                {project.epics.map((epic) => (
                    <Column key={epic.id} epic={epic} />
                ))}
            </div>
            <DragOverlay>
                {activeStory ? (
                    <div className="p-4 bg-gray-800 rounded-lg shadow-md cursor-grabbing">
                        <p className="text-sm text-gray-200">
                            {activeStory.content}
                        </p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default Board;
