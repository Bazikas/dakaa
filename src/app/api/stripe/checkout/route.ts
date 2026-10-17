import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";

type Plan = "standard" | "premium";

export async function POST(request: NextRequest) {
  try {
    // =====================================================
    // DAKAA V8 - STRIPE CHECKOUT
    // =====================================================

    // 1. Variables d'environnement

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const standardPrice =
      process.env.STRIPE_PRICE_STANDARD;

    const premiumPrice =
      process.env.STRIPE_PRICE_PREMIUM;

    // 2. Vérification de la configuration

    if (
      !stripeKey ||
      !supabaseUrl ||
      !supabaseKey ||
      !standardPrice ||
      !premiumPrice
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuration Stripe ou Supabase incomplète.",
        },
        { status: 500 }
      );
    }

    // 3. Authentification Supabase

    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentification obligatoire.",
        },
        { status: 401 }
      );
    }

    const token = authorization.slice(7).trim();

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Session invalide ou expirée.",
        },
        { status: 401 }
      );
    }

    // 4. Récupération de l'offre choisie

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Données de la requête invalides.",
        },
        { status: 400 }
      );
    }

    const plan =
      typeof body === "object" &&
      body !== null &&
      "plan" in body
        ? (body as { plan?: unknown }).plan
        : undefined;

    if (plan !== "standard" && plan !== "premium") {
      return NextResponse.json(
        {
          success: false,
          error: "Offre invalide.",
        },
        { status: 400 }
      );
    }

    // DAKAA_DUPLICATE_SUBSCRIPTION_GUARD
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuration du serveur incomplete.",
        },
        { status: 503 }
      );
    }

    const admin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: activeSubscriptions, error: subscriptionError } =
      await admin
        .from("user_subscriptions")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due"])
        .limit(1);

    if (subscriptionError) {
      console.error(
        "DAKAA subscription verification:",
        subscriptionError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Impossible de verifier votre abonnement.",
        },
        { status: 503 }
      );
    }

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Vous possedez deja un abonnement. Consultez votre profil.",
        },
        { status: 409 }
      );
    }
    // 5. Sélection du tarif Stripe

    const selectedPlan: Plan = plan;

    const priceId =
      selectedPlan === "standard"
        ? standardPrice
        : premiumPrice;

    // 6. Initialisation Stripe

    const stripe = new Stripe(stripeKey);

    // 7. Adresse de retour

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const baseUrl = appUrl.replace(/\/$/, "");

    // 8. Création de la session Checkout

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      client_reference_id: user.id,

      ...(user.email
        ? { customer_email: user.email }
        : {}),

      metadata: {
        user_id: user.id,
        plan: selectedPlan,
      },

      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: selectedPlan,
        },
      },

      success_url:
        `${baseUrl}/pricing?checkout=success`,

      cancel_url:
        `${baseUrl}/pricing?checkout=cancel`,
    });

    // 9. Vérification de la session

    if (!session.url) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de créer la session Stripe.",
        },
        { status: 500 }
      );
    }

    // 10. Réponse au navigateur

    return NextResponse.json(
      {
        success: true,
        url: session.url,
        sessionId: session.id,
        plan: selectedPlan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "DAKAA V8 - STRIPE CHECKOUT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création du paiement.",
      },
      { status: 500 }
    );
  }
}
