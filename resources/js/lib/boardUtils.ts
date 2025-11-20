import { DragEndEvent } from "@dnd-kit/core";
import { Epic, Project, UserStory } from "@/types";

export type StoryLocation = {
    story: UserStory;
    epic: Epic;
    index: number;
};

export type ReorderIntent = {
    storyId: string;
    targetEpicId: string;
    beforeStoryId: string | null;
    afterStoryId: string | null;
};

export const findStoryLocation = (
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

export const resolveReorderIntent = (
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
