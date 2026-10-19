"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Level = "beginner" | "intermediate" | "advanced";

type Challenge = {
  id: number;
  title: string;
  description: string;
  level: Level;
  duration: string;
  objective: string;
  instructions: string[];
  example: string;
};

type ChallengeProgress = {
  answer: string;
  completed: boolean;
};

const challenges: Challenge[] = [
  {
    id: 1,
    title: "كتابة أمر احترافي للذكاء الاصطناعي",
    description: "تعلم كيفية صياغة أوامر دقيقة للحصول على نتائج أفضل.",
    level: "beginner",
    duration: "10 دقائق",
    objective: "إنشاء أمر واضح ومحدد يتضمن الدور والمهمة والنتيجة المطلوبة.",
    instructions: [
      "اختر مهمة مهنية أو تعليمية.",
      "حدد الدور الذي يجب أن يؤديه الذكاء الاصطناعي.",
      "اشرح المهمة والقيود المطلوبة.",
      "حدد شكل الإجابة النهائي."
    ],
    example:
      "تصرف كخبير تسويق رقمي. أنشئ خطة تسويقية لمتجر إلكتروني لمدة 30 يوماً، مع تحديد الأهداف والقنوات والميزانية، وقدم النتيجة في جدول."
  },
  {
    id: 2,
    title: "تلخيص وثيقة باستخدام الذكاء الاصطناعي",
    description: "تعلم استخراج المعلومات الأساسية من النصوص الطويلة.",
    level: "beginner",
    duration: "15 دقيقة",
    objective: "صياغة أمر يسمح بتلخيص وثيقة دون فقدان المعلومات المهمة.",
    instructions: [
      "تخيل أنك تتعامل مع تقرير مهني طويل.",
      "اطلب استخراج الأفكار الرئيسية.",
      "حدد الحد الأقصى للكلمات.",
      "اطلب إبراز القرارات والتوصيات."
    ],
    example:
      "لخص التقرير التالي في 150 كلمة كحد أقصى. استخرج الأهداف والنتائج والمخاطر والتوصيات، ولا تضف معلومات غير موجودة في النص."
  },
  {
    id: 3,
    title: "تصميم مساعد ذكي لخدمة العملاء",
    description: "أنشئ تصوراً لمساعد يجيب عن أسئلة العملاء.",
    level: "intermediate",
    duration: "20 دقيقة",
    objective: "تحديد دور المساعد وقواعد عمله وآلية التعامل مع العملاء.",
    instructions: [
      "اختر نوع الشركة.",
      "حدد الأسئلة التي سيجيب عنها المساعد.",
      "ضع قواعد التعامل مع المعلومات غير المتوفرة.",
      "حدد الحالات التي تتطلب تدخلاً بشرياً."
    ],
    example:
      "أنت مساعد خدمة العملاء لشركة تأجير سيارات. أجب عن الأسئلة المتعلقة بالأسعار والحجوزات والشروط. لا تؤكد أي حجز دون التحقق من التوفر، وحوّل الشكاوى المعقدة إلى الموظف المختص."
  },
  {
    id: 4,
    title: "تحليل بيانات المبيعات",
    description: "استخدم الذكاء الاصطناعي لاستخراج مؤشرات الأعمال.",
    level: "intermediate",
    duration: "25 دقيقة",
    objective: "صياغة طلب تحليل بيانات يتضمن مؤشرات الأداء والتوصيات.",
    instructions: [
      "حدد طبيعة بيانات المبيعات.",
      "اختر ثلاثة مؤشرات أداء رئيسية.",
      "اطلب مقارنة النتائج عبر الزمن.",
      "اطلب توصيات قابلة للتنفيذ."
    ],
    example:
      "حلل بيانات المبيعات الشهرية وحدد إجمالي الإيرادات ومتوسط قيمة الطلب ومعدل النمو. أبرز الأشهر الضعيفة واقترح ثلاث إجراءات لتحسين الأداء."
  },
  {
    id: 5,
    title: "تصميم سير عمل آلي بالذكاء الاصطناعي",
    description: "خطط لأتمتة عملية مهنية متعددة المراحل.",
    level: "advanced",
    duration: "30 دقيقة",
    objective: "تصميم سير عمل يحدد المدخلات والمعالجة والتحقق والمخرجات.",
    instructions: [
      "اختر عملية متكررة داخل شركة.",
      "حدد نقطة بدء العملية.",
      "صف مراحل معالجة البيانات.",
      "أضف مرحلة للتحقق البشري عند الحاجة.",
      "حدد النتيجة النهائية وطريقة قياس النجاح."
    ],
    example:
      "صمم سير عمل لاستقبال طلبات العملاء وتصنيفها وإعداد رد أولي، ثم تحويل الحالات الحساسة إلى موظف بشري قبل إرسال الرد."
  },
  {
    id: 6,
    title: "تخطيط مشروع رقمي يعتمد على الذكاء الاصطناعي",
    description: "حوّل فكرة إلى مشروع قابل للتنفيذ.",
    level: "advanced",
    duration: "40 دقيقة",
    objective: "إعداد تصور متكامل لمشروع ذكاء اصطناعي.",
    instructions: [
      "حدد المشكلة والفئة المستهدفة.",
      "اقترح حلاً يعتمد على الذكاء الاصطناعي.",
      "حدد الوظائف الأساسية للإصدار الأول.",
      "اذكر المتطلبات التقنية والمخاطر.",
      "ضع خطة تنفيذ ومؤشرات نجاح."
    ],
    example:
      "صمم منصة لمساعدة الشركات الصغيرة على تحليل مبيعاتها. حدد المستخدمين والوظائف الأساسية والتقنيات المطلوبة ومخاطر حماية البيانات وخطة إطلاق خلال 90 يوماً."
  }
];

