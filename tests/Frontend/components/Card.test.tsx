import { render, screen } from "@testing-library/react";
import Card from "@/components/Card";
import type { UserStory } from "@/types";

vi.mock("@dnd-kit/sortable", () => ({
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
}));

vi.mock("@dnd-kit/utilities", () => ({
    CSS: {
        Transform: {
            toString: () => "",
        },
    },
}));

const buildStory = (overrides: Partial<UserStory> = {}): UserStory => ({
    id: "story-1",
    content: "Raw content",
    status: "todo",
    priority: "high",
    position: 1,
    is_ai_generated: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    derived_fields: {
        meta: {
            var_id: "VAR-001",
        },
        assets: {
            hook: "Bu bir test hook metnidir.",
            google_h1: "Öne çıkan başlık",
        },
        reasoning: {},
        limits: {
            hook: 60,
            google_h1: 30,
        },
        char_counts: {
            hook: 27,
            google_h1: 15,
        },
        over_limit_fields: [],
        over_limit_count: 0,
    },
    ...overrides,
});

describe("Card", () => {
    it("renders hook text and character counter from derived fields", () => {
        const story = buildStory();

        render(<Card story={story} epicId="epic-1" density="comfortable" />);

        expect(
            screen.getByText("Bu bir test hook metnidir.")
        ).toBeInTheDocument();

        expect(screen.getByText("15/30")).toBeInTheDocument();
    });
});
