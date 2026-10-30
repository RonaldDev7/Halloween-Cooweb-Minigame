"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function JumpscareOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !imageRef.current) return;

      const tl = gsap.timeline();

      // Violent camera shake
      tl.to(containerRef.current, {
        x: () => (Math.random() - 0.5) * 40,
        y: () => (Math.random() - 0.5) * 40,
        duration: 0.04,
        repeat: 25,
        yoyo: true,
        ease: "none",
      });

      // Monster lunge towards screen
      tl.fromTo(
        imageRef.current,
        { scale: 0.85, filter: "brightness(0.3) contrast(200%)" },
        { scale: 1.15, filter: "brightness(1.4) contrast(150%)", duration: 0.25, ease: "power4.out" },
        0
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden pointer-events-none"
    >
      {/* Red blood emergency strobe */}
      <div className="absolute inset-0 bg-[#FF1E42]/40 mix-blend-color-burn animate-ping pointer-events-none" />

      {/* Ronald Monster Visual */}
      <div ref={imageRef} className="relative w-full h-full max-w-5xl max-h-screen">
        <Image
          src="/images/ronald-monster.jpg"
          alt="Ronald Biomechanical Monster"
          fill
          priority
          className="object-cover sm:object-contain drop-shadow-[0_0_80px_rgba(255,30,66,0.9)]"
        />

        {/* Glitch CRT Lines over monster */}
        <div className="absolute inset-0 crt-scanlines opacity-70" />

        {/* Terrifying Inscription */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center w-full px-4">
          <p className="text-xl sm:text-3xl font-black font-mono tracking-widest text-[#FF1E42] glitch-text drop-shadow-[0_0_20px_#FF1E42]" data-text="EL CÓDIGO NO MUERE...">
            EL CÓDIGO NO MUERE...
          </p>
          <p className="text-sm sm:text-lg font-mono text-[#F5F3F2] font-bold tracking-wider mt-1 drop-shadow-md">
            RESUCITA CON IA_
          </p>
        </div>
      </div>
    </div>
  );
}
