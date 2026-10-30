import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ywecilfuetzrfaoovonz.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZWNpbGZ1ZXR6cmZhb292b256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNzkyNDUsImV4cCI6MjEwODk1NTI0NX0.rNMFXu5ZiSUoKVSGk6qtL4ExEzmMERPjBK4MR6EjMYw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  survival_time: number;
  created_at: string;
  is_local?: boolean;
}

const LOCAL_STORAGE_KEY = "cooweb_last_protocol_leaderboard";

const DEFAULT_SCORES: LeaderboardEntry[] = [
  { id: "1", player_name: "E.V.A._HUNTER", score: 3450, survival_time: 195, created_at: "2041-10-30T10:14:00Z", is_local: true },
  { id: "2", player_name: "CYBER_SURVIVOR", score: 2890, survival_time: 160, created_at: "2041-10-30T10:30:00Z", is_local: true },
  { id: "3", player_name: "BIO_HACKER", score: 2150, survival_time: 135, created_at: "2041-10-30T11:00:00Z", is_local: true },
  { id: "4", player_name: "DEV_RONALD_404", score: 1720, survival_time: 110, created_at: "2041-10-30T11:20:00Z", is_local: true },
  { id: "5", player_name: "OUTLAST_RUNNER", score: 1250, survival_time: 85, created_at: "2041-10-30T11:45:00Z", is_local: true },
];

export async function fetchLeaderboard(): Promise<{ data: LeaderboardEntry[]; isCloud: boolean }> {
  try {
    const res = await fetch("/api/leaderboard", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch {}

  return { data: getLocalLeaderboard(), isCloud: false };
}

export async function submitScore(
  playerName: string,
  score: number,
  survivalTime: number
): Promise<{ success: boolean; entry: LeaderboardEntry; isCloud: boolean }> {
  const cleanName = playerName.trim().substring(0, 24) || "SUPERVIVIENTE";
  const newEntry: LeaderboardEntry = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    player_name: cleanName,
    score: Math.max(0, Math.floor(score)),
    survival_time: Math.max(0, Math.floor(survivalTime)),
    created_at: new Date().toISOString(),
  };

  saveLocalScore(newEntry);

  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_name: cleanName, score, survival_time: survivalTime }),
    });

    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch {}

  return { success: true, entry: newEntry, isCloud: false };
}

function getLocalLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return DEFAULT_SCORES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SCORES));
      return DEFAULT_SCORES;
    }
    const parsed: LeaderboardEntry[] = JSON.parse(raw);
    return parsed.sort((a, b) => b.score - a.score || b.survival_time - a.survival_time);
  } catch {
    return DEFAULT_SCORES;
  }
}

function saveLocalScore(entry: LeaderboardEntry) {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalLeaderboard();
    const updated = [...current, { ...entry, is_local: true }]
      .sort((a, b) => b.score - a.score || b.survival_time - a.survival_time)
      .slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}
