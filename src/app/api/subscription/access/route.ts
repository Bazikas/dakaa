import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noCache = {
  "Cache-Control": "no-store",
};

function response(allowed: boolean, status: number) {
  return NextResponse.json(
    { allowed },
    {
      status,
      headers: noCache,
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authentification obligatoire

    const tokenHeader =
      request.headers.get("authorization") || "";

    if (!tokenHeader.startsWith("Bearer ")) {
      return response(false, 401);
    }

    // 2. Configuration Supabase

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const publicKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !publicKey || !serviceKey) {
      return response(false, 503);
    }

    // 3. Vérification de la session

    const token = tokenHeader.slice(7).trim();

    const auth = createClient(url, publicKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await auth.auth.getUser(token);

    if (authError || !user) {
      return response(false, 401);
    }

    // 4. Accès administrateur

    const isAdmin =
      !!process.env.DAKAA_ADMIN_USER_ID &&
      user.id === process.env.DAKAA_ADMIN_USER_ID;

    if (isAdmin) {
      return response(true, 200);
    }

    // 5. Vérification de l'abonnement Supabase

    const admin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const now = new Date().toISOString();

    const { data: subscriptions, error } = await admin
      .from("user_subscriptions")
      .select(
        "id, stripe_subscription_id, current_period_start, current_period_end, subscription_plans!inner(active)"
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .lte("current_period_start", now)
      .gt("current_period_end", now)
      .eq("subscription_plans.active", true);

    if (error) {
      console.error(
        "DAKAA subscription access check:",
        error
      );

      return response(false, 503);
    }

    if (!subscriptions?.length) {
      return response(false, 403);
    }

    // 6. Vérification de la configuration Stripe LIVE

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (
      !stripeKey ||
      (process.env.NODE_ENV === "production" &&
        !stripeKey.startsWith("rk_live_") &&
        !stripeKey.startsWith("sk_live_"))
    ) {
      console.error(
        "DAKAA ACCESS: Stripe LIVE non configuré."
      );

      return response(false, 503);
    }

    const stripe = new Stripe(stripeKey);

    // 7. Vérification réelle auprès de Stripe

    let stripeVerificationFailed = false;

    for (const subscription of subscriptions) {
      if (!subscription.stripe_subscription_id) {
        continue;
      }

      try {
        const stripeSubscription =
          await stripe.subscriptions.retrieve(
            subscription.stripe_subscription_id
          );

        const isLive =
          stripeSubscription.livemode === true;

        const isActive =
          stripeSubscription.status === "active";

        const belongsToUser =
          stripeSubscription.metadata.user_id === user.id;

        if (isLive && isActive && belongsToUser) {
          return response(true, 200);
        }
      } catch (error) {
        if (
          error instanceof Stripe.errors.StripeInvalidRequestError &&
          error.code === "resource_missing"
        ) {
          // Ancien abonnement Stripe TEST.
          continue;
        }

        console.error(
          "DAKAA ACCESS STRIPE ERROR:",
          error
        );

        stripeVerificationFailed = true;
      }
    }

    // 8. Refuser les abonnements TEST ou invalides

    if (stripeVerificationFailed) {
      return response(false, 503);
    }

    return response(false, 403);
  } catch (error) {
    console.error("DAKAA ACCESS ERROR:", error);

    return response(false, 503);
  }
}