import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server-client";
import { createCheckoutSession, openCustomerPortal } from "@/app/account/actions";

export default async function AccountPage() {
  const supabase = createServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/signup");
  }

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("name, goal, tz").maybeSingle(),
    supabase.from("subscriptions").select("*").maybeSingle()
  ]);

  return (
    <div className="grid" style={{ gap: "1.5rem", maxWidth: 720 }}>
      <div className="card">
        <h1>Account</h1>
        <p>Manage your subscription, personal data, and notification preferences.</p>
      </div>

      <section className="card">
        <h2>Profile</h2>
        <p>
          <strong>Name:</strong> {profile?.name ?? "Not set"}
        </p>
        <p>
          <strong>Goal:</strong> {profile?.goal ?? "Not set"}
        </p>
        <p>
          <strong>Time zone:</strong> {profile?.tz ?? "UTC"}
        </p>
      </section>

      <section className="card">
        <h2>Subscription</h2>
        {subscription ? (
          <>
            <p>
              Status: <strong>{subscription.status}</strong>
            </p>
            <p>Plan: {subscription.plan ?? "monthly"}</p>
            {subscription.renews_at && <p>Renews at: {new Date(subscription.renews_at).toLocaleString()}</p>}
            <form action={openCustomerPortal}>
              <button className="button secondary" type="submit">
                Manage in Stripe
              </button>
            </form>
          </>
        ) : (
          <>
            <p>No active subscription. Unlock premium plans and nudges.</p>
            <form action={createCheckoutSession}>
              <button className="button" type="submit">
                Upgrade to premium
              </button>
            </form>
          </>
        )}
      </section>

      <section className="card">
        <h2>Data privacy</h2>
        <p>
          Need to delete your account or export data? Email support@lumawell.co or run the delete
          account action (coming soon).
        </p>
      </section>
    </div>
  );
}
