import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    application: "DAKAA V8",
    configuration: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    },
  });
}

