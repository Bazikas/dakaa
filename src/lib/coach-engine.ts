import {
  type Skill,
  type SkillKey,
  skills,
} from "./coach-content";

// ==========================================
// DAKAA AI COACH V2
// MOTEUR PÉDAGOGIQUE
// ==========================================

// Structure du résultat d'évaluation
export type EvaluationResult = {
  score: number;
  passed: boolean;
  feedback: string;
  strengths: string[];
  improvements: string[];
};

// ==========================================
// 1. NORMALISATION DU TEXTE ARABE
// ==========================================

function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ==========================================
// 2. ÉVALUATION DES EXERCICES
// ==========================================

export function evaluateExercise(
  skill: Skill,
  answer: string
): EvaluationResult {
  const normalizedAnswer = normalizeArabic(answer);

  const strengths: string[] = [];
  const improvements: string[] = [];

  let score = 0;

  // Vérifier chaque critère pédagogique
  for (const criterion of skill.exercise.criteria) {
    const matched = criterion.keywords.some((keyword) =>
      normalizedAnswer.includes(normalizeArabic(keyword))
    );

    if (matched) {
      score += criterion.points;
      strengths.push(criterion.label);
    } else {
      improvements.push(criterion.label);
    }
  }

  // Une réponse très courte ne peut pas obtenir
  // une note élevée dans cette démonstration.
  if (answer.trim().length < 30) {
    score = Math.min(score, 40);
  }

  // Garantir un score compris entre 0 et 100
  score = Math.max(0, Math.min(score, 100));

  const passed = score >= 70;

  // Générer un retour pédagogique en arabe
  let feedback = "";

  if (passed) {
    feedback = `🎉 أحسنت!

حصلت على ${score}/100 في هذا التقييم التدريبي.

لقد أظهرت فهماً جيداً للعناصر المطلوبة.

يمكنك الآن الانتقال إلى مهارة جديدة أو إعادة التمرين لتحسين إجابتك.`;
  } else if (score >= 40) {
    feedback = `👍 بداية جيدة!

حصلت على ${score}/100 في هذا التقييم التدريبي.

إجابتك تحتوي على بعض العناصر المطلوبة، لكنها تحتاج إلى تحسين.

راجع الملاحظات التالية وحاول مرة أخرى.`;
  } else {
    feedback = `📚 لا بأس، نحن هنا لنتعلم!

حصلت على ${score}/100 في هذا التقييم التدريبي.

يبدو أن إجابتك تحتاج إلى مزيد من التفاصيل.

اقرأ المثال التوضيحي، ثم حاول كتابة إجابة أكثر وضوحاً.`;
  }

  return {
    score,
    passed,
    feedback,
    strengths,
    improvements,
  };
}

// ==========================================
// 3. CHOISIR LA PROCHAINE COMPÉTENCE
// ==========================================

export function chooseNextSkill(
  mastery: Record<string, number>
): SkillKey {
  // Choisir la première compétence
  // dont le score est inférieur à 70.
  const nextSkill = skills.find(
    (skill) => (mastery[skill.key] ?? 0) < 70
  );

  // Lorsque toutes les compétences atteignent
  // le seuil, recommencer au premier module.
  return nextSkill?.key ?? skills[0].key;
}

// ==========================================
// 4. MESSAGE D'ACCUEIL PERSONNALISÉ
// ==========================================

export function buildWelcomeMessage(
  level: string,
  profession: string,
  skill: Skill
): string {
  return `👋 مرحباً بك في DAKAA AI Coach!

أنا مدربك الشخصي لتعلم الذكاء الاصطناعي.

سأرافقك خطوة بخطوة لتطوير مهاراتك، من خلال الشرح والتطبيق والتقييم.

━━━━━━━━━━━━━━━━━━

👤 ملفك التعليمي

📚 مستواك الحالي: ${level}

💼 مجالك المهني: ${profession}

━━━━━━━━━━━━━━━━━━

🎯 التدريب المقترح اليوم:

${skill.icon} ${skill.title}

${skill.description}

━━━━━━━━━━━━━━━━━━

📖 كيف سنتعلم؟

1️⃣ سأشرح لك المفهوم بطريقة بسيطة.

2️⃣ سأعرض لك مثالاً عملياً.

3️⃣ سأطلب منك تنفيذ تمرين.

4️⃣ سأقدم لك تقييماً وملاحظات.

5️⃣ سنحدد الخطوة التالية حسب نتيجتك.

━━━━━━━━━━━━━━━━━━

🚀 هل أنت مستعد؟

اضغط على زر "ابدأ التدريب" لنبدأ رحلتنا التعليمية.`;
}

// ==========================================
// 5. CONSTRUIRE UNE SÉANCE PÉDAGOGIQUE
// ==========================================

export function buildExerciseMessage(
  skill: Skill
): string {
  return `🧠 ${skill.title}

━━━━━━━━━━━━━━━━━━

📖 الشرح

${skill.explanation}

━━━━━━━━━━━━━━━━━━

📝 التمرين العملي

${skill.exercise.title}

${skill.exercise.instructions}

━━━━━━━━━━━━━━━━━━

💡 مثال توضيحي

${skill.exercise.example}

━━━━━━━━━━━━━━━━━━

🎯 المطلوب منك

اكتب إجابتك بأسلوبك الخاص.

حاول تطبيق ما تعلمته في هذا الدرس.

بعد إرسال الإجابة، سأقدم لك تقييماً تدريبياً يوضح العناصر المكتشفة والعناصر التي تحتاج إلى تحسين.`;
}

// ==========================================
// 6. CONSTRUIRE LE RAPPORT D'ÉVALUATION
// ==========================================

export function buildFeedbackMessage(
  evaluation: EvaluationResult
): string {
  const strengths =
    evaluation.strengths.length > 0
      ? evaluation.strengths
          .map((item) => `✅ ${item}`)
          .join("\n")
      : "لم يتم اكتشاف عناصر مكتملة وفق الكلمات المفتاحية المحددة.";

  const improvements =
    evaluation.improvements.length > 0
      ? evaluation.improvements
          .map((item) => `🔸 ${item}`)
          .join("\n")
      : "لم يتم اكتشاف عناصر ناقصة وفق معايير التمرين.";

  const recommendation = evaluation.passed
    ? `🚀 الخطوة التالية

يمكنك الانتقال إلى تدريب جديد.

أنصحك أيضاً بمحاولة تطبيق هذه المهارة على مهمة حقيقية من حياتك المهنية.`
    : `🔄 الخطوة التالية

راجع العناصر التي تحتاج إلى تحسين.

حاول إعادة صياغة إجابتك مع إضافة المعلومات الناقصة.

يمكنك الضغط على زر "إعادة المحاولة" للقيام بتدريب جديد.`;

  return `📊 تقرير DAKAA التدريبي

━━━━━━━━━━━━━━━━━━

${evaluation.feedback}

━━━━━━━━━━━━━━━━━━

🌟 العناصر المكتشفة

${strengths}

━━━━━━━━━━━━━━━━━━

🛠️ عناصر تحتاج إلى تحسين

${improvements}

━━━━━━━━━━━━━━━━━━

${recommendation}

━━━━━━━━━━━━━━━━━━

ℹ️ ملاحظة مهمة:

هذا تقييم تجريبي يعتمد على اكتشاف كلمات مفتاحية محددة.

لا يستطيع هذا المحرك حالياً فهم المعنى الكامل للإجابة أو الحكم بدقة على جودتها.

سيتم تطوير نظام تقييم أكثر تقدماً عند ربط DAKAA بنموذج ذكاء اصطناعي.`;
}