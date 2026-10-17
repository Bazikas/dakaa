"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Question = {
  id: number;
  question: string;
  answers: {
    id: string;
    text: string;
    score: number;
  }[];
};

const questions: Question[] = [
  {
    id: 1,
    question: "ما هو الذكاء الاصطناعي؟",
    answers: [
      {
        id: "a",
        text: "برنامج مخصص فقط للروبوتات",
        score: 0,
      },
      {
        id: "b",
        text: "تقنيات تمكّن الأنظمة من تنفيذ مهام تتطلب عادةً ذكاءً بشرياً",
        score: 3,
      },
      {
        id: "c",
        text: "نوع من شبكات الإنترنت",
        score: 0,
      },
      {
        id: "d",
        text: "لا أعرف",
        score: 0,
      },
    ],
  },
  {
    id: 2,
    question: "هل سبق لك استخدام أداة مثل ChatGPT أو Gemini أو Copilot؟",
    answers: [
      {
        id: "a",
        text: "لم أستخدم أي أداة من قبل",
        score: 0,
      },
      {
        id: "b",
        text: "استخدمتها مرة أو مرتين",
        score: 1,
      },
      {
        id: "c",
        text: "أستخدمها بشكل متكرر",
        score: 2,
      },
      {
        id: "d",
        text: "أستخدم عدة أدوات ذكاء اصطناعي بشكل متقدم",
        score: 3,
      },
    ],
  },
  {
    id: 3,
    question: "ما المقصود بـ Prompt عند استخدام أدوات الذكاء الاصطناعي؟",
    answers: [
      {
        id: "a",
        text: "الأمر أو التعليمات التي نعطيها للذكاء الاصطناعي",
        score: 3,
      },
      {
        id: "b",
        text: "كلمة المرور الخاصة بالحساب",
        score: 0,
      },
      {
        id: "c",
        text: "اسم نموذج الذكاء الاصطناعي",
        score: 0,
      },
      {
        id: "d",
        text: "لا أعرف",
        score: 0,
      },
    ],
  },
  {
    id: 4,
    question: "أي Prompt من التالي سيعطي عادةً نتيجة أفضل؟",
    answers: [
      {
        id: "a",
        text: "اكتب لي عن التسويق",
        score: 1,
      },
      {
        id: "b",
        text: "التسويق",
        score: 0,
      },
      {
        id: "c",
        text: "أنت خبير تسويق. أنشئ خطة تسويق لمدة 30 يوماً لمتجر إلكتروني صغير، مع تحديد الجمهور والقنوات والأهداف",
        score: 3,
      },
      {
        id: "d",
        text: "أعطني شيئاً جيداً",
        score: 0,
      },
    ],
  },
  {
    id: 5,
    question: "عندما يعطيك الذكاء الاصطناعي معلومة مهمة، ماذا يُفضّل أن تفعل؟",
    answers: [
      {
        id: "a",
        text: "أعتبرها صحيحة دائماً",
        score: 0,
      },
      {
        id: "b",
        text: "أتحقق من المعلومات المهمة من مصادر موثوقة",
        score: 3,
      },
      {
        id: "c",
        text: "أنشرها مباشرة",
        score: 0,
      },
      {
        id: "d",
        text: "لا أعرف",
        score: 0,
      },
    ],
  },
  {
    id: 6,
    question: "كيف يمكن للذكاء الاصطناعي مساعدتك في العمل؟",
    answers: [
      {
        id: "a",
        text: "كتابة وتلخيص وتحليل المعلومات والمساعدة في إنجاز المهام",
        score: 3,
      },
      {
        id: "b",
        text: "لا يمكن استخدامه في العمل",
        score: 0,
      },
      {
        id: "c",
        text: "يمكن استخدامه فقط لإنشاء الصور",
        score: 1,
      },
      {
        id: "d",
        text: "لا أعرف",
        score: 0,
      },
    ],
  },
];

