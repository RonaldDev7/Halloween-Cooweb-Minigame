"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { submitScore } from "@/lib/supabase";
import { soundFX } from "@/lib/audio/soundFX";
import { Trophy, RotateCcw, Home, Skull, CheckCircle2, ShieldCheck, ArrowRight, User } from "lucide-react";

interface GameOverScreenProps {
  mode: "ESCAPE" | "CONTAINMENT";
  outcome: "VICTORY" | "DEFEAT";
  score: number;
  survivalTime: number;
  fragmentsFound?: number;
  onRestart: () => void;
}

export function GameOverScreen({
  mode,
  outcome,
  score,
  survivalTime,
  fragmentsFound = 0,
  onRestart,
}: GameOverScreenProps) {
  const { goToMenu, openLeaderboard } = useGame();
  const [playerName, setPlayerName] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSaved) return;

    setIsSaving(true);
    soundFX.playClick();
    const res = await submitScore(playerName, score, survivalTime);
    setIsSaving(false);
    setIsSaved(true);
    soundFX.playItemPickup();
  };

  const isVictory = outcome === "VICTORY";

  return (
    <div className="fixed inset-0 z-40 bg-[#09080A]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-mono select-none overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#120E17] border border-[#530570]/80 rounded-sm p-6 sm:p-8 space-y-6 text-center shadow-[0_0_60px_rgba(83,5,112,0.4)]">
        {/* Visual Badge */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16 rounded-full border-2 border-[#530570] p-2 bg-black/60 shadow-lg">
            {isVictory ? (
              <ShieldCheck className="w-full h-full text-[#00FFC2] animate-pulse" />
            ) : (
              <Skull className="w-full h-full text-[#FF1E42] animate-bounce" />
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <span className="text-[11px] tracking-widest text-[#8B1FD4] font-bold block mb-1">
            {mode === "ESCAPE" ? "PROTOCOLO: MODO ESCAPE" : "PROTOCOLO DE CONTENCIÓN // COMPETITIVO"}
          </span>
          <h2
            className={`text-2xl sm:text-4xl font-black tracking-wider ${
              isVictory ? "text-[#00FFC2]" : "text-[#FF1E42] glitch-text"
            }`}
            data-text={isVictory ? "ESCAPASTE CON LA CURA" : "RONALD TE HA DEVORADO"}
          >
            {isVictory ? "ESCAPASTE CON LA CURA" : "RONALD TE HA DEVORADO"}
          </h2>
          <p className="text-xs text-neutral-400 mt-2 max-w-sm mx-auto">
            {isVictory
              ? "Lograste recuperar los 3 fragmentos y abrir la esclusa antes de que la IA E.V.A. sellara el complejo."
              : "La criatura biomecánica interceptó tus signos vitales en los pasillos oscuros del laboratorio."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-black/60 border border-neutral-800 rounded text-xs">
          <div>
            <span className="text-[10px] text-neutral-500 block">TIEMPO SOBREVIVIDO:</span>
            <span className="text-lg font-black text-[#F5F3F2] font-mono">
              {formatTime(survivalTime)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-neutral-500 block">
              {mode === "ESCAPE" ? "FRAGMENTOS RECUPERADOS:" : "PUNTUACIÓN FINAL:"}
            </span>
            <span className="text-lg font-black text-[#00FFC2] font-mono">
              {mode === "ESCAPE" ? `${fragmentsFound} / 3` : `${score.toLocaleString()} PTS`}
            </span>
          </div>
        </div>

        {/* Competitive Mode: Save Nickname to Supabase */}
        {mode === "CONTAINMENT" && (
          <div className="p-4 bg-[#181222] border border-[#8B1FD4]/60 rounded space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#F5F3F2]">
              <Trophy className="w-4 h-4 text-[#F59E0B]" />
              <span>REGISTRAR EN EL RANKING DE COOWEB:</span>
            </div>

            {!isSaved ? (
              <form onSubmit={handleSaveScore} className="space-y-3">
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Introduce tu apodo o nombre..."
                    maxLength={24}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-black/70 border border-neutral-700 rounded text-xs text-[#F5F3F2] placeholder:text-neutral-500 focus:outline-none focus:border-[#8B1FD4]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving || !playerName.trim()}
                  className="w-full py-2.5 bg-[#530570] hover:bg-[#8B1FD4] disabled:bg-neutral-800 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,31,212,0.4)]"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>{isSaving ? "GUARDANDO EN SUPABASE..." : "GUARDAR PUNTUACIÓN"}</span>
                </button>
              </form>
            ) : (
              <div className="p-3 bg-[#00FFC2]/10 border border-[#00FFC2]/50 rounded flex items-center justify-center gap-2 text-xs text-[#00FFC2] font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#00FFC2]" />
                <span>¡PUNTUACIÓN GUARDADA CON ÉXITO!</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              soundFX.playClick();
              onRestart();
            }}
            className="chamfer-btn px-6 py-2.5 bg-[#530570] hover:bg-[#8B1FD4] text-white font-bold text-xs rounded transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(139,31,212,0.4)]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#00FFC2]" />
            <span>JUGAR OTRA VEZ</span>
          </button>

          {mode === "CONTAINMENT" && (
            <button
              onClick={openLeaderboard}
              className="px-5 py-2.5 bg-black/60 hover:bg-[#1A1424] border border-[#8B1FD4]/70 text-neutral-300 hover:text-white font-bold text-xs rounded transition-colors flex items-center gap-2"
            >
              <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>VER RANKING</span>
            </button>
          )}

          <button
            onClick={goToMenu}
            className="px-5 py-2.5 bg-black/60 hover:bg-[#1A1424] border border-neutral-700 text-neutral-400 hover:text-white font-bold text-xs rounded transition-colors flex items-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>MENÚ PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
