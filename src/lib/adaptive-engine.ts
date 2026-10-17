// DAKAA V7.5
// Adaptive Learning Engine

export type LearningDecision =
  | "reteach"
  | "remediate"
  | "consolidate"
  | "advance";

export interface LearningMemory {
  skillKey: string;
  lastScore: number;
  revisionCount: number;
  strengths: string[];
  weaknesses: string[];
}

export interface AdaptiveRecommendation {
  decision: LearningDecision;
  level: string;
  title: string;
  instruction: string;
  focusAreas: string[];
  canAdvance: boolean;
}

export function analyzeLearningProgress(
  memory: LearningMemory
): AdaptiveRecommendation {
  const score = Math.max(
    0,
    Math.min(100, memory.lastScore)
  );

  const weaknesses = memory.weaknesses ?? [];

  if (score < 50) {
    return {
      decision: "reteach",
      level: "مبتدئ",
      title: "إعادة شرح المفاهيم الأساسية",
      instruction:
        "اشرح المفاهيم بطريقة مبسطة، ثم قدم مثالاً عملياً وتمريناً سهلاً.",
      focusAreas: weaknesses,
      canAdvance: false,
    };
  }

  if (score < 70) {
    return {
      decision: "remediate",
      level: "أساسي",
      title: "معالجة نقاط الضعف",
      instruction:
        "أنشئ تمريناً جديداً يركز على الأخطاء السابقة، ثم قدم تصحيحاً مفصلاً.",
      focusAreas: weaknesses,
      canAdvance: false,
    };
  }

  if (score < 90) {
    return {
      decision: "consolidate",
      level: "متوسط",
      title: "تعزيز المهارات المكتسبة",
      instruction:
        "أنشئ تمريناً تطبيقياً أكثر تقدماً يعالج نقاط الضعف المتبقية.",
      focusAreas: weaknesses,
      canAdvance: true,
    };
  }

  return {
    decision: "advance",
    level: "متقدم",
    title: "الانتقال إلى تحدٍ متقدم",
    instruction:
      "قدم تحدياً عملياً متقدماً أو اقترح الانتقال إلى المهارة التالية.",
    focusAreas: weaknesses,
    canAdvance: true,
  };
}