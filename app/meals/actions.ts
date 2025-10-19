"use server";

import { formatISO, startOfWeek } from "date-fns";
import { createServerClient } from "@/lib/supabase/server-client";

export async function generateGroceryList() {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in required." };
  }

  const [{ data: meals }, { data: tasks }] = await Promise.all([
    supabase.from("meals").select("title, grocery").limit(10),
    supabase.from("tasks").select("type, ref_id").eq("user_id", user.id)
  ]);

  const selectedMealIds = new Set(tasks?.filter((task) => task.type === "meal").map((task) => task.ref_id));

  const relevantMeals =
    meals?.filter((meal) => {
      if (!selectedMealIds.size) return true;
      return selectedMealIds.has((meal as any).id) || selectedMealIds.size === 0;
    }) ?? [];

  const map = new Map<string, { qty: string; item: string }>();

  relevantMeals.forEach((meal: any) => {
    meal.grocery?.forEach((ingredient: any) => {
      if (!ingredient?.item) return;
      if (!map.has(ingredient.item)) {
        map.set(ingredient.item, { item: ingredient.item, qty: ingredient.qty });
      } else {
        const existing = map.get(ingredient.item)!;
        existing.qty = existing.qty || ingredient.qty;
      }
    });
  });

  const items = Array.from(map.values()).sort((a, b) => a.item.localeCompare(b.item));

  const weekStart = formatISO(startOfWeek(new Date(), { weekStartsOn: 1 }), {
    representation: "date"
  });

  await supabase.from("grocery_lists").upsert({
    user_id: user.id,
    week_start: weekStart,
    items
  });

  return { error: null };
}
