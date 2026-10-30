"use client";

import React, { useRef } from "react";
import { useGame } from "@/context/GameContext";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function GlitchLayer() {
  const { isJumpscareActive } = useGame();
  const layerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!layerRef.current) return;
      if (isJumpscareActive) {
        gsap.to(layerRef.current, {
          x: () => (Math.random() - 0.5) * 20,
          y: () => (Math.random() - 0.5) * 20,
          duration: 0.05,
          repeat: 10,
          yoyo: true,
          ease: "none",
          onComplete: () => {
            gsap.set(layerRef.current, { x: 0, y: 0 });
          },
        });
      }
    },
    { dependencies: [isJumpscareActive], scope: layerRef }
  );

  if (!isJumpscareActive) return null;

  return (
    <div
      ref={layerRef}
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden mix-blend-screen"
    >
      <div
        className="absolute inset-0 bg-[#FF1E42]/20 translate-x-1"
        style={{ clipPath: "polygon(0 15%, 100% 12%, 100% 35%, 0 38%)" }}
      />
      <div
        className="absolute inset-0 bg-[#8B1FD4]/25 -translate-x-1"
        style={{ clipPath: "polygon(0 62%, 100% 58%, 100% 82%, 0 85%)" }}
      />
    </div>
  );
}
