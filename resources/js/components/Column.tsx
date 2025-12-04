import React, { useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Epic, UserStory } from "@/types";
import Card from "./Card";
import { BoardDensity } from "@/types";
import { useGenerateAiUserStory } from "@/hooks/useUserStoryMutations";
import { triggerConfetti } from "@/lib/confetti";
import type { AuthGuardControls } from "@/hooks/useAuthGuard";

const SCROLL_SETTLE_MS = 500;
const HIGHLIGHT_DURATION_MS = 2500;

interface ColumnProps {
    projectId: string;
    epic: Epic;
    onCardSelect?: (story: UserStory) => void;
    density?: BoardDensity;
    authGuard?: Pick<AuthGuardControls, "guard">;
}

const Column: React.FC<ColumnProps> = ({
    projectId,
    epic,
    onCardSelect,
    density = "comfortable",
    authGuard,
}) => {
    const { setNodeRef } = useDroppable({
        id: epic.id,
    });
    const listRef = useRef<HTMLDivElement | null>(null);
    const previousCountRef = useRef<number>(epic.user_stories.length);
    const [highlightedStoryId, setHighlightedStoryId] = useState<string | null>(
        null
    );
    const isManualGenerationRef = useRef(false);
    const scrollTimeoutRef = useRef<number | null>(null);
    const highlightTimeoutRef = useRef<number | null>(null);
    const generateStoryMutation = useGenerateAiUserStory(projectId);

    useEffect(() => {
        if (epic.user_stories.length > previousCountRef.current) {
            const lastChild = listRef.current?.lastElementChild;
            const newStory = epic.user_stories[epic.user_stories.length - 1];
            if (lastChild) {
                lastChild.scrollIntoView({ behavior: "smooth", block: "nearest" });

                if (isManualGenerationRef.current) {
                    if (newStory) {
                        setHighlightedStoryId(newStory.id);
                        if (highlightTimeoutRef.current) {
                            clearTimeout(highlightTimeoutRef.current);
                        }
                        highlightTimeoutRef.current = window.setTimeout(() => {
                            setHighlightedStoryId(null);
                            highlightTimeoutRef.current = null;
                        }, HIGHLIGHT_DURATION_MS);
                    }

                    const timeoutId = window.setTimeout(() => {
                        void triggerConfetti();
                        isManualGenerationRef.current = false;
                        scrollTimeoutRef.current = null;
                    }, SCROLL_SETTLE_MS);
                    scrollTimeoutRef.current = timeoutId;
                }
            }
        }
        previousCountRef.current = epic.user_stories.length;

        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
                scrollTimeoutRef.current = null;
            }
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
                highlightTimeoutRef.current = null;
            }
        };
    }, [epic.user_stories.length]);

    const handleGenerateClick = () => {
        const perform = () => {
            isManualGenerationRef.current = true;
            generateStoryMutation.mutate(
                { epicId: epic.id },
                {
                    onError: () => {
                        isManualGenerationRef.current = false;
                    },
                }
            );
        };

        if (authGuard) {
            authGuard.guard(perform);
            return;
        }

        isManualGenerationRef.current = true;
        generateStoryMutation.mutate(
            { epicId: epic.id },
            {
                onError: () => {
                    isManualGenerationRef.current = false;
                },
            }
        );
    };

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
                    ref={listRef}
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
                            isHighlighted={story.id === highlightedStoryId}
                        />
                    ))}
                </div>
            </SortableContext>

            {epic.user_stories.length < 5 && (
                <button
                    type="button"
                    onClick={handleGenerateClick}
                    disabled={generateStoryMutation.isPending}
                    className="mt-2 inline-flex items-center justify-center rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {generateStoryMutation.isPending ? "Generating..." : "Generate another"}
                </button>
            )}
        </div>
    );
};

export default React.memo(Column);
