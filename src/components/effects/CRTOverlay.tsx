"use client";

import React from "react";

export function CRTOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* CRT scanlines grid */}
      <div className="absolute inset-0 crt-scanlines opacity-50" />
      
      {/* CRT vignette curvature */}
      <div className="absolute inset-0 crt-vignette opacity-70" />
      
      {/* Peripheral HUD framing markers */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#8B1FD4]/40" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#8B1FD4]/40" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#8B1FD4]/40" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#8B1FD4]/40" />
    </div>
  );
}
