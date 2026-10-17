"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type OnboardingData = {
  level: string;
  profession: string;
  goal: string;
  dailyTime: string;
};

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [data, setData] = useState<OnboardingData>({
    level: "",
    profession: "",
    goal: "",
    dailyTime: "",
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const totalSteps = 4;

  /* =========================================================
     Vérifier l'utilisateur connecté
  ========================================================= */

  useEffect(() => {
    async function checkUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Erreur utilisateur Supabase :", error);
          router.replace("/login");
          return;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        setUserId(user.id);
      } catch (error) {
        console.error("Erreur pendant la vérification :", error);
        router.replace("/login");
      } finally {
        setCheckingUser(false);
      }
    }

    checkUser();
  }, [router]);

  /* =========================================================
     Choix
  ========================================================= */

  const levels = [
    {
      id: "beginner",
      icon: "🌱",
      title: "مبتدئ تماماً",
      description: "لا أملك معرفة سابقة بالذكاء الاصطناعي",
    },
    {
      id: "basic",
      icon: "💡",
      title: "لدي معرفة بسيطة",
      description: "استخدمت بعض أدوات الذكاء الاصطناعي من قبل",
    },
    {
      id: "intermediate",
      icon: "🧠",
      title: "متوسط",
      description: "أستخدم أدوات الذكاء الاصطناعي وأفهم بعض مفاهيمه",
    },
    {
      id: "advanced",
      icon: "🚀",
      title: "متقدم",
      description: "لدي خبرة جيدة وأريد تطوير مهارات متقدمة",
    },
  ];

  const professions = [
    {
      id: "student",
      icon: "🎓",
      title: "طالب",
    },
    {
      id: "employee",
      icon: "💼",
      title: "موظف",
    },
    {
      id: "entrepreneur",
      icon: "📈",
      title: "رائد أعمال",
    },
    {
      id: "teacher",
      icon: "📚",
      title: "تعليم وتدريب",
    },
    {
      id: "developer",
      icon: "💻",
      title: "برمجة وتقنية",
    },
    {
      id: "marketing",
      icon: "📣",
      title: "تسويق ومبيعات",
    },
    {
      id: "finance",
      icon: "💰",
      title: "مالية وأعمال",
    },
    {
      id: "other",
      icon: "✨",
      title: "مجال آخر",
    },
  ];

  const goals = [
    {
      id: "work",
      icon: "💼",
      title: "استخدام الذكاء الاصطناعي في عملي",
      description: "تعلم كيف أستخدم AI في مهامي المهنية",
    },
    {
      id: "productivity",
      icon: "⚡",
      title: "زيادة إنتاجيتي",
      description: "إنجاز المهام بشكل أسرع وأكثر فعالية",
    },
    {
      id: "tools",
      icon: "🤖",
      title: "إتقان أدوات الذكاء الاصطناعي",
      description: "تعلم استخدام أهم أدوات AI بشكل عملي",
    },
    {
      id: "automation",
      icon: "⚙️",
      title: "أتمتة المهام",
      description: "استخدام AI لتبسيط وأتمتة الأعمال المتكررة",
    },
    {
      id: "prompting",
      icon: "✍️",
      title: "إتقان كتابة الأوامر",
      description: "تعلم Prompt Engineering للحصول على نتائج أفضل",
    },
    {
      id: "project",
      icon: "🚀",
      title: "إنشاء مشروع باستخدام AI",
      description: "تحويل فكرة إلى مشروع حقيقي بمساعدة الذكاء الاصطناعي",
    },
  ];

  const dailyTimes = [
    {
      id: "10",
      icon: "☕",
      title: "10 دقائق",
      description: "تعلم سريع كل يوم",
    },
    {
      id: "20",
      icon: "⏱️",
      title: "20 دقيقة",
      description: "وتيرة متوازنة",
    },
    {
      id: "30",
      icon: "📖",
      title: "30 دقيقة",
      description: "تقدم أسرع",
    },
    {
      id: "60",
      icon: "🔥",
      title: "ساعة أو أكثر",
      description: "أريد التقدم بشكل مكثف",
    },
  ];

  /* =========================================================
     Vérifier si l'étape est remplie
  ========================================================= */

  function canContinue() {
    if (step === 1) return data.level !== "";
    if (step === 2) return data.profession !== "";
    if (step === 3) return data.goal !== "";
    if (step === 4) return data.dailyTime !== "";

    return false;
  }

  /* =========================================================
     Bouton suivant + sauvegarde Supabase
  ========================================================= */

  async function handleNext() {
    if (!canContinue() || saving) {
      return;
    }

    setErrorMessage("");

    if (step < totalSteps) {
      setStep((current) => current + 1);
      return;
    }

    if (!userId) {
      setErrorMessage(
        "تعذر العثور على حسابك. يرجى تسجيل الدخول من جديد."
      );
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            level: data.level,
            profession: data.profession,
            goal: data.goal,
            daily_time: data.dailyTime,
            onboarding_completed: true,
          },
          {
            onConflict: "id",
          }
        );

      if (error) {
        console.error("DAKAA onboarding error:", error);

        setErrorMessage(
          `Supabase: ${error.message} | Code: ${
            error.code || "unknown"
          }`
        );

        return;
      }

      router.push("/assessment");
      router.refresh();
    } catch (error) {
      console.error("Erreur inattendue :", error);

      if (error instanceof Error) {
        setErrorMessage(`Erreur: ${error.message}`);
      } else {
        setErrorMessage(
          "حدث خطأ غير متوقع أثناء حفظ البيانات."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     Bouton précédent
  ========================================================= */

  function handlePrevious() {
    if (step > 1 && !saving) {
      setErrorMessage("");
      setStep((current) => current - 1);
    }
  }

  const progress = (step / totalSteps) * 100;

  /* =========================================================
     Chargement utilisateur
  ========================================================= */

  if (checkingUser) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#061127] text-white"
      >
        <div className="text-center">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-purple-500" />

          <p className="text-sm text-slate-400">
            جاري تحميل حسابك...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     Interface
  ========================================================= */

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#061127] text-white"
    >
      {/* Background */}
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 font-black shadow-lg shadow-purple-500/20">
              D
            </div>

            <div>
              <div className="text-lg font-black tracking-wide">
                DAKAA
              </div>

              <div className="text-xs text-blue-300">
                ذكاء
              </div>
            </div>
          </Link>

          <div className="text-sm text-slate-400">
            الخطوة {step} من {totalSteps}
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="relative z-10 mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">

        {/* Progress */}
        <div className="mb-12">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>إعداد مسارك الشخصي</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-l from-purple-500 to-blue-500 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <section>
            <SectionHeader
              icon="🧠"
              title="ما هو مستواك الحالي في الذكاء الاصطناعي؟"
              description="لا تقلق، لا توجد إجابة صحيحة أو خاطئة. نريد فقط أن نبدأ من المستوى المناسب لك."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {levels.map((item) => (
                <ChoiceCard
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  selected={data.level === item.id}
                  onClick={() =>
                    setData({
                      ...data,
                      level: item.id,
                    })
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <section>
            <SectionHeader
              icon="💼"
              title="ما هو مجالك المهني؟"
              description="سنستخدم هذه المعلومة لتقديم أمثلة وتطبيقات أقرب إلى مجال عملك."
            />

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {professions.map((item) => (
                <ChoiceCard
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  selected={data.profession === item.id}
                  compact
                  onClick={() =>
                    setData({
                      ...data,
                      profession: item.id,
                    })
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <section>
            <SectionHeader
              icon="🎯"
              title="ما هو هدفك الرئيسي من تعلم الذكاء الاصطناعي؟"
              description="اختر الهدف الأقرب إليك. سنستخدمه لبناء مسار تعلم يناسب ما تريد تحقيقه."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((item) => (
                <ChoiceCard
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  selected={data.goal === item.id}
                  onClick={() =>
                    setData({
                      ...data,
                      goal: item.id,
                    })
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <section>
            <SectionHeader
              icon="⏱️"
              title="كم من الوقت تريد تخصيصه للتعلم يومياً؟"
              description="سنساعدك على بناء وتيرة تعلم واقعية يمكنك الاستمرار عليها."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {dailyTimes.map((item) => (
                <ChoiceCard
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  selected={data.dailyTime === item.id}
                  onClick={() =>
                    setData({
                      ...data,
                      dailyTime: item.id,
                    })
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Message erreur Supabase */}
        {errorMessage && (
          <div
            dir="ltr"
            className="mt-7 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-left text-sm leading-6 text-red-300"
          >
            <div className="mb-1 font-bold">
              Erreur d&apos;enregistrement
            </div>

            <div className="break-words">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between border-t border-slate-800 pt-7">

          <button
            type="button"
            onClick={handlePrevious}
            disabled={step === 1 || saving}
            className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            السابق
          </button>

          {/* Progress dots */}
          <div className="hidden items-center gap-2 sm:flex">
            {Array.from({
              length: totalSteps,
            }).map((_, index) => (
              <div
                key={index}
                className={`h-2.5 rounded-full transition-all ${
                  index + 1 === step
                    ? "w-7 bg-purple-500"
                    : index + 1 < step
                    ? "w-2.5 bg-blue-500"
                    : "w-2.5 bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue() || saving}
            className="rounded-xl bg-gradient-to-l from-purple-600 to-blue-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            {saving
              ? "جاري الحفظ..."
              : step === totalSteps
              ? "ابدأ التقييم"
              : "التالي"}
          </button>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   Section Header
========================================================= */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-9 text-center">

      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-2xl">
        {icon}
      </div>

      <h1 className="mb-3 text-2xl font-black leading-relaxed md:text-3xl">
        {title}
      </h1>

      <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   Choice Card
========================================================= */

function ChoiceCard({
  icon,
  title,
  description,
  selected,
  onClick,
  compact = false,
}: {
  icon: string;
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-2xl border text-right transition-all duration-200 ${
        compact ? "p-5" : "p-6"
      } ${
        selected
          ? "border-purple-500 bg-gradient-to-l from-purple-500/15 to-blue-500/10 shadow-lg shadow-purple-500/10"
          : "border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60"
      }`}
    >

      {selected && (
        <div className="absolute left-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-black text-white">
          ✓
        </div>
      )}

      <div
        className={`flex ${
          compact
            ? "flex-col items-center text-center"
            : "items-start gap-4"
        }`}
      >

        <div
          className={`flex shrink-0 items-center justify-center rounded-xl bg-slate-700/40 ${
            compact
              ? "mb-4 h-12 w-12 text-xl"
              : "h-12 w-12 text-xl"
          }`}
        >
          {icon}
        </div>

        <div>
          <h2 className="font-bold text-white">
            {title}
          </h2>

          {description && (
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {description}
            </p>
          )}
        </div>

      </div>
    </button>
  );
}