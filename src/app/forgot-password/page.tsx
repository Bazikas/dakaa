"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!url || !key) {
        throw new Error("إعدادات الاتصال غير مكتملة.");
      }

      const supabase = createClient(url, key);

      const redirectTo =
        window.location.origin + "/reset-password";

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "إذا كان هذا البريد مرتبطاً بحساب، فستصلك رسالة لإعادة تعيين كلمة المرور. تحقق من صندوق الوارد والبريد غير المرغوب فيه."
      );
    } catch {
      setError(
        "تعذر إرسال الطلب حالياً. يرجى المحاولة بعد قليل."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#07142d] text-white flex items-center justify-center p-6"
    >
      <section className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#111f40] p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-purple-400">ذكاء</span> DAKAA
          </h1>

          <h2 className="mt-7 text-2xl font-bold">
            استعادة كلمة المرور
          </h2>

          <p className="mt-3 text-sm text-slate-300">
            أدخل بريدك الإلكتروني لتلقي رابط آمن لإعادة تعيين كلمة المرور.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm"
            >
              البريد الإلكتروني
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-[#07142d] p-3 text-white outline-none focus:border-purple-400"
              placeholder="email@example.com"
            />
          </div>

          {message && (
            <p role="status" className="rounded-xl bg-green-900/40 p-4 text-sm text-green-300">
              {message}
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-red-900/40 p-4 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-l from-purple-600 to-blue-600 p-3 font-bold disabled:opacity-50"
          >
            {loading ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-6 block text-center text-sm text-purple-300 hover:underline"
        >
          العودة إلى تسجيل الدخول
        </Link>
      </section>
    </main>
  );
}
