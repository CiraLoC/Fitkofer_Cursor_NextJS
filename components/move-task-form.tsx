"use client";

import { useFormState } from "react-dom";
import { moveTask } from "@/app/planner/actions";

const INITIAL_STATE = { message: null as string | null };

export function MoveTaskForm({ taskId, currentSlot }: { taskId: string; currentSlot: string }) {
  const [state, formAction] = useFormState(moveTask, INITIAL_STATE);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <input type="hidden" name="task_id" value={taskId} />
      <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
        Slot
        <select
          name="slot"
          defaultValue={currentSlot}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem 0.75rem",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
          marginTop: "0.25rem"
        }}
        >
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
      </label>
      {state.message && <span style={{ color: "#7c3aed", fontSize: "0.75rem" }}>{state.message}</span>}
    </form>
  );
}