const levelLabels: Record<Level, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم"
};

const levelStyles: Record<Level, string> = {
  beginner: "border-green-500/30 bg-green-500/10 text-green-300",
  intermediate: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  advanced: "border-red-500/30 bg-red-500/10 text-red-300"
};

type AIEvaluation = {
  score: number;
  passed: boolean;
  feedback: string;
  strengths: string[];
  improvements: string[];
  nextAction: string;
};

const STORAGE_PREFIX = "dakaa-v8-challenges";

export default function ChallengesPage() {
  const [selectedLevel, setSelectedLevel] = useState<Level | "all">("all");
  const [selectedChallenge, setSelectedChallenge] = useState<number | null>(null);

  const [progress, setProgress] = useState<Record<number, ChallengeProgress>>({});
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [storageError, setStorageError] = useState("");

  const [evaluations, setEvaluations] =
    useState<Record<number, AIEvaluation>>({});

  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");

  const [aiUsage, setAiUsage] =
    useState<{ used: number; quota: number } | null>(null);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const { createClient } = await import("@supabase/supabase-js");

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
        );

        const { data, error } = await supabase.auth.getUser();

        if (!active) return;

        if (error || !data.user) {
          window.location.replace("/login");
          return;
        }
        // DAKAA_ACCESS_GUARD: verification serveur avant tout chargement pedagogique.
        const { data: accessSession } = await supabase.auth.getSession();
        const accessToken = accessSession.session?.access_token;
        if (!accessToken) {
          window.location.replace("/login");
          return;
        }
        let accessResponse: Response;
        try {
          accessResponse = await fetch("/api/subscription/access", {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          });
        } catch {
          window.location.replace("/pricing");
          return;
        }
        if (!accessResponse.ok) {
          window.location.replace(accessResponse.status === 401 ? "/login" : "/pricing");
          return;
        }

        const key = `${STORAGE_PREFIX}-${data.user.id}`;

        let savedProgress: Record<number, ChallengeProgress> = {};

        try {
          const saved = window.localStorage.getItem(key);

          if (saved) {
            const parsed: unknown = JSON.parse(saved);

            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              const entries = Object.entries(parsed).filter(
                ([id, value]) =>
                  challenges.some((challenge) => String(challenge.id) === id) &&
                  value !== null &&
                  typeof value === "object" &&
                  typeof (value as ChallengeProgress).answer === "string" &&
                  typeof (value as ChallengeProgress).completed === "boolean"
              );

              savedProgress = Object.fromEntries(entries);
            }
          }
        } catch {
          setStorageError("تعذر قراءة التقدم المحفوظ على هذا الجهاز.");
        }

        setProgress(savedProgress);
        setStorageKey(key);
      } catch {
        if (active) {
          setStorageError("تعذر التحقق من الحساب. يرجى تحديث الصفحة.");
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  function updateProgress(
    challengeId: number,
    changes: Partial<ChallengeProgress>
  ) {
    if (!storageKey) return;

    const updated = {
      ...progress,
      [challengeId]: {
        answer: progress[challengeId]?.answer ?? "",
        completed: progress[challengeId]?.completed ?? false,
        ...changes
      }
    };

    setProgress(updated);

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(updated));
      setStorageError("");
    } catch {
      setStorageError("تعذر حفظ التقدم على هذا الجهاز.");
    }
  }

  async function evaluateChallenge(challenge: Challenge) {
    const answer = progress[challenge.id]?.answer?.trim() ?? "";

    if (!answer) {
      setEvaluationError("???? ????? ?????? ?????.");
      return;
    }

    setEvaluations((previous) => {
      const next = { ...previous };
      delete next[challenge.id];
      return next;
    });

    setEvaluating(true);
    setEvaluationError("");

    try {
      const { createClient } = await import("@supabase/supabase-js");

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );

      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.access_token) {
        throw new Error("???? ????? ?????? ?? ????.");
      }

      const task = [
        "???? ??????? ??????? ??? ?????? ?????? ????????.",
        "????? ??????: " + challenge.title,
        "?????: " + challenge.objective,
        "?????????:",
        ...challenge.instructions,
        "????? ??????? (?????? ????? ???????):",
        "<student_answer>",
        answer,
        "</student_answer>",
        "??? ??????? ???????? ????? ??? ????? ??????????."
      ].join("\n");

      if (task.length > 4000) {
        throw new Error("??????? ????? ????. ???? ????????.");
      }

      const response = await fetch("/api/challenges/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + data.session.access_token
        },
        body: JSON.stringify({
          mode: "challenge_evaluate",
          challengeId: challenge.id,
          answer,
          messages: [
            {
              role: "user",
              content: task
            }
          ],
          context: {
            skill: "practical_ai_challenges",
            level: challenge.level,
            goal: challenge.objective
          }
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message = result.error || "???? ????? ???????.";

        if (
          typeof message === "string" &&
          message.includes("?? ???? ???? ????? ????")
        ) {
          throw new Error(
            "??? ????? ???? ??????? ????? ????? ?? ???? ??????."
          );
        }

        throw new Error(message);
      }

      if (!result.evaluation) {
        throw new Error("?? ??? ?????? ????? ???????.");
      }

      setEvaluations((previous) => ({
        ...previous,
        [challenge.id]: result.evaluation as AIEvaluation
      }));

      if (
        typeof result.aiUsage?.used === "number" &&
        typeof result.aiUsage?.quota === "number"
      ) {
        setAiUsage(result.aiUsage);
      }

      if (result.evaluation.passed) {
        updateProgress(challenge.id, { completed: true });
      }
    } catch (error) {
      setEvaluationError(
        error instanceof Error
          ? error.message
          : "??? ??? ????? ????? ???????."
      );
    } finally {
      setEvaluating(false);
    }
  }

  const visibleChallenges = challenges.filter(
    (challenge) =>
      selectedLevel === "all" || challenge.level === selectedLevel
  );

  const completedCount = challenges.filter(
    (challenge) => progress[challenge.id]?.completed
  ).length;

  const completionPercentage = Math.round(
    (completedCount / challenges.length) * 100
  );

  const activeChallenge = challenges.find(
    (challenge) => challenge.id === selectedChallenge
  );

  if (!storageKey) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#07142e] text-white"
      >
        <p>{storageError || "جاري تحميل التحديات..."}</p>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#07142e] px-5 py-10 text-white md:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard" className="text-3xl font-black">
            DAKAA <span className="text-purple-400">ذكاء</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/20 px-5 py-3 transition hover:bg-white/10"
          >
            العودة إلى لوحة التحكم
          </Link>
        </header>

        <section className="mb-10 rounded-3xl border border-purple-500/30 bg-gradient-to-l from-purple-600/20 to-blue-600/10 p-8 md:p-12">
          <div className="mb-5 text-5xl">🏆</div>

          <h1 className="mb-4 text-4xl font-black">
            التحديات العملية
          </h1>

          <p className="max-w-3xl text-lg leading-9 text-slate-300">
            انتقل من التعلم النظري إلى التطبيق العملي.
            أنجز تحديات واقعية وطور مهاراتك في استخدام الذكاء الاصطناعي.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#101f42] p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-bold">تقدمك في التحديات</h2>

              <span className="font-black text-purple-300">
                <span dir="ltr">{completedCount} / {challenges.length}</span>
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-l from-purple-500 to-blue-500 transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-slate-400">
              نسبة الإنجاز: {completionPercentage}%
            </p>
          </div>
        </section>

        {storageError && (
          <div className="mb-6 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-orange-300">
            {storageError}
          </div>
        )}

        {!activeChallenge ? (
          <>
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-black">
                اختر مستوى التحدي
              </h2>

              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ["all", "جميع المستويات"],
                    ["beginner", "مبتدئ"],
                    ["intermediate", "متوسط"],
                    ["advanced", "متقدم"]
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedLevel(value)}
                    className={`rounded-xl border px-5 py-3 font-bold transition ${
                      selectedLevel === value
                        ? "border-purple-500 bg-purple-600 text-white"
                        : "border-white/20 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2">
              {visibleChallenges.map((challenge) => {
                const completed = progress[challenge.id]?.completed ?? false;

                return (
                  <article
                    key={challenge.id}
                    className="rounded-3xl border border-slate-700 bg-[#101f42] p-7 transition hover:border-purple-500"
                  >
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full border px-4 py-2 text-sm font-bold ${levelStyles[challenge.level]}`}
                      >
                        {levelLabels[challenge.level]}
                      </span>

                      <span className="text-sm text-slate-400">
                        {challenge.duration}
                      </span>
                    </div>

                    <h3 className="mb-3 text-xl font-black leading-9">
                      {challenge.title}
                    </h3>

                    <p className="mb-6 leading-8 text-slate-300">
                      {challenge.description}
                    </p>

                    {completed && (
                      <p className="mb-5 font-bold text-green-300">
                        ✓ تم إنجاز التحدي
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedChallenge(challenge.id)}
                      className="rounded-xl bg-gradient-to-l from-purple-600 to-blue-600 px-6 py-3 font-bold transition hover:opacity-90"
                    >
                      {completed ? "مراجعة التحدي" : "ابدأ التحدي"}
                    </button>
                  </article>
                );
              })}
            </section>
          </>
        ) : (
          <section className="rounded-3xl border border-purple-500/30 bg-[#101f42] p-7 md:p-10">
            <button
              type="button"
              onClick={() => setSelectedChallenge(null)}
              className="mb-8 rounded-xl border border-white/20 px-5 py-3 hover:bg-white/10"
            >
              العودة إلى التحديات
            </button>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-4 py-2 text-sm font-bold ${levelStyles[activeChallenge.level]}`}
              >
                {levelLabels[activeChallenge.level]}
              </span>

              <span className="text-sm text-slate-400">
                {activeChallenge.duration}
              </span>
            </div>

            <h2 className="mb-6 text-3xl font-black leading-relaxed">
              {activeChallenge.title}
            </h2>

            <div className="mb-7 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
              <h3 className="mb-3 text-lg font-bold text-blue-300">
                الهدف من التحدي
              </h3>

              <p className="leading-9 text-slate-200">
                {activeChallenge.objective}
              </p>
            </div>

            <div className="mb-7">
              <h3 className="mb-4 text-xl font-black">
                خطوات التنفيذ
              </h3>

              <ol className="list-inside list-decimal space-y-3 text-slate-300">
                {activeChallenge.instructions.map((instruction, index) => (
                  <li key={index} className="leading-8">
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mb-8 rounded-2xl border border-slate-700 bg-[#07142e] p-6">
              <h3 className="mb-3 font-bold text-purple-300">
                مثال إرشادي
              </h3>

              <p className="whitespace-pre-line leading-9 text-slate-300">
                {activeChallenge.example}
              </p>
            </div>

            <div className="mb-7">
              <label
                htmlFor="challenge-answer"
                className="mb-4 block text-xl font-black"
              >
                اكتب إجابتك هنا
              </label>

              <textarea
                id="challenge-answer"
                rows={10}
                value={progress[activeChallenge.id]?.answer ?? ""}
                onChange={(event) => {
    setEvaluations((previous) => {
      const next = { ...previous };
      delete next[activeChallenge.id];
      return next;
    });
    setEvaluationError("");
    updateProgress(activeChallenge.id, {
      answer: event.target.value,
      completed: false
    });
  }}
                placeholder="اكتب الحل أو الأمر الذي قمت بإعداده..."
                className="w-full resize-y rounded-2xl border border-slate-600 bg-[#07142e] p-5 leading-9 text-white outline-none focus:border-purple-500"
              />

              <p className="mt-3 text-sm text-slate-400">
                يتم حفظ إجابتك تلقائياً على هذا الجهاز.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                disabled={
                  !(progress[activeChallenge.id]?.answer ?? "").trim()
                }
                onClick={() =>
                  updateProgress(activeChallenge.id, {
                    completed: true
                  })
                }
                className="rounded-xl bg-gradient-to-l from-green-600 to-emerald-500 px-7 py-4 font-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                إتمام التحدي ✓
              </button>

              <button
                type="button"
                disabled={
                  evaluating ||
                  !(progress[activeChallenge.id]?.answer ?? "").trim()
                }
                onClick={() => evaluateChallenge(activeChallenge)}
                className="rounded-xl bg-gradient-to-l from-purple-600 to-blue-600 px-7 py-4 font-black disabled:opacity-40"
              >
                {evaluating
                  ? "???? ????? ???????..."
                  : "????? ?????? ??????? ????????? ?"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedChallenge(null)}
                className="rounded-xl border border-white/20 px-7 py-4 font-bold hover:bg-white/10"
              >
                العودة إلى القائمة
              </button>
            </div>

            {evaluationError && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
                <p>{evaluationError}</p>

                {evaluationError.includes("??????? ?????") && (
                  <Link
                    href="/ai"
                    className="mt-3 inline-block rounded-lg bg-purple-600 px-5 py-2 font-bold text-white"
                  >
                    ??? ??????? ?????
                  </Link>
                )}
              </div>
            )}

            {evaluations[activeChallenge.id] && (
              <section className="mt-8 rounded-2xl border border-purple-500/30 bg-[#07142e] p-6">
                <h3 className="mb-5 text-2xl font-black">
                  ????? ??????? ?????
                </h3>

                <div className="mb-5 text-5xl font-black text-purple-300">
                  <span dir="ltr">
                    {evaluations[activeChallenge.id].score} / 100
                  </span>
                </div>

                <p className="mb-6 leading-9 text-slate-200">
                  {evaluations[activeChallenge.id].feedback}
                </p>

                <h4 className="mb-3 font-black text-green-300">
                  ???? ?????
                </h4>

                <ul className="mb-6 list-inside list-disc space-y-2 text-slate-300">
                  {evaluations[activeChallenge.id].strengths.map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>

                <h4 className="mb-3 font-black text-orange-300">
                  ???? ???????
                </h4>

                <ul className="mb-6 list-inside list-disc space-y-2 text-slate-300">
                  {evaluations[activeChallenge.id].improvements.map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>

                <h4 className="mb-3 font-black text-blue-300">
                  ?????? ???????
                </h4>

                <p className="leading-8 text-slate-300">
                  {evaluations[activeChallenge.id].nextAction}
                </p>

                {aiUsage && (
                  <p className="mt-6 border-t border-white/10 pt-4 text-sm text-slate-400">
                    ????? ?????? ?????????:
                    <span dir="ltr" className="mx-2 inline-block">
                      {aiUsage.used} / {aiUsage.quota}
                    </span>
                  </p>
                )}
              </section>
            )}

            {progress[activeChallenge.id]?.completed && (
              <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-5 font-bold text-green-300">
                🎉 أحسنت! تم تسجيل إنجاز هذا التحدي على جهازك.
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
