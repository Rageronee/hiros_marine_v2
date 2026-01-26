export type NewsCategory = 'Positive News' | 'Alert' | 'Community';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export type MissionStatus = 'Available' | 'Active' | 'Completed';
export type LocationCondition = 'Ideal' | 'Calm' | 'Rough' | 'Stormy';

export interface News {
    id: string;
    title: string;
    subtitle: string | null;
    category: NewsCategory;
    image_url: string | null;
    content: string | null;
    created_at: string;
}

export interface Location {
    id: string;
    name: string;
    region: string;
    image_url: string | null;
    water_clarity: number | null;
    biodiversity_score: string | null;
    current_condition: LocationCondition | null;
    description: string | null;
}

export interface Mission {
    id: string;
    title: string;
    location: string;
    difficulty: Difficulty;
    type: string;
    xp_reward: number;
    shell_reward: number;
    description: string;
    status: MissionStatus;
    deadline: string | null;
}

export interface Player {
    id: string;
    name: string | null;
    clan: string | null;
    score: number;
    role: string | null;
    created_at: string;
    avatar_url: string | null;
    bio: string | null;
    level: number;
    xp: number;
    rank_title: string | null;
}
