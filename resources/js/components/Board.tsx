import React, { useRef, useState } from "react";
import {
    DndContext,
    closestCenter,
    DragCancelEvent,
    DragEndEvent,
    DragOverEvent,
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
import { BoardDensity } from "@/types";

interface BoardProps {
    project: Project;
    onCardSelect?: (story: UserStory) => void;
    visibleEpics?: Epic[];
    density?: BoardDensity;
    onManualSort?: () => void;
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
        const index = epic.user_stories.findIndex(
            (item) => item.id === storyId
        );
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

    const targetEpic = project.epics.find((epic) => epic.id === targetEpicId);

    if (!targetEpic) {
        return null;
    }

    const targetStoryIds = targetEpic.user_stories.map((story) => story.id);
    const filteredIds = targetStoryIds.filter((id) => id !== storyId);
    const movingWithinSameEpic = targetEpicId === source.epic.id;

    if (String(over.id) === storyId) {
        return null;
    }

    const isOverCard = sortableData && targetStoryIds.includes(String(over.id));

    let insertionIndex = filteredIds.length;

    if (isOverCard) {
        const overId = String(over.id);
        const overIndexInFiltered = filteredIds.indexOf(overId);
        const overIndexInTarget = targetStoryIds.indexOf(overId);

        if (overIndexInFiltered !== -1 && overIndexInTarget !== -1) {
            if (movingWithinSameEpic) {
                const movingDown = source.index < overIndexInTarget;
                insertionIndex = movingDown
                    ? overIndexInFiltered + 1
                    : overIndexInFiltered;
            } else {
                insertionIndex = overIndexInFiltered;
            }
        }
    } else if (filteredIds.length === 0) {
        insertionIndex = 0;
    }

    if (insertionIndex < 0) {
        insertionIndex = 0;
    } else if (insertionIndex > filteredIds.length) {
        insertionIndex = filteredIds.length;
    }

    if (movingWithinSameEpic) {
        const originalOrder = source.epic.user_stories.map((s) => s.id);
        const prospectiveOrder = [...filteredIds];
        prospectiveOrder.splice(insertionIndex, 0, storyId);

        if (
            JSON.stringify(originalOrder) === JSON.stringify(prospectiveOrder)
        ) {
            return null;
        }

        filteredIds.splice(0, filteredIds.length, ...prospectiveOrder);
    } else {
        filteredIds.splice(insertionIndex, 0, storyId);
    }

    const beforeStoryId = filteredIds[insertionIndex + 1] ?? null;
    const afterStoryId = filteredIds[insertionIndex - 1] ?? null;

    return {
        storyId,
        targetEpicId,
        beforeStoryId,
        afterStoryId,
    };
};

const Board: React.FC<BoardProps> = ({
    project,
    onCardSelect,
    visibleEpics,
    density = "comfortable",
    onManualSort,
}) => {
    const [activeStory, setActiveStory] = useState<UserStory | null>(null);
    const reorderMutation = useReorderUserStory();
    const lastCardOverRef = useRef<{
        id: string;
        containerId: string;
        index: number | null;
    } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 6,
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

    const handleDragOver = (event: DragOverEvent) => {
        const { over, active } = event;

        if (!over) {
            return;
        }

        const overSortable = over.data.current?.sortable;

        if (
            overSortable &&
            typeof overSortable.containerId === "string" &&
            String(over.id) !== String(active.id)
        ) {
            lastCardOverRef.current = {
                id: String(over.id),
                containerId: overSortable.containerId,
                index:
                    typeof overSortable.index === "number"
                        ? overSortable.index
                        : null,
            };
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveStory(null);
        console.log("[drag:end] raw event", {
            overId: event.over?.id,
            overData: event.over?.data.current?.sortable,
            lastFallback: lastCardOverRef.current,
        });

        let effectiveEvent = event;

        if (
            !event.over?.data.current?.sortable ||
            typeof event.over.data.current.sortable.containerId !== "string"
        ) {
            const fallback = lastCardOverRef.current;

            if (fallback) {
                effectiveEvent = {
                    ...event,
                    over: {
                        id: fallback.id,
                        data: {
                            current: {
                                sortable:
                                    fallback.index === null
                                        ? {
                                              containerId: fallback.containerId,
                                          }
                                        : {
                                              containerId: fallback.containerId,
                                              index: fallback.index,
                                          },
                            },
                        },
                    } as unknown as DragEndEvent["over"],
                };
            }
        }

        const intent = resolveReorderIntent(effectiveEvent, project);
        console.log("[drag:end] intent + local order", {
            intent,
            epicOrder: project.epics.map((epic) => ({
                epic: epic.id,
                stories: epic.user_stories.map(({ id, position }) => ({
                    id,
                    position,
                })),
            })),
        });
        lastCardOverRef.current = null;

        if (!intent) {
            return;
        }

        reorderMutation.mutate({
            projectId: project.id,
            ...intent,
        });

        const source = findStoryLocation(project.epics, intent.storyId);
        if (source && source.epic.id === intent.targetEpicId) {
            onManualSort?.();
        }
    };

    const handleDragCancel = (_event: DragCancelEvent) => {
        setActiveStory(null);
        lastCardOverRef.current = null;
    };

    const epicsToRender = visibleEpics ?? project.epics;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            {epicsToRender.length === 0 ? (
                <div className="mt-10 rounded-xl border border-slate-700/60 bg-slate-900/70 p-6 text-center text-sm text-slate-300">
                    No stories match the current filters.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 mt-8 items-start md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {epicsToRender.map((epic) => (
                        <Column
                            key={epic.id}
                            epic={epic}
                            onCardSelect={onCardSelect}
                            density={density}
                        />
                    ))}
                </div>
            )}
            <DragOverlay>
                {activeStory ? (
                    <div className="min-w-[240px] max-w-[280px] rounded-xl border border-slate-600/60 bg-slate-800/95 p-4 shadow-2xl ring-1 ring-slate-900/30">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-slate-300/90">
                                {activeStory.derived_fields?.meta?.var_id && (
                                    <span className="rounded bg-slate-700/80 px-2 py-0.5 font-semibold text-slate-200">
                                        {activeStory.derived_fields.meta.var_id}
                                    </span>
                                )}
                                <span
                                    className={`rounded-full px-2 py-0.5 font-semibold ${
                                        activeStory.priority === "high"
                                            ? "bg-rose-500/15 text-rose-200 border border-rose-400/40"
                                            : activeStory.priority === "medium"
                                            ? "bg-amber-500/15 text-amber-200 border border-amber-400/40"
                                            : "bg-emerald-500/15 text-emerald-200 border border-emerald-400/40"
                                    }`}
                                >
                                    {activeStory.priority}
                                </span>
                            </div>
                        </div>
                        <p
                            className="text-sm font-semibold text-slate-100"
                            style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {activeStory.derived_fields?.assets?.hook ||
                                "No hook provided"}
                        </p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default Board;
