"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { syncPublicDiagnostic } from "@/lib/diagnostic-sync";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Authentication errors are displayed in the form.

        setMessage(
          "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        );

        setLoading(false);
        return;
      }

            try { await syncPublicDiagnostic(supabase); }
      catch (syncError) { console.error("Diagnostic sync:", syncError); }
      // Connexion réussie → Dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Unexpected login error:", error);

      setMessage(
        "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى."
      );

      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#06142d] to-[#12113d] text-white flex flex-col items-center justify-center px-4"
    >
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg">
          D
        </div>

        <div>
          <h1 className="text-3xl font-bold">
            DAKAA
          </h1>

          <p className="text-xs text-blue-300">
            ذكاء
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-2">
          تسجيل الدخول
        </h2>

        <p className="text-slate-400 text-center mb-8">
          مرحباً بعودتك إلى DAKAA
        </p>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          {/* Email */}
          <div>
            <label className="block mb-2 text-sm">
              البريد الإلكتروني
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="name@example.com"
              className="w-full rounded-xl border border-slate-600 bg-[#0b1c3b] px-4 py-4 outline-none focus:border-purple-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-2 text-sm">
              كلمة المرور
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-600 bg-[#0b1c3b] px-4 py-4 outline-none focus:border-purple-500"
            />

            {/* Forgot password */}
            <div className="mt-3">
              <Link
                href="/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
          </div>

          {/* Error message */}
          {message && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">
              {message}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold bg-gradient-to-l from-purple-600 to-blue-500 hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading
              ? "جاري تسجيل الدخول..."
              : "تسجيل الدخول"}
          </button>
        </form>

        {/* Signup */}
        <div className="mt-7 text-center text-sm text-slate-400">
          ليس لديك حساب؟{" "}
          <Link
            href="/signup"
            className="text-purple-400 font-bold hover:text-purple-300"
          >
            إنشاء حساب
          </Link>
        </div>
      </div>

      {/* Back Home */}
      <Link
        href="/"
        className="mt-8 text-sm text-slate-400 hover:text-white"
      >
        ← العودة إلى الصفحة الرئيسية
      </Link>
    </main>
  );
}