export type CompanionActionKey = 'water' | 'feed' | 'play';
export type CompanionStageKey =
  | 'era-1'
  | 'era-2'
  | 'era-3'
  | 'era-4'
  | 'era-5'
  | 'era-6'
  | 'era-7'
  | 'era-8'
  | 'era-9'
  | 'era-10';
export type BuddyRoomKey = 'studio' | 'play' | 'night';

export interface CompanionSkin { key: string; name: string; premium: boolean; unlocked: boolean; }

export type CompanionMoodKey = 'wilted' | 'calm' | 'happy' | 'radiant';

export interface Companion {
  id: number;
  name: string;
  care_points: number;
  growth_points: number;
  water: number;
  hunger: number;
  happiness: number;
  selected_skin: string;
  selected_room: BuddyRoomKey;
  last_interaction_at: string | null;
}

export interface CompanionGrowth {
  key: CompanionStageKey;
  level: number;
  max_level: number;
  era: number;
  name: string;
  progress_percentage: number;
  current_level_points: number;
  next_level_points: number | null;
  points_to_next_level: number;
  next_stage_points: number | null;
  points_to_next_stage: number;
  knowledge_growth_points: number;
  care_growth_points: number;
  total_growth_points: number;
  size_percentage: number;
}

export interface CompanionMood {
  key: CompanionMoodKey;
  name: string;
  score: number;
}

export interface CompanionAction {
  key: CompanionActionKey;
  label: string;
  cost: number;
  boost: number;
  growth: number;
}

export interface CompanionState {
  companion: Companion;
  growth: CompanionGrowth;
  mood: CompanionMood;
  xp_points: number;
  actions: CompanionAction[];
  available_skins: CompanionSkin[];
  available_rooms: BuddyRoomKey[];
}

export interface CompanionActionResponse {
  message: string;
  state: CompanionState;
}
