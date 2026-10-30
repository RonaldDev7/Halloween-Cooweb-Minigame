import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ywecilfuetzrfaoovonz.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZWNpbGZ1ZXR6cmZhb292b256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNzkyNDUsImV4cCI6MjEwODk1NTI0NX0.rNMFXu5ZiSUoKVSGk6qtL4ExEzmMERPjBK4MR6EjMYw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  survival_time: number;
  created_at: string;
  is_local?: boolean;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .order("survival_time", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ data: [], isCloud: false, error: error.message });
    }

    return NextResponse.json({ data: data || [], isCloud: true });
  } catch (err) {
    return NextResponse.json({
      data: [],
      isCloud: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cleanName = (body.player_name || "SUPERVIVIENTE").trim().substring(0, 24);
    const score = Math.max(0, Math.floor(Number(body.score) || 0));
    const survival_time = Math.max(0, Math.floor(Number(body.survival_time) || 0));

    const { data, error } = await supabase
      .from("leaderboard")
      .insert([{ player_name: cleanName, score, survival_time }])
      .select()
      .single();

    if (error || !data) {
      const fallbackEntry: LeaderboardEntry = {
        id: crypto.randomUUID(),
        player_name: cleanName,
        score,
        survival_time,
        created_at: new Date().toISOString(),
        is_local: true,
      };
      return NextResponse.json({ success: true, entry: fallbackEntry, isCloud: false });
    }

    return NextResponse.json({ success: true, entry: data, isCloud: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al registrar puntuación" },
      { status: 500 }
    );
  }
}
