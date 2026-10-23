import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Plan = "standard" | "premium";

type ExistingSubscription = {
  stripe_subscription_id: string | null;
};

const noCache = {
  "Cache-Control": "no-store",
};

function fail(error: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status,
      headers: noCache,
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // =====================================================
    // DAKAA V10 — STRIPE CHECKOUT LIVE
    // CORRECTION DES ANCIENS ABONNEMENTS TEST
    // =====================================================

    // 1. Variables d'environnement

    const stripeKey =
      process.env.STRIPE_SECRET_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const standardPrice =
      process.env.STRIPE_PRICE_STANDARD;

    const premiumPrice =
      process.env.STRIPE_PRICE_PREMIUM;

    // 2. Configuration obligatoire

    if (
      !stripeKey ||
      !supabaseUrl ||
      !supabaseKey ||
      !serviceRoleKey ||
      !standardPrice ||
      !premiumPrice
    ) {
      return fail(
        "Configuration Stripe ou Supabase incomplète.",
        503
      );
    }

    // 3. Stripe LIVE obligatoire en production

    if (
      process.env.NODE_ENV === "production" &&
      !stripeKey.startsWith("rk_live_") &&
      !stripeKey.startsWith("sk_live_")
    ) {
      console.error(
        "DAKAA CHECKOUT: Stripe LIVE non configuré."
      );

      return fail(
        "Stripe LIVE obligatoire en production.",
        503
      );
    }

    // 4. Authentification Supabase

    const authorization =
      request.headers.get("authorization") || "";

    if (!authorization.startsWith("Bearer ")) {
      return fail(
        "Authentification obligatoire.",
        401
      );
    }

    const token =
      authorization.slice(7).trim();

    if (!token) {
      return fail(
        "Authentification obligatoire.",
        401
      );
    }

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
      return fail(
        "Session invalide ou expirée.",
        401
      );
    }

    // 5. Validation de l'offre

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return fail(
        "Données de la requête invalides.",
        400
      );
    }

    const plan =
      typeof body === "object" &&
      body !== null &&
      !Array.isArray(body) &&
      "plan" in body
        ? (body as { plan?: unknown }).plan
        : undefined;

    if (
      plan !== "standard" &&
      plan !== "premium"
    ) {
      return fail(
        "Offre invalide.",
        400
      );
    }

    const selectedPlan: Plan = plan;

    // 6. Initialisation Stripe

    const stripe = new Stripe(stripeKey);

    // 7. Client Supabase administrateur

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

    // =====================================================
    // 8. RÉCUPÉRATION DES ABONNEMENTS EXISTANTS
    // =====================================================

    const {
      data: existingData,
      error: subscriptionError,
    } = await admin
      .from("user_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .in("status", [
        "active",
        "trialing",
        "past_due",
      ]);

    if (subscriptionError) {
      console.error(
        "DAKAA CHECKOUT: Supabase subscription error:",
        subscriptionError
      );

      return fail(
        "Impossible de vérifier votre abonnement.",
        503
      );
    }

    const existingSubscriptions =
      (existingData ?? []) as unknown as
        ExistingSubscription[];

    // =====================================================
    // 9. VÉRIFICATION RÉELLE AUPRÈS DE STRIPE
    // =====================================================

    for (const subscription of existingSubscriptions) {
      const subscriptionId =
        subscription.stripe_subscription_id;

      if (!subscriptionId) {
        // Ancienne ligne sans identifiant Stripe.
        // Elle ne prouve pas l'existence d'un abonnement LIVE.
        continue;
      }

      try {
        const stripeSubscription =
          await stripe.subscriptions.retrieve(
            subscriptionId
          );

        const isLive =
          stripeSubscription.livemode === true;

        const belongsToUser =
          stripeSubscription.metadata.user_id ===
          user.id;

        // Ne pas accepter un abonnement appartenant
        // à un autre utilisateur.
        if (isLive && !belongsToUser) {
          console.error(
            "DAKAA CHECKOUT: Subscription ownership mismatch."
          );

          return fail(
            "Impossible de vérifier votre abonnement.",
            503
          );
        }

        const blockingStatuses = [
          "active",
          "trialing",
          "past_due",
        ];

        const isBlocking =
          blockingStatuses.includes(
            stripeSubscription.status
          );

        if (
          isLive &&
          belongsToUser &&
          isBlocking
        ) {
          return fail(
            "Vous possédez déjà un abonnement Stripe LIVE. Consultez votre profil.",
            409
          );
        }

      } catch (error) {
        if (
          error instanceof
            Stripe.errors.StripeInvalidRequestError &&
          error.code === "resource_missing"
        ) {
          // Abonnement TEST ou inexistant dans Stripe LIVE.
          // Ne pas bloquer le nouveau paiement.
          continue;
        }

        console.error(
          "DAKAA CHECKOUT: Stripe verification error:",
          error
        );

        return fail(
          "La vérification de votre abonnement est temporairement indisponible.",
          503
        );
      }
    }

    // =====================================================
    // 10. SÉLECTION DU TARIF
    // =====================================================

    const priceId =
      selectedPlan === "standard"
        ? standardPrice
        : premiumPrice;

    // =====================================================
    // 11. VÉRIFICATION DU TARIF STRIPE
    // =====================================================

    const stripePrice =
      await stripe.prices.retrieve(priceId);

    if (
      !stripePrice.active ||
      !stripePrice.recurring
    ) {
      return fail(
        "Tarif Stripe invalide ou inactif.",
        503
      );
    }

    if (
      process.env.NODE_ENV === "production" &&
      stripePrice.livemode !== true
    ) {
      console.error(
        "DAKAA CHECKOUT: Tarif Stripe TEST interdit."
      );

      return fail(
        "Tarif Stripe LIVE obligatoire.",
        503
      );
    }

    // =====================================================
    // 12. ADRESSE DE RETOUR
    // =====================================================

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://dakaa-production.up.railway.app";

    const baseUrl =
      appUrl.replace(/\/$/, "");

    // =====================================================
    // 13. CRÉATION DE LA SESSION CHECKOUT
    // =====================================================

    const session =
      await stripe.checkout.sessions.create({
        mode: "subscription",

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        client_reference_id: user.id,

        ...(user.email
          ? {
              customer_email: user.email,
            }
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

    // =====================================================
    // 14. VÉRIFICATION DE LA SESSION
    // =====================================================

    if (!session.url) {
      return fail(
        "Impossible de créer la session Stripe.",
        500
      );
    }

    // =====================================================
    // 15. RÉPONSE AU NAVIGATEUR
    // =====================================================

    return NextResponse.json(
      {
        success: true,
        url: session.url,
        sessionId: session.id,
        plan: selectedPlan,
      },
      {
        status: 200,
        headers: noCache,
      }
    );

  } catch (error) {
    console.error(
      "DAKAA V10 - STRIPE CHECKOUT ERROR:",
      error
    );

    return fail(
      "Erreur lors de la création du paiement.",
      500
    );
  }
}