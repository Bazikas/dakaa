"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { syncPublicDiagnostic } from "@/lib/diagnostic-sync";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (name.trim().length < 2) {
      setErrorMessage("يرجى إدخال الاسم الكامل.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
          emailRedirectTo:
            window.location.origin + "/pricing",
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (!data.user) {
        setErrorMessage("تعذر إنشاء الحساب. حاول مرة أخرى.");
        return;
      }

      if (!data.session) {
        setSuccessMessage(
          "تم استلام طلب التسجيل. تحقق من بريدك الإلكتروني لتأكيد الحساب، ثم سجل الدخول."
        );
        return;
      }

            try { await syncPublicDiagnostic(supabase); }
      catch (syncError) { console.error("Diagnostic sync:", syncError); }
      setSuccessMessage("تم إنشاء الحساب بنجاح.");

      router.push("/pricing");
      router.refresh();

    } catch (error) {
      console.error("DAKAA SIGNUP ERROR:", error);

      setErrorMessage(
        "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071127] px-6 py-12 text-white"
    >
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-violet-600/20 blur-[130px]" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-500/20 blur-[130px]" />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-black">
            D
          </div>

          <div>
            <div className="text-xl font-black">DAKAA</div>
            <div className="text-xs text-blue-300">ذكاء</div>
          </div>
        </Link>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <h1 className="text-center text-3xl font-black">
            أنشئ حسابك
          </h1>

          <p className="mt-3 text-center leading-7 text-slate-400">
            احفظ مسارك التعليمي واختر اشتراكك للبدء مع DAKAA
          </p>

          <form
            onSubmit={handleSignup}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="signup-name"
                className="mb-2 block text-sm text-slate-300"
              >
                الاسم الكامل
              </label>

              <input
                id="signup-name"
                type="text"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="أدخل اسمك"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1935] px-4 py-4 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="mb-2 block text-sm text-slate-300"
              >
                البريد الإلكتروني
              </label>

              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1935] px-4 py-4 text-left text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="mb-2 block text-sm text-slate-300"
              >
                كلمة المرور
              </label>

              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8 أحرف على الأقل"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1935] px-4 py-4 text-white outline-none focus:border-violet-500"
              />
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm leading-7 text-green-300"
              >
                {successMessage}

                <div className="mt-3">
                  <Link
                    href="/login"
                    className="font-bold underline"
                  >
                    تسجيل الدخول
                  </Link>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || Boolean(successMessage)}
              className="w-full rounded-2xl bg-gradient-to-l from-violet-600 to-blue-500 px-6 py-4 font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/login"
              className="font-bold text-violet-400"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}