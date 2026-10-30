"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { useGame } from "@/context/GameContext";
import { soundFX } from "@/lib/audio/soundFX";
import { Play, ShieldAlert, Trophy, Settings, Volume2, VolumeX, Skull, Radio } from "lucide-react";
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

      // Atmospheric fade in
      tl.from(".menu-header", {
        opacity: 0,
        y: -30,
        duration: 1,
        ease: "power2.out",
      });

      tl.from(
        monsterRef.current,
        {
          opacity: 0,
          scale: 1.08,
          duration: 1.8,
          ease: "power3.out",
        },
        "-=0.6"
      );

      tl.from(
        ".menu-btn",
        {
          opacity: 0,
          x: -40,
          stagger: 0.12,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=1"
      );

      // Continuous subtle breathing zoom on Ronald
      gsap.to(monsterRef.current, {
        scale: 1.025,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-[#09080A] text-[#F5F3F2] overflow-hidden flex flex-col justify-between p-6 sm:p-10 select-none font-mono"
    >
      {/* Background Ronald Monster Hero Visual with radial mask */}
      <div
        ref={monsterRef}
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      >
        <Image
          src="/images/ronald-monster.jpg"
          alt="Ronald Monster - CooWeb"
          fill
          priority
          className="object-cover object-center filter contrast-125 brightness-90"
        />
        {/* Radial Dark Vignette & Violet Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#09080A_85%)]" />
        <div className="absolute inset-0 bg-[#09080A]/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09080A] via-[#09080A]/80 to-transparent w-full md:w-3/5" />
        {/* CRT Scanline effect */}
        <div className="absolute inset-0 crt-scanlines opacity-50" />
      </div>

      {/* Top Header: Official CooWeb Logo + Atmosphere Indicators */}
      <header className="menu-header relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_15px_rgba(43,127,255,0.7)]">
            <Image
              src="/images/cooweb-logo.png"
              alt="CooWeb Logo Oficial"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-xs tracking-widest text-[#8B1FD4] font-bold block">
              COOWEB EXPERIMENTAL DIVISION // 2041
            </span>
            <span className="text-[10px] text-neutral-400">
              SISTEMA DE CONTENCIÓN SUBTERRÁNEO SECTOR 07
            </span>
          </div>
        </div>

        <button
          onClick={toggleSound}
          className="p-2.5 rounded-sm bg-black/60 border border-[#530570]/70 hover:border-[#8B1FD4] text-neutral-300 transition-colors flex items-center gap-2 text-xs"
          title={soundMuted ? "Activar audio" : "Silenciar audio"}
        >
          {soundMuted ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-[#00FFC2]" />}
          <span className="hidden sm:inline">{soundMuted ? "MUTE" : "SONIDO ACTIVO"}</span>
        </button>
      </header>

      {/* Main Title & Action Menu */}
      <div className="relative z-10 max-w-xl my-auto py-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FF1E42]/15 border border-[#FF1E42]/40 text-[#FF1E42] text-[11px] font-bold mb-3 tracking-widest">
            <Skull className="w-3.5 h-3.5 animate-pulse" />
            <span>ADVERTENCIA: PROTOCOLO HOSTIL ACTIVO</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-wider text-[#F5F3F2] uppercase leading-none drop-shadow-[0_0_25px_rgba(139,31,212,0.6)]">
            THE LAST <span className="text-[#8B1FD4] glitch-text" data-text="PROTOCOL">PROTOCOL</span>
          </h1>

          <p className="text-xs sm:text-sm text-neutral-400 mt-3 leading-relaxed max-w-md">
            Ronald sigue en las profundidades del laboratorio. Encuentra la cura o sobrevive a su cacería antes de que la IA E.V.A. selle las compuertas para siempre.
          </p>
        </div>

        {/* Menu Buttons List */}
        <div className="space-y-3 pt-2">
          {/* Play Escape Mode */}
          <button
            onClick={startEscape}
            onMouseEnter={() => soundFX.playFootstep()}
            className="menu-btn chamfer-btn w-full sm:w-80 group py-4 px-6 bg-[#530570] hover:bg-[#8B1FD4] text-[#F5F3F2] font-black text-sm tracking-widest border border-[#8B1FD4] shadow-[0_0_25px_rgba(139,31,212,0.4)] hover:shadow-[0_0_40px_rgba(139,31,212,0.8)] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Play className="w-4 h-4 text-[#00FFC2] fill-[#00FFC2] group-hover:scale-110 transition-transform" />
              <span>JUGAR // MODO ESCAPE</span>
            </div>
            <span className="text-[10px] text-[#00FFC2] opacity-80 group-hover:opacity-100 font-bold">
              HISTORIA
            </span>
          </button>

          {/* Containment Protocol (Competitive Mode) */}
          <button
            onClick={startContainment}
            onMouseEnter={() => soundFX.playFootstep()}
            className="menu-btn chamfer-btn w-full sm:w-80 group py-4 px-6 bg-[#16101E] hover:bg-[#251A33] text-[#F5F3F2] font-black text-sm tracking-widest border border-[#FF1E42]/60 hover:border-[#FF1E42] shadow-[0_0_15px_rgba(255,30,66,0.2)] hover:shadow-[0_0_25px_rgba(255,30,66,0.5)] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-[#FF1E42] group-hover:scale-110 transition-transform" />
              <span>PROTOCOLO: CONTENCIÓN</span>
            </div>
            <span className="text-[10px] text-[#FF1E42] font-bold">
              RANKING
            </span>
          </button>

          {/* Leaderboard */}
          <button
            onClick={openLeaderboard}
            onMouseEnter={() => soundFX.playFootstep()}
            className="menu-btn w-full sm:w-80 py-3.5 px-6 bg-black/60 hover:bg-[#120E17] text-neutral-300 hover:text-white font-bold text-xs tracking-wider border border-neutral-800 hover:border-[#8B1FD4] transition-all flex items-center gap-3"
          >
            <Trophy className="w-4 h-4 text-[#F59E0B]" />
            <span>CLASIFICACIÓN GLOBAL</span>
          </button>

          {/* Settings */}
          <button
            onClick={openSettings}
            onMouseEnter={() => soundFX.playFootstep()}
            className="menu-btn w-full sm:w-80 py-3.5 px-6 bg-black/60 hover:bg-[#120E17] text-neutral-300 hover:text-white font-bold text-xs tracking-wider border border-neutral-800 hover:border-neutral-600 transition-all flex items-center gap-3"
          >
            <Settings className="w-4 h-4 text-neutral-400" />
            <span>CONFIGURACIÓN & CONTROLES</span>
          </button>
        </div>
      </div>

      {/* Footer System Status */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 text-[11px] text-neutral-500 pt-4 border-t border-neutral-900">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-[#00FFC2] animate-pulse" />
          <span>ESTADO DEL SERVIDOR: COMPROMETIDO POR E.V.A.</span>
        </div>
        <div>
          <span>CONTROLES: [W,A,S,D] MOVERSE | [RATÓN] LINTERNA | [SHIFT] ESQUIVAR | [F] APAGAR LUZ</span>
        </div>
      </footer>
    </div>
  );
}
