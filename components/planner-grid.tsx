"use client";

import { format, parseISO } from "date-fns";
import { MoveTaskForm } from "@/components/move-task-form";

interface Task {
  id: string;
  title: string;
  slot: string;
  type: string;
  duration_min: number | null;
  intensity: string | null;
}

interface PlannerDay {
  date: string;
  tasks: Task[];
}

const SLOT_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening"
};

export function PlannerGrid({ week }: { week: PlannerDay[] }) {
  return (
    <div className="planner-grid">
      {week.map((day) => (
        <section key={day.date} className="planner-day card">
          <header>
            <h3>{format(parseISO(day.date), "EEE d")}</h3>
          </header>
          <div className="planner-slots">
            {Object.keys(SLOT_LABELS).map((slot) => {
              const tasks = day.tasks.filter((task) => task.slot === slot);
              return (
                <div key={slot} className="planner-slot">
                  <p className="planner-slot__label">{SLOT_LABELS[slot]}</p>
                  {tasks.length ? (
                    tasks.map((task) => (
                      <article key={task.id} className="planner-task">
                        <div>
                          <p className="planner-task__title">{task.title}</p>
                          <small className="planner-task__meta">
                            {task.type} - {task.duration_min ? `${task.duration_min} min - ` : ""}
                            {task.intensity ?? "standard"}
                          </small>
                        </div>
                        <MoveTaskForm taskId={task.id} currentSlot={task.slot} />
                      </article>
                    ))
                  ) : (
                    <p className="planner-empty">No task yet</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <style jsx>{`
        .planner-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        }

        .planner-slots {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .planner-slot {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem;
          background: #f9fafb;
        }

        .planner-slot__label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #4c1d95;
        }

        .planner-task {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 10px;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(76, 29, 149, 0.08);
        }

        .planner-task__title {
          font-weight: 600;
          margin: 0;
        }

        .planner-task__meta {
          color: #6b7280;
        }

        .planner-empty {
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
