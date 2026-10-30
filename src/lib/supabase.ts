import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ywecilfuetzrfaoovonz.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZWNpbGZ1ZXR6cmZhb292b256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNzkyNDUsImV4cCI6MjEwODk1NTI0NX0.rNMFXu5ZiSUoKVSGk6qtL4ExEzmMERPjBK4MR6EjMYw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  survival_time: number;
  created_at: string;
  is_local?: boolean;
}

const LOCAL_STORAGE_KEY = "cooweb_real_leaderboard_v2";

export async function fetchLeaderboard(): Promise<{ data: LeaderboardEntry[]; isCloud: boolean }> {
  try {
    const res = await fetch(`/api/leaderboard?t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.isCloud) {
        return { data: json.data || [], isCloud: true };
      }
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
  const cleanScore = Math.max(0, Math.floor(score));
  const cleanTime = Math.max(0, Math.floor(survivalTime));

  const newEntry: LeaderboardEntry = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
    player_name: cleanName,
    score: cleanScore,
    survival_time: cleanTime,
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_name: cleanName,
        score: cleanScore,
        survival_time: cleanTime,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.entry) {
        saveLocalScore(json.entry);
      }
      return json;
    }
  } catch {}

  saveLocalScore(newEntry);
  return { success: true, entry: newEntry, isCloud: false };
}

function getLocalLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed: LeaderboardEntry[] = JSON.parse(raw);
    return parsed.sort((a, b) => b.score - a.score || b.survival_time - a.survival_time);
  } catch {
    return [];
  }
}

function saveLocalScore(entry: LeaderboardEntry) {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalLeaderboard().filter((e) => e.id !== entry.id);
    const updated = [...current, entry]
      .sort((a, b) => b.score - a.score || b.survival_time - a.survival_time)
      .slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}
