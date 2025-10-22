import { UserStory } from "./UserStory";

export interface Epic {
    id: string;
    title: string;
    position: number;
    user_stories: UserStory[];
    created_at: string;
    updated_at: string;
}