export default function AssessmentPage() {
  const router = useRouter();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const [userId, setUserId] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const question = questions[currentQuestion];

  const progress =
    ((currentQuestion + 1) / questions.length) * 100;

  /* =========================================================
     Vérifier utilisateur connecté
  ========================================================= */

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setCheckingUser(false);
    }

    checkUser();
  }, [router]);

  /* =========================================================
     Sélection réponse
  ========================================================= */

  function handleAnswer(answerId: string) {
    if (saving) return;

    setSelectedAnswer(answerId);
    setErrorMessage("");
  }

  /* =========================================================
     Question suivante / terminer
  ========================================================= */

  async function handleNext() {
    if (!selectedAnswer || saving) return;

    setErrorMessage("");

    const answer = question.answers.find(
      (item) => item.id === selectedAnswer
    );

    const newScore = score + (answer?.score ?? 0);

    /* Question suivante */

    if (currentQuestion < questions.length - 1) {
      setScore(newScore);

      setCurrentQuestion(
        (current) => current + 1
      );

      setSelectedAnswer(null);

      return;
    }

    /* =========================================================
       Calcul résultat final
    ========================================================= */

    const maxScore = questions.length * 3;

    const percentage = Math.round(
      (newScore / maxScore) * 100
    );

    let level = "beginner";

    if (percentage >= 75) {
      level = "advanced";
    } else if (percentage >= 50) {
      level = "intermediate";
    } else if (percentage >= 25) {
      level = "basic";
    }

    /* =========================================================
       Vérification utilisateur
    ========================================================= */

    if (!userId) {
      setErrorMessage(
        "تعذر العثور على حسابك. يرجى تسجيل الدخول من جديد."
      );

      return;
    }

    setSaving(true);

    /* =========================================================
       Sauvegarder dans Supabase
    ========================================================= */

    const { error } = await supabase
      .from("assessment_results")
      .insert({
        user_id: userId,
        score: newScore,
        max_score: maxScore,
        percentage: percentage,
        level: level,
      });

    if (error) {
      console.error(
        "DAKAA assessment save error:",
        error
      );

      setErrorMessage(
        `حدث خطأ أثناء حفظ نتيجة التقييم: ${error.message}`
      );

      setSaving(false);

      return;
    }

    /* =========================================================
       Sauvegarde locale temporaire
    ========================================================= */

    sessionStorage.setItem(
      "dakaa_assessment",
      JSON.stringify({
        score: newScore,
        maxScore,
        percentage,
        level,
      })
    );

    /* =========================================================
       Aller au dashboard
    ========================================================= */

    router.push("/dashboard");
    router.refresh();
  }

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

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#061127] text-white"
    >
      {/* Background */}

      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">

        {/* Header */}

        <div className="mb-10 flex items-center justify-between">

          <div className="flex items-center gap-3">

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

          </div>

          <div className="rounded-full border border-slate-700 bg-slate-800/40 px-4 py-2 text-sm text-slate-300">
            السؤال {currentQuestion + 1} من{" "}
            {questions.length}
          </div>

        </div>

        {/* Progress */}

        <div className="mb-12">

          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">

            <span>
              تقييم مستواك
            </span>

            <span>
              {Math.round(progress)}%
            </span>

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

        {/* Assessment card */}

        <section className="rounded-3xl border border-slate-700/80 bg-slate-800/40 p-6 shadow-2xl backdrop-blur md:p-9">

          <div className="mb-8 text-center">

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-2xl">
              🧠
            </div>

            <p className="mb-3 text-sm font-bold text-purple-400">
              السؤال {currentQuestion + 1}
            </p>

            <h1 className="text-xl font-black leading-9 md:text-2xl">
              {question.question}
            </h1>

          </div>

          {/* Answers */}

          <div className="grid gap-4">

            {question.answers.map((answer) => {

              const selected =
                selectedAnswer === answer.id;

              return (
                <button
                  key={answer.id}
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    handleAnswer(answer.id)
                  }
                  className={`relative w-full rounded-2xl border p-5 text-right transition-all ${
                    selected
                      ? "border-purple-500 bg-gradient-to-l from-purple-500/15 to-blue-500/10 shadow-lg shadow-purple-500/10"
                      : "border-slate-700 bg-[#091831]/70 hover:border-slate-500 hover:bg-slate-800"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >

                  <div className="flex items-center gap-4">

                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                        selected
                          ? "border-purple-400 bg-purple-500 text-white"
                          : "border-slate-600 text-slate-400"
                      }`}
                    >
                      {selected
                        ? "✓"
                        : answer.id.toUpperCase()}
                    </div>

                    <span className="leading-7 text-slate-200">
                      {answer.text}
                    </span>

                  </div>

                </button>
              );
            })}

          </div>

          {/* Error */}

          {errorMessage && (
            <div className="mt-7 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm leading-7 text-red-300">
              <div className="font-bold">
                تعذر حفظ النتيجة
              </div>

              <div className="mt-1">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Navigation */}

          <div className="mt-8 flex items-center justify-between border-t border-slate-700/70 pt-7">

            <span className="text-xs text-slate-500">
              اختر إجابة واحدة للمتابعة
            </span>

            <button
              type="button"
              disabled={
                !selectedAnswer || saving
              }
              onClick={handleNext}
              className="rounded-xl bg-gradient-to-l from-purple-600 to-blue-500 px-7 py-3 font-bold text-white shadow-lg shadow-purple-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >

              {saving
                ? "جاري حفظ النتيجة..."
                : currentQuestion ===
                  questions.length - 1
                ? "إنهاء التقييم"
                : "السؤال التالي"}

            </button>

          </div>

        </section>

        <p className="mt-6 text-center text-xs leading-6 text-slate-500">
          سيتم استخدام نتائج التقييم لتخصيص مسار التعلم الخاص بك.
        </p>

      </div>
    </main>
  );
}