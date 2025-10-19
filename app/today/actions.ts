"use server";

import { formatISO } from "date-fns";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server-client";
import { computeEnergyWindows, generateDailyPlan } from "@/lib/plan";

const checkinSchema = z.object({
  date: z.string(),
  sleep_hours: z.coerce.number().min(3).max(12),
  wake_time: z.string(),
  energy: z.coerce.number().min(1).max(5),
  mood: z.coerce.number().min(1).max(5),
  notes: z.string().optional()
});

export async function submitCheckIn(_: { message: string | null }, formData: FormData) {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Please sign in to submit a check-in." };
  }

  const parsed = checkinSchema.safeParse({
    date: formData.get("date"),
    sleep_hours: formData.get("sleep_hours"),
    wake_time: formData.get("wake_time"),
    energy: formData.get("energy"),
    mood: formData.get("mood"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return { message: "Check-in fields look off. Please review and resubmit." };
  }

  const date = parsed.data.date || formatISO(new Date(), { representation: "date" });

  await supabase.from("checkins").upsert({
    user_id: user.id,
    date,
    sleep_hours: parsed.data.sleep_hours,
    wake_time: parsed.data.wake_time,
    energy: parsed.data.energy,
    mood: parsed.data.mood,
    notes: parsed.data.notes ?? null
  });

  const profile = await supabase.from("profiles").select("energy_pref").maybeSingle();

  const energy = computeEnergyWindows(
    {
      sleep_hours: parsed.data.sleep_hours,
      wake_time: parsed.data.wake_time,
      energy: parsed.data.energy,
      mood: parsed.data.mood
    },
    profile.data?.energy_pref ?? null
  );
  energy.date = date;

  await supabase.from("energy_windows").upsert({
    user_id: user.id,
    date,
    morning: energy.morning,
    afternoon: energy.afternoon,
    evening: energy.evening,
    source: "heuristic_v1"
  });

  const plan = generateDailyPlan(energy, { profile: null });

  await supabase.from("tasks").delete().eq("user_id", user.id).eq("date", date);

  await supabase.from("tasks").insert(
    plan.map((task) => ({
      user_id: user.id,
      date,
      slot: task.slot,
      type: task.type,
      title: task.title,
      duration_min: task.duration_min,
      intensity: task.intensity,
      status: task.status
    }))
  );

  return { message: "Plan refreshed with your latest energy check-in." };
}

const statusSchema = z.object({
  task_id: z.string().uuid(),
  status: z.enum(["planned", "done", "skipped"])
});

export async function updateTaskStatus(_: { message: string | null }, formData: FormData) {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Sign in required." };
  }

  const parsed = statusSchema.safeParse({
    task_id: formData.get("task_id"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return { message: "Could not update task." };
  }

  await supabase
    .from("tasks")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.task_id)
    .eq("user_id", user.id);

  await supabase.from("task_events").insert({
    task_id: parsed.data.task_id,
    event: parsed.data.status === "done" ? "done" : "status_update",
    meta: { status: parsed.data.status }
  });

  return { message: "Task updated." };
}
