import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ywecilfuetzrfaoovonz.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZWNpbGZ1ZXR6cmZhb292b256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNzkyNDUsImV4cCI6MjEwODk1NTI0NX0.rNMFXu5ZiSUoKVSGk6qtL4ExEzmMERPjBK4MR6EjMYw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  survival_time: number;
  created_at: string;
  is_local?: boolean;
}

const DEFAULT_SCORES: LeaderboardEntry[] = [
  { id: "1", player_name: "E.V.A._HUNTER", score: 3450, survival_time: 195, created_at: "2041-10-30T10:14:00Z", is_local: true },
  { id: "2", player_name: "CYBER_SURVIVOR", score: 2890, survival_time: 160, created_at: "2041-10-30T10:30:00Z", is_local: true },
  { id: "3", player_name: "BIO_HACKER", score: 2150, survival_time: 135, created_at: "2041-10-30T11:00:00Z", is_local: true },
  { id: "4", player_name: "DEV_RONALD_404", score: 1720, survival_time: 110, created_at: "2041-10-30T11:20:00Z", is_local: true },
  { id: "5", player_name: "OUTLAST_RUNNER", score: 1250, survival_time: 85, created_at: "2041-10-30T11:45:00Z", is_local: true },
];

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .order("survival_time", { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ data: DEFAULT_SCORES, isCloud: false });
    }

    return NextResponse.json({ data, isCloud: true });
  } catch {
    return NextResponse.json({ data: DEFAULT_SCORES, isCloud: false });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cleanName = (body.player_name || "SUPERVIVIENTE").trim().substring(0, 24);
    const score = Math.max(0, Math.floor(body.score || 0));
    const survival_time = Math.max(0, Math.floor(body.survival_time || 0));

    const newEntry: LeaderboardEntry = {
      id: crypto.randomUUID(),
      player_name: cleanName,
      score,
      survival_time,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("leaderboard")
      .insert([{ player_name: cleanName, score, survival_time }])
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ success: true, entry: newEntry, isCloud: false });
    }

    return NextResponse.json({ success: true, entry: data, isCloud: true });
  } catch {
    return NextResponse.json({
      success: true,
      entry: {
        id: crypto.randomUUID(),
        player_name: "SUPERVIVIENTE",
        score: 0,
        survival_time: 0,
        created_at: new Date().toISOString(),
      },
      isCloud: false,
    });
  }
}
