"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Lesson = {
  id: string;
  module_id: string;
  title_ar: string;
  description_ar: string | null;
  content_ar: string | null;
  position: number;
};

type NextLesson = {
  id: string;
  title_ar: string;
  position: number;
};

type Question = {
  id: string;
  lesson_id: string;
  question_ar: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "a" | "b" | "c";
  explanation_ar: string | null;
  position: number;
};

type Answers = Record<string, "a" | "b" | "c">;

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();

  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [nextLesson, setNextLesson] =
    useState<NextLesson | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Progression
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Quiz
  const [answers, setAnswers] = useState<Answers>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setErrorMessage("");

      // Réinitialiser les données quand on change de leçon
      setLesson(null);
      setNextLesson(null);
      setQuestions([]);
      setAnswers({});
      setQuizSubmitted(false);
      setQuizPassed(false);
      setScore(0);
      setCompleted(false);

      // Vérifier utilisateur
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      // Charger la leçon
      const { data: lessonData, error: lessonError } =
        await supabase
          .from("lessons")
          .select(`
            id,
            module_id,
            title_ar,
            description_ar,
            content_ar,
            position
          `)
          .eq("id", lessonId)
          .single();

      if (lessonError || !lessonData) {
        console.error("DAKAA lesson error:", lessonError);

        setErrorMessage(
          `حدث خطأ أثناء تحميل الدرس: ${
            lessonError?.message || "لم يتم العثور على الدرس"
          }`
        );

        setLoading(false);
        return;
      }

      const currentLesson = lessonData as Lesson;

      setLesson(currentLesson);

      // Chercher la prochaine leçon du même module
      const {
        data: nextLessonData,
        error: nextLessonError,
      } = await supabase
        .from("lessons")
        .select(`
          id,
          title_ar,
          position
        `)
        .eq("module_id", currentLesson.module_id)
        .gt("position", currentLesson.position)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextLessonError) {
        console.error(
          "DAKAA next lesson error:",
          nextLessonError
        );
      } else {
        setNextLesson(
          nextLessonData
            ? (nextLessonData as NextLesson)
            : null
        );
      }

      // Charger les questions
      const {
        data: questionsData,
        error: questionsError,
      } = await supabase
        .from("lesson_questions")
        .select(`
          id,
          lesson_id,
          question_ar,
          option_a,
          option_b,
          option_c,
          correct_option,
          explanation_ar,
          position
        `)
        .eq("lesson_id", lessonId)
        .order("position", { ascending: true });

      if (questionsError) {
        console.error(
          "DAKAA questions error:",
          questionsError
        );

        setErrorMessage(
          `حدث خطأ أثناء تحميل الاختبار: ${questionsError.message}`
        );

        setLoading(false);
        return;
      }

      setQuestions((questionsData ?? []) as Question[]);

      // Vérifier progression
      const {
        data: progressData,
        error: progressError,
      } = await supabase
        .from("user_lesson_progress")
        .select("completed")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (progressError) {
        console.error(
          "DAKAA progress check error:",
          progressError
        );
      }

      if (progressData?.completed) {
        setCompleted(true);
      }

      setLoading(false);
    }

    if (lessonId) {
      loadPage();
    }
  }, [lessonId, router]);

  function selectAnswer(
    questionId: string,
    answer: "a" | "b" | "c"
  ) {
    if (quizSubmitted) return;

    setAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));
  }

  function handleSubmitQuiz() {
    setErrorMessage("");

    if (Object.keys(answers).length !== questions.length) {
      setErrorMessage(
        "يرجى الإجابة عن جميع أسئلة الاختبار قبل عرض النتيجة."
      );
      return;
    }

    let correctAnswers = 0;

    questions.forEach((question) => {
      if (
        answers[question.id] === question.correct_option
      ) {
        correctAnswers++;
      }
    });

    setScore(correctAnswers);
    setQuizSubmitted(true);

    if (correctAnswers === questions.length) {
      setQuizPassed(true);
    } else {
      setQuizPassed(false);
    }
  }

  function handleRetryQuiz() {
    setAnswers({});
    setScore(0);
    setQuizSubmitted(false);
    setQuizPassed(false);
    setErrorMessage("");
  }

  async function handleCompleteLesson() {
    if (!lesson || completed) return;

    if (questions.length > 0 && !quizPassed) {
      setErrorMessage(
        "يجب اجتياز الاختبار بنجاح قبل إكمال الدرس."
      );

      return;
    }

    setCompleting(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setCompleting(false);
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("user_lesson_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lesson.id,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,lesson_id",
        }
      );

    if (error) {
      console.error("DAKAA progress error:", error);

      setErrorMessage(
        `حدث خطأ أثناء حفظ تقدمك: ${error.message}`
      );

      setCompleting(false);
      return;
    }

    setCompleted(true);
    setCompleting(false);
  }

  function getOptionClass(
    question: Question,
    option: "a" | "b" | "c"
  ) {
    const selected =
      answers[question.id] === option;

    if (!quizSubmitted) {
      if (selected) {
        return "border-purple-500 bg-purple-500/15 text-purple-200";
      }

      return "border-slate-700 bg-[#091831]/70 text-slate-300 hover:border-purple-500/60 hover:bg-purple-500/5";
    }

    if (option === question.correct_option) {
      return "border-green-500/60 bg-green-500/10 text-green-300";
    }

    if (
      selected &&
      option !== question.correct_option
    ) {
      return "border-red-500/60 bg-red-500/10 text-red-300";
    }

    return "border-slate-700 bg-[#091831]/50 text-slate-500";
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#061127] text-white"
      >
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-purple-500" />

          <p className="text-slate-400">
            جاري تحميل الدرس...
          </p>
        </div>
      </main>
    );
  }

  if (!lesson) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#061127] px-5 text-white"
      >
        <div className="w-full max-w-xl rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <div className="mb-4 text-4xl">
            ⚠️
          </div>

          <h1 className="mb-3 text-xl font-bold text-red-300">
            تعذر تحميل الدرس
          </h1>

          <p className="mb-6 text-sm text-red-200">
            {errorMessage ||
              "لم يتم العثور على الدرس."}
          </p>

          <Link
            href="/courses"
            className="inline-block rounded-xl bg-gradient-to-l from-purple-600 to-blue-500 px-6 py-3 font-bold"
          >
            العودة إلى الدروس
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#061127] text-white"
    >
      {/* Background */}
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 font-black">
              D
            </div>

            <div>
              <div className="text-lg font-black">
                DAKAA
              </div>

              <div className="text-xs text-blue-300">
                ذكاء
              </div>
            </div>
          </Link>

          <Link
            href="/courses"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-purple-500 hover:text-white"
          >
            ← العودة إلى الدروس
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-10 md:py-14">

        {/* Lesson heading */}
        <section className="mb-8">
          <div className="mb-3 text-sm font-bold text-purple-400">
            درس DAKAA
          </div>

          <h1 className="mb-4 text-3xl font-black leading-relaxed md:text-4xl">
            {lesson.title_ar}
          </h1>

          {lesson.description_ar && (
            <p className="max-w-3xl text-lg leading-8 text-slate-400">
              {lesson.description_ar}
            </p>
          )}
        </section>

        {/* Erreur */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Lesson */}
        <section className="overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-800/40 shadow-2xl">
          <div className="border-b border-slate-700/70 bg-gradient-to-l from-purple-500/10 to-blue-500/10 p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-2xl">
                🧠
              </div>

              <div>
                <p className="text-sm text-slate-400">
                  محتوى الدرس
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {lesson.title_ar}
                </h2>
              </div>
            </div>
          </div>

          <article className="p-6 md:p-10">
            {lesson.content_ar ? (
              <div className="whitespace-pre-line text-lg leading-10 text-slate-200">
                {lesson.content_ar}
              </div>
            ) : (
              <p className="text-slate-400">
                لا يوجد محتوى لهذا الدرس حالياً.
              </p>
            )}
          </article>
        </section>

        {/* QUIZ */}
        {questions.length > 0 && (
          <section className="mt-10 overflow-hidden rounded-3xl border border-purple-500/30 bg-slate-800/40 shadow-2xl">

            <div className="border-b border-slate-700/70 bg-gradient-to-l from-purple-500/15 to-blue-500/10 p-6 md:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-2xl">
                  📝
                </div>

                <div>
                  <p className="text-sm font-bold text-purple-400">
                    اختبر معلوماتك
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    اختبار قصير
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    أجب عن جميع الأسئلة بشكل صحيح لإكمال الدرس.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8 p-6 md:p-8">
              {questions.map(
                (question, questionIndex) => {
                  const options = [
                    {
                      key: "a" as const,
                      text: question.option_a,
                    },
                    {
                      key: "b" as const,
                      text: question.option_b,
                    },
                    {
                      key: "c" as const,
                      text: question.option_c,
                    },
                  ];

                  const answerCorrect =
                    answers[question.id] ===
                    question.correct_option;

                  return (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-slate-700 bg-[#091831]/50 p-5 md:p-6"
                    >
                      <div className="mb-5 flex items-start gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/10 font-black text-purple-300">
                          {questionIndex + 1}
                        </div>

                        <h3 className="pt-1 text-lg font-bold leading-8">
                          {question.question_ar}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {options.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() =>
                              selectAnswer(
                                question.id,
                                option.key
                              )
                            }
                            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-right transition ${getOptionClass(
                              question,
                              option.key
                            )}`}
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-sm font-bold">
                              {option.key.toUpperCase()}
                            </span>

                            <span>
                              {option.text}
                            </span>
                          </button>
                        ))}
                      </div>

                      {quizSubmitted && (
                        <div
                          className={`mt-5 rounded-xl border p-4 ${
                            answerCorrect
                              ? "border-green-500/30 bg-green-500/10 text-green-300"
                              : "border-red-500/30 bg-red-500/10 text-red-300"
                          }`}
                        >
                          <div className="font-bold">
                            {answerCorrect
                              ? "✓ إجابة صحيحة"
                              : "✕ إجابة غير صحيحة"}
                          </div>

                          {question.explanation_ar && (
                            <p className="mt-2 text-sm leading-7 opacity-90">
                              {
                                question.explanation_ar
                              }
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}

              {!quizSubmitted && (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="w-full rounded-xl bg-gradient-to-l from-purple-600 to-blue-500 px-7 py-4 font-black shadow-lg shadow-purple-500/20 transition hover:scale-[1.01]"
                >
                  عرض نتيجة الاختبار
                </button>
              )}

              {quizSubmitted && (
                <div
                  className={`rounded-2xl border p-6 ${
                    quizPassed
                      ? "border-green-500/40 bg-green-500/10"
                      : "border-orange-500/40 bg-orange-500/10"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">
                      {quizPassed ? "🎉" : "📚"}
                    </div>

                    <div>
                      <h3
                        className={`text-xl font-black ${
                          quizPassed
                            ? "text-green-300"
                            : "text-orange-300"
                        }`}
                      >
                        {quizPassed
                          ? "أحسنت! لقد اجتزت الاختبار"
                          : "حاول مرة أخرى"}
                      </h3>

                      <p className="mt-2 text-slate-300">
                        نتيجتك: {score} من{" "}
                        {questions.length}
                      </p>
                    </div>
                  </div>

                  {!quizPassed && (
                    <button
                      type="button"
                      onClick={handleRetryQuiz}
                      className="mt-5 rounded-xl border border-orange-500/40 px-6 py-3 font-bold text-orange-300 transition hover:bg-orange-500/10"
                    >
                      إعادة الاختبار
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Completed */}
        {completed && (
          <div className="mt-8 rounded-2xl border border-green-500/40 bg-green-500/10 p-5 text-green-300">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-xl">
                ✓
              </div>

              <div>
                <div className="font-bold">
                  أحسنت! لقد أكملت هذا الدرس
                </div>

                <div className="mt-1 text-sm text-green-300/70">
                  تم حفظ تقدمك في مسارك التعليمي.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next lesson */}
        {completed && nextLesson && (
          <div className="mt-6 rounded-3xl border border-purple-500/30 bg-gradient-to-l from-purple-500/10 to-blue-500/10 p-6">
            <p className="mb-2 text-sm font-bold text-purple-300">
              الخطوة التالية
            </p>

            <h3 className="mb-5 text-xl font-black">
              {nextLesson.title_ar}
            </h3>

            <Link
              href={`/courses/${nextLesson.id}`}
              className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-l from-purple-600 to-blue-500 px-7 py-3 font-black shadow-lg shadow-purple-500/20 transition hover:scale-[1.02]"
            >
              الدرس التالي
              <span>←</span>
            </Link>
          </div>
        )}

        {/* Module completed */}
        {completed && !nextLesson && (
          <div className="mt-6 rounded-3xl border border-green-500/40 bg-green-500/10 p-7 text-center">
            <div className="mb-3 text-4xl">
              🎉
            </div>

            <h3 className="text-2xl font-black text-green-300">
              لقد أكملت الوحدة
            </h3>

            <p className="mt-3 text-slate-300">
              أحسنت! لقد أنهيت جميع دروس هذه الوحدة.
            </p>

            <Link
              href="/courses"
              className="mt-6 inline-block rounded-xl bg-gradient-to-l from-purple-600 to-blue-500 px-7 py-3 font-bold"
            >
              العودة إلى المسار التعليمي
            </Link>
          </div>
        )}

        {/* Bottom navigation */}
        <div className="mt-8 flex flex-col gap-4 border-t border-slate-800 pt-8 sm:flex-row sm:items-center sm:justify-between">

          <Link
            href="/courses"
            className="rounded-xl border border-slate-700 px-6 py-3 text-center text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            العودة إلى قائمة الدروس
          </Link>

          {!completed ? (
            <button
              type="button"
              onClick={handleCompleteLesson}
              disabled={
                completing ||
                (questions.length > 0 && !quizPassed)
              }
              className={`rounded-xl px-7 py-3 font-bold shadow-lg transition ${
                questions.length > 0 && !quizPassed
                  ? "border border-slate-700 bg-slate-800 text-slate-500"
                  : "bg-gradient-to-l from-purple-600 to-blue-500 text-white shadow-purple-500/20 hover:scale-[1.02]"
              } disabled:cursor-not-allowed`}
            >
              {completing
                ? "جاري حفظ تقدمك..."
                : questions.length > 0 &&
                  !quizPassed
                ? "اجتز الاختبار أولاً"
                : "إكمال الدرس ✓"}
            </button>
          ) : nextLesson ? (
            <Link
              href={`/courses/${nextLesson.id}`}
              className="rounded-xl bg-gradient-to-l from-purple-600 to-blue-500 px-7 py-3 text-center font-bold shadow-lg shadow-purple-500/20 transition hover:scale-[1.02]"
            >
              الدرس التالي ←
            </Link>
          ) : (
            <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-7 py-3 font-bold text-green-300">
              اكتملت الوحدة ✓
            </div>
          )}

        </div>
      </div>
    </main>
  );
}