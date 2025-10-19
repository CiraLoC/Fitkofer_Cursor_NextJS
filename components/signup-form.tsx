"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestOtp } from "@/lib/auth/actions";

const INITIAL_STATE = { message: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button" type="submit" disabled={pending}>
      {pending ? "Sending..." : "Send magic link"}
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useFormState(requestOtp, INITIAL_STATE);

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}
    >
      <label htmlFor="email" style={{ fontWeight: 600 }}>
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        placeholder="you@example.com"
        required
        style={{
          padding: "0.75rem 1rem",
          borderRadius: "12px",
          border: "1px solid #d1d5db",
          fontSize: "1rem"
        }}
      />
      <SubmitButton />
      {state.message && <p style={{ color: "#4c1d95" }}>{state.message}</p>}
    </form>
  );
}
