"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { soundFX } from "@/lib/audio/soundFX";

export type GameScreen = "MENU" | "PLAY_ESCAPE" | "PLAY_CONTAINMENT" | "LEADERBOARD" | "SETTINGS";
export type GameOutcome = "PLAYING" | "VICTORY" | "DEFEAT";

interface GameContextType {
  screen: GameScreen;
  outcome: GameOutcome;
  gameSessionId: number;
  finalScore: number;
  finalSurvivalTime: number;
  isJumpscareActive: boolean;
  soundMuted: boolean;
  goToMenu: () => void;
  startEscape: () => void;
  startContainment: () => void;
  openLeaderboard: () => void;
  openSettings: () => void;
  toggleSound: () => void;
  triggerJumpscare: (onFinished: () => void) => void;
  finishGame: (outcome: "VICTORY" | "DEFEAT", score: number, survivalTime: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<GameScreen>("MENU");
  const [outcome, setOutcome] = useState<GameOutcome>("PLAYING");
  const [gameSessionId, setGameSessionId] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  const [finalSurvivalTime, setFinalSurvivalTime] = useState(0);
  const [isJumpscareActive, setIsJumpscareActive] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // Guard to guarantee the jumpscare only fires ONCE per match
  const jumpscareLockRef = useRef(false);
  const jumpscareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSoundMuted(soundFX.getMuted());
  }, []);

  const clearJumpscareTimer = () => {
    if (jumpscareTimerRef.current) {
      clearTimeout(jumpscareTimerRef.current);
      jumpscareTimerRef.current = null;
    }
  };

  const goToMenu = useCallback(() => {
    clearJumpscareTimer();
    jumpscareLockRef.current = false;
    soundFX.playClick();
    soundFX.stopChaseMusic();
    soundFX.startAmbient();
    setOutcome("PLAYING");
    setIsJumpscareActive(false);
    setScreen("MENU");
  }, []);

  const startEscape = useCallback(() => {
    clearJumpscareTimer();
    jumpscareLockRef.current = false;
    soundFX.playClick();
    soundFX.startAmbient();
    setOutcome("PLAYING");
    setIsJumpscareActive(false);
    setGameSessionId((id) => id + 1);
    setScreen("PLAY_ESCAPE");
  }, []);

  const startContainment = useCallback(() => {
    clearJumpscareTimer();
    jumpscareLockRef.current = false;
    soundFX.playClick();
    soundFX.startAmbient();
    setOutcome("PLAYING");
    setIsJumpscareActive(false);
    setGameSessionId((id) => id + 1);
    setScreen("PLAY_CONTAINMENT");
  }, []);

  const openLeaderboard = useCallback(() => {
    clearJumpscareTimer();
    soundFX.playClick();
    setOutcome("PLAYING");
    setIsJumpscareActive(false);
    setScreen("LEADERBOARD");
  }, []);

  const openSettings = useCallback(() => {
    clearJumpscareTimer();
    soundFX.playClick();
    setOutcome("PLAYING");
    setIsJumpscareActive(false);
    setScreen("SETTINGS");
  }, []);

  const toggleSound = useCallback(() => {
    const isMuted = soundFX.toggleMute();
    setSoundMuted(isMuted);
  }, []);

  const triggerJumpscare = useCallback((onFinished: () => void) => {
    // Prevent multiple jumpscare triggers when already dead
    if (jumpscareLockRef.current) return;
    jumpscareLockRef.current = true;

    soundFX.playJumpscare();
    soundFX.stopChaseMusic();
    setIsJumpscareActive(true);

    clearJumpscareTimer();
    jumpscareTimerRef.current = setTimeout(() => {
      setIsJumpscareActive(false);
      onFinished();
    }, 1800);
  }, []);

  const finishGame = useCallback((resOutcome: "VICTORY" | "DEFEAT", score: number, time: number) => {
    setOutcome(resOutcome);
    setFinalScore(score);
    setFinalSurvivalTime(time);
    soundFX.stopChaseMusic();
  }, []);

  return (
    <GameContext.Provider
      value={{
        screen,
        outcome,
        gameSessionId,
        finalScore,
        finalSurvivalTime,
        isJumpscareActive,
        soundMuted,
        goToMenu,
        startEscape,
        startContainment,
        openLeaderboard,
        openSettings,
        toggleSound,
        triggerJumpscare,
        finishGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
