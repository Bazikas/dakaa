import Link from "next/link";

export default function HomePage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#071126] text-white"
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <h1 className="text-3xl font-bold">DAKAA</h1>
          <p className="text-sm text-purple-300">ذكاء</p>
        </div>

        <nav className="flex gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-white/20 px-5 py-3"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl bg-purple-600 px-5 py-3"
          >
            الاشتراكات
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-28 text-center">
        <div className="mb-6 inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-purple-300">
          منصة عربية لتعلم الذكاء الاصطناعي
        </div>

        <h2 className="mb-8 text-4xl font-extrabold leading-tight md:text-6xl">
          تعلّم الذكاء الاصطناعي بالعربية
          <br />
          <span className="text-purple-400">
            وابدأ رحلتك نحو المستقبل
          </span>
        </h2>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-9 text-slate-300">
          اكتشف مستواك في الذكاء الاصطناعي من خلال اختبار مجاني،
          ثم اتبع مساراً تعليمياً منظماً يشمل الدروس والتطبيقات
          العملية والتحديات والمساعدة الذكية.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/diagnostic"
            className="rounded-2xl bg-purple-600 px-8 py-4 text-lg font-bold hover:bg-purple-500"
          >
            ابدأ التشخيص المجاني
          </Link>

          <Link
            href="/pricing"
            className="rounded-2xl border border-white/20 px-8 py-4 text-lg hover:bg-white/10"
          >
            اكتشف الاشتراكات
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-3">
        {[
          {
            title: "تشخيص ذكي",
            description: "اكتشف مستواك واحتياجاتك التعليمية.",
          },
          {
            title: "تعلم تدريجي",
            description: "دروس وتمارين وتحديات عملية باللغة العربية.",
          },
          {
            title: "مدرب ذكاء اصطناعي",
            description: "مساعدة ذكية لتطوير مهاراتك خطوة بخطوة.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-8"
          >
            <h3 className="mb-4 text-2xl font-bold text-purple-300">
              {item.title}
            </h3>
            <p className="leading-8 text-slate-300">
              {item.description}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
