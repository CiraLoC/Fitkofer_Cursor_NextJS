import { addDays, format, formatISO, parseISO, startOfWeek } from "date-fns";
import { redirect } from "next/navigation";
import { AutoSlotForm } from "@/components/auto-slot-form";
import { PlannerGrid } from "@/components/planner-grid";
import { createServerClient } from "@/lib/supabase/server-client";

interface PlannerPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function PlannerPage({ searchParams }: PlannerPageProps) {
  const supabase = createServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/signup");
  }

  const paramWeek = typeof searchParams?.week === "string" ? searchParams?.week : undefined;
  const weekStart = paramWeek
    ? startOfWeek(parseISO(paramWeek), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  const startDate = formatISO(weekStart, { representation: "date" });
  const endDate = formatISO(addDays(weekStart, 6), { representation: "date" });

  const [{ data: tasks }, { data: energy }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true }),
    supabase
      .from("energy_windows")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
  ]);

  const week = Array.from({ length: 7 }).map((_, index) => {
    const date = formatISO(addDays(weekStart, index), { representation: "date" });
    return {
      date,
      tasks: (tasks ?? []).filter((task) => task.date === date),
      energy: energy?.find((item) => item.date === date)
    };
  });

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <div className="card" style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1>Weekly planner</h1>
          <p>
            Week of {format(weekStart, "MMMM d")} - {format(addDays(weekStart, 6), "MMMM d")}
          </p>
        </div>
        <AutoSlotForm weekStart={startDate} />
      </div>

      <PlannerGrid
        week={week.map((day) => ({
          date: day.date,
          tasks: day.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            slot: task.slot,
            type: task.type,
            duration_min: task.duration_min,
            intensity: task.intensity
          }))
        }))}
      />
    </div>
  );
}
