"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Diagnostic = {
  profession: string;
  level: string;
  goal: string;
  project: string;
  challenge: string;
  dailyTime: string;
};

type Choice = {
  id: string;
  label: string;
  icon: string;
};

const STORAGE_KEY = "dakaa_public_diagnostic_v1";

const initialData: Diagnostic = {
  profession: "",
  level: "",
  goal: "",
  project: "",
  challenge: "",
  dailyTime: "",
};

const professions: Choice[] = [
  { id: "student", label: "طالب", icon: "🎓" },
  { id: "employee", label: "موظف", icon: "💼" },
  { id: "entrepreneur", label: "رائد أعمال", icon: "🚀" },
  { id: "teacher", label: "أستاذ أو مدرب", icon: "📚" },
  { id: "developer", label: "مطور أو تقني", icon: "💻" },
  { id: "marketing", label: "تسويق ومبيعات", icon: "📢" },
  { id: "finance", label: "مالية وأعمال", icon: "💰" },
  { id: "other", label: "مجال آخر", icon: "✨" },
];

const levels: Choice[] = [
  { id: "beginner", label: "مبتدئ تماماً", icon: "🌱" },
  { id: "basic", label: "لدي معرفة بسيطة", icon: "💡" },
  { id: "intermediate", label: "مستوى متوسط", icon: "🧠" },
  { id: "advanced", label: "مستوى متقدم", icon: "🚀" },
];

const goals: Choice[] = [
  { id: "work", label: "تطوير أدائي في العمل", icon: "💼" },
  { id: "productivity", label: "زيادة الإنتاجية", icon: "⚡" },
  { id: "tools", label: "إتقان أدوات الذكاء الاصطناعي", icon: "🤖" },
  { id: "automation", label: "أتمتة المهام", icon: "⚙️" },
  { id: "prompting", label: "تحسين كتابة الأوامر", icon: "✍️" },
  { id: "project", label: "إنشاء مشروع باستخدام الذكاء الاصطناعي", icon: "🚀" },
];

const challenges: Choice[] = [
  { id: "starting", label: "لا أعرف من أين أبدأ", icon: "🧭" },
  { id: "tools", label: "لا أعرف الأدوات المناسبة", icon: "🛠️" },
  { id: "time", label: "ليس لدي وقت كافٍ", icon: "⏱️" },
  { id: "practice", label: "أحتاج إلى تطبيقات عملية", icon: "🎯" },
  { id: "results", label: "لا أحصل على نتائج جيدة", icon: "📊" },
  { id: "other", label: "تحدٍ آخر", icon: "💬" },
];

const times: Choice[] = [
  { id: "10", label: "10 دقائق يومياً", icon: "☕" },
  { id: "20", label: "20 دقيقة يومياً", icon: "⏱️" },
  { id: "30", label: "30 دقيقة يومياً", icon: "📖" },
  { id: "60", label: "60 دقيقة يومياً", icon: "🔥" },
];

function getLabel(items: Choice[], id: string) {
  return items.find((item) => item.id === id)?.label ?? "";
}

function getRecommendations(data: Diagnostic): string[] {
  const recommendations: string[] = [];

  if (data.level === "beginner" || data.level === "basic") {
    recommendations.push("فهم أساسيات الذكاء الاصطناعي واستخداماته");
  }

  if (data.goal === "prompting" || data.challenge === "results") {
    recommendations.push("تطوير مهارات كتابة الأوامر للحصول على نتائج دقيقة");
  }

  if (data.goal === "automation" || data.goal === "productivity") {
    recommendations.push("التعرف على طرق أتمتة المهام وتحسين الإنتاجية");
  }

  if (data.goal === "project" || data.profession === "entrepreneur") {
    recommendations.push("تحديد فكرة مشروعك واختيار أدوات الذكاء الاصطناعي المناسبة");
  }

  if (data.goal === "tools" || data.challenge === "tools") {
    recommendations.push("مقارنة أدوات الذكاء الاصطناعي واختيار الأنسب لاحتياجاتك");
  }

  if (data.challenge === "practice") {
    recommendations.push("الانتقال تدريجياً من المفاهيم إلى التطبيقات العملية");
  }

  if (data.profession === "marketing") {
    recommendations.push("استكشاف تطبيقات الذكاء الاصطناعي في التسويق والمبيعات");
  }

  if (data.profession === "finance") {
    recommendations.push("استكشاف استخدام الذكاء الاصطناعي في تحليل المعلومات المالية");
  }

  if (data.profession === "teacher") {
    recommendations.push("استخدام الذكاء الاصطناعي لإعداد المحتوى التعليمي");
  }

  if (recommendations.length === 0) {
    recommendations.push("اختيار أدوات الذكاء الاصطناعي المناسبة لمجالك");
  }

  recommendations.push("بناء خطة تعلم تدريجية تتناسب مع وقتك اليومي");

  return [...new Set(recommendations)].slice(0, 4);
}

