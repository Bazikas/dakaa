"use client";
import { createClient } from "@supabase/supabase-js";

import Link from "next/link";
import { useEffect, useState } from "react";

type Plan = {
  code: "standard" | "premium";
  name: string;
  price: string;
  duration: string;
  description: string;
  features: string[];
  recommended: boolean;
};

const plans: Plan[] = [
  {
    code: "standard",
    name: "DAKAA STANDARD",
    price: "14.90",
    duration: "شهرياً",
    description: "ابدأ رحلتك في تعلم الذكاء الاصطناعي.",
    recommended: false,
    features: [
      "الوصول إلى جميع الوحدات التعليمية",
      "89 درساً تعليمياً",
      "اختبارات وتقييمات تفاعلية",
      "لوحة متابعة التقدم",
      "أستاذ ذكاء اصطناعي بمعدل استخدام محدد",
      "تجديد الاشتراك تلقائياً كل شهر",
    ],
  },
  {
    code: "premium",
    name: "DAKAA PREMIUM",
    price: "39.90",
    duration: "كل 4 أشهر",
    description: "تعلم بذكاء أكبر واستفد من أفضل قيمة.",
    recommended: true,
    features: [
      "جميع مزايا الاشتراك Standard",
      "الوصول إلى 14 وحدة تعليمية",
      "89 درساً تعليمياً",
      "اختبارات وتمارين ذكية",
      "أستاذ ذكاء اصطناعي بحصة استخدام أكبر",
      "متابعة شخصية لمسارك التعليمي",
      "تجديد الاشتراك تلقائياً كل 4 أشهر",
    ],
  },
];

export default function PricingPage() {
  const [message, setMessage] = useState("");

  // DAKAA_EXISTING_SUBSCRIBER_V1
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSubscription() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

        if (!url || !key) {
          throw new Error("Configuration Supabase manquante.");
        }

        const supabase = createClient(url, key);

        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!data.session?.access_token) {
          if (!cancelled) {
            setAlreadySubscribed(false);
          }
          return;
        }

        const response = await fetch("/api/subscription/access", {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
          cache: "no-store",
        });

        if (response.status === 200) {
          if (!cancelled) setAlreadySubscribed(true);
        } else if (
          response.status === 403 ||
          response.status === 401
        ) {
          if (!cancelled) setAlreadySubscribed(false);
        } else {
          throw new Error("Verification de l'abonnement indisponible.");
        }
      } catch {
        if (!cancelled) {
          setMessage("تعذر التحقق من الاشتراك. يرجى المحاولة لاحقاً.");
        }
      } finally {
        if (!cancelled) setSubscriptionLoading(false);
      }
    }

    void checkSubscription();

    return () => {
      cancelled = true;
    };
  }, []);

  // DAKAA_STRIPE_RETURN_POLL_V2
  const [checkoutStatus, setCheckoutStatus] = useState<"waiting" | "confirmed" | "timeout" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    queueMicrotask(() => {
      if (!stopped) {
        setCheckoutStatus("waiting");
        setSubscriptionLoading(true);
      }
    });

    async function pollAccess() {
      if (stopped) return;
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        if (!url || !key) throw new Error("Missing Supabase configuration");
        const client = createClient(url, key);
        const { data } = await client.auth.getSession();
        if (!data.session?.access_token) {
          setCheckoutStatus("timeout");
          setSubscriptionLoading(false);
          return;
        }
        const response = await fetch("/api/subscription/access", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: "no-store",
        });
        if (stopped) return;
        if (response.ok) {
          setAlreadySubscribed(true);
          setCheckoutStatus("confirmed");
          window.location.replace("/dashboard");
          return;
        }
        if (response.status !== 403 && response.status !== 401) {
          throw new Error("Subscription verification unavailable");
        }
      } catch {
        // Retry transient failures without creating another checkout.
      }
      attempts += 1;
      if (attempts >= 20) {
        setCheckoutStatus("timeout");
        setSubscriptionLoading(false);
        return;
      }
      timer = setTimeout(() => { void pollAccess(); }, 3000);
    }

    void pollAccess();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, []);
async function handleSubscribe(plan: Plan) {
  setMessage("");

  if (subscriptionLoading) {
    setMessage("يرجى انتظار التحقق من اشتراكك.");
    return;
  }

  if (alreadySubscribed) {
    setMessage("لديك اشتراك نشط بالفعل. يمكنك الدخول إلى دوراتك.");
    return;
  }

  try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Configuration Supabase manquante.");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        throw new Error("Veuillez vous connecter avant de vous abonner.");
      }

      const accessToken = sessionData.session.access_token;
