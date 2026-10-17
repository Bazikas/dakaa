"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient, User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const subjects = [
  {
    id: "languages",
    icon: "🌍",
    title: "اللغات",
    description: "تعلم اللغات بطريقة تفاعلية تناسب مستواك.",
    href: "/courses/languages",
  },
  {
    id: "math",
    icon: "➗",
    title: "الرياضيات",
    description: "طور مهاراتك في الحساب والجبر والهندسة.",
    href: "/courses/math",
  },
  {
    id: "programming",
    icon: "💻",
    title: "البرمجة",
    description: "تعلم البرمجة والتقنيات الرقمية خطوة بخطوة.",
    href: "/courses/programming",
  },
  {
    id: "science",
    icon: "🔬",
    title: "العلوم",
    description: "اكتشف الفيزياء والكيمياء وعلوم الحياة.",
    href: "/courses/science",
  },
  {
    id: "skills",
    icon: "🎯",
    title: "تطوير المهارات",
    description: "طور مهاراتك المهنية والشخصية.",
    href: "/courses/skills",
  },
  {
    id: "other",
    icon: "✨",
    title: "مجالات أخرى",
    description: "اكتشف مجالات تعليمية إضافية مع DAKAA.",
    href: "/courses/other",
  },
];

export default function CoursesPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUser(user);
      setLoading(false);
    }

    checkUser();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-[#06142d] to-[#12113d] text-white flex items-center justify-center"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
            D
          </div>

          <p className="text-slate-400">
            جاري تحميل الدروس...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#06142d] via-[#081a35] to-[#12113d] text-white"
    >
      {/* Header */}
      <header className="border-b border-slate-700/60 bg-slate-900/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold shadow-lg">
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

          {/* User */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <p className="text-sm text-slate-300">
                مرحباً بك
              </p>

              <p className="text-xs text-slate-500">
                {user?.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm hover:bg-slate-700/50 transition"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-10">

        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8"
        >
          → العودة إلى لوحة التحكم
        </Link>

        {/* Title */}
        <section className="mb-10">
          <p className="text-blue-300 mb-2">
            📚 مسارات التعلم
          </p>

          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            ماذا تريد أن تتعلم؟
          </h2>

          <p className="text-slate-400 max-w-2xl">
            اختر المجال الذي تريد تعلمه وسيساعدك DAKAA
            على بناء مسار تعليمي يناسب مستواك وأهدافك.
          </p>
        </section>

        {/* Subjects */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={subject.href}
              className="group bg-slate-800/60 border border-slate-700 rounded-3xl p-7 hover:border-purple-500 hover:bg-slate-800/80 transition"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="text-4xl">
                  {subject.icon}
                </div>

                <div className="text-slate-500 group-hover:text-purple-300 transition">
                  ←
                </div>
              </div>

              <h3 className="text-xl font-bold mb-3 group-hover:text-purple-300 transition">
                {subject.title}
              </h3>

              <p className="text-slate-400 text-sm leading-7">
                {subject.description}
              </p>
            </Link>
          ))}
        </section>

        {/* AI suggestion */}
        <section className="mt-10 bg-gradient-to-l from-purple-600/20 to-blue-500/20 border border-purple-500/20 rounded-3xl p-7">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">

            <div>
              <p className="text-purple-300 text-sm mb-2">
                ✨ DAKAA AI
              </p>

              <h3 className="text-xl font-bold mb-2">
                لا تعرف من أين تبدأ؟
              </h3>

              <p className="text-slate-400 text-sm">
                لاحقاً سيقوم DAKAA بتحليل مستواك وأهدافك
                واقتراح أفضل مسار تعليمي لك.
              </p>
            </div>

            <div className="rounded-xl bg-slate-900/40 border border-slate-700 px-5 py-3 text-sm text-slate-400">
              قريباً
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}