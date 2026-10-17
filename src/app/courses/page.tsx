"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Lesson = {
  id: string;
  module_id: string;
  title_ar: string;
  description_ar: string | null;
  duration_minutes: number;
  position: number;
};

type ModuleRow = {
  id: string;
  title_ar: string;
  description_ar: string | null;
  icon: string | null;
  level: string;
  position: number;
};

type Module = ModuleRow & {
  lessons: Lesson[];
};

export default function CoursesPage() {
  const router = useRouter();

  const [modules, setModules] = useState<Module[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        setErrorMessage("");

        // 1. Vérifier l'utilisateur connecté
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        // 2. Charger les modules
        const { data: modulesData, error: modulesError } =
          await supabase
            .from("modules")
            .select(`
              id,
              title_ar,
              description_ar,
              icon,
              level,
              position
            `)
            .order("position", { ascending: true });

        if (modulesError) {
          console.error("MODULES ERROR:", modulesError);

          setErrorMessage(
            `خطأ في تحميل الوحدات: ${modulesError.message}`
          );

          setLoading(false);
          return;
        }

        // 3. Charger les leçons
        const { data: lessonsData, error: lessonsError } =
          await supabase
            .from("lessons")
            .select(`
              id,
              module_id,
              title_ar,
              description_ar,
              duration_minutes,
              position
            `)
            .order("position", { ascending: true });

        if (lessonsError) {
          console.error("LESSONS ERROR:", lessonsError);

          setErrorMessage(
            `خطأ في تحميل الدروس: ${lessonsError.message}`
          );

          setLoading(false);
          return;
        }

        // 4. Charger la progression de l'utilisateur
        const { data: progressData, error: progressError } =
          await supabase
            .from("user_lesson_progress")
            .select("lesson_id, completed")
            .eq("user_id", user.id)
            .eq("completed", true);

        if (progressError) {
          console.error("PROGRESS ERROR:", progressError);

          setErrorMessage(
            `خطأ في تحميل تقدمك: ${progressError.message}`
          );

          setLoading(false);
          return;
        }

        const completedIds =
          progressData?.map((item) => item.lesson_id) ?? [];

        setCompletedLessons(completedIds);

        // 5. Relier les leçons aux modules
        const formattedModules: Module[] = (
          (modulesData ?? []) as ModuleRow[]
        ).map((module) => ({
          ...module,

          lessons: ((lessonsData ?? []) as Lesson[])
            .filter(
              (lesson) => lesson.module_id === module.id
            )
            .sort((a, b) => a.position - b.position),
        }));

        setModules(formattedModules);
        setLoading(false);
      } catch (error) {
        console.error("DAKAA COURSES ERROR:", error);

        setErrorMessage(
          "حدث خطأ غير متوقع أثناء تحميل الدروس."
        );

        setLoading(false);
      }
    }

    loadCourses();
  }, [router]);

  // Toutes les leçons dans l'ordre général
  const allLessons = modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      modulePosition: module.position,
    }))
  );

  const totalLessons = allLessons.length;

  const completedCount = allLessons.filter((lesson) =>
    completedLessons.includes(lesson.id)
  ).length;

  const progressPercentage =
    totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0;

  // Première leçon non terminée = prochaine leçon accessible
  const nextLesson = allLessons.find(
    (lesson) => !completedLessons.includes(lesson.id)
  );

  function isLessonCompleted(lessonId: string) {
    return completedLessons.includes(lessonId);
  }

  function isLessonUnlocked(lessonId: string) {
    // Une leçon terminée reste accessible
    if (completedLessons.includes(lessonId)) {
      return true;
    }

    // La prochaine leçon est accessible
    if (nextLesson?.id === lessonId) {
      return true;
    }

    return false;
  }

  function isModuleCompleted(module: Module) {
    if (module.lessons.length === 0) {
      return false;
    }

    return module.lessons.every((lesson) =>
      completedLessons.includes(lesson.id)
    );
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#061127] text-white"
      >
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-purple-500" />

          <p className="text-slate-400">
            جاري تحميل مسارك التعليمي...
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

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
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

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            العودة للرئيسية
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        {/* Intro */}
        <section className="mb-8">
          <div className="mb-3 text-sm font-bold text-blue-300">
            مسارك التعليمي
          </div>

          <h1 className="mb-4 text-3xl font-black md:text-4xl">
            ابدأ رحلتك في الذكاء الاصطناعي
          </h1>

          <p className="max-w-2xl leading-8 text-slate-400">
            تعلم خطوة بخطوة من خلال دروس قصيرة وعملية مصممة
            لمساعدتك على تطوير مهاراتك في الذكاء الاصطناعي.
          </p>
        </section>

        {/* Progression globale */}
        {!errorMessage && totalLessons > 0 && (
          <section className="mb-10 rounded-3xl border border-slate-700/80 bg-slate-800/40 p-6 md:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">
                  تقدمك في المسار
                </p>

                <h2 className="mt-1 text-xl font-black">
                  {progressPercentage}% مكتمل
                </h2>
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 font-bold text-purple-300">
                {completedCount} / {totalLessons}
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-l from-purple-500 to-blue-500 transition-all duration-500"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>

            {progressPercentage === 100 && (
              <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
                🎉 أحسنت! لقد أكملت جميع الدروس المتاحة.
              </div>
            )}
          </section>
        )}

        {/* Erreur */}
        {errorMessage && (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="mb-2 font-bold text-red-300">
              تعذر تحميل المحتوى
            </p>

            <p className="text-sm text-red-200">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Aucun module */}
        {!errorMessage && modules.length === 0 && (
          <div className="rounded-3xl border border-slate-700 bg-slate-800/40 p-10 text-center">
            <div className="mb-4 text-4xl">
              📚
            </div>

            <h2 className="mb-2 text-xl font-bold">
              لا توجد دروس حالياً
            </h2>

            <p className="text-slate-400">
              سيتم إضافة محتوى جديد قريباً.
            </p>
          </div>
        )}

        {/* Modules */}
        <div className="space-y-8">
          {modules.map((module, moduleIndex) => {
            const totalMinutes = module.lessons.reduce(
              (total, lesson) =>
                total + (lesson.duration_minutes || 0),
              0
            );

            const moduleCompleted =
              isModuleCompleted(module);

            const moduleCompletedCount =
              module.lessons.filter((lesson) =>
                completedLessons.includes(lesson.id)
              ).length;

            return (
              <section
                key={module.id}
                className={`overflow-hidden rounded-3xl border bg-slate-800/40 shadow-xl ${
                  moduleCompleted
                    ? "border-green-500/30"
                    : "border-slate-700/80"
                }`}
              >
                {/* Module header */}
                <div className="border-b border-slate-700/70 bg-gradient-to-l from-purple-500/10 to-blue-500/10 p-6 md:p-8">
                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-2xl ${
                          moduleCompleted
                            ? "border-green-500/30 bg-green-500/10"
                            : "border-purple-500/20 bg-purple-500/10"
                        }`}
                      >
                        {moduleCompleted
                          ? "✓"
                          : module.icon || "📚"}
                      </div>

                      <div>
                        <div className="mb-2 flex items-center gap-3 text-xs font-bold text-purple-400">
                          <span>
                            الوحدة {moduleIndex + 1}
                          </span>

                          {moduleCompleted && (
                            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-green-300">
                              مكتملة ✓
                            </span>
                          )}
                        </div>

                        <h2 className="mb-2 text-xl font-black md:text-2xl">
                          {module.title_ar}
                        </h2>

                        {module.description_ar && (
                          <p className="max-w-2xl leading-7 text-slate-400">
                            {module.description_ar}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-3">
                      <div className="rounded-xl border border-slate-700 bg-[#091831]/70 px-4 py-3 text-center">
                        <div className="font-bold">
                          {moduleCompletedCount}/
                          {module.lessons.length}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          دروس مكتملة
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-700 bg-[#091831]/70 px-4 py-3 text-center">
                        <div className="font-bold">
                          {totalMinutes}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          دقيقة
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lessons */}
                <div className="p-5 md:p-7">
                  {module.lessons.length === 0 ? (
                    <div className="rounded-2xl border border-slate-700 bg-[#091831]/60 p-6 text-center text-slate-400">
                      لا توجد دروس في هذه الوحدة.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {module.lessons.map(
                        (lesson, lessonIndex) => {
                          const lessonCompleted =
                            isLessonCompleted(
                              lesson.id
                            );

                          const lessonUnlocked =
                            isLessonUnlocked(
                              lesson.id
                            );

                          const isNextLesson =
                            nextLesson?.id ===
                            lesson.id;

                          const lessonContent = (
                            <>
                              <div className="flex items-center gap-4">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-bold ${
                                    lessonCompleted
                                      ? "border-green-500/40 bg-green-500/10 text-green-300"
                                      : isNextLesson
                                      ? "border-purple-500 bg-purple-500/10 text-purple-300"
                                      : "border-slate-700 bg-slate-800 text-slate-500"
                                  }`}
                                >
                                  {lessonCompleted
                                    ? "✓"
                                    : lessonUnlocked
                                    ? lessonIndex + 1
                                    : "🔒"}
                                </div>

                                <div>
                                  <h3
                                    className={`font-bold ${
                                      lessonCompleted
                                        ? "text-green-300"
                                        : lessonUnlocked
                                        ? "text-white"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {lesson.title_ar}
                                  </h3>

                                  {lesson.description_ar && (
                                    <p className="mt-1 hidden text-sm text-slate-500 sm:block">
                                      {
                                        lesson.description_ar
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-4">
                                {lessonCompleted ? (
                                  <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">
                                    مكتمل ✓
                                  </span>
                                ) : isNextLesson ? (
                                  <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
                                    ابدأ الدرس
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-600">
                                    مقفل 🔒
                                  </span>
                                )}

                                <span className="hidden text-xs text-slate-500 sm:block">
                                  {
                                    lesson.duration_minutes
                                  }{" "}
                                  دقيقة
                                </span>

                                {lessonUnlocked && (
                                  <span className="text-lg text-slate-500">
                                    ←
                                  </span>
                                )}
                              </div>
                            </>
                          );

                          if (lessonUnlocked) {
                            return (
                              <Link
                                key={lesson.id}
                                href={`/courses/${lesson.id}`}
                                className={`group flex items-center justify-between gap-4 rounded-2xl border p-5 transition ${
                                  lessonCompleted
                                    ? "border-green-500/20 bg-green-500/5 hover:border-green-500/50"
                                    : "border-purple-500/30 bg-[#091831]/60 hover:border-purple-500 hover:bg-purple-500/5"
                                }`}
                              >
                                {lessonContent}
                              </Link>
                            );
                          }

                          return (
                            <div
                              key={lesson.id}
                              className="flex cursor-not-allowed items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#071329]/50 p-5 opacity-60"
                            >
                              {lessonContent}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}