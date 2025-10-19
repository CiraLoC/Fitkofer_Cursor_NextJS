import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message:
        "Stripe portal integration placeholder. Configure STRIPE_SECRET_KEY and implement access to the customer portal."
    },
    { status: 501 }
  );
}
