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
      setErrorMessage("┘èÏ▒Ï¼┘ë ÏÑÏ»Ï«Ïº┘ä Ïº┘äÏºÏ│┘à Ïº┘ä┘âÏº┘à┘ä.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("┘èÏ¼Ï¿ Ïú┘å Ï¬Ï¡Ï¬┘ê┘è ┘â┘ä┘àÏ® Ïº┘ä┘àÏ▒┘êÏ▒ Ï╣┘ä┘ë 8 ÏúÏ¡Ï▒┘ü Ï╣┘ä┘ë Ïº┘äÏú┘é┘ä.");
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
        setErrorMessage("Ï¬Ï╣Ï░Ï▒ ÏÑ┘åÏ┤ÏºÏí Ïº┘äÏ¡Ï│ÏºÏ¿. Ï¡Ïº┘ê┘ä ┘àÏ▒Ï® ÏúÏ«Ï▒┘ë.");
        return;
      }

      if (!data.session) {
        setSuccessMessage(
          "Ï¬┘à ÏºÏ│Ï¬┘äÏº┘à ÏÀ┘äÏ¿ Ïº┘äÏ¬Ï│Ï¼┘è┘ä. Ï¬Ï¡┘é┘é ┘à┘å Ï¿Ï▒┘èÏ»┘â Ïº┘äÏÑ┘ä┘âÏ¬Ï▒┘ê┘å┘è ┘äÏ¬Ïú┘â┘èÏ» Ïº┘äÏ¡Ï│ÏºÏ¿Ïî Ï½┘à Ï│Ï¼┘ä Ïº┘äÏ»Ï«┘ê┘ä."
        );
        return;
      }

            try { await syncPublicDiagnostic(supabase); }
      catch (syncError) { console.error("Diagnostic sync:", syncError); }
      setSuccessMessage("Ï¬┘à ÏÑ┘åÏ┤ÏºÏí Ïº┘äÏ¡Ï│ÏºÏ¿ Ï¿┘åÏ¼ÏºÏ¡.");

      router.push("/pricing");
      router.refresh();

    } catch (error) {
      console.error("DAKAA SIGNUP ERROR:", error);

      setErrorMessage(
        "Ï¡Ï»Ï½ Ï«ÏÀÏú Ï║┘èÏ▒ ┘àÏ¬┘ê┘éÏ╣. ┘èÏ▒Ï¼┘ë Ïº┘ä┘àÏ¡Ïº┘ê┘äÏ® ┘àÏ▒Ï® ÏúÏ«Ï▒┘ë."
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
            <div className="text-xs text-blue-300">Ï░┘âÏºÏí</div>
          </div>
        </Link>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <h1 className="text-center text-3xl font-black">
            Ïú┘åÏ┤Ïª Ï¡Ï│ÏºÏ¿┘â
          </h1>

          <p className="mt-3 text-center leading-7 text-slate-400">
            ÏºÏ¡┘üÏ© ┘àÏ│ÏºÏ▒┘â Ïº┘äÏ¬Ï╣┘ä┘è┘à┘è ┘êÏºÏ«Ï¬Ï▒ ÏºÏ┤Ï¬Ï▒Ïº┘â┘â ┘ä┘äÏ¿Ï»Ïí ┘àÏ╣ DAKAA
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
                Ïº┘äÏºÏ│┘à Ïº┘ä┘âÏº┘à┘ä
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
                placeholder="ÏúÏ»Ï«┘ä ÏºÏ│┘à┘â"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1935] px-4 py-4 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="mb-2 block text-sm text-slate-300"
              >
                Ïº┘äÏ¿Ï▒┘èÏ» Ïº┘äÏÑ┘ä┘âÏ¬Ï▒┘ê┘å┘è
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
                ┘â┘ä┘àÏ® Ïº┘ä┘àÏ▒┘êÏ▒
              </label>

              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8 ÏúÏ¡Ï▒┘ü Ï╣┘ä┘ë Ïº┘äÏú┘é┘ä"
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
                    Ï¬Ï│Ï¼┘è┘ä Ïº┘äÏ»Ï«┘ê┘ä
                  </Link>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || Boolean(successMessage)}
              className="w-full rounded-2xl bg-gradient-to-l from-violet-600 to-blue-500 px-6 py-4 font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Ï¼ÏºÏ▒┘è ÏÑ┘åÏ┤ÏºÏí Ïº┘äÏ¡Ï│ÏºÏ¿..." : "ÏÑ┘åÏ┤ÏºÏí Ï¡Ï│ÏºÏ¿"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            ┘äÏ»┘è┘â Ï¡Ï│ÏºÏ¿ Ï¿Ïº┘ä┘üÏ╣┘äÏƒ{" "}
            <Link
              href="/login"
              className="font-bold text-violet-400"
            >
              Ï¬Ï│Ï¼┘è┘ä Ïº┘äÏ»Ï«┘ê┘ä
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
