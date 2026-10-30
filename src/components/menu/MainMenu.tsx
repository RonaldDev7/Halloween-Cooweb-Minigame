"use client";

import React, { useRef, useEffect, useState } from "react";
import { useGame } from "@/context/GameContext";
import { soundFX } from "@/lib/audio/soundFX";
import {
  Play,
  ShieldAlert,
  Trophy,
  Settings,
  Volume2,
  VolumeX,
  Skull,
  Headphones,
  ChevronRight,
  Radio,
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function MainMenu() {
  const { startEscape, startContainment, openLeaderboard, openSettings, soundMuted, toggleSound } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const monsterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    soundFX.startAmbient();
  }, []);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.fromTo(
        ".menu-header",
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );

      tl.fromTo(
        ".menu-title-block",
        { opacity: 0, x: -25 },
        { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" },
        "-=0.2"
      );

      tl.fromTo(
        ".menu-btn-item",
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, stagger: 0.08, duration: 0.5, ease: "power2.out" },
        "-=0.4"
      );

      if (monsterRef.current) {
        gsap.to(monsterRef.current, {
          scale: 1.03,
          duration: 5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full bg-[#09080A] text-[#F5F3F2] overflow-hidden flex flex-col justify-between p-5 sm:p-8 md:p-10 select-none font-mono"
    >
      {/* Background Visual Layer: Monster Ronald prominently displayed on the right */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          ref={monsterRef}
          className="absolute right-0 top-0 w-full md:w-[65%] h-full"
          style={{ transformOrigin: "center right" }}
        >
          <img
            src="/images/ronald-monster.jpg"
            alt="Ronald Monstruo Biomecánico"
            className="w-full h-full object-cover object-top filter contrast-125 brightness-95"
          />
          {/* Violet Glow & Blood Red Lighting Overlays */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 60% 40%, rgba(83, 5, 112, 0.4) 0%, transparent 65%)",
            }}
          />
        </div>

        {/* Heavy Dark Gradient from Left to Right to ensure 100% button legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #09080A 0%, rgba(9, 8, 10, 0.95) 42%, rgba(9, 8, 10, 0.5) 75%, transparent 100%)",
          }}
        />

        {/* CRT Scanline Filter */}
        <div className="crt-scanlines absolute inset-0 opacity-35" />
      </div>

      {/* Top Header: Official CooWeb Logo + Sound Switch */}
      <header className="menu-header relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/images/cooweb-logo.png"
            alt="CooWeb"
            style={{
              width: "40px",
              height: "40px",
              objectFit: "contain",
              flexShrink: 0,
              filter: "drop-shadow(0 0 10px rgba(43, 127, 255, 0.9))",
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black tracking-widest text-[#8B1FD4] uppercase">
                COOWEB BIO-DEFENSE
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#530570]/50 text-[#00FFC2] border border-[#8B1FD4]/50 font-mono">
                SEC-07
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 tracking-wider block">
              COMPLEJO SUBTERRÁNEO // AÑO 2041
            </span>
          </div>
        </div>

        <button
          onClick={toggleSound}
          className="px-3 py-1.5 rounded-sm bg-black/75 border border-[#530570]/80 hover:border-[#8B1FD4] text-neutral-200 transition-all flex items-center gap-2 text-xs hover:bg-[#530570]/30"
          title={soundMuted ? "Activar audio" : "Silenciar audio"}
        >
          {soundMuted ? (
            <VolumeX className="w-4 h-4 text-neutral-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#00FFC2]" />
          )}
          <span className="hidden sm:inline font-bold">
            {soundMuted ? "MUTE" : "AUDIO ON"}
          </span>
        </button>
      </header>

      {/* Center Left: Game Title & AAA Tactical Menu */}
      <div className="relative z-10 max-w-xl my-auto py-2">
        <div className="menu-title-block mb-5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#FF1E42]/20 border border-[#FF1E42]/60 text-[#FF1E42] text-[10px] font-bold mb-2 tracking-widest uppercase">
            <Skull className="w-3.5 h-3.5 animate-pulse" />
            <span>BIOHAZARD PROTOCOL // SUJETO: RONALD</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#F5F3F2] uppercase leading-none"
            style={{
              textShadow:
                "0 0 25px rgba(139, 31, 212, 0.8), 0 0 50px rgba(83, 5, 112, 0.6), 0 4px 10px rgba(0,0,0,0.9)",
            }}
          >
            THE LAST <span className="text-[#8B1FD4] glitch-text" data-text="PROTOCOL">PROTOCOL</span>
          </h1>

          <p className="text-xs text-neutral-300 mt-2.5 leading-relaxed max-w-md drop-shadow">
            Ronald ha mutado en una aberración biomecánica fusionada con la IA E.V.A. Adéntrate en el laboratorio subterráneo y sobrevive a su cacería.
          </p>
        </div>

        {/* Tactical Game Menu Buttons */}
        <div className="space-y-2.5 max-w-md">
          {/* Button 1: Mode Escape */}
          <button
            onClick={startEscape}
            onMouseEnter={() => soundFX.playFootstep()}
            className="menu-btn-item w-full group px-4 py-3 bg-[#530570]/90 hover:bg-[#8B1FD4] text-[#F5F3F2] font-black text-xs sm:text-sm tracking-wider border border-[#8B1FD4] rounded-sm transition-all flex items-center justify-between shadow-[0_0_20px_rgba(139,31,212,0.4)] hover:shadow-[0_0_35px_rgba(139,31,212,0.9)] hover:translate-x-1.5 active:scale-98"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="p-1.5 bg-black/40 rounded border border-[#8B1FD4]/60 group-hover:border-white">
                <Play className="w-4 h-4 text-[#00FFC2] fill-[#00FFC2]" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black tracking-widest text-xs sm:text-sm">JUGAR // MODO ESCAPE</span>
                  <span className="text-[9px] px-1 bg-[#00FFC2]/20 text-[#00FFC2] font-mono rounded font-bold">
                    HISTORIA
                  </span>
                </div>
                <span className="text-[10px] text-neutral-200 font-normal block font-sans">
                  Recupera 3 fragmentos de la cura y huye antes de que te atrape.
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#00FFC2] group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Button 2: Competitive Containment */}
          <button
            onClick={startContainment}
            onMouseEnter={() => soundFX.playFootstep()}
            className="menu-btn-item w-full group px-4 py-3 bg-[#181022]/95 hover:bg-[#2A183C] text-[#F5F3F2] font-black text-xs sm:text-sm tracking-wider border border-[#FF1E42]/60 hover:border-[#FF1E42] rounded-sm transition-all flex items-center justify-between shadow-[0_0_15px_rgba(255,30,66,0.2)] hover:shadow-[0_0_30px_rgba(255,30,66,0.6)] hover:translate-x-1.5 active:scale-98"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="p-1.5 bg-black/50 rounded border border-[#FF1E42]/60 group-hover:border-white">
                <ShieldAlert className="w-4 h-4 text-[#FF1E42]" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black tracking-widest text-xs sm:text-sm">PROTOCOLO: CONTENCIÓN</span>
                  <span className="text-[9px] px-1 bg-[#FF1E42]/20 text-[#FF1E42] font-mono rounded font-bold">
                    RANKING
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 font-normal block font-sans">
                  Sobrevive por puntos, hackea terminales y compite en el ranking.
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#FF1E42] group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Button 3: Global Leaderboard */}
          <button
            onClick={openLeaderboard}
            onMouseEnter={() => soundFX.playFootstep()}
            className="menu-btn-item w-full group px-4 py-2.5 bg-black/80 hover:bg-[#150F20] text-neutral-300 hover:text-white font-bold text-xs tracking-wider border border-neutral-800 hover:border-[#8B1FD4] rounded-sm transition-all flex items-center justify-between hover:translate-x-1"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Trophy className="w-4 h-4 text-[#F59E0B]" />
              <div>
                <span className="font-bold tracking-wider text-xs">CLASIFICACIÓN GLOBAL</span>
                <span className="text-[10px] text-neutral-400 block font-normal font-sans">
                  Top 10 de supervivientes registrados en Supabase.
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-[#F59E0B] transition-colors" />
          </button>

          {/* Button 4: Settings & Controls */}
          <button
            onClick={openSettings}
            onMouseEnter={() => soundFX.playFootstep()}
            className="menu-btn-item w-full group px-4 py-2.5 bg-black/80 hover:bg-[#150F20] text-neutral-300 hover:text-white font-bold text-xs tracking-wider border border-neutral-800 hover:border-neutral-600 rounded-sm transition-all flex items-center justify-between hover:translate-x-1"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Settings className="w-4 h-4 text-neutral-400" />
              <div>
                <span className="font-bold tracking-wider text-xs">CONFIGURACIÓN & CONTROLES</span>
                <span className="text-[10px] text-neutral-400 block font-normal font-sans">
                  Ajustes de audio y guía de sigilo.
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Bottom Footer: Sound Advice & Controls */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] sm:text-[11px] text-neutral-400 pt-3 border-t border-neutral-900/80">
        <div className="flex items-center gap-2 text-neutral-300">
          <Headphones className="w-3.5 h-3.5 text-[#00FFC2]" />
          <span>RECOMENDADO JUGAR CON AURICULARES EN LA OSCURIDAD</span>
        </div>
        <div className="text-[10px] text-neutral-500 font-mono">
          [W,A,S,D] Mover | [Ratón] Linterna | [Shift] Esprintar | [F] Apagar Luz | [E] Usar
        </div>
      </footer>
    </div>
  );
}
