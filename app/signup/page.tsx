import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { createServerClient } from "@/lib/supabase/server-client";

export const metadata = {
  title: "Sign up - LumaWell"
};

export default async function SignupPage() {
  const supabase = createServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/today");
  }

  return (
    <section className="card" style={{ maxWidth: 480 }}>
      <h1>Join the beta</h1>
      <p>
        Enter your email and we&apos;ll send a secure magic link. After confirming, onboarding will
        unlock your personalized plan.
      </p>
      <SignupForm />
    </section>
  );
}
