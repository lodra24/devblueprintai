import { UserStory } from "./UserStory";

export interface Epic {
    id: string;
    title: string;
    position: number;
    is_ai_generated: boolean;
    user_stories: UserStory[];
    created_at: string;
    updated_at: string;
}
