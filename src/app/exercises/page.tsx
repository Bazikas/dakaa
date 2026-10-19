"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Module = {
  id: string;
  title_ar: string;
  position: number;
};

type Lesson = {
  id: string;
  module_id: string;
  title_ar: string;
  position: number;
};

type Question = {
  id: string;
  lesson_id: string;
};

export default function ExercisesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [selectedModule, setSelectedModule] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadExercises() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          window.location.href = "/login";
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

        const [
          modulesResult,
          lessonsResult,
          questionsResult
        ] = await Promise.all([
          supabase
            .from("modules")
            .select("id,title_ar,position")
            .order("position"),

          supabase
            .from("lessons")
            .select("id,module_id,title_ar,position")
            .order("position"),

          supabase
            .from("lesson_questions")
            .select("id,lesson_id")
        ]);

        if (modulesResult.error) {
          throw modulesResult.error;
        }

        if (lessonsResult.error) {
          throw lessonsResult.error;
        }

        if (questionsResult.error) {
          throw questionsResult.error;
        }

        if (!active) return;

        setModules((modulesResult.data ?? []) as Module[]);
        setLessons((lessonsResult.data ?? []) as Lesson[]);
        setQuestions((questionsResult.data ?? []) as Question[]);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء تحميل التمارين."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadExercises();

    return () => {
      active = false;
    };
  }, []);

  const visibleModules = selectedModule
    ? modules.filter((module) => module.id === selectedModule)
    : modules;

  const countQuestions = (lessonId: string) =>
    questions.filter((question) => question.lesson_id === lessonId).length;

  const totalExercises = questions.length;

  const lessonsWithExercises = lessons.filter(
    (lesson) => countQuestions(lesson.id) > 0
  ).length;

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
          <div className="mb-5 text-5xl">🧠</div>

          <h1 className="mb-4 text-4xl font-black">
            مركز التمارين
          </h1>

          <p className="max-w-2xl text-lg leading-9 text-slate-300">
            اختبر معلوماتك في الذكاء الاصطناعي من خلال
            تمارين تفاعلية مرتبطة بدروس DAKAA.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#101f42] p-5">
              <p className="text-sm text-slate-400">الوحدات التعليمية</p>
              <p className="mt-2 text-3xl font-black text-purple-300">
                {modules.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#101f42] p-5">
              <p className="text-sm text-slate-400">الدروس التي تحتوي على تمارين</p>
              <p className="mt-2 text-3xl font-black text-blue-300">
                {lessonsWithExercises}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#101f42] p-5">
              <p className="text-sm text-slate-400">الأسئلة المتاحة</p>
              <p className="mt-2 text-3xl font-black text-green-300">
                {totalExercises}
              </p>
            </div>
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            جاري تحميل التمارين...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="mb-8">
              <label
                htmlFor="module"
                className="mb-3 block text-lg font-bold"
              >
                اختر الوحدة التعليمية
              </label>

              <select
                id="module"
                value={selectedModule}
                onChange={(event) => setSelectedModule(event.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-[#101f42] p-4 text-white outline-none focus:border-purple-500"
              >
                <option value="">جميع الوحدات</option>

                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title_ar}
                  </option>
                ))}
              </select>
            </section>

            <div className="space-y-8">
              {visibleModules.map((module) => {
                const moduleLessons = lessons.filter(
                  (lesson) =>
                    lesson.module_id === module.id &&
                    countQuestions(lesson.id) > 0
                );

                if (moduleLessons.length === 0) return null;

                return (
                  <section
                    key={module.id}
                    className="overflow-hidden rounded-3xl border border-slate-700 bg-[#101f42]/70"
                  >
                    <div className="border-b border-slate-700 bg-purple-500/10 p-6">
                      <h2 className="text-2xl font-black">
                        {module.title_ar}
                      </h2>

                      <p className="mt-2 text-sm text-slate-400">
                        {moduleLessons.length} دروس تحتوي على تمارين
                      </p>
                    </div>

                    <div className="grid gap-4 p-6 md:grid-cols-2">
                      {moduleLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="rounded-2xl border border-slate-700 bg-[#07142e] p-6 transition hover:border-purple-500"
                        >
                          <h3 className="mb-3 text-lg font-bold leading-8">
                            {lesson.title_ar}
                          </h3>

                          <p className="mb-5 text-sm text-slate-400">
                            {countQuestions(lesson.id)} أسئلة
                          </p>

                          <Link
                            href={`/courses/${lesson.id}`}
                            className="inline-flex rounded-xl bg-gradient-to-l from-purple-600 to-blue-600 px-5 py-3 font-bold transition hover:opacity-90"
                          >
                            ابدأ التمرين ←
                          </Link>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            {lessonsWithExercises === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
                لا توجد تمارين متاحة حالياً.
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
