import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  const tokenHeader = request.headers.get("authorization") || "";
  if (!tokenHeader.startsWith("Bearer ")) {
    return NextResponse.json({ allowed: false }, { status: 401, headers });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publicKey || !serviceKey) {
    return NextResponse.json({ allowed: false }, { status: 503, headers });
  }
  const token = tokenHeader.slice(7).trim();
  const auth = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await auth.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ allowed: false }, { status: 401, headers });
  }
  if (process.env.DAKAA_ADMIN_USER_ID && user.id === process.env.DAKAA_ADMIN_USER_ID) {
    return NextResponse.json({ allowed: true }, { headers });
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date().toISOString();
  const { data, error } = await admin.from("user_subscriptions")
    .select("id,subscription_plans!inner(active)")
    .eq("user_id", user.id).eq("status", "active")
    .lte("current_period_start", now).gt("current_period_end", now)
    .eq("subscription_plans.active", true).limit(1).maybeSingle();
  if (error) {
    console.error("DAKAA subscription access check:", error);
    return NextResponse.json({ allowed: false }, { status: 503, headers });
  }
  return NextResponse.json({ allowed: !!data }, { status: data ? 200 : 403, headers });
}