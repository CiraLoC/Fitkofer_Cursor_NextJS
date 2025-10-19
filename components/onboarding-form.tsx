"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useMemo, useState } from "react";
import { completeOnboarding } from "@/app/onboarding/actions";

const INITIAL_STATE = { error: null as string | null };

const timezones = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London"
];

const steps = [
  { id: 0, label: "Basics" },
  { id: 1, label: "Constraints" },
  { id: 2, label: "Energy" },
  { id: 3, label: "Sleep" }
];

function Stepper({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      {steps.map((item, index) => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: index <= step ? "#7c3aed" : "#ede9fe",
              color: index <= step ? "#ffffff" : "#4c1d95",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600
            }}
          >
            {index + 1}
          </span>
          <span style={{ fontWeight: 600 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function SubmitButton({ step, maxStep }: { step: number; maxStep: number }) {
  const { pending } = useFormStatus();
  const label = step === maxStep ? "Finish and build plan" : "Continue";
  return (
    <button className="button" type="submit" disabled={pending}>
      {pending ? "Building..." : label}
    </button>
  );
}

export function OnboardingForm() {
  const [state, formAction] = useFormState(completeOnboarding, INITIAL_STATE);
  const [step, setStep] = useState(0);
  const maxStep = steps.length - 1;

  const advance = () => {
    setStep((current) => Math.min(current + 1, maxStep));
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const energyMarks = useMemo(
    () => (
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
        {[1, 2, 3, 4, 5].map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>
    ),
    []
  );

  return (
    <form
      action={(formData) => {
        if (step < maxStep) {
          advance();
        } else {
          formAction(formData);
        }
      }}
      className="grid"
      style={{ gap: "2rem" }}
    >
      <Stepper step={step} />

      <div className="card" style={{ display: step === 0 ? "block" : "none" }}>
        <h2>Tell us about you</h2>
        <label>
          Name
          <input
            name="name"
            required
            placeholder="Sam"
            style={{
              display: "block",
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              marginTop: "0.5rem"
            }}
          />
        </label>
        <label style={{ display: "block", marginTop: "1rem" }}>
          Where do you live?
          <select
            name="tz"
            required
            style={{
              display: "block",
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              marginTop: "0.5rem"
            }}
          >
            {timezones.map((tz) => (
              <option key={tz}>{tz}</option>
            ))}
          </select>
        </label>
        <label style={{ display: "block", marginTop: "1rem" }}>
          Goal
          <select
            name="goal"
            required
            defaultValue="fat_loss"
            style={{
              display: "block",
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              marginTop: "0.5rem"
            }}
          >
            <option value="fat_loss">Fat loss</option>
            <option value="recomp">Recomp</option>
            <option value="glute">Glute focus</option>
          </select>
        </label>
      </div>

      <div className="card" style={{ display: step === 1 ? "block" : "none" }}>
        <h2>Constraints</h2>
        <fieldset style={{ border: "none", padding: 0 }}>
          <legend style={{ fontWeight: 600 }}>Equipment</legend>
          {["bands", "dumbbells", "gym"].map((item) => (
            <label key={item} style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <input type="checkbox" name="equipment" value={item} />
              <span>{item}</span>
            </label>
          ))}
        </fieldset>
        <fieldset style={{ border: "none", padding: 0, marginTop: "1.5rem" }}>
          <legend style={{ fontWeight: 600 }}>Condition toggles</legend>
          {[
            { id: "postpartum", label: "Postpartum" },
            { id: "ir", label: "Insulin resistance" },
            { id: "hashimoto", label: "Hashimoto's" },
            { id: "pcos", label: "PCOS" }
          ].map((condition) => (
            <label
              key={condition.id}
              style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem" }}
            >
              <input type="checkbox" name={condition.id} />
              <span>{condition.label}</span>
            </label>
          ))}
        </fieldset>
        <label style={{ display: "block", marginTop: "1.5rem" }}>
          Cycle phase (optional)
          <select
            name="cycle_phase"
            defaultValue=""
            style={{
              display: "block",
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              marginTop: "0.5rem"
            }}
          >
            <option value="">Not tracking</option>
            <option value="follicular">Follicular</option>
            <option value="ovulatory">Ovulatory</option>
            <option value="luteal">Luteal</option>
            <option value="menstrual">Menstrual</option>
          </select>
        </label>
      </div>

      <div className="card" style={{ display: step === 2 ? "block" : "none" }}>
        <h2>Energy windows</h2>
        <p>Where do you usually feel most capable today?</p>
        {[
          { id: "morning_energy", label: "Morning" },
          { id: "afternoon_energy", label: "Afternoon" },
          { id: "evening_energy", label: "Evening" }
        ].map((slot) => (
          <div key={slot.id} style={{ marginTop: "1.5rem" }}>
            <label style={{ fontWeight: 600 }}>{slot.label}</label>
            <input
              type="range"
              min="1"
              max="5"
              name={slot.id}
              defaultValue={slot.id === "evening_energy" ? 2 : 4}
              style={{ width: "100%", marginTop: "0.75rem" }}
            />
            {energyMarks}
          </div>
        ))}
      </div>

      <div className="card" style={{ display: step === 3 ? "block" : "none" }}>
        <h2>Sleep anchors</h2>
        <label style={{ display: "block", marginTop: "1rem" }}>
          Average sleep hours
          <input
            type="number"
            name="sleep_hours"
            min="4"
            max="10"
            step="0.5"
            defaultValue="7"
            style={{
              display: "block",
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              marginTop: "0.5rem"
            }}
          />
        </label>
        <label style={{ display: "block", marginTop: "1rem" }}>
          Typical wake time
          <input
            type="time"
            name="wake_time"
            defaultValue="06:30"
            style={{
              display: "block",
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              marginTop: "0.5rem"
            }}
          />
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {step > 0 ? (
          <button
            type="button"
            className="button secondary"
            onClick={goBack}
            style={{ display: step > 0 ? "inline-flex" : "none" }}
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <SubmitButton step={step} maxStep={maxStep} />
      </div>

      {state.error && <p style={{ color: "#b91c1c" }}>{state.error}</p>}
    </form>
  );
}
