import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !publicKey || !serviceKey) {
      return errorResponse(
        "Configuration du serveur incomplète",
        500
      );
    }

    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return errorResponse("يرجى تسجيل الدخول", 401);
    }

    const token = authorization.slice(7).trim();

    const authClient = createClient(url, publicKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: auth, error: authError } =
      await authClient.auth.getUser(token);

    if (authError || !auth.user) {
      return errorResponse(
        "جلسة المستخدم غير صالحة",
        401
      );
    }

    const userId = auth.user.id;

    const admin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const isAdmin =
      !!process.env.DAKAA_ADMIN_USER_ID &&
      userId === process.env.DAKAA_ADMIN_USER_ID;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("بيانات غير صالحة", 400);
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse("طلب غير صالح", 400);
    }

    const input = body as Record<string, unknown>;

    const lessonId = input.lessonId;

    const answers = input.answers;

    if (
      typeof lessonId !== "string" ||
      !UUID.test(lessonId) ||
      !answers ||
      typeof answers !== "object" ||
      Array.isArray(answers)
    ) {
      return errorResponse(
        "بيانات الاختبار غير مكتملة",
        400
      );
    }

    const submittedAnswers = answers as Record<
      string,
      unknown
    >;

    // Vérification de l'abonnement.

    if (!isAdmin) {
      const now = new Date().toISOString();

      const { data: subscription, error: subError } =
        await admin
          .from("user_subscriptions")
          .select(
            "id,subscription_plans!inner(active)"
          )
          .eq("user_id", userId)
          .eq("status", "active")
          .lte("current_period_start", now)
          .gt("current_period_end", now)
          .eq("subscription_plans.active", true)
          .limit(1)
          .maybeSingle();

      if (subError) {
        throw subError;
      }

      if (!subscription) {
        return errorResponse(
          "يتطلب الاختبار اشتراكاً نشطاً",
          403
        );
      }
    }

    // Vérifier l'existence de la leçon.

    const { data: lesson, error: lessonError } =
      await admin
        .from("lessons")
        .select("id,module_id,position")
        .eq("id", lessonId)
        .maybeSingle();

    if (lessonError) {
      throw lessonError;
    }

    if (!lesson) {
      return errorResponse("الدرس غير موجود", 404);
    }

    // Vérifier que les leçons précédentes sont terminées.

    const { data: modules, error: modulesError } =
      await admin
        .from("modules")
        .select("id,position")
        .order("position", { ascending: true })
        .order("id", { ascending: true });

    if (modulesError) {
      throw modulesError;
    }

    const { data: allLessons, error: lessonsError } =
      await admin
        .from("lessons")
        .select("id,module_id,position")
        .order("position", { ascending: true })
        .order("id", { ascending: true });

    if (lessonsError) {
      throw lessonsError;
    }

    const orderedLessons = (modules ?? []).flatMap(
      (module) =>
        (allLessons ?? [])
          .filter((item) => item.module_id === module.id)
          .sort(
            (a, b) =>
              a.position - b.position ||
              a.id.localeCompare(b.id)
          )
    );

    const lessonIndex = orderedLessons.findIndex(
      (item) => item.id === lessonId
    );

    if (lessonIndex === -1) {
      return errorResponse("الدرس غير موجود", 404);
    }

    const previousIds = orderedLessons
      .slice(0, lessonIndex)
      .map((item) => item.id);

    const { data: progress, error: progressError } =
      await admin
        .from("user_lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("completed", true);

    if (progressError) {
      throw progressError;
    }

    const completedIds = new Set(
      (progress ?? []).map((item) => item.lesson_id)
    );

    if (
      !isAdmin &&
      !previousIds.every((id) => completedIds.has(id))
    ) {
      return errorResponse(
        "يجب إكمال الدروس السابقة أولاً",
        403
      );
    }

    // Récupérer les réponses correctes côté serveur uniquement.

    const { data: questions, error: questionsError } =
      await admin
        .from("lesson_questions")
        .select(
          "id,question_ar,correct_option,explanation_ar,position"
        )
        .eq("lesson_id", lessonId)
        .order("position", { ascending: true });

    if (questionsError) {
      throw questionsError;
    }

    if (!questions || questions.length === 0) {
      return errorResponse(
        "لا توجد أسئلة لهذا الدرس",
        400
      );
    }

    // Vérifier les réponses transmises.

    const questionIds = new Set(
      questions.map((question) => question.id)
    );

    if (
      Object.keys(submittedAnswers).length !==
      questions.length
    ) {
      return errorResponse(
        "يرجى الإجابة عن جميع الأسئلة",
        400
      );
    }

    for (const [questionId, answer] of Object.entries(
      submittedAnswers
    )) {
      if (
        !questionIds.has(questionId) ||
        typeof answer !== "string" ||
        !["a", "b", "c"].includes(answer.toLowerCase())
      ) {
        return errorResponse(
          "إحدى الإجابات غير صالحة",
          400
        );
      }
    }

    // Correction côté serveur.

    let correctCount = 0;

    const results = questions.map((question) => {
      const selected = String(
        submittedAnswers[question.id]
      ).toLowerCase();

      const correct = String(
        question.correct_option
      ).toLowerCase();

      const isCorrect = selected === correct;

      if (isCorrect) {
        correctCount++;
      }

      return {
        questionId: question.id,
        selected,
        correct,
        isCorrect,
        explanation_ar: question.explanation_ar,
      };
    });

    const total = questions.length;

    const score = Math.round(
      (correctCount / total) * 100
    );

    // Règle pédagogique actuelle :
    // toutes les réponses doivent être correctes.

    const passed = correctCount === total;

    if (passed) {
      const { error: saveError } = await admin
        .from("user_lesson_progress")
        .upsert(
          {
            user_id: userId,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,lesson_id",
          }
        );

      if (saveError) {
        console.error(
          "DAKAA PROGRESS SAVE:",
          saveError
        );

        return errorResponse(
          "نجحت في الاختبار لكن تعذر حفظ التقدم",
          500
        );
      }
    }

    const nextLesson =
      passed && lessonIndex + 1 < orderedLessons.length
        ? orderedLessons[lessonIndex + 1].id
        : null;

    return NextResponse.json(
      {
        success: true,
        lessonId,
        score,
        correctCount,
        total,
        passed,
        completed: passed,
        nextLessonId: nextLesson,
        results,
        message: passed
          ? "أحسنت! لقد أكملت الدرس بنجاح."
          : "حاول مرة أخرى. يجب الإجابة عن جميع الأسئلة بشكل صحيح.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("DAKAA QUIZ API:", error);

    return errorResponse(
      "تعذر تصحيح الاختبار",
      500
    );
  }
}