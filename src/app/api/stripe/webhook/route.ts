import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getConfig() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseKey) {
    throw new Error("Configuration Stripe ou Supabase incomplète.");
  }

  return {
    stripe: new Stripe(stripeKey),
    webhookSecret,
    supabase: createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
  };
}

export async function POST(request: NextRequest) {
  try {
    const { stripe, webhookSecret, supabase } = getConfig();

    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Signature Stripe absente." },
        { status: 400 }
      );
    }

    const body = await request.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch {
      return NextResponse.json(
        { error: "Signature Stripe invalide." },
        { status: 400 }
      );
    }

    if (
      event.type !== "checkout.session.completed" &&
      event.type !== "customer.subscription.updated" &&
      event.type !== "customer.subscription.deleted"
    ) {
      return NextResponse.json({ received: true });
    }

    let subscription: Stripe.Subscription;
    let userId: string | undefined;
    let planCode: string | undefined;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode !== "subscription" || !session.subscription) {
        return NextResponse.json({ received: true });
      }

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

      subscription = await stripe.subscriptions.retrieve(subscriptionId);

      userId =
        session.metadata?.user_id ||
        session.client_reference_id ||
        subscription.metadata.user_id;

      planCode =
        session.metadata?.plan ||
        subscription.metadata.plan;
    } else {
      subscription = event.data.object as Stripe.Subscription;

      userId = subscription.metadata.user_id;
      planCode = subscription.metadata.plan;
    }

    if (!userId || !planCode) {
      console.error("Webhook : utilisateur ou formule introuvable.");

      return NextResponse.json(
        { error: "Informations d'abonnement manquantes." },
        { status: 400 }
      );
    }

    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("code", planCode)
      .eq("active", true)
      .single();

    if (planError || !plan) {
      console.error("Webhook : formule introuvable.", planError);

      return NextResponse.json(
        { error: "Formule introuvable." },
        { status: 500 }
      );
    }

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const item = subscription.items.data[0];

    const periodStart = item?.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null;

    const periodEnd = item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null;

    const canceledAt = subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null;

    const payload = {
      user_id: userId,
      plan_id: plan.id,
      status: subscription.status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: canceledAt,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: lookupError } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (existing) {
      const { error } = await supabase
        .from("user_subscriptions")
        .update(payload)
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("user_subscriptions")
        .insert(payload);

      if (error) throw error;
    }

    console.log(
      "DAKAA STRIPE WEBHOOK:",
      event.type,
      subscription.id,
      subscription.status
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("DAKAA WEBHOOK ERROR:", error);

    return NextResponse.json(
      { error: "Erreur de synchronisation de l'abonnement." },
      { status: 500 }
    );
  }
}