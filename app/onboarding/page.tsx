import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server-client";
import { OnboardingForm } from "@/components/onboarding-form";

export const metadata = {
  title: "Onboarding - LumaWell"
};

export default async function OnboardingPage() {
  const supabase = createServerClient();
  const [{ data: profile }, { data: sessionData }] = await Promise.all([
    supabase.from("profiles").select("*").maybeSingle(),
    supabase.auth.getSession()
  ]);

  if (!sessionData.session) {
    redirect("/signup");
  }

  if (profile) {
    redirect("/today");
  }

  return (
    <section className="grid" style={{ gap: "1.5rem", maxWidth: 720 }}>
      <h1>Let&apos;s calibrate your plan</h1>
      <p>
        Answer a few focused questions so we can dial in your starting program, preferred windows,
        and safe intensity levels.
      </p>
      <OnboardingForm />
    </section>
  );
}
