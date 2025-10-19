"use server";

import { formatISO, startOfWeek } from "date-fns";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server-client";
import { computeEnergyWindows, generateDailyPlan } from "@/lib/plan";
import type { Profile } from "@/lib/types";

const onboardingSchema = z.object({
  name: z.string().min(1),
  tz: z.string().min(2),
  goal: z.enum(["fat_loss", "recomp", "glute"]),
  equipment: z.array(z.string()).default([]),
  cycle_phase: z.string().nullable(),
  postpartum: z.boolean().optional(),
  ir: z.boolean().optional(),
  hashimoto: z.boolean().optional(),
  pcos: z.boolean().optional(),
  morning_energy: z.coerce.number().min(1).max(5),
  afternoon_energy: z.coerce.number().min(1).max(5),
  evening_energy: z.coerce.number().min(1).max(5),
  sleep_hours: z.coerce.number().min(4).max(10),
  wake_time: z.string()
});

export async function completeOnboarding(_: { error?: string | null }, formData: FormData) {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in to continue." };
  }

  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    tz: formData.get("tz"),
    goal: formData.get("goal"),
    equipment: formData.getAll("equipment"),
    cycle_phase: formData.get("cycle_phase") || null,
    postpartum: formData.get("postpartum") === "on",
    ir: formData.get("ir") === "on",
    hashimoto: formData.get("hashimoto") === "on",
    pcos: formData.get("pcos") === "on",
    morning_energy: formData.get("morning_energy"),
    afternoon_energy: formData.get("afternoon_energy"),
    evening_energy: formData.get("evening_energy"),
    sleep_hours: formData.get("sleep_hours"),
    wake_time: formData.get("wake_time")
  });

  if (!parsed.success) {
    return { error: "Please review the fields and try again." };
  }

  const today = formatISO(new Date(), { representation: "date" });

  const profile: Profile = {
    user_id: user.id,
    name: parsed.data.name,
    tz: parsed.data.tz,
    goal: parsed.data.goal,
    equipment: parsed.data.equipment,
    sleep_wake: {
      weekdays: { bed: "22:30", wake: parsed.data.wake_time },
      weekends: { bed: "23:00", wake: parsed.data.wake_time }
    },
    energy_pref: {
      morning: parsed.data.morning_energy,
      afternoon: parsed.data.afternoon_energy,
      evening: parsed.data.evening_energy
    },
    conditions: {
      postpartum: parsed.data.postpartum ?? false,
      ir: parsed.data.ir ?? false,
      hashimoto: parsed.data.hashimoto ?? false,
      pcos: parsed.data.pcos ?? false
    },
    cycle_phase: parsed.data.cycle_phase,
    created_at: new Date().toISOString()
  };

  const checkin = {
    sleep_hours: parsed.data.sleep_hours,
    wake_time: parsed.data.wake_time,
    energy: Math.round(
      (parsed.data.morning_energy + parsed.data.afternoon_energy + parsed.data.evening_energy) / 3
    ),
    mood: 3
  };

  const energy = computeEnergyWindows(checkin, profile.energy_pref);
  energy.date = today;

  const plan = generateDailyPlan(energy, { profile });

  await supabase.from("profiles").upsert({
    user_id: user.id,
    name: profile.name,
    tz: profile.tz,
    goal: profile.goal,
    equipment: profile.equipment,
    sleep_wake: profile.sleep_wake,
    energy_pref: profile.energy_pref,
    conditions: profile.conditions,
    cycle_phase: profile.cycle_phase
  });

  await supabase.from("energy_windows").upsert({
    user_id: user.id,
    date: today,
    morning: energy.morning,
    afternoon: energy.afternoon,
    evening: energy.evening,
    source: "heuristic_v1"
  });

  await supabase.from("tasks").delete().eq("user_id", user.id).eq("date", today);

  const inserts = plan.map((task) => ({
    user_id: user.id,
    date: today,
    slot: task.slot,
    type: task.type,
    title: task.title,
    duration_min: task.duration_min,
    intensity: task.intensity,
    status: "planned"
  }));

  await supabase.from("tasks").insert(inserts);

  await supabase.from("grocery_lists").upsert({
    user_id: user.id,
    week_start: formatISO(startOfWeek(new Date(), { weekStartsOn: 1 }), {
      representation: "date"
    }),
    items: []
  });

  redirect("/today");
}
