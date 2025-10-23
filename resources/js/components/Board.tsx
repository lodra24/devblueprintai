import React, { useState, useEffect } from "react";
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
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Project, Epic, UserStory } from "@/types";
import Column from "./Column";

interface BoardProps {
    project: Project | undefined;
}

type ActiveStory = {
    story: UserStory;
    epicId: string;
};

const cloneEpics = (source: Epic[] = []): Epic[] =>
    source.map((epic) => ({
        ...epic,
        user_stories: epic.user_stories.map((story) => ({ ...story })),
    }));

const findStoryById = (epics: Epic[], storyId: string): ActiveStory | null => {
    for (const epic of epics) {
        const story = epic.user_stories.find((item) => item.id === storyId);
        if (story) {
            return { story, epicId: epic.id };
        }
    }
    return null;
};

const Board: React.FC<BoardProps> = ({ project }) => {
    const [epics, setEpics] = useState<Epic[]>(() =>
        cloneEpics(project?.epics ?? [])
    );
    const [activeStory, setActiveStory] = useState<ActiveStory | null>(null);

    useEffect(() => {
        setEpics(cloneEpics(project?.epics ?? []));
    }, [project]);

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
        const story = findStoryById(epics, storyId);
        setActiveStory(story);
    };

    const handleDragCancel = (_event: DragCancelEvent) => {
        setActiveStory(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveStory(null);

        if (!over || active.id === over.id) {
            return;
        }

        const activeId = String(active.id);
        const overId = String(over.id);

        const activeContainerId =
            (active.data.current?.sortable?.containerId as string | undefined) ??
            (active.data.current as { epicId?: string } | undefined)?.epicId;
        const overContainerId =
            (over.data.current?.sortable?.containerId as string | undefined) ??
            (typeof over.id === "string" ? over.id : overId);

        if (!activeContainerId || !overContainerId) {
            return;
        }

        setEpics((prevEpics) => {
            const sourceEpicIndex = prevEpics.findIndex(
                (epic) => epic.id === activeContainerId
            );
            const targetEpicIndex = prevEpics.findIndex(
                (epic) => epic.id === overContainerId
            );

            if (sourceEpicIndex === -1 || targetEpicIndex === -1) {
                return prevEpics;
            }

            const sourceEpic = prevEpics[sourceEpicIndex];
            const targetEpic = prevEpics[targetEpicIndex];

            const activeStoryIndex = sourceEpic.user_stories.findIndex(
                (story) => story.id === activeId
            );

            if (activeStoryIndex === -1) {
                return prevEpics;
            }

            const overIndexFromContext =
                over.data.current?.sortable?.index ?? null;

            let targetIndex = targetEpic.user_stories.findIndex(
                (story) => story.id === overId
            );

            if (targetIndex === -1) {
                targetIndex =
                    typeof overIndexFromContext === "number"
                        ? overIndexFromContext
                        : targetEpic.user_stories.length;
            }

            if (sourceEpic.id === targetEpic.id) {
                const safeTargetIndex =
                    targetIndex >= sourceEpic.user_stories.length
                        ? sourceEpic.user_stories.length - 1
                        : targetIndex;

                if (
                    safeTargetIndex === -1 ||
                    safeTargetIndex === activeStoryIndex
                ) {
                    return prevEpics;
                }

                const updatedStories = arrayMove(
                    sourceEpic.user_stories,
                    activeStoryIndex,
                    safeTargetIndex
                );

                if (updatedStories === sourceEpic.user_stories) {
                    return prevEpics;
                }

                return prevEpics.map((epic, index) =>
                    index === sourceEpicIndex
                        ? { ...epic, user_stories: updatedStories }
                        : epic
                );
            }

            const nextEpics = prevEpics.map((epic) => ({
                ...epic,
                user_stories: [...epic.user_stories],
            }));

            const sourceStories = nextEpics[sourceEpicIndex].user_stories;
            const targetStories = nextEpics[targetEpicIndex].user_stories;

            const [movedStory] = sourceStories.splice(activeStoryIndex, 1);

            if (!movedStory) {
                return prevEpics;
            }

            const insertionIndex = Math.min(targetIndex, targetStories.length);
            targetStories.splice(insertionIndex, 0, movedStory);

            return nextEpics;
        });
    };

    if (!project || !epics || epics.length === 0) {
        return (
            <div className="mt-8 text-center text-gray-400">
                No epics or stories to display for this project.
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8 items-start">
                {epics.map((epic) => (
                    <Column key={epic.id} epic={epic} />
                ))}
            </div>
            <DragOverlay>
                {activeStory ? (
                    <div className="p-4 bg-gray-800 rounded-lg shadow-md">
                        <p className="text-sm text-gray-200">
                            {activeStory.story.content}
                        </p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default Board;
