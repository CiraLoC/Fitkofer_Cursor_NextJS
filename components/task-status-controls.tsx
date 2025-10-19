"use client";

import { useFormState } from "react-dom";
import { updateTaskStatus } from "@/app/today/actions";

const INITIAL_STATE = { message: null as string | null };

export function TaskStatusControls({ taskId, status }: { taskId: string; status: string }) {
  const [, formAction] = useFormState(updateTaskStatus, INITIAL_STATE);

  return (
    <form
      action={formAction}
      style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}
    >
      <input type="hidden" name="task_id" value={taskId} />
      {["planned", "done", "skipped"].map((option) => (
        <button
          key={option}
          className={`button ${status === option ? "" : "secondary"}`}
          type="submit"
          name="status"
          value={option}
          style={{ padding: "0.4rem 0.9rem" }}
        >
          {option}
        </button>
      ))}
    </form>
  );
}
