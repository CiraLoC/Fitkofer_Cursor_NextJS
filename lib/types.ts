export type EnergySlot = "morning" | "afternoon" | "evening";
export type TaskType = "workout" | "walk" | "meal_prep" | "meal" | "micro" | "wind_down";
export type TaskStatus = "planned" | "done" | "skipped";

export interface EnergyWindows {
  date: string;
  morning: number;
  afternoon: number;
  evening: number;
}

export interface DailyTask {
  id: string;
  date: string;
  slot: EnergySlot;
  type: TaskType;
  title: string;
  duration_min: number | null;
  intensity: "high" | "low" | "micro" | null;
  status: TaskStatus;
}

export interface MealPreset {
  id: string;
  title: string;
  preset_key: string;
  kcal: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  recipe_url: string | null;
  grocery: {
    item: string;
    qty: string;
    checked?: boolean;
  }[];
}

export interface Profile {
  user_id: string;
  name: string | null;
  tz: string;
  goal: "fat_loss" | "recomp" | "glute" | null;
  equipment: string[] | null;
  sleep_wake: Record<string, unknown> | null;
  energy_pref: Record<EnergySlot, number> | null;
  conditions: Record<string, boolean> | null;
  cycle_phase: string | null;
  created_at?: string;
}

export interface CheckInPayload {
  date: string;
  sleep_hours: number;
  wake_time: string;
  energy: number;
  mood: number;
  notes?: string;
}
