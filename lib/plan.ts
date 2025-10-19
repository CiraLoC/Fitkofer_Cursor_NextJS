import { addDays, formatISO, startOfWeek } from "date-fns";
import { DailyTask, EnergySlot, EnergyWindows, Profile } from "@/lib/types";

interface CheckIn {
  sleep_hours: number;
  wake_time: string;
  energy: number;
  mood: number;
}

const DEFAULT_PREF: Record<EnergySlot, number> = {
  morning: 3,
  afternoon: 4,
  evening: 2
};

const MICRO_FALLBACK: Record<EnergySlot, DailyTask> = {
  morning: {
    id: "micro-morning",
    date: "",
    slot: "morning",
    type: "micro",
    title: "2-min sunlight + mobility",
    duration_min: 5,
    intensity: "micro",
    status: "planned"
  },
  afternoon: {
    id: "micro-afternoon",
    date: "",
    slot: "afternoon",
    type: "micro",
    title: "Stand + stretch break",
    duration_min: 5,
    intensity: "micro",
    status: "planned"
  },
  evening: {
    id: "micro-evening",
    date: "",
    slot: "evening",
    type: "wind_down",
    title: "Wind-down breathwork (6 min)",
    duration_min: 6,
    intensity: "low",
    status: "planned"
  }
};

function parseWakeTimeMinutes(wakeTime: string) {
  const [h, m] = wakeTime.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function computeEnergyWindows(
  checkin: CheckIn,
  profilePref: Profile["energy_pref"]
): EnergyWindows {
  const pref = profilePref
    ? {
        morning: profilePref.morning ?? DEFAULT_PREF.morning,
        afternoon: profilePref.afternoon ?? DEFAULT_PREF.afternoon,
        evening: profilePref.evening ?? DEFAULT_PREF.evening
      }
    : DEFAULT_PREF;

  const result: Record<EnergySlot, number> = { ...pref };

  const wakeMinutes = parseWakeTimeMinutes(checkin.wake_time);
  if (wakeMinutes !== null && Math.abs(7 * 60 - wakeMinutes) < 45 && checkin.sleep_hours >= 7) {
    result.morning += 1;
  }

  if (checkin.sleep_hours < 6) {
    result.evening -= 1;
  }

  if (checkin.energy >= 4) {
    result.afternoon += 1;
  }

  (["morning", "afternoon", "evening"] as EnergySlot[]).forEach((slot) => {
    result[slot] = Math.max(1, Math.min(5, result[slot]));
  });

  const today = formatISO(new Date(), { representation: "date" });
  return {
    date: today,
    morning: result.morning,
    afternoon: result.afternoon,
    evening: result.evening
  };
}

interface GeneratePlanOptions {
  profile: Profile | null;
  weekStart?: Date;
}

const BASE_TASKS: DailyTask[] = [
  {
    id: "workout",
    date: "",
    slot: "morning",
    type: "workout",
    title: "Primary workout",
    duration_min: 28,
    intensity: "high",
    status: "planned"
  },
  {
    id: "meal",
    date: "",
    slot: "afternoon",
    type: "meal",
    title: "Preset meal",
    duration_min: null,
    intensity: "low",
    status: "planned"
  },
  {
    id: "micro",
    date: "",
    slot: "evening",
    type: "micro",
    title: "Micro habit",
    duration_min: 5,
    intensity: "micro",
    status: "planned"
  },
  {
    id: "wind-down",
    date: "",
    slot: "evening",
    type: "wind_down",
    title: "Evening wind-down",
    duration_min: 10,
    intensity: "low",
    status: "planned"
  }
];

export function generateDailyPlan(
  energy: EnergyWindows,
  options: GeneratePlanOptions
): DailyTask[] {
  const tasks = BASE_TASKS.map((task) => ({
    ...task,
    date: energy.date
  }));

  const sortedSlots = (["morning", "afternoon", "evening"] as EnergySlot[]).sort((a, b) => {
    return energy[b] - energy[a];
  });

  const primary = tasks.find((task) => task.type === "workout");
  if (primary) {
    const highSlot = sortedSlots.find((slot) => energy[slot] >= 4);
    if (highSlot) {
      primary.slot = highSlot;
      primary.title =
        energy[highSlot] >= 4 ? "Primary workout" : "Micro strength (15 min band circuit)";
      primary.intensity = energy[highSlot] >= 4 ? "high" : "micro";
      primary.duration_min = energy[highSlot] >= 4 ? 28 : 15;
      if (energy[highSlot] < 4) {
        primary.type = "micro";
      }
    } else {
      primary.slot = sortedSlots[0];
      primary.type = "micro";
      primary.intensity = "micro";
      primary.title = "Micro movement: 12-min walk";
      primary.duration_min = 12;
    }
  }

  const usedSlots = new Set(tasks.map((task) => task.slot));

  sortedSlots.forEach((slot) => {
    const slotTasks = tasks.filter((task) => task.slot === slot);
    if (!slotTasks.length) {
      const fallback = { ...MICRO_FALLBACK[slot], id: `${MICRO_FALLBACK[slot].id}-${slot}` };
      fallback.date = energy.date;
      tasks.push(fallback);
      usedSlots.add(slot);
    }
  });

  const uniqueTasks = tasks.reduce<DailyTask[]>((acc, task) => {
    if (!acc.some((t) => t.id === task.id && t.slot === task.slot)) {
      acc.push(task);
    }
    return acc;
  }, []);

  return uniqueTasks.sort((a, b) => {
    const order: EnergySlot[] = ["morning", "afternoon", "evening"];
    return order.indexOf(a.slot as EnergySlot) - order.indexOf(b.slot as EnergySlot);
  });
}

export function buildWeekPlan(energyWindows: EnergyWindows[], profile: Profile | null) {
  const weekStart = startOfWeek(new Date(energyWindows[0]?.date ?? new Date()), {
    weekStartsOn: 1
  });
  return Array.from({ length: 7 }).map((_, index) => {
    const date = formatISO(addDays(weekStart, index), { representation: "date" });
    const energy = energyWindows.find((window) => window.date === date) ?? {
      date,
      ...DEFAULT_PREF
    };
    const plan = generateDailyPlan(energy as EnergyWindows, { profile });
    return { date, plan };
  });
}