const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
          Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: plan.code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Impossible de démarrer le paiement."
      );
    }

    if (!data.url || typeof data.url !== "string") {
      throw new Error("Lien de paiement Stripe introuvable.");
    }

    window.location.assign(data.url);
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Une erreur est survenue."
    );
  }
}

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#06142d] via-[#0b1430] to-[#171039] text-white"
    >
      {/* HEADER */}

      <header className="border-b border-slate-700/60 bg-[#07142c]/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-black">
              D
            </div>

            <div>
              <h1 className="text-xl font-black">
                DAKAA
              </h1>

              <p className="text-xs text-purple-300">
                منصة ذكاء للتعلم الذكي
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            العودة للرئيسية
          </Link>
        </div>
      </header>

      {/* HERO */}

      <section className="mx-auto max-w-5xl px-5 pb-10 pt-16 text-center">
        <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm font-semibold text-purple-200">
          🚀 استثمر في مستقبلك
        </span>

        <h2 className="mt-8 text-3xl font-black leading-relaxed md:text-5xl">
          اختر اشتراكك في
          <span className="text-purple-400">
            {" "}DAKAA
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-9 text-slate-300">
          تعلم الذكاء الاصطناعي باللغة العربية،
          وطوّر مهاراتك من خلال الدروس التفاعلية
          والتمارين الذكية وأستاذك الشخصي.
        </p>
      </section>

      {/* DAKAA : abonnement existant */}
      {alreadySubscribed && (
        <section className="mx-auto mb-8 max-w-4xl px-5">
          <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center">
            <h3 className="text-2xl font-bold text-emerald-300">
              اشتراكك في DAKAA نشط
            </h3>

            <p className="mt-4 text-slate-200">
              لديك اشتراك فعال. لا تحتاج إلى الدفع مرة أخرى.
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-xl bg-emerald-600 px-8 py-4 font-bold text-white"
            >
              الدخول إلى لوحة التعلم
            </Link>
          </div>
        </section>
      )}

      {checkoutStatus === "waiting" && (
        <section role="status" className="mx-auto mb-8 max-w-4xl rounded-2xl border border-blue-400/40 bg-blue-500/10 px-6 py-5 text-center text-blue-100">
          Payment received by Stripe. Waiting for subscription confirmation. Do not pay again.
        </section>
      )}
      {checkoutStatus === "timeout" && (
        <section role="status" className="mx-auto mb-8 max-w-4xl rounded-2xl border border-amber-400/40 bg-amber-500/10 px-6 py-5 text-center text-amber-100">
          Subscription confirmation is taking longer than expected. Please refresh this page later. Do not pay again.
        </section>
      )}
      {/* PLANS */}

      <section className="mx-auto grid max-w-5xl gap-8 px-5 pb-16 md:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.code}
            className={`relative flex flex-col rounded-3xl border p-8 shadow-2xl ${
              plan.recommended
                ? "border-purple-500 bg-purple-500/10"
                : "border-slate-700 bg-slate-900/60"
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-4 right-6 rounded-full bg-gradient-to-l from-purple-600 to-blue-500 px-5 py-2 text-sm font-black">
                ⭐ أفضل قيمة
              </div>
            )}

            <h3 className="mt-4 text-2xl font-black">
              {plan.name}
            </h3>

            <p className="mt-4 min-h-14 leading-8 text-slate-300">
              {plan.description}
            </p>

            <div className="my-8 border-b border-slate-700 pb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black">
                  {plan.price}
                </span>

                <span className="text-2xl text-purple-300">
                  €
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-400">
                {plan.duration}
              </p>
            </div>

            <ul className="mb-10 flex-1 space-y-5">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm leading-7 text-slate-200"
                >
                  <span className="text-emerald-400">
                    ✓
                  </span>

                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => handleSubscribe(plan)}
              disabled={subscriptionLoading || alreadySubscribed}
              className={`w-full rounded-xl px-5 py-4 text-base font-black transition hover:brightness-110 ${
                plan.recommended
                  ? "bg-gradient-to-l from-purple-600 to-blue-500"
                  : "bg-blue-600"
              }`}
            >
              {subscriptionLoading
                ? "جارٍ التحقق..."
                : alreadySubscribed
                  ? "لديك اشتراك نشط"
                  : "اشترك الآن"}
            </button>
          </article>
        ))}
      </section>

      {/* MESSAGE */}

      {message && (
        <section
          role="status"
          className="mx-auto mb-12 max-w-3xl rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center text-amber-200"
        >
          {message}
        </section>
      )}

      {/* INFORMATION */}

      <section className="mx-auto max-w-4xl px-5 pb-20 text-center">
        <div className="rounded-3xl border border-slate-700 bg-slate-900/50 p-8">
          <h3 className="text-xl font-black">
            🔒 اشتراك آمن وواضح
          </h3>

          <p className="mt-5 leading-9 text-slate-300">
            يتم تجديد الاشتراكات تلقائياً حسب
            المدة المحددة لكل باقة.
            سيتم توفير تفاصيل الدفع وإدارة
            الاشتراك قبل تفعيل الخدمة التجارية.
          </p>

          <p className="mt-4 text-sm text-slate-400">
            الأسعار معروضة باليورو.
            قد تختلف الضرائب حسب بلد العميل.
          </p>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-slate-700 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} DAKAA.
        جميع الحقوق محفوظة.
      </footer>
    </main>
  );
}