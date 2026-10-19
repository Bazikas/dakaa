"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [client, setClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    let mounted = true;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      queueMicrotask(() => {
        if (mounted) setMessage("إعدادات الاتصال غير مكتملة.");
      });
      return;
    }

    const supabase = createClient(url, key);
    queueMicrotask(() => {
      if (mounted) setClient(supabase);
    });

    const subscription = supabase.auth.onAuthStateChange(
      (event) => {
        if (mounted && event === "PASSWORD_RECOVERY") {
          setReady(true);
          setMessage("");
        }
      }
    );

    async function initialize() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } =
          await supabase.auth.exchangeCodeForSession(code);

        if (!mounted) return;

        if (error) {
          setMessage("رابط الاستعادة غير صالح أو منتهي الصلاحية.");
        } else {
          setReady(true);
          setMessage("");
          window.history.replaceState(
            {},
            "",
            window.location.pathname
          );
        }
        return;
      }

      const hash = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!mounted) return;

        if (error) {
          setMessage("تعذر التحقق من رابط الاستعادة.");
        } else {
          setReady(true);
          setMessage("");
          window.history.replaceState(
            {},
            "",
            window.location.pathname
          );
        }
        return;
      }

      if (!mounted) return;

      if (mounted) {
        setReady(false);
        setMessage(
          "افتح رابط الاستعادة الجديد الذي وصلك عبر البريد الإلكتروني."
        );
      }
    }

    void initialize();

    return () => {
      mounted = false;
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!client || !ready || loading) return;

    if (password.length < 8) {
      setMessage("كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.");
      return;
    }

    if (password !== confirm) {
      setMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { error } = await client.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccess(true);
      setMessage("تم تغيير كلمة المرور بنجاح.");
      await client.auth.signOut();
    } catch {
      setMessage(
        "تعذر تغيير كلمة المرور. يرجى طلب رابط استعادة جديد."
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
        <h1 className="text-center text-3xl font-bold">
          <span className="text-purple-400">ذكاء</span> DAKAA
        </h1>

        <h2 className="mt-7 text-center text-2xl font-bold">
          تعيين كلمة مرور جديدة
        </h2>

        {message && (
          <p role="status" className="mt-6 rounded-xl bg-slate-800 p-4 text-sm">
            {message}
          </p>
        )}

        {success ? (
          <Link
            href="/login"
            className="mt-7 block rounded-xl bg-purple-600 p-3 text-center font-bold"
          >
            تسجيل الدخول
          </Link>
        ) : ready ? (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="كلمة المرور الجديدة"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-[#07142d] p-3"
            />

            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="تأكيد كلمة المرور"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-[#07142d] p-3"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 p-3 font-bold disabled:opacity-50"
            >
              {loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور الجديدة"}
            </button>
          </form>
        ) : (
          <Link
            href="/forgot-password"
            className="mt-7 block text-center text-purple-300 hover:underline"
          >
            طلب رابط استعادة جديد
          </Link>
        )}
      </section>
    </main>
  );
}
