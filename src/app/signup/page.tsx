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
      setErrorMessage("ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("ÙŠØ¬Ø¨ Ø£Ù† ØªØ­ØªÙˆÙŠ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¹Ù„Ù‰ 8 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„.");
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
        setErrorMessage("ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.");
        return;
      }

      if (!data.session) {
        setSuccessMessage(
          "ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø·Ù„Ø¨ Ø§Ù„ØªØ³Ø¬ÙŠÙ„. ØªØ­Ù‚Ù‚ Ù…Ù† Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù„ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø³Ø§Ø¨ØŒ Ø«Ù… Ø³Ø¬Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„."
        );
        return;
      }

            try { await syncPublicDiagnostic(supabase); }
      catch (syncError) { console.error("Diagnostic sync:", syncError); }
      setSuccessMessage("ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨ Ø¨Ù†Ø¬Ø§Ø­.");

      router.push("/pricing");
      router.refresh();

    } catch (error) {
      console.error("DAKAA SIGNUP ERROR:", error);

      setErrorMessage(
        "Ø­Ø¯Ø« Ø®Ø·Ø£ ØºÙŠØ± Ù…ØªÙˆÙ‚Ø¹. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰."
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
            <div className="text-xs text-blue-300">Ø°ÙƒØ§Ø¡</div>
          </div>
        </Link>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <h1 className="text-center text-3xl font-black">
            Ø£Ù†Ø´Ø¦ Ø­Ø³Ø§Ø¨Ùƒ
          </h1>

          <p className="mt-3 text-center leading-7 text-slate-400">
            Ø§Ø­ÙØ¸ Ù…Ø³Ø§Ø±Ùƒ Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠ ÙˆØ§Ø®ØªØ± Ø§Ø´ØªØ±Ø§ÙƒÙƒ Ù„Ù„Ø¨Ø¯Ø¡ Ù…Ø¹ DAKAA
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
                Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„
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
                placeholder="Ø£Ø¯Ø®Ù„ Ø§Ø³Ù…Ùƒ"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1935] px-4 py-4 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="mb-2 block text-sm text-slate-300"
              >
                Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ
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
                ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±
              </label>

              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„"
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
                    ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„
                  </Link>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || Boolean(successMessage)}
              className="w-full rounded-2xl bg-gradient-to-l from-violet-600 to-blue-500 px-6 py-4 font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Ø¬Ø§Ø±ÙŠ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨..." : "Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Ù„Ø¯ÙŠÙƒ Ø­Ø³Ø§Ø¨ Ø¨Ø§Ù„ÙØ¹Ù„ØŸ{" "}
            <Link
              href="/login"
              className="font-bold text-violet-400"
            >
              ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}