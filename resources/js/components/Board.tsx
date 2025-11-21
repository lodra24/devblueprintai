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
import { findStoryLocation, resolveReorderIntent } from "@/lib/boardUtils";

interface BoardProps {
    project: Project;
    onCardSelect?: (story: UserStory) => void;
    visibleEpics?: Epic[];
    density?: BoardDensity;
    onManualSort?: () => void;
}

const PRIORITY_BADGE: Record<UserStory["priority"], string> = {
    high: "border border-rose-200 bg-rose-50 text-rose-700",
    medium: "border border-amber-200 bg-amber-50 text-amber-700",
    low: "border border-emerald-200 bg-emerald-50 text-emerald-700",
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
            <div className="mt-10 rounded-2xl border border-stone/20 bg-white/90 p-6 text-center text-sm text-stone shadow-deep">
                No stories match the current filters.
            </div>
        ) : (
            <div className="mt-8 grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {epicsToRender.map((epic) => (
                    <Column
                        key={epic.id}
                        projectId={project.id}
                        epic={epic}
                        onCardSelect={onCardSelect}
                        density={density}
                    />
                ))}
            </div>
        )}
        <DragOverlay>
            {activeStory ? (
                <div className="min-w-[240px] max-w-[280px] rounded-2xl border border-stone/20 bg-white/95 p-4 text-ink shadow-deep ring-2 ring-accent/20">
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-stone">
                        {activeStory.derived_fields?.meta?.var_id && (
                            <span className="rounded-md bg-pastel-mint/80 px-2 py-0.5 font-semibold text-ink/80">
                                {activeStory.derived_fields.meta.var_id}
                            </span>
                        )}
                        <span
                            className={`rounded-full px-2 py-0.5 font-semibold ${PRIORITY_BADGE[activeStory.priority]}`}
                        >
                            {activeStory.priority}
                        </span>
                    </div>
                    <p
                        className="text-sm font-semibold text-ink"
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
