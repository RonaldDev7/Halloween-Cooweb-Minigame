"use client";

import React from "react";

export function CRTOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* CRT scanlines grid */}
      <div className="absolute inset-0 crt-scanlines opacity-75" />
      
      {/* CRT vignette curvature */}
      <div className="absolute inset-0 crt-vignette opacity-80" />
      
      {/* Dynamic rolling scan bar */}
      <div className="scan-bar" />
      
      {/* Subtle CRT flicker */}
      <div className="absolute inset-0 crt-flicker pointer-events-none" />
      
      {/* Peripheral HUD framing markers */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#8B1FD4]/40" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#8B1FD4]/40" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#8B1FD4]/40" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#8B1FD4]/40" />
    </div>
  );
}
