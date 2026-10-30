"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { soundFX } from "@/lib/audio/soundFX";

export type GameScreen = "MENU" | "PLAY_ESCAPE" | "PLAY_CONTAINMENT" | "LEADERBOARD" | "SETTINGS";
export type GameOutcome = "PLAYING" | "VICTORY" | "DEFEAT";

interface GameContextType {
  screen: GameScreen;
  outcome: GameOutcome;
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
  const [finalScore, setFinalScore] = useState(0);
  const [finalSurvivalTime, setFinalSurvivalTime] = useState(0);
  const [isJumpscareActive, setIsJumpscareActive] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  useEffect(() => {
    setSoundMuted(soundFX.getMuted());
  }, []);

  const goToMenu = useCallback(() => {
    soundFX.playClick();
    soundFX.stopChaseMusic();
    soundFX.startAmbient();
    setOutcome("PLAYING");
    setIsJumpscareActive(false);
    setScreen("MENU");
  }, []);

  const startEscape = useCallback(() => {
    soundFX.playClick();
    soundFX.startAmbient();
    setOutcome("PLAYING");
    setIsJumpscareActive(false);
    setScreen("PLAY_ESCAPE");
  }, []);

  const startContainment = useCallback(() => {
    soundFX.playClick();
    soundFX.startAmbient();
    setOutcome("PLAYING");
    setIsJumpscareActive(false);
    setScreen("PLAY_CONTAINMENT");
  }, []);

  const openLeaderboard = useCallback(() => {
    soundFX.playClick();
    setScreen("LEADERBOARD");
  }, []);

  const openSettings = useCallback(() => {
    soundFX.playClick();
    setScreen("SETTINGS");
  }, []);

  const toggleSound = useCallback(() => {
    const isMuted = soundFX.toggleMute();
    setSoundMuted(isMuted);
  }, []);

  const triggerJumpscare = useCallback((onFinished: () => void) => {
    soundFX.playJumpscare();
    soundFX.stopChaseMusic();
    setIsJumpscareActive(true);
    setTimeout(() => {
      setIsJumpscareActive(false);
      onFinished();
    }, 2200);
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
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
