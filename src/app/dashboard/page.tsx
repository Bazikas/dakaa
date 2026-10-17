"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient, User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Profile = {
  id: string;
  level: string | null;
  profession: string | null;
  goal: string | null;
  daily_time: string | null;
  onboarding_completed: boolean | null;
};

type AssessmentResult = {
  id: string;
  user_id: string;
  score: number;
  max_score: number;
  percentage: number;
  level: string;
  created_at: string;
};

type Lesson = {
  id: string;
  title_ar: string;
  module_id: string;
  position: number;
};

type ProgressRow = {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
};

const levelLabels: Record<string, string> = {
  beginner: "مبتدئ",
  basic: "أساسي",
  intermediate: "متوسط",
  advanced: "متقدم",
};

const professionLabels: Record<string, string> = {
  student: "طالب",
  employee: "موظف",
  entrepreneur: "رائد أعمال",
  teacher: "تعليم وتدريب",
  developer: "برمجة وتقنية",
  marketing: "تسويق ومبيعات",
  finance: "مالية وأعمال",
  other: "مجال آخر",
};

const goalLabels: Record<string, string> = {
  work: "استخدام الذكاء الاصطناعي في العمل",
  productivity: "زيادة الإنتاجية",
  tools: "إتقان أدوات الذكاء الاصطناعي",
  automation: "أتمتة المهام",
  prompting: "إتقان كتابة الأوامر",
  project: "إنشاء مشروع باستخدام AI",
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [assessment, setAssessment] =
    useState<AssessmentResult | null>(null);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /* =========================================================
     Charger Dashboard
  ========================================================= */

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setErrorMessage("");

      /* -----------------------------
         Utilisateur connecté
      ----------------------------- */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setUser(user);

      /* -----------------------------
         Profil
      ----------------------------- */

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, level, profession, goal, daily_time, onboarding_completed"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("DAKAA profile error:", profileError);

        setErrorMessage(
          `تعذر تحميل الملف الشخصي: ${profileError.message}`
        );
      } else {
        setProfile(profileData);
      }

      /* -----------------------------
         Dernier assessment
      ----------------------------- */

      const {
        data: assessmentData,
        error: assessmentError,
      } = await supabase
        .from("assessment_results")
        .select(
          "id, user_id, score, max_score, percentage, level, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (assessmentError) {
        console.error(
          "DAKAA assessment error:",
          assessmentError
        );

        setErrorMessage((current) =>
          current
            ? `${current} | ${assessmentError.message}`
            : `تعذر تحميل نتيجة التقييم: ${assessmentError.message}`
        );
      } else {
        setAssessment(assessmentData);
      }

      /* -----------------------------
         Charger les leçons
      ----------------------------- */

      const {
        data: lessonsData,
        error: lessonsError,
      } = await supabase
        .from("lessons")
        .select("id, title_ar, module_id, position")
        .order("position", {
          ascending: true,
        });

      if (lessonsError) {
        console.error(
          "DAKAA lessons error:",
          lessonsError
        );

        setErrorMessage((current) =>
          current
            ? `${current} | ${lessonsError.message}`
            : `تعذر تحميل الدروس: ${lessonsError.message}`
        );
      } else {
        setLessons((lessonsData ?? []) as Lesson[]);
      }

      /* -----------------------------
         Progression utilisateur
      ----------------------------- */

      const {
        data: progressData,
        error: progressError,
      } = await supabase
        .from("user_lesson_progress")
        .select(
          "lesson_id, completed, completed_at"
        )
        .eq("user_id", user.id);

      if (progressError) {
        console.error(
          "DAKAA progress error:",
          progressError
        );

        setErrorMessage((current) =>
          current
            ? `${current} | ${progressError.message}`
            : `تعذر تحميل تقدمك: ${progressError.message}`
        );
      } else {
        setProgress(
          (progressData ?? []) as ProgressRow[]
        );
      }

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  /* =========================================================
     Déconnexion
  ========================================================= */

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  /* =========================================================
     Loading
  ========================================================= */

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#06142d] to-[#12113d] text-white"
      >
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold">
            D
          </div>

          <div className="mx-auto mb-5 h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-purple-500" />

          <p className="text-slate-400">
            جاري تحميل حسابك...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     Données profil
  ========================================================= */

  const assessmentLevel =
    assessment?.level ||
    profile?.level ||
    "beginner";

  const levelLabel =
    levelLabels[assessmentLevel] ||
    assessmentLevel;

  const professionLabel =
    profile?.profession
      ? professionLabels[profile.profession] ||
        profile.profession
      : "غير محدد";

  const goalLabel =
    profile?.goal
      ? goalLabels[profile.goal] ||
        profile.goal
      : "غير محدد";

  const dailyTime =
    profile?.daily_time
      ? `${profile.daily_time} دقيقة`
      : "غير محدد";

  const score = assessment?.score ?? 0;
  const maxScore = assessment?.max_score ?? 18;
  const percentage = assessment?.percentage ?? 0;

  /* =========================================================
     Progression réelle
  ========================================================= */

  const completedLessonIds = new Set(
    progress
      .filter((item) => item.completed)
      .map((item) => item.lesson_id)
  );

  const completedLessonsCount =
    completedLessonIds.size;

  const totalLessons = lessons.length;

  const learningProgress =
    totalLessons > 0
      ? Math.round(
          (completedLessonsCount /
            totalLessons) *
            100
        )
      : 0;

  /* -----------------------------
     Prochaine leçon
  ----------------------------- */

  const nextLesson = lessons.find(
    (lesson) =>
      !completedLessonIds.has(lesson.id)
  );

  /* -----------------------------
     Nombre de jours d'apprentissage
  ----------------------------- */

  const learningDays = new Set(
    progress
      .filter(
        (item) =>
          item.completed &&
          item.completed_at
      )
      .map((item) =>
        new Date(
          item.completed_at!
        ).toDateString()
      )
  ).size;

  /* =========================================================
     Interface
  ========================================================= */

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#06142d] via-[#081a35] to-[#12113d] text-white"
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-slate-700/60 bg-slate-900/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 font-bold shadow-lg">
              D
            </div>

            <div>
              <h1 className="text-xl font-bold">
                DAKAA
              </h1>

              <p className="text-xs text-blue-300">
                ذكاء
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden text-left sm:block">
              <p className="text-sm text-slate-300">
                مرحباً بك
              </p>

              <p className="text-xs text-slate-500">
                {user?.email}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm transition hover:bg-slate-700/50"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* Welcome */}

        <section className="mb-10">
          <p className="mb-2 text-blue-300">
            مرحباً بك في DAKAA 👋
          </p>

          <h2 className="mb-3 text-3xl font-bold md:text-4xl">
            مسارك الذكي جاهز
          </h2>

          <p className="max-w-2xl text-slate-400">
            قمنا بتحليل مستواك وهدفك لإنشاء تجربة
            تعلم تناسب احتياجاتك.
          </p>
        </section>

        {/* Error */}

        {errorMessage && (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {/* =====================================================
            ASSESSMENT
        ===================================================== */}

        <section className="mb-10 overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-l from-purple-500/10 to-blue-500/10 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="mb-2 text-sm font-bold text-purple-300">
                نتيجة تقييمك
              </p>

              <h3 className="mb-3 text-3xl font-black">
                المستوى: {levelLabel}
              </h3>

              <p className="text-sm text-slate-400">
                تم تحديد مستواك بناءً على إجاباتك
                في اختبار DAKAA.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-black text-blue-300">
                  {percentage}%
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  النتيجة
                </p>
              </div>

              <div className="h-14 w-px bg-slate-700" />

              <div className="text-center">
                <p className="text-3xl font-black">
                  {score}

                  <span className="text-base text-slate-500">
                    /{maxScore}
                  </span>
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  النقاط
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-l from-purple-500 to-blue-500 transition-all duration-700"
                style={{
                  width: `${Math.min(
                    Math.max(
                      percentage,
                      0
                    ),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            PERSONAL DATA
        ===================================================== */}

        <section className="mb-10">
          <h3 className="mb-5 text-xl font-bold">
            مسارك الشخصي
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
              <div className="mb-3 text-2xl">
                💼
              </div>

              <p className="mb-1 text-xs text-slate-500">
                مجالك
              </p>

              <p className="font-bold">
                {professionLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
              <div className="mb-3 text-2xl">
                🎯
              </div>

              <p className="mb-1 text-xs text-slate-500">
                هدفك
              </p>

              <p className="font-bold">
                {goalLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
              <div className="mb-3 text-2xl">
                ⏱️
              </div>

              <p className="mb-1 text-xs text-slate-500">
                وقت التعلم اليومي
              </p>

              <p className="font-bold">
                {dailyTime}
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            LEARNING PROGRESS
        ===================================================== */}

        <section className="mb-10 overflow-hidden rounded-3xl border border-blue-500/20 bg-slate-800/40 p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">
                تقدمك في المسار
              </p>

              <h3 className="mt-1 text-2xl font-black">
                {learningProgress}% مكتمل
              </h3>
            </div>

            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 font-bold text-purple-300">
              {completedLessonsCount} /{" "}
              {totalLessons}
            </div>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-l from-purple-500 to-blue-500 transition-all duration-700"
              style={{
                width: `${learningProgress}%`,
              }}
            />
          </div>

          {learningProgress === 100 &&
            totalLessons > 0 && (
              <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 font-bold text-green-300">
                🎉 أحسنت! لقد أكملت جميع الدروس المتاحة.
              </div>
            )}
        </section>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Lessons */}

          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6">
            <div className="mb-4 text-2xl">
              📚
            </div>

            <p className="mb-3 text-sm text-slate-400">
              الدروس المكتملة
            </p>

            <p className="text-3xl font-bold">
              {completedLessonsCount}

              <span className="mr-2 text-base font-normal text-slate-500">
                / {totalLessons}
              </span>
            </p>
          </div>

          {/* Assessment */}

          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6">
            <div className="mb-4 text-2xl">
              🎯
            </div>

            <p className="mb-3 text-sm text-slate-400">
              نتيجة التقييم
            </p>

            <p className="text-3xl font-bold">
              {percentage}%
            </p>
          </div>

          {/* Learning days */}

          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6">
            <div className="mb-4 text-2xl">
              🔥
            </div>

            <p className="mb-3 text-sm text-slate-400">
              أيام التعلم
            </p>

            <p className="text-3xl font-bold">
              {learningDays}
            </p>
          </div>
        </section>

        {/* =====================================================
            NEXT LESSON
        ===================================================== */}

        <section className="mb-10 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-7">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            {nextLesson ? (
              <>
                <div>
                  <p className="mb-2 text-sm font-bold text-blue-300">
                    الخطوة التالية
                  </p>

                  <h3 className="mb-3 text-2xl font-bold">
                    {completedLessonsCount === 0
                      ? "ابدأ أول درس في مسارك"
                      : "واصل رحلتك التعليمية"}
                  </h3>

                  <p className="mb-2 text-sm text-slate-400">
                    الدرس التالي
                  </p>

                  <p className="font-bold text-purple-300">
                    {nextLesson.title_ar}
                  </p>
                </div>

                <Link
                  href={`/courses/${nextLesson.id}`}
                  className="rounded-xl bg-gradient-to-l from-purple-600 to-blue-500 px-7 py-3 text-center font-bold shadow-lg shadow-purple-500/20 transition hover:scale-[1.02]"
                >
                  {completedLessonsCount === 0
                    ? "ابدأ التعلم"
                    : "متابعة التعلم ←"}
                </Link>
              </>
            ) : totalLessons > 0 ? (
              <>
                <div>
                  <p className="mb-2 text-sm font-bold text-green-300">
                    🎉 أحسنت
                  </p>

                  <h3 className="mb-2 text-2xl font-bold">
                    لقد أكملت جميع الدروس
                  </h3>

                  <p className="text-sm text-slate-400">
                    لقد أنهيت جميع الدروس المتاحة
                    حالياً في DAKAA.
                  </p>
                </div>

                <Link
                  href="/courses"
                  className="rounded-xl border border-green-500/40 bg-green-500/10 px-7 py-3 text-center font-bold text-green-300 transition hover:bg-green-500/20"
                >
                  مراجعة الدروس
                </Link>
              </>
            ) : (
              <div>
                <p className="mb-2 text-sm font-bold text-blue-300">
                  مسارك التعليمي
                </p>

                <h3 className="text-xl font-bold">
                  سيتم إضافة الدروس قريباً
                </h3>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            FEATURES
        ===================================================== */}

        <section>
          <h3 className="mb-6 text-2xl font-bold">
            استكشف DAKAA
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DashboardCard
              href="/courses"
              icon="📚"
              title="الدروس"
              description="ابدأ مسارك التعليمي المخصص حسب مستواك وهدفك."
            />

            <DashboardCard
              href="/exercises"
              icon="🧠"
              title="التمارين"
              description="اختبر معلوماتك من خلال تمارين ذكية وتفاعلية."
            />

            <DashboardCard
              href="/ai"
              icon="✨"
              title="المعلم الذكي"
              description="اسأل DAKAA واحصل على شرح يناسب مستواك."
            />

            <DashboardCard
              href="/progress"
              icon="📈"
              title="تقدمي"
              description="تابع الدروس والنتائج ومستوى تقدمك."
            />

            <DashboardCard
              href="/challenges"
              icon="🏆"
              title="التحديات"
              description="أكمل التحديات واجمع النقاط."
            />

            <DashboardCard
              href="/profile"
              icon="👤"
              title="الملف الشخصي"
              description="إدارة معلومات حسابك وإعدادات التعلم."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   Dashboard Card
========================================================= */

function DashboardCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-700 bg-slate-800/60 p-7 transition hover:-translate-y-1 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/5"
    >
      <div className="mb-5 text-4xl">
        {icon}
      </div>

      <h4 className="mb-2 text-xl font-bold transition group-hover:text-purple-300">
        {title}
      </h4>

      <p className="text-sm leading-7 text-slate-400">
        {description}
      </p>
    </Link>
  );
}