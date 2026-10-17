import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!UUID.test(id)) {
      return errorResponse("معرف الدرس غير صالح", 400);
    }

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

    if (!isAdmin) {
      const { data: subscription, error: subError } =
        await admin
          .from("user_subscriptions")
          .select(
            "id, status, current_period_start, current_period_end, subscription_plans!inner(active)"
          )
          .eq("user_id", userId)
          .eq("status", "active")
          .lte(
            "current_period_start",
            new Date().toISOString()
          )
          .gt(
            "current_period_end",
            new Date().toISOString()
          )
          .eq("subscription_plans.active", true)
          .limit(1)
          .maybeSingle();

      if (subError) {
        console.error("Subscription:", subError);
        return errorResponse(
          "تعذر التحقق من الاشتراك",
          503
        );
      }

      if (!subscription) {
        return errorResponse(
          "يتطلب هذا الدرس اشتراكاً نشطاً",
          403
        );
      }
    }

    const { data: lesson, error: lessonError } =
      await admin
        .from("lessons")
        .select(
          "id,module_id,title_ar,description_ar,content_ar,duration_minutes,position"
        )
        .eq("id", id)
        .maybeSingle();

    if (lessonError) {
      throw lessonError;
    }

    if (!lesson) {
      return errorResponse("الدرس غير موجود", 404);
    }

    // Vérifier l'ordre réel des modules et des leçons.

    const { data: modules, error: modulesError } =
      await admin
        .from("modules")
        .select("id,position")
        .order("position", { ascending: true })
        .order("id", { ascending: true });

    if (modulesError) {
      throw modulesError;
    }

    const { data: allLessons, error: allLessonsError } =
      await admin
        .from("lessons")
        .select("id,module_id,position")
        .order("position", { ascending: true })
        .order("id", { ascending: true });

    if (allLessonsError) {
      throw allLessonsError;
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
      (item) => item.id === id
    );

    if (lessonIndex === -1) {
      return errorResponse("الدرس غير موجود", 404);
    }

    const previousLessons = orderedLessons
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

    const completed = new Set(
      (progress ?? []).map((item) => item.lesson_id)
    );

    const unlocked =
      isAdmin ||
      previousLessons.every((lessonId) =>
        completed.has(lessonId)
      );

    if (!unlocked) {
      return errorResponse(
        "يجب إكمال الدروس السابقة أولاً",
        403
      );
    }

    // Les réponses correctes ne sont jamais envoyées.

    const { data: questions, error: questionsError } =
      await admin
        .from("lesson_questions")
        .select(
          "id,lesson_id,question_ar,option_a,option_b,option_c,position"
        )
        .eq("lesson_id", id)
        .order("position", { ascending: true });

    if (questionsError) {
      throw questionsError;
    }

    return NextResponse.json(
      {
        success: true,
        lesson,
        questions: questions ?? [],
        completed: completed.has(id),
        unlocked: true,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("DAKAA LESSON API:", error);

    return errorResponse(
      "تعذر تحميل الدرس",
      500
    );
  }
}