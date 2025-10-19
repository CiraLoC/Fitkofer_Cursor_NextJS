"use client";

import { useFormState, useFormStatus } from "react-dom";
import { autoSlot } from "@/app/planner/actions";

const INITIAL_STATE = { message: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button" type="submit" disabled={pending}>
      {pending ? "Auto-slotting..." : "Auto-slot week"}
    </button>
  );
}

export function AutoSlotForm({ weekStart }: { weekStart: string }) {
  const [state, formAction] = useFormState(autoSlot, INITIAL_STATE);

  return (
    <form action={formAction} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <input type="hidden" name="week_start" value={weekStart} />
      <SubmitButton />
      {state.message && <span style={{ color: "#16a34a" }}>{state.message}</span>}
    </form>
  );
}
