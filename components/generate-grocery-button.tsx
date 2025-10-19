"use client";

import { useTransition } from "react";
import { generateGroceryList } from "@/app/meals/actions";

export function GenerateGroceryButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="button"
      type="button"
      onClick={() => startTransition(() => generateGroceryList())}
      disabled={pending}
    >
      {pending ? "Compiling..." : "Refresh grocery list"}
    </button>
  );
}
