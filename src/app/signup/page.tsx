import Link from "next/link";

export default function SignupPage() {
  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071127] px-6 py-12 text-white"
    >
      {/* Background */}
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-violet-600/20 blur-[130px]" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-500/20 blur-[130px]" />

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-black">
            D
          </div>

          <div>
            <div className="text-xl font-black tracking-wider">
              DAKAA
            </div>
            <div className="text-xs text-blue-300">
              ذكاء
            </div>
          </div>
        </Link>

        {/* Signup card */}
        <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl sm:p-10">

          <div className="text-center">
            <h1 className="text-3xl font-black">
              أنشئ حسابك
            </h1>

            <p className="mt-3 leading-7 text-slate-400">
              ابدأ رحلتك لتعلم الذكاء الاصطناعي مع DAKAA
            </p>
          </div>

          <form className="mt-8 space-y-5">

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                الاسم الكامل
              </label>

              <input
                type="text"
                placeholder="أدخل اسمك"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1935] px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                البريد الإلكتروني
              </label>

              <input
                type="email"
                placeholder="name@example.com"
                dir="ltr"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1935] px-4 py-4 text-left text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                كلمة المرور
              </label>

              <input
                type="password"
                placeholder="••••••••"
                dir="ltr"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1935] px-4 py-4 text-left text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-l from-violet-600 to-blue-500 py-4 font-bold shadow-xl shadow-violet-500/20 transition hover:-translate-y-0.5"
            >
              إنشاء حساب
            </button>

          </form>

          <div className="mt-7 text-center text-sm text-slate-400">
            لديك حساب بالفعل؟{" "}
            <span className="font-bold text-violet-400">
              تسجيل الدخول
            </span>
          </div>

        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-slate-500 transition hover:text-white"
        >
          ← العودة إلى الصفحة الرئيسية
        </Link>

      </div>
    </main>
  );
}