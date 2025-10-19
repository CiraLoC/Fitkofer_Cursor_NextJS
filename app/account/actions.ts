"use server";

import { redirect } from "next/navigation";

export async function createCheckoutSession() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  redirect(`${siteUrl}/api/stripe/checkout`);
}

export async function openCustomerPortal() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  redirect(`${siteUrl}/api/stripe/portal`);
}
