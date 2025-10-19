"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server-client";

export async function signOut() {
  const supabase = createServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

const emailSchema = z.object({
  email: z.string().email()
});

export async function requestOtp(_: { message: string | null }, formData: FormData) {
  const supabase = createServerClient();
  const parse = emailSchema.safeParse({
    email: formData.get("email")
  });

  if (!parse.success) {
    return { message: "Enter a valid email to continue." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parse.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  });

  if (error) {
    console.error(error);
    return { message: "Could not send code. Try again." };
  }

  return { message: "Check your inbox for the magic link." };
}
