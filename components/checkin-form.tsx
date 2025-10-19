"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitCheckIn } from "@/app/today/actions";

const INITIAL_STATE = { message: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button" type="submit" disabled={pending}>
      {pending ? "Updating..." : "Save check-in"}
    </button>
  );
}

export function CheckInForm({ date }: { date: string }) {
  const [state, formAction] = useFormState(submitCheckIn, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="card"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <h2>2-minute check-in</h2>
      <input type="hidden" name="date" value={date} />
      <label>
        Sleep hours
        <input
          name="sleep_hours"
          type="number"
          min="3"
          max="12"
          step="0.5"
          defaultValue="7"
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            marginTop: "0.5rem"
          }}
        />
      </label>
      <label>
        Wake time
        <input
          name="wake_time"
          type="time"
          defaultValue="06:30"
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            marginTop: "0.5rem"
          }}
        />
      </label>
      <label>
        Energy (1-5)
        <input
          name="energy"
          type="number"
          min="1"
          max="5"
          defaultValue="3"
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            marginTop: "0.5rem"
          }}
        />
      </label>
      <label>
        Mood (1-5)
        <input
          name="mood"
          type="number"
          min="1"
          max="5"
          defaultValue="3"
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            marginTop: "0.5rem"
          }}
        />
      </label>
      <label>
        Notes (optional)
        <textarea
          name="notes"
          rows={3}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            marginTop: "0.5rem"
          }}
        />
      </label>
      <SubmitButton />
      {state?.message && <p style={{ color: "#065f46", fontWeight: 500 }}>{state.message}</p>}
    </form>
  );
}