export default function DiagnosticPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Diagnostic>(initialData);
  const [ready, setReady] = useState(false);
  type AiResult = {
    summary: string;
    followUp: string;
    modules: { id: string; title_ar: string; description_ar: string | null }[];
    plan: string[];
    reasons: string[];
  };
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  async function analyzeWithAi() {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError("");
    setAiResult(null);
    try {
      const response = await fetch("/api/diagnostic/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "تعذر التحليل");
            setAiResult(result as AiResult);
      try {
        localStorage.setItem("dakaa_public_diagnostic_ai_v1", JSON.stringify(result));
      } catch { /* optional local storage */ }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "تعذر التحليل");
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as {
          data?: Partial<Diagnostic>;
          step?: number;
        };

        if (parsed.data && typeof parsed.data === "object") {
          const validKeys: (keyof Diagnostic)[] = [
            "profession",
            "level",
            "goal",
            "project",
            "challenge",
            "dailyTime",
          ];

          const restored: Diagnostic = { ...initialData };

          for (const key of validKeys) {
            const value = parsed.data[key];

            if (typeof value === "string") {
              restored[key] = value.slice(0, 1200);
            }
          }

          queueMicrotask(() => setData(restored));
        }

        if (
          typeof parsed.step === "number" &&
          Number.isInteger(parsed.step) &&
          parsed.step >= 0 &&
          parsed.step <= 6
        ) {
          queueMicrotask(() => setStep(parsed.step as number));
        }
      }
    } catch {
      // Le diagnostic reste utilisable si le stockage est indisponible.
    }

    queueMicrotask(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ data, step })
      );
    } catch {
      // Le stockage local est facultatif.
    }
  }, [data, step, ready]);

  function update(field: keyof Diagnostic, value: string) {
    setData((current) => ({ ...current, [field]: value }));
  }

  function canContinue() {
    if (step === 0) return data.profession !== "";
    if (step === 1) return data.level !== "";
    if (step === 2) return data.goal !== "";
    if (step === 3) return data.project.trim().length >= 10;
    if (step === 4) return data.challenge !== "";
    if (step === 5) return data.dailyTime !== "";
    return true;
  }

  function restart() {
        setData(initialData);
    setAiResult(null);
    setStep(0);
    try { localStorage.removeItem("dakaa_public_diagnostic_ai_v1"); } catch { /* optional */ }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorer si le stockage est désactivé.
    }
  }

  const questions = [
    "ما هو مجالك المهني أو مجال اهتمامك؟",
    "ما هو مستواك الحالي في الذكاء الاصطناعي؟",
    "ما هو هدفك الأساسي؟",
    "حدثنا عن مشروعك أو ما ترغب في تحقيقه",
    "ما هو أكبر تحدٍ تواجهه حالياً؟",
    "كم من الوقت يمكنك تخصيصه للتعلم يومياً؟",
  ];

  function renderChoices(
    choices: Choice[],
    field: keyof Diagnostic
  ) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {choices.map((item) => {
          const selected = data[field] === item.id;

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => update(field, item.id)}
              className={`rounded-2xl border p-5 text-right transition ${
                selected
                  ? "border-violet-400 bg-violet-500/20"
                  : "border-slate-700 bg-slate-800/50 hover:border-violet-500"
              }`}
            >
              <span className="ml-3 text-2xl">{item.icon}</span>
              <span className="font-bold">{item.label}</span>
              {selected && (
                <span className="mr-3 text-violet-300">✓</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (!ready) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#061127] text-white"
      >
        جاري التحميل...
      </main>
    );
  }

  const recommendations = getRecommendations(data);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#061127] px-5 py-10 text-white"
    >
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-black">
              D
            </div>
            <div>
              <div className="text-xl font-black">DAKAA</div>
              <div className="text-xs text-blue-300">ذكاء</div>
            </div>
          </Link>

          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
            تشخيص مجاني
          </span>
        </header>

        {step < 6 ? (
          <>
            <div className="mb-8">
              <div className="mb-3 flex justify-between text-sm text-slate-400">
                <span>الخطوة {step + 1} من 6</span>
                <span>{Math.round(((step + 1) / 6) * 100)}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-violet-500 to-blue-500"
                  style={{
                    width: `${((step + 1) / 6) * 100}%`,
                  }}
                />
              </div>
            </div>

            <section className="rounded-3xl border border-slate-700 bg-slate-800/30 p-6 md:p-10">
              <p className="mb-4 font-bold text-violet-300">
                دعنا نتعرف عليك أكثر
              </p>

              <h1 className="mb-8 text-2xl font-black leading-relaxed md:text-3xl">
                {questions[step]}
              </h1>

              {step === 0 && renderChoices(professions, "profession")}
              {step === 1 && renderChoices(levels, "level")}
              {step === 2 && renderChoices(goals, "goal")}

              {step === 3 && (
                <div>
                  <p className="mb-4 leading-8 text-slate-400">
                    اشرح فكرتك أو احتياجاتك بأسلوبك الخاص.
                    لا تحتاج إلى استعمال مصطلحات تقنية.
                  </p>

                  <textarea
                    value={data.project}
                    onChange={(event) =>
                      update(
                        "project",
                        event.target.value.slice(0, 1200)
                      )
                    }
                    maxLength={1200}
                    rows={7}
                    placeholder="مثلاً: أريد استخدام الذكاء الاصطناعي لتطوير عملي وإنشاء مشروع رقمي، لكنني لا أعرف الأدوات التي أحتاج إليها..."
                    className="w-full resize-y rounded-2xl border border-slate-700 bg-[#091831] p-5 leading-8 text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    اكتب 10 أحرف على الأقل. تجنب إدخال معلومات شخصية حساسة.
                  </p>
                </div>
              )}

              {step === 4 && renderChoices(challenges, "challenge")}
              {step === 5 && renderChoices(times, "dailyTime")}

              <div className="mt-10 flex justify-between gap-4 border-t border-slate-700 pt-7">
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  disabled={step === 0}
                  className="rounded-xl border border-slate-600 px-6 py-3 disabled:opacity-30"
                >
                  السابق
                </button>

                <button
                  type="button"
                  disabled={!canContinue()}
                  onClick={() => setStep((current) => current + 1)}
                  className="rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 px-7 py-3 font-bold disabled:opacity-40"
                >
                  {step === 5 ? "اكتشف مسارك" : "التالي"}
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-3xl border border-violet-500/30 bg-slate-800/40 p-6 md:p-10">
            <div className="mb-6 text-center text-5xl">🎯</div>

            <h1 className="mb-5 text-center text-3xl font-black">
              مسارك التعليمي المقترح
            </h1>

            <p className="mb-8 text-center leading-8 text-slate-300">
              شكراً لمشاركة أهدافك معنا.
              إليك توصيات أولية مبنية على إجاباتك.
            </p>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#091831] p-5">
                <p className="mb-2 text-sm text-slate-400">مجالك</p>
                <p className="font-bold">
                  {getLabel(professions, data.profession)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#091831] p-5">
                <p className="mb-2 text-sm text-slate-400">مستواك</p>
                <p className="font-bold">
                  {getLabel(levels, data.level)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#091831] p-5">
                <p className="mb-2 text-sm text-slate-400">هدفك</p>
                <p className="font-bold">
                  {getLabel(goals, data.goal)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#091831] p-5">
                <p className="mb-2 text-sm text-slate-400">وقت التعلم</p>
                <p className="font-bold">
                  {getLabel(times, data.dailyTime)}
                </p>
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6">
              <h2 className="mb-3 text-xl font-black">تحليل شخصي بالذكاء الاصطناعي</h2>
              <p className="mb-4 text-sm leading-7 text-slate-300">يمكنك طلب تحليل أولي مجاني. لن نفتح أي درس قبل الاشتراك.</p>
              <button type="button" disabled={aiLoading} onClick={analyzeWithAi}
                className="rounded-xl bg-violet-600 px-6 py-3 font-bold disabled:opacity-50">
                {aiLoading ? "جاري تحليل احتياجاتك..." : "حلّل احتياجاتي بالذكاء الاصطناعي"}
              </button>
              {aiError && <p className="mt-4 break-words text-sm text-amber-300">{aiError}</p>}
              {aiResult && <div className="mt-6 space-y-5">
                <p className="whitespace-pre-wrap leading-8 text-slate-100">{aiResult.summary}</p>
                {aiResult.followUp && <div className="rounded-xl border border-amber-500/30 p-4 text-amber-200">
                  <strong>سؤال لمزيد من التخصيص:</strong> {aiResult.followUp}
                  <p className="mt-2 text-xs">يمكنك تعديل وصف مشروعك ثم إعادة التحليل.</p>
                </div>}
                <h3 className="font-black">وحدات حقيقية من مكتبة DAKAA</h3>
                {aiResult.modules.length === 0 && <p>لا توجد توصيات متاحة من المكتبة حالياً.</p>}
                {aiResult.modules.map((module, index) => <div key={module.id} className="rounded-xl border border-slate-700 bg-[#091831] p-4">
                  <strong>{module.title_ar}</strong>
                  {aiResult.reasons[index] && <p className="mt-2 text-sm text-slate-300">{aiResult.reasons[index]}</p>}
                </div>)}
                <h3 className="font-black">خطة مقترحة</h3>
                <ol className="list-inside list-decimal space-y-2 text-slate-200">
                  {aiResult.plan.map((item, index) => <li key={index}>{item}</li>)}
                </ol>
              </div>}
            </div>
            <div className="mb-7 rounded-2xl border border-slate-700 p-6">
              <h2 className="mb-4 text-xl font-black">
                ما الذي تريد تحقيقه؟
              </h2>
              <p className="whitespace-pre-wrap break-words leading-8 text-slate-300">
                {data.project}
              </p>
            </div>

            <div className="mb-8">
              <h2 className="mb-5 text-xl font-black">
                أولويات التعلم المقترحة
              </h2>

              <div className="space-y-4">
                {recommendations.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-4 rounded-2xl border border-slate-700 bg-[#091831] p-5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 font-black">
                      {index + 1}
                    </span>
                    <p className="pt-1 leading-7">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-violet-500/10 p-6 text-center">
              <h2 className="mb-3 text-xl font-black">
                هل أنت مستعد لبدء رحلتك؟
              </h2>

              <p className="mb-5 leading-8 text-slate-300">
                يمكنك إنشاء حساب ثم اختيار اشتراكك.
                يبدأ الوصول إلى الدروس والأنشطة بعد تفعيل الاشتراك.
              </p>

              <Link
                href="/signup"
                className="inline-block rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 px-8 py-4 font-bold"
              >
                إنشاء حساب
              </Link>

              <div className="mt-4">
                <Link
                  href="/pricing"
                  className="text-sm text-violet-300 underline"
                >
                  الاطلاع على الاشتراكات
                </Link>
              </div>
            </div>

            <div className="mt-7 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="rounded-xl border border-slate-600 px-5 py-3"
              >
                تعديل الإجابات
              </button>

              <button
                type="button"
                onClick={restart}
                className="rounded-xl border border-slate-600 px-5 py-3"
              >
                إعادة التشخيص
              </button>
            </div>

            <p className="mt-6 text-center text-xs leading-6 text-slate-500">
              هذه توصيات أولية وليست تقييماً آلياً متقدماً.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}