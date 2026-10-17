"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

/* =====================================================
   TYPES
===================================================== */

type Module = {
  id: string;
  title_ar: string;
  description_ar: string | null;
  icon: string | null;
  position: number;
};

type Lesson = {
  id: string;
  module_id: string;
  title_ar: string;
  description_ar: string | null;
  duration_minutes: number | null;
  position: number;
};

type LessonProgress = {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
};

type Assessment = {
  score: number;
  max_score: number;
  percentage: number;
  level: string;
};

type ModuleWithProgress = Module & {
  lessons: Lesson[];
  completedCount: number;
  percentage: number;
};

/* =====================================================
   LABELS
===================================================== */

const levelLabels: Record<string, string> = {
  beginner: "مبتدئ",
  basic: "أساسي",
  intermediate: "متوسط",
  advanced: "متقدم",
};

/* =====================================================
   PAGE
===================================================== */

export default function ProgressPage() {
  const router = useRouter();

  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /* =====================================================
     CHARGEMENT SUPABASE
  ===================================================== */

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const [
          modulesResult,
          lessonsResult,
          progressResult,
          assessmentResult,
        ] = await Promise.all([
          supabase
            .from("modules")
            .select(
              "id, title_ar, description_ar, icon, position"
            )
            .order("position", { ascending: true }),

          supabase
            .from("lessons")
            .select(
              "id, module_id, title_ar, description_ar, duration_minutes, position"
            )
            .order("position", { ascending: true }),

          supabase
            .from("user_lesson_progress")
            .select("lesson_id, completed, completed_at")
            .eq("user_id", user.id),

          supabase
            .from("assessment_results")
            .select("score, max_score, percentage, level")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (!active) return;

        const errors = [
          modulesResult.error,
          lessonsResult.error,
          progressResult.error,
          assessmentResult.error,
        ].filter(Boolean);

        if (errors.length > 0) {
          setErrorMessage(
            errors.map((error) => error?.message).join(" | ")
          );
          return;
        }

        setModules(modulesResult.data ?? []);
        setLessons(lessonsResult.data ?? []);
        setProgress(progressResult.data ?? []);
        setAssessment(assessmentResult.data ?? null);
      } catch (error) {
        console.error("DAKAA PROGRESS ERROR:", error);

        if (active) {
          setErrorMessage(
            "حدث خطأ غير متوقع أثناء تحميل تقدمك."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      active = false;
    };
  }, [router]);

  /* =====================================================
     CALCUL DES STATISTIQUES
  ===================================================== */

  const completedIds = useMemo(() => {
    return new Set(
      progress
        .filter((item) => item.completed)
        .map((item) => item.lesson_id)
    );
  }, [progress]);

  const totalLessons = lessons.length;

  const completedLessons = lessons.filter((lesson) =>
    completedIds.has(lesson.id)
  ).length;

  const remainingLessons = totalLessons - completedLessons;

  const percentage =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  const totalMinutes = lessons.reduce(
    (sum, lesson) => sum + (lesson.duration_minutes ?? 0),
    0
  );

  const completedMinutes = lessons
    .filter((lesson) => completedIds.has(lesson.id))
    .reduce(
      (sum, lesson) => sum + (lesson.duration_minutes ?? 0),
      0
    );

  // Nombre de dates distinctes avec une leçon terminée.
  // Ce n'est pas une mesure du temps réellement passé.
  const learningDays = new Set(
    progress
      .filter(
        (item) =>
          item.completed &&
          item.completed_at &&
          completedIds.has(item.lesson_id)
      )
      .map((item) => item.completed_at!.slice(0, 10))
  ).size;

  /* =====================================================
     PROGRESSION PAR MODULE
  ===================================================== */

  const modulesWithProgress: ModuleWithProgress[] =
    useMemo(() => {
      return modules.map((module) => {
        const moduleLessons = lessons
          .filter((lesson) => lesson.module_id === module.id)
          .sort((a, b) => a.position - b.position);

        const completedCount = moduleLessons.filter(
          (lesson) => completedIds.has(lesson.id)
        ).length;

        const modulePercentage =
          moduleLessons.length > 0
            ? Math.round(
                (completedCount / moduleLessons.length) * 100
              )
            : 0;

        return {
          ...module,
          lessons: moduleLessons,
          completedCount,
          percentage: modulePercentage,
        };
      });
    }, [modules, lessons, completedIds]);

  /* =====================================================
     PROCHAINE LEÇON
  ===================================================== */

  const nextLesson = useMemo(() => {
    for (const module of modulesWithProgress) {
      const lesson = module.lessons.find(
        (item) => !completedIds.has(item.id)
      );

      if (lesson) {
        return lesson;
      }
    }

    return null;
  }, [modulesWithProgress, completedIds]);

  /* =====================================================
     DERNIÈRE LEÇON TERMINÉE
  ===================================================== */

  const lastCompleted = useMemo(() => {
    return [...progress]
      .filter(
        (item) =>
          item.completed &&
          item.completed_at &&
          completedIds.has(item.lesson_id)
      )
      .sort(
        (a, b) =>
          new Date(b.completed_at!).getTime() -
          new Date(a.completed_at!).getTime()
      )[0];
  }, [progress, completedIds]);

  const lastCompletedLesson = lessons.find(
    (lesson) => lesson.id === lastCompleted?.lesson_id
  );

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#061127] text-white"
      >
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-black">
            D
          </div>

          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-purple-500" />

          <p className="text-slate-400">
            جاري تحليل تقدمك التعليمي...
          </p>
        </div>
      </main>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (errorMessage) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#061127] px-5 text-white"
      >
        <div className="w-full max-w-xl rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <div className="mb-4 text-4xl">⚠️</div>

          <h1 className="mb-4 text-2xl font-bold">
            تعذر تحميل تقدمك
          </h1>

          <p className="mb-6 break-words text-sm text-red-200">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-gradient-to-l from-purple-600 to-blue-500 px-6 py-3 font-bold"
          >
            إعادة المحاولة
          </button>
        </div>
      </main>
    );
  }

  /* =====================================================
     INTERFACE
  ===================================================== */

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#06142d] via-[#081a35] to-[#12113d] text-white"
    >
      {/* HEADER */}

      <header className="border-b border-slate-700/60 bg-slate-900/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">

          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 font-black">
              D
            </div>

            <div>
              <h1 className="text-xl font-black">
                DAKAA
              </h1>

              <p className="text-xs text-blue-300">
                ذكاء
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-700 px-5 py-2 text-sm text-slate-300 transition hover:border-purple-500 hover:text-white"
          >
            العودة للرئيسية
          </Link>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-12">

        {/* INTRODUCTION */}

        <section className="mb-12">

          <p className="mb-3 font-bold text-purple-400">
            رحلتك التعليمية مع DAKAA
          </p>

          <h2 className="mb-4 text-4xl font-black md:text-5xl">
            📈 تقدمي التعليمي
          </h2>

          <p className="max-w-2xl leading-8 text-slate-400">
            اكتشف إنجازاتك، تابع تطور مهاراتك،
            واستمر في رحلتك لإتقان الذكاء الاصطناعي.
          </p>

        </section>

        {/* STATISTIQUES */}

        <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            icon="📚"
            title="الدروس المكتملة"
            value={`${completedLessons} / ${totalLessons}`}
            subtitle="عدد الدروس التي أنهيتها"
          />

          <StatCard
            icon="📊"
            title="نسبة الإنجاز"
            value={`${percentage}%`}
            subtitle="تقدمك في المسار التعليمي"
          />

          <StatCard
            icon="🔥"
            title="أيام التعلم"
            value={`${learningDays}`}
            subtitle="أيام أكملت فيها دروساً"
          />

          <StatCard
            icon="🎯"
            title="نتيجة التقييم"
            value={
              assessment
                ? `${assessment.percentage}%`
                : "—"
            }
            subtitle={
              assessment
                ? `المستوى: ${
                    levelLabels[assessment.level] ??
                    assessment.level
                  }`
                : "لم يتم إجراء التقييم"
            }
          />

        </section>

        {/* PROGRESSION GLOBALE */}

        <section className="mb-10 overflow-hidden rounded-3xl border border-blue-500/20 bg-slate-800/50 p-7 md:p-9">

          <div className="mb-7 flex flex-wrap items-center justify-between gap-5">

            <div>
              <p className="mb-2 text-sm text-blue-300">
                تقدمك في المسار
              </p>

              <h3 className="text-4xl font-black">
                {percentage}%
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                {completedLessons} من أصل {totalLessons} درساً
              </p>
            </div>

            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 px-6 py-4 text-center">

              <p className="text-2xl font-black text-purple-300">
                {remainingLessons}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                دروس متبقية
              </p>

            </div>

          </div>

          <div
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="نسبة التقدم التعليمي"
            className="h-4 overflow-hidden rounded-full bg-slate-700"
          >
            <div
              className="h-full rounded-full bg-gradient-to-l from-purple-500 to-blue-500 transition-all duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {totalLessons > 0 && percentage === 100 && (
            <div className="mt-7 rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-green-300">

              <p className="mb-2 text-lg font-black">
                🎉 أحسنت! لقد أكملت جميع الدروس المتاحة
              </p>

              <p className="text-sm">
                يمكنك مراجعة الدروس لتثبيت معلوماتك
                والاستعداد للتحديات القادمة.
              </p>

            </div>
          )}

        </section>

        {/* ACTIVITÉ */}

        <section className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-2">

          <div className="rounded-3xl border border-slate-700 bg-slate-800/40 p-7">

            <p className="mb-3 text-sm text-slate-400">
              ⏱️ المدة التقديرية للدروس المكتملة
            </p>

            <h3 className="text-3xl font-black">
              {completedMinutes} دقيقة
            </h3>

            <p className="mt-3 text-sm text-slate-500">
              من أصل {totalMinutes} دقيقة تقديرية
            </p>

            <p className="mt-2 text-xs text-slate-500">
              هذه المدة تقديرية وليست وقت الاستخدام الفعلي.
            </p>

          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-800/40 p-7">

            <p className="mb-3 text-sm text-slate-400">
              🕒 آخر درس أكملته
            </p>

            <h3 className="text-xl font-black">
              {lastCompletedLesson?.title_ar ??
                "لم تكمل أي درس بعد"}
            </h3>

            {lastCompleted?.completed_at && (
              <p className="mt-3 text-sm text-slate-400">
                {new Date(
                  lastCompleted.completed_at
                ).toLocaleDateString("ar", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </p>
            )}

          </div>

        </section>

        {/* PROCHAINE ACTION */}

        <section className="mb-12 rounded-3xl border border-purple-500/30 bg-gradient-to-l from-purple-500/10 to-blue-500/10 p-7 md:p-9">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

            <div>

              <p className="mb-3 text-sm font-bold text-purple-300">
                🚀 الخطوة التالية
              </p>

              <h3 className="mb-3 text-2xl font-black">
                {nextLesson
                  ? "تابع رحلتك التعليمية"
                  : totalLessons > 0
                  ? "لقد أكملت جميع الدروس!"
                  : "ابدأ رحلتك التعليمية"}
              </h3>

              <p className="max-w-xl leading-7 text-slate-400">
                {nextLesson
                  ? `درسك التالي: ${nextLesson.title_ar}`
                  : totalLessons > 0
                  ? "راجع ما تعلمته واستعد لاكتساب مهارات جديدة."
                  : "اكتشف الدروس المتاحة وابدأ التعلم."}
              </p>

            </div>

            <Link
              href={
                nextLesson
                  ? `/courses/${nextLesson.id}`
                  : "/courses"
              }
              className="shrink-0 rounded-xl bg-gradient-to-l from-purple-600 to-blue-500 px-7 py-4 text-center font-black transition hover:opacity-90"
            >
              {nextLesson
                ? "متابعة التعلم ←"
                : "مراجعة الدروس"}
            </Link>

          </div>

        </section>

        {/* MODULES */}

        <section className="mb-12">

          <div className="mb-7">
            <p className="mb-2 text-sm font-bold text-purple-400">
              تفاصيل المسار
            </p>

            <h3 className="text-3xl font-black">
              📚 تقدمي حسب الوحدات
            </h3>
          </div>

          <div className="space-y-7">

            {modulesWithProgress.map((module, moduleIndex) => (
              <div
                key={module.id}
                className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-800/40"
              >

                {/* MODULE HEADER */}

                <div className="border-b border-slate-700 bg-gradient-to-l from-purple-500/10 to-blue-500/10 p-6 md:p-8">

                  <div className="flex flex-wrap items-center justify-between gap-5">

                    <div className="flex items-center gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-3xl">
                        {module.icon || "📚"}
                      </div>

                      <div>

                        <p className="mb-1 text-xs font-bold text-purple-400">
                          الوحدة {moduleIndex + 1}
                        </p>

                        <h4 className="text-xl font-black">
                          {module.title_ar}
                        </h4>

                        {module.description_ar && (
                          <p className="mt-2 text-sm leading-7 text-slate-400">
                            {module.description_ar}
                          </p>
                        )}

                      </div>

                    </div>

                    <div className="text-center">

                      <p className="text-2xl font-black text-blue-300">
                        {module.percentage}%
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {module.completedCount} / {module.lessons.length}
                      </p>

                    </div>

                  </div>

                  <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-700">

                    <div
                      className="h-full rounded-full bg-gradient-to-l from-purple-500 to-blue-500"
                      style={{
                        width: `${module.percentage}%`,
                      }}
                    />

                  </div>

                  {module.lessons.length > 0 &&
                    module.percentage === 100 && (
                      <p className="mt-4 text-sm font-bold text-green-400">
                        🏆 لقد أكملت هذه الوحدة
                      </p>
                    )}

                </div>

                {/* LESSONS */}

                <div className="space-y-3 p-5 md:p-7">

                  {module.lessons.map((lesson, index) => {
                    const isCompleted = completedIds.has(
                      lesson.id
                    );

                    const completion = progress.find(
                      (item) =>
                        item.lesson_id === lesson.id &&
                        item.completed
                    );

                    return (
                      <Link
                        key={lesson.id}
                        href={`/courses/${lesson.id}`}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-[#091831]/60 p-5 transition hover:border-purple-500/60"
                      >

                        <div className="flex items-center gap-4">

                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold ${
                              isCompleted
                                ? "bg-green-500/10 text-green-400"
                                : "bg-purple-500/10 text-purple-300"
                            }`}
                          >
                            {isCompleted ? "✓" : index + 1}
                          </div>

                          <div>

                            <h5 className="font-bold">
                              {lesson.title_ar}
                            </h5>

                            {lesson.description_ar && (
                              <p className="mt-1 text-sm text-slate-400">
                                {lesson.description_ar}
                              </p>
                            )}

                            {isCompleted &&
                              completion?.completed_at && (
                                <p className="mt-2 text-xs text-green-400/80">
                                  تاريخ الإكمال:{" "}
                                  {new Date(
                                    completion.completed_at
                                  ).toLocaleDateString("ar", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    timeZone: "UTC",
                                  })}
                                </p>
                              )}

                          </div>

                        </div>

                        <span
                          className={`rounded-xl px-4 py-2 text-xs font-bold ${
                            isCompleted
                              ? "bg-green-500/10 text-green-300"
                              : "bg-slate-700/60 text-slate-400"
                          }`}
                        >
                          {isCompleted
                            ? "مكتمل ✓"
                            : "غير مكتمل"}
                        </span>

                      </Link>
                    );
                  })}

                  {module.lessons.length === 0 && (
                    <p className="py-5 text-center text-slate-400">
                      لا توجد دروس في هذه الوحدة حالياً.
                    </p>
                  )}

                </div>

              </div>
            ))}

            {modulesWithProgress.length === 0 && (
              <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-8 text-center text-slate-400">
                لا توجد وحدات تعليمية متاحة حالياً.
              </div>
            )}

          </div>

        </section>

        {/* FOOTER */}

        <div className="border-t border-slate-800 pt-10 text-center">

          <Link
            href="/dashboard"
            className="inline-block rounded-xl border border-slate-700 px-8 py-4 font-bold transition hover:border-purple-500"
          >
            العودة إلى لوحة التحكم
          </Link>

        </div>

      </div>
    </main>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 transition hover:border-purple-500/40">

      <div className="mb-4 text-3xl">
        {icon}
      </div>

      <p className="mb-2 text-sm text-slate-400">
        {title}
      </p>

      <p className="text-3xl font-black">
        {value}
      </p>

      <p className="mt-3 text-xs leading-6 text-slate-500">
        {subtitle}
      </p>

    </div>
  );
}