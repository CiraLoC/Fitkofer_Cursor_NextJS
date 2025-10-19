import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message:
        "Stripe checkout integration placeholder. Configure STRIPE_SECRET_KEY and implement checkout session creation."
    },
    { status: 501 }
  );
}
