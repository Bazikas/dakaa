// ==================================================
// DAKAA V6.1
// ADAPTIVE LEARNING ENGINE
// ==================================================

// ==================================================
// TYPES
// ==================================================

export type LearningLevel =
  | "beginner"
  | "basic"
  | "intermediate"
  | "advanced";

export type LearningAction =
  | "explain"
  | "remediate"
  | "practice"
  | "advance"
  | "challenge";

export type LearningDecision = {
  score: number;
  passed: boolean;
  action: LearningAction;
  title: string;
  message: string;
  recommendation: string;
};

export type LearnerContext = {
  level: LearningLevel;
  profession: string;
  goal: string;
  skill: string;
  previousScore?: number | null;
};

// ==================================================
// NORMALIZE SCORE
// ==================================================

function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(score))
  );
}

// ==================================================
// ADAPTIVE PEDAGOGICAL DECISION
// ==================================================

export function decideNextLearningAction(
  rawScore: number
): LearningDecision {
  const score = normalizeScore(rawScore);

  // ================================================
  // LEVEL 1 — NEEDS EXPLANATION
  // ================================================

  if (score < 50) {
    return {
      score,
      passed: false,
      action: "explain",

      title: "📚 لنراجع الأساسيات",

      message:
        "يبدو أنك تحتاج إلى شرح أبسط لهذا المفهوم.",

      recommendation:
        "سيشرح لك الأستاذ الفكرة بطريقة مختلفة، مع مثال عملي بسيط، ثم يطرح عليك سؤالاً للتحقق من الفهم.",
    };
  }

  // ================================================
  // LEVEL 2 — REMEDIATION
  // ================================================

  if (score < 70) {
    return {
      score,
      passed: false,
      action: "remediate",

      title: "🔄 أنت تتقدم بشكل جيد",

      message:
        "لقد فهمت جزءاً مهماً من الدرس، لكن بعض العناصر تحتاج إلى تحسين.",

      recommendation:
        "سيقدم لك الأستاذ تمريناً قصيراً يركز على نقاط الضعف قبل إعادة التقييم.",
    };
  }

  // ================================================
  // LEVEL 3 — PRACTICE
  // ================================================

  if (score < 90) {
    return {
      score,
      passed: true,
      action: "practice",

      title: "✅ أحسنت! لقد اجتزت التمرين",

      message:
        "أظهرت فهماً جيداً للمهارة المطلوبة.",

      recommendation:
        "يمكنك الانتقال إلى المهارة التالية أو تطبيق المفهوم في تمرين عملي أكثر تعقيداً.",
    };
  }

  // ================================================
  // LEVEL 4 — ADVANCED CHALLENGE
  // ================================================

  return {
    score,
    passed: true,
    action: "challenge",

    title: "🏆 أداء ممتاز",

    message:
      "لقد أظهرت مستوى متقدماً في هذه المهارة.",

    recommendation:
      "يمكنك الانتقال إلى المهارة التالية أو تجربة تحدٍّ متقدم يجمع بين عدة مفاهيم.",
  };
}

// ==================================================
// PERSONALIZED TEACHING INSTRUCTIONS
// ==================================================

export function buildPersonalizedTeachingPrompt(
  context: LearnerContext,
  decision?: LearningDecision
): string {
  const levelLabels: Record<
    LearningLevel,
    string
  > = {
    beginner: "مبتدئ",
    basic: "أساسي",
    intermediate: "متوسط",
    advanced: "متقدم",
  };

  const learnerLevel =
    levelLabels[context.level];

  const previousScore =
    context.previousScore == null
      ? "لا يوجد تقييم سابق"
      : `${normalizeScore(context.previousScore)}/100`;

  const decisionInstructions = decision
    ? `
القرار التربوي الحالي:
${decision.title}

الإجراء المطلوب:
${decision.action}

التوجيه:
${decision.recommendation}
`
    : `
ابدأ بشرح مناسب لمستوى المتعلم.

تحقق من فهمه قبل الانتقال إلى مفهوم جديد.
`;

  return `
أنت الأستاذ الذكي في منصة DAKAA.

مهمتك تعليم المستخدم كيفية استعمال ChatGPT
بطريقة عملية وتدريجية.

================================

ملف المتعلم:

المستوى: ${learnerLevel}

المجال المهني: ${context.profession}

الهدف: ${context.goal}

المهارة الحالية: ${context.skill}

آخر تقييم: ${previousScore}

================================

${decisionInstructions}

================================

قواعد التدريس:

1. تحدث بالعربية الفصحى الواضحة.

2. خصص الأمثلة حسب المجال المهني للمتعلم.

3. اشرح المفاهيم بالتدرج.

4. لا تقدم عدة تمارين في رسالة واحدة.

5. اطرح سؤالاً واحداً للتحقق من الفهم.

6. إذا لم يفهم المتعلم، غيّر طريقة الشرح.

7. استخدم أمثلة عملية.

8. قدم ملاحظات بناءة ومحددة.

9. لا تنتقل تلقائياً إلى مهارة جديدة
   قبل التأكد من استعداد المتعلم.

10. حافظ على أسلوب الأستاذ المشجع
    والمحترف.

11. ركز على تعليم استخدام ChatGPT.

12. لا تدّعِ أن المتعلم أتقن مهارة
    دون وجود تقييم يدعم ذلك.

================================

ابدأ أو تابع الدرس وفق حالة المتعلم.
`;
}

// ==================================================
// LEARNING PROGRESS SUMMARY
// ==================================================

export function calculateLearningProgress(
  mastery: Record<string, number>
): {
  average: number;
  mastered: number;
  needsImprovement: number;
  total: number;
} {
  const values = Object.values(mastery)
    .filter((value) => Number.isFinite(value))
    .map(normalizeScore);

  if (values.length === 0) {
    return {
      average: 0,
      mastered: 0,
      needsImprovement: 0,
      total: 0,
    };
  }

  const total = values.length;

  const sum = values.reduce(
    (acc, value) => acc + value,
    0
  );

  const mastered = values.filter(
    (value) => value >= 70
  ).length;

  return {
    average: Math.round(sum / total),

    mastered,

    needsImprovement: total - mastered,

    total,
  };
}