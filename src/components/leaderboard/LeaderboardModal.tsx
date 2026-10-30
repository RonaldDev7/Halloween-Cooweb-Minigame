"use client";

import React, { useEffect, useState } from "react";
import { fetchLeaderboard, LeaderboardEntry } from "@/lib/supabase";
import { useGame } from "@/context/GameContext";
import { soundFX } from "@/lib/audio/soundFX";
import { Trophy, Medal, Clock, ArrowLeft, RefreshCw, Database, CloudCheck, ShieldAlert } from "lucide-react";

export function LeaderboardModal() {
  const { goToMenu } = useGame();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);

  const loadScores = async () => {
    setIsLoading(true);
    soundFX.playClick();
    const res = await fetchLeaderboard();
    setEntries(res.data);
    setIsCloud(res.isCloud);
    setIsLoading(false);
  };

  useEffect(() => {
    loadScores();
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#09080A]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-mono select-none">
      <div className="relative w-full max-w-3xl bg-[#120E17] border border-[#530570]/70 rounded-sm shadow-[0_0_50px_rgba(83,5,112,0.4)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#181220] border-b border-[#530570] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/cooweb-logo.png"
              alt="CooWeb"
              style={{ width: "36px", height: "36px", objectFit: "contain", flexShrink: 0 }}
            />
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#F59E0B]" />
                <h2 className="text-base sm:text-lg font-black text-[#F5F3F2] tracking-wider">
                  PROTOCOLO: CONTENCIÓN // RANKING GLOBAL
                </h2>
              </div>
              <span className="text-[10px] text-neutral-400">
                Puntuaciones oficiales registradas en el búnker de CooWeb
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadScores}
              disabled={isLoading}
              className="p-2 rounded bg-black/50 border border-neutral-700 hover:border-[#8B1FD4] text-neutral-300 transition-colors"
              title="Actualizar ranking"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#8B1FD4]" : ""}`} />
            </button>
            <button
              onClick={goToMenu}
              className="px-3 py-1.5 bg-[#530570] hover:bg-[#8B1FD4] text-white text-xs font-bold rounded transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>VOLVER</span>
            </button>
          </div>
        </div>

        {/* Database Status Strip */}
        <div className="px-6 py-2 bg-black/60 border-b border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#00FFC2]" />
            <span>ORIGEN DE DATOS:</span>
            <span className={isCloud ? "text-[#00FFC2] font-bold" : "text-[#F59E0B] font-bold"}>
              {isCloud ? "SUPABASE CLOUD (EN LÍNEA)" : "ALMACENAMIENTO LOCAL ACTIVO"}
            </span>
          </div>
          <div>TOP 10 SUPERVIVIENTES</div>
        </div>

        {/* Leaderboard Table Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-2">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-neutral-400 animate-pulse">
              Consultando registros del protocolo...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No hay puntuaciones registradas aún. ¡Sé el primero en sobrevivir!
            </div>
          ) : (
            entries.slice(0, 10).map((entry, idx) => {
              const isTop1 = idx === 0;
              const isTop2 = idx === 1;
              const isTop3 = idx === 2;

              let rankBadge = `${idx + 1}`;
              let rowStyle = "border-neutral-800 bg-[#0E0B12]/80";
              let badgeColor = "text-neutral-500";

              if (isTop1) {
                rowStyle = "border-[#F59E0B]/70 bg-[#F59E0B]/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]";
                badgeColor = "text-[#F59E0B] font-black";
              } else if (isTop2) {
                rowStyle = "border-slate-400/50 bg-slate-400/5";
                badgeColor = "text-slate-300 font-bold";
              } else if (isTop3) {
                rowStyle = "border-amber-700/50 bg-amber-700/5";
                badgeColor = "text-amber-600 font-bold";
              }

              return (
                <div
                  key={entry.id || idx}
                  className={`p-3 rounded-sm border flex items-center justify-between gap-3 text-xs sm:text-sm transition-all ${rowStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 text-center text-sm ${badgeColor}`}>
                      {isTop1 ? <Medal className="w-4 h-4 mx-auto text-[#F59E0B]" /> : `#${rankBadge}`}
                    </span>
                    <div>
                      <span className="font-bold text-[#F5F3F2] tracking-wider block">
                        {entry.player_name}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 text-right">
                    <div className="hidden sm:block">
                      <span className="text-[10px] text-neutral-500 block">SUPERVIVENCIA</span>
                      <span className="text-neutral-300 flex items-center gap-1 font-mono text-xs">
                        <Clock className="w-3 h-3 text-[#00FFC2]" />
                        {formatTime(entry.survival_time)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">PUNTUACIÓN</span>
                      <span className="text-sm font-black text-[#00FFC2] font-mono tracking-wider">
                        {entry.score.toLocaleString()} PTS
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
