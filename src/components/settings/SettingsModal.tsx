"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { soundFX } from "@/lib/audio/soundFX";
import { Settings, Volume2, VolumeX, ArrowLeft, Keyboard, Eye, ShieldAlert, Cpu } from "lucide-react";

export function SettingsModal() {
  const { goToMenu, soundMuted, toggleSound } = useGame();

  return (
    <div className="fixed inset-0 z-40 bg-[#09080A]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-mono select-none">
      <div className="relative w-full max-w-2xl bg-[#120E17] border border-[#530570]/70 rounded-sm shadow-[0_0_50px_rgba(83,5,112,0.4)] p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#530570]/60">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#8B1FD4]" />
            <h2 className="text-lg font-black text-[#F5F3F2] tracking-wider">
              CONFIGURACIÓN & PROTOCOLO DE CONTROL
            </h2>
          </div>
          <button
            onClick={goToMenu}
            className="px-3 py-1.5 bg-[#530570] hover:bg-[#8B1FD4] text-white text-xs font-bold rounded transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>VOLVER</span>
          </button>
        </div>

        {/* Audio Controls */}
        <div className="p-4 bg-black/60 border border-neutral-800 rounded space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F5F3F2]">
              {soundMuted ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-[#00FFC2]" />}
              <span>SISTEMA DE AUDIO ATMOSFÉRICO (WEB AUDIO API)</span>
            </div>
            <button
              onClick={toggleSound}
              className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                soundMuted
                  ? "bg-neutral-800 text-neutral-400 border-neutral-700"
                  : "bg-[#530570] text-[#00FFC2] border-[#8B1FD4] shadow-[0_0_10px_rgba(139,31,212,0.4)]"
              }`}
            >
              {soundMuted ? "SILENCIADO" : "ACTIVO"}
            </button>
          </div>
          <p className="text-[11px] text-neutral-400">
            Efectos procedurales sintetizados en tiempo real: pasos de metal, cono de linterna, zumbido de laboratorio, latidos cardíacos y rugidos de Ronald.
          </p>
        </div>

        {/* Controls Scheme */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#8B1FD4]">
            <Keyboard className="w-4 h-4" />
            <span>MECÁNICAS DE SUPERVIVENCIA:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-black/40 border border-neutral-800 rounded">
              <span className="text-[#00FFC2] font-bold block mb-1">MOVIMIENTO:</span>
              <span className="text-neutral-300">[ W, A, S, D ] o [ Flechas ]</span>
            </div>

            <div className="p-3 bg-black/40 border border-neutral-800 rounded">
              <span className="text-[#00FFC2] font-bold block mb-1">ORIENTACIÓN LINTERNA:</span>
              <span className="text-neutral-300">[ Ratón ] o [ Arrastre táctil ]</span>
            </div>

            <div className="p-3 bg-black/40 border border-neutral-800 rounded">
              <span className="text-[#00FFC2] font-bold block mb-1">ESPRINTAR:</span>
              <span className="text-neutral-300">[ Shift ] (Consume estamina)</span>
            </div>

            <div className="p-3 bg-black/40 border border-neutral-800 rounded">
              <span className="text-[#00FFC2] font-bold block mb-1">INTERACTUAR / RECOGER:</span>
              <span className="text-neutral-300">[ E ] o [ Espacio ]</span>
            </div>

            <div className="p-3 bg-black/40 border border-neutral-800 rounded sm:col-span-2">
              <span className="text-[#FF1E42] font-bold block mb-1">SIGILO (CONMUTAR LINTERNA):</span>
              <span className="text-neutral-300">
                Pulsa <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-white">[ F ]</kbd> para apagar la luz. Ronald detecta la luz del haz. En la oscuridad total eres casi invisible si no haces ruido.
              </span>
            </div>
          </div>
        </div>

        {/* System Specs */}
        <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500">
          <span>COOWEB THE LAST PROTOCOL // v2041.10</span>
          <span>MOTOR: CANVAS 2D VOLUMETRIC LIGHTING</span>
        </div>
      </div>
    </div>
  );
}
