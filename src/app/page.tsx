"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { MainMenu } from "@/components/menu/MainMenu";
import { HorrorGameCanvas } from "@/components/game/HorrorGameCanvas";
import { LeaderboardModal } from "@/components/leaderboard/LeaderboardModal";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { JumpscareOverlay } from "@/components/game/JumpscareOverlay";
import { GameOverScreen } from "@/components/game/GameOverScreen";
import { CRTOverlay } from "@/components/effects/CRTOverlay";
import { GlitchLayer } from "@/components/effects/GlitchLayer";

export default function Home() {
  const {
    screen,
    outcome,
    gameSessionId,
    finalScore,
    finalSurvivalTime,
    isJumpscareActive,
    startEscape,
    startContainment,
  } = useGame();

  const isGameOver = outcome === "VICTORY" || outcome === "DEFEAT";
  const showActiveCanvas = !isJumpscareActive && !isGameOver;

  return (
    <main className="relative min-h-screen w-full bg-[#09080A] text-[#F5F3F2] overflow-hidden">
      {/* CRT Scanline & Glitch Layers */}
      <CRTOverlay />
      <GlitchLayer />

      {/* Main Menu State */}
      {screen === "MENU" && <MainMenu />}

      {/* Active 2.5D Survival Gameplay (unmounts cleanly on jumpscare/gameover) */}
      {showActiveCanvas && screen === "PLAY_ESCAPE" && (
        <HorrorGameCanvas key={gameSessionId} mode="ESCAPE" />
      )}
      {showActiveCanvas && screen === "PLAY_CONTAINMENT" && (
        <HorrorGameCanvas key={gameSessionId} mode="CONTAINMENT" />
      )}

      {/* Leaderboard Modal */}
      {screen === "LEADERBOARD" && (
        <>
          <MainMenu />
          <LeaderboardModal />
        </>
      )}

      {/* Settings Modal */}
      {screen === "SETTINGS" && (
        <>
          <MainMenu />
          <SettingsModal />
        </>
      )}

      {/* Terrifying Ronald Jumpscare Burst (Plays once per defeat) */}
      {isJumpscareActive && <JumpscareOverlay />}

      {/* Game Over / Victory Modal */}
      {isGameOver && !isJumpscareActive && (
        <GameOverScreen
          mode={screen === "PLAY_ESCAPE" ? "ESCAPE" : "CONTAINMENT"}
          outcome={outcome}
          score={finalScore}
          survivalTime={finalSurvivalTime}
          onRestart={() => {
            if (screen === "PLAY_ESCAPE") startEscape();
            else startContainment();
          }}
        />
      )}
    </main>
  );
}
