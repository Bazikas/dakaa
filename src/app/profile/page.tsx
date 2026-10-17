"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Plan = {
  id: string;
  name: string;
  code: string;
  
};

type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_end: string | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        if (cancelled) return;

        setEmail(user.email || "");

        const { data: subscriptions, error: subError } =
          await supabase
            .from("user_subscriptions")
            .select(
              "id,user_id,plan_id,status,current_period_end"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

        if (subError) {
          throw new Error(
            "Erreur Supabase : " + subError.message
          );
        }

        const activeSubscription =
          (subscriptions || []).find(
            (item) =>
              item.status === "active" &&
              (!item.current_period_end ||
                new Date(item.current_period_end).getTime() >
                  Date.now())
          ) || null;

        if (!cancelled) {
          setSubscription(activeSubscription);
        }

        if (activeSubscription) {
          const { data: planData, error: planError } =
            await supabase
              .from("subscription_plans")
              .select(
                "id,name,code"
              )
              .eq("id", activeSubscription.plan_id)
              .maybeSingle();

          if (planError) {
            throw new Error(
              "Erreur formule : " + planError.message
            );
          }

          if (!cancelled) {
            setPlan(planData);
          }
        }
      } catch (error) {
        console.error("DAKAA Profile Error:", error);

        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Erreur inconnue"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#07142e] p-10 text-white"
      >
        جارٍ تحميل الملف الشخصي...
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#07142e] px-6 py-12 text-white"
    >
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 flex items-center justify-between">
          <h1 className="text-3xl font-bold">DAKAA</h1>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/20 px-5 py-3"
          >
            العودة إلى لوحة التحكم
          </Link>
        </header>

        <section className="rounded-3xl border border-purple-500/30 bg-[#101f42] p-8">
          <div className="mb-6 text-5xl">👤</div>

          <h2 className="mb-8 text-3xl font-bold">
            الملف الشخصي
          </h2>

          <div className="space-y-6">
            <div className="rounded-xl bg-white/5 p-5">
              <p className="mb-2 text-slate-300">
                البريد الإلكتروني
              </p>

              <p className="font-semibold" dir="ltr">
                {email}
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5">
                <p className="font-semibold text-red-300">
                  تعذر تحميل بيانات الاشتراك
                </p>

                <p
                  className="mt-2 text-sm text-red-200"
                  dir="ltr"
                >
                  {errorMessage}
                </p>
              </div>
            )}

            <div className="rounded-xl bg-white/5 p-5">
              <p className="mb-2 text-slate-300">
                الاشتراك الحالي
              </p>

              <p className="text-xl font-bold">
                {plan?.name ||
                  (subscription
                    ? "تعذر تحميل اسم الخطة"
                    : "لا يوجد اشتراك نشط")}
              </p>
            </div>

            {subscription && (
              <>
                <div className="rounded-xl bg-white/5 p-5">
                  <p className="mb-2 text-slate-300">
                    حالة الاشتراك
                  </p>

                  <p className="font-semibold text-green-400">
                    نشط
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-5">
                  <p className="mb-2 text-slate-300">
                    الحد الشهري لطلبات الذكاء الاصطناعي
                  </p>

                  <p className="text-2xl font-bold">
                    {plan?.code === "standard" ? 200 : plan?.code === "premium" ? 300 : "—"}
                  </p>
                </div>

                {subscription.current_period_end && (
                  <div className="rounded-xl bg-white/5 p-5">
                    <p className="mb-2 text-slate-300">
                      نهاية فترة الاشتراك
                    </p>

                    <p>
                      {new Date(
                        subscription.current_period_end
                      ).toLocaleDateString("ar")}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/pricing"
              className="rounded-xl bg-gradient-to-l from-blue-600 to-purple-600 px-6 py-3 font-semibold"
            >
              إدارة الاشتراك
            </Link>

            <Link
              href="/courses"
              className="rounded-xl border border-white/20 px-6 py-3"
            >
              متابعة التعلم
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}