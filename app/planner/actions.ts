"use server";

import { addDays, eachDayOfInterval, formatISO, parseISO, startOfWeek } from "date-fns";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server-client";
import { buildWeekPlan, generateDailyPlan } from "@/lib/plan";

const autoSlotSchema = z.object({
  week_start: z.string().optional()
});

const moveTaskSchema = z.object({
  task_id: z.string().uuid(),
  slot: z.enum(["morning", "afternoon", "evening"])
});

export async function autoSlot(_: { message: string | null }, formData: FormData) {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Sign in required." };
  }

  const parsed = autoSlotSchema.safeParse({
    week_start: formData.get("week_start")
  });

  if (!parsed.success) {
    return { message: "Invalid week selected." };
  }

  const anchor = parsed.data.week_start
    ? parseISO(parsed.data.week_start)
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekDates = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }).map((day) =>
    formatISO(day, { representation: "date" })
  );

  const [{ data: energyWindows }, { data: profile }] = await Promise.all([
    supabase
      .from("energy_windows")
      .select("*")
      .in("date", weekDates)
      .order("date", { ascending: true }),
    supabase.from("profiles").select("*").maybeSingle()
  ]);

  const windows = weekDates.map((date) => {
    const existing = energyWindows?.find((win) => win.date === date);
    return (
      existing ?? {
        date,
        morning: 3,
        afternoon: 4,
        evening: 2
      }
    );
  });

  const plans = buildWeekPlan(windows, profile ?? null);

  for (const day of plans) {
    await supabase.from("tasks").delete().eq("user_id", user.id).eq("date", day.date);
    await supabase.from("tasks").insert(
      day.plan.map((task) => ({
        user_id: user.id,
        date: day.date,
        slot: task.slot,
        type: task.type,
        title: task.title,
        duration_min: task.duration_min,
        intensity: task.intensity,
        status: task.status
      }))
    );
  }

  return { message: "Week auto-slotted based on your latest energy patterns." };
}

export async function moveTask(_: { message: string | null }, formData: FormData) {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Sign in required." };
  }

  const parsed = moveTaskSchema.safeParse({
    task_id: formData.get("task_id"),
    slot: formData.get("slot")
  });

  if (!parsed.success) {
    return { message: "Invalid move." };
  }

  await supabase
    .from("tasks")
    .update({ slot: parsed.data.slot })
    .eq("id", parsed.data.task_id)
    .eq("user_id", user.id);

  return { message: "Task moved." };
}
