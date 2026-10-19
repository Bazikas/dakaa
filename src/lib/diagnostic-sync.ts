import type { SupabaseClient } from "@supabase/supabase-js";

const KEY = "dakaa_public_diagnostic_v1";
const AI_KEY = "dakaa_public_diagnostic_ai_v1";

export type SavedDiagnostic = {
  profession: string;
  level: string;
  goal: string;
  project: string;
  challenge: string;
  dailyTime: string;
  ai?: {
    summary: string;
    modules: { id: string; title_ar: string }[];
    plan: string[];
  };
};

function readDiagnostic(): SavedDiagnostic | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    const data = value?.data;
    if (!data || typeof data !== "object") return null;
    const fields = ["profession", "level", "goal", "project", "challenge", "dailyTime"] as const;
    if (!fields.every((field) => typeof data[field] === "string" && data[field].length <= 1200)) return null;
    if (!data.profession || !data.level || !data.goal || !data.challenge || !data.dailyTime || data.project.trim().length < 10) return null;
    const result: SavedDiagnostic = {
      profession: data.profession, level: data.level, goal: data.goal,
      project: data.project, challenge: data.challenge, dailyTime: data.dailyTime,
    };
    const aiRaw = localStorage.getItem(AI_KEY);
    if (aiRaw) {
      const ai = JSON.parse(aiRaw);
      if (typeof ai?.summary === "string" && Array.isArray(ai.modules) && Array.isArray(ai.plan)) {
        result.ai = {
          summary: ai.summary.slice(0, 1200),
          modules: ai.modules.filter((m: unknown) => {
            if (!m || typeof m !== "object") return false;
            const row = m as Record<string, unknown>;
            return typeof row.id === "string" && typeof row.title_ar === "string";
          }).slice(0, 4).map((m: { id: string; title_ar: string }) => ({ id: m.id, title_ar: m.title_ar.slice(0, 160) })),
          plan: ai.plan.filter((v: unknown): v is string => typeof v === "string").slice(0, 5).map((v: string) => v.slice(0, 300)),
        };
      }
    }
    return result;
  } catch {
    return null;
  }
}

export async function syncPublicDiagnostic(client: SupabaseClient): Promise<SavedDiagnostic | null> {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return null;
  const existing = auth.user.user_metadata?.dakaa_diagnostic as SavedDiagnostic | undefined;
  const local = readDiagnostic();
  if (!local) return existing ?? null;
  // Preserve existing account diagnostic: never silently overwrite another user's data.
  if (existing) return existing;
  const { error } = await client.auth.updateUser({ data: { dakaa_diagnostic: local } });
  if (error) throw new Error(error.message);
  try { localStorage.removeItem(KEY); localStorage.removeItem(AI_KEY); } catch { /* optional */ }
  return local;
}
