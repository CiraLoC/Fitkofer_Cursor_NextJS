import { format, parseISO } from "date-fns";
import { redirect } from "next/navigation";
import { GenerateGroceryButton } from "@/components/generate-grocery-button";
import { createServerClient } from "@/lib/supabase/server-client";

export default async function MealsPage() {
  const supabase = createServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/signup");
  }

  const [{ data: meals }, { data: grocery }] = await Promise.all([
    supabase
      .from("meals")
      .select("*")
      .order("preset_key", { ascending: true })
      .limit(30),
    supabase.from("grocery_lists").select("*").order("week_start", { ascending: false }).limit(1)
  ]);

  const latestList = grocery?.[0];

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <div className="card" style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1>Meal presets</h1>
          <p>Swap presets and refresh your grocery list at any time.</p>
        </div>
        <GenerateGroceryButton />
      </div>

      <section className="grid two">
        {meals?.map((meal) => (
          <article key={meal.id ?? meal.title} className="card">
            <h3>{meal.title}</h3>
            <p style={{ color: "#6b7280" }}>Preset: {meal.preset_key}</p>
            <p>
              {meal.kcal} kcal - Protein {meal.macros?.protein}g - Carbs {meal.macros?.carbs}g - Fat{" "}
              {meal.macros?.fat}g
            </p>
            {meal.recipe_url && (
              <a
                href={meal.recipe_url}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#7c3aed", fontWeight: 600 }}
              >
                View recipe ->
              </a>
            )}
            <div style={{ marginTop: "1rem" }}>
              <strong>Ingredients</strong>
              <ul>
                {meal.grocery?.map((item: any) => (
                  <li key={item.item}>
                    {item.item} - {item.qty}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="card">
        <h2>Grocery list</h2>
        {latestList ? (
          <>
            <p>
              Week of {format(parseISO(latestList.week_start), "MMMM d")}. Total items:{" "}
              {latestList.items?.length ?? 0}
            </p>
            <ul>
              {latestList.items?.map((item: any) => (
                <li key={item.item}>
                  {item.item} - {item.qty}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No grocery list yet. Hit refresh to generate one.</p>
        )}
      </section>
    </div>
  );
}
