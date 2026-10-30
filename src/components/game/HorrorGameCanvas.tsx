"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useGame } from "@/context/GameContext";
import { soundFX } from "@/lib/audio/soundFX";
import {
  Zap,
  Battery,
  BatteryCharging,
  Activity,
  KeyRound,
  DoorOpen,
  Eye,
  EyeOff,
  Flame,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";

interface HorrorGameCanvasProps {
  mode: "ESCAPE" | "CONTAINMENT";
}

// Map Dimensions
const MAP_W = 1600;
const MAP_H = 1200;

interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Item {
  id: string;
  type: "FRAGMENT" | "BATTERY" | "TERMINAL" | "LOCKER" | "EXIT";
  x: number;
  y: number;
  radius: number;
  label: string;
  collected?: boolean;
  active?: boolean;
}

export function HorrorGameCanvas({ mode }: HorrorGameCanvasProps) {
  const { finishGame, triggerJumpscare, goToMenu } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Player state
  const playerRef = useRef({
    x: 180,
    y: 180,
    angle: 0,
    speed: 3.2,
    stamina: 100,
    flashlightOn: true,
    battery: 100,
    inLocker: false,
    currentLockerId: null as string | null,
  });

  // Ronald Monster state
  const monsterRef = useRef({
    x: 1100,
    y: 850,
    angle: 0,
    speed: 2.7,
    state: "PATROL" as "PATROL" | "ALERT" | "CHASE",
    alertTimer: 0,
    waypointIdx: 0,
  });

  // Gameplay state
  const [fragmentsCount, setFragmentsCount] = useState(0);
  const [score, setScore] = useState(0);
  const [survivalSecs, setSurvivalSecs] = useState(0);
  const [threatLevel, setThreatLevel] = useState(1);
  const [batteryUi, setBatteryUi] = useState(100);
  const [staminaUi, setStaminaUi] = useState(100);
  const [flashlightUi, setFlashlightUi] = useState(true);
  const [inLockerUi, setInLockerUi] = useState(false);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [exitUnlocked, setExitUnlocked] = useState(false);

  // Key states
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef({ x: 0, y: 0 });

  // Map elements definition
  const walls: Wall[] = [
    // Outer perimeter
    { x: 0, y: 0, w: MAP_W, h: 20 },
    { x: 0, y: MAP_H - 20, w: MAP_W, h: 20 },
    { x: 0, y: 0, w: 20, h: MAP_H },
    { x: MAP_W - 20, y: 0, w: 20, h: MAP_H },

    // Room 1: Lab Interior Walls
    { x: 380, y: 20, w: 20, h: 360 },
    { x: 20, y: 380, w: 280, h: 20 }, // Door gap at x:300-380

    // Room 2: Server Center
    { x: 380, y: 480, w: 20, h: 320 },
    { x: 20, y: 800, w: 380, h: 20 },

    // Central Pillar / Server Banks
    { x: 620, y: 280, w: 180, h: 180 },
    { x: 620, y: 650, w: 180, h: 180 },

    // East Wing: Cryo Storage
    { x: 1050, y: 20, w: 20, h: 420 },
    { x: 1050, y: 520, w: 20, h: 380 },
    { x: 1050, y: 420, w: 280, h: 20 },
    { x: 1400, y: 420, w: 180, h: 20 },

    // South Hall Decontamination Room
    { x: 620, y: 980, w: 450, h: 20 },
  ];

  // Patrol waypoints for Ronald
  const waypoints = [
    { x: 1150, y: 250 },
    { x: 850, y: 250 },
    { x: 500, y: 250 },
    { x: 500, y: 580 },
    { x: 850, y: 580 },
    { x: 850, y: 850 },
    { x: 1250, y: 850 },
    { x: 1250, y: 580 },
  ];

  // Dynamic game items
  const [items, setItems] = useState<Item[]>([
    // Mode Escape Fragments
    { id: "frag1", type: "FRAGMENT", x: 160, y: 650, radius: 24, label: "FRAGMENTO 01 [BIO-CÓDIGO]" },
    { id: "frag2", type: "FRAGMENT", x: 1400, y: 220, radius: 24, label: "FRAGMENTO 02 [NEURAL]" },
    { id: "frag3", type: "FRAGMENT", x: 850, y: 1100, radius: 24, label: "FRAGMENTO 03 [NÚCLEO]" },

    // Flashlight Batteries
    { id: "bat1", type: "BATTERY", x: 280, y: 120, radius: 20, label: "BATERÍA DE LINTERNA (+40%)" },
    { id: "bat2", type: "BATTERY", x: 920, y: 350, radius: 20, label: "BATERÍA DE LINTERNA (+40%)" },
    { id: "bat3", type: "BATTERY", x: 1480, y: 850, radius: 20, label: "BATERÍA DE LINTERNA (+40%)" },

    // Lockers (Hiding Spots)
    { id: "lock1", type: "LOCKER", x: 340, y: 60, radius: 28, label: "TAQUILLA METÁLICA (ESCONDERSE)" },
    { id: "lock2", type: "LOCKER", x: 680, y: 520, radius: 28, label: "TAQUILLA DE SEGURIDAD (ESCONDERSE)" },
    { id: "lock3", type: "LOCKER", x: 1200, y: 480, radius: 28, label: "ARMARIO DE CONTENCIÓN (ESCONDERSE)" },

    // Escape Exit Door
    { id: "exit", type: "EXIT", x: 1520, y: 60, radius: 36, label: "ESCLUSA DE DESCONTAMINACIÓN" },

    // Containment Mode Terminals
    { id: "term1", type: "TERMINAL", x: 200, y: 320, radius: 30, label: "TERMINAL DE PURGA SECTOR 1", active: true },
    { id: "term2", type: "TERMINAL", x: 950, y: 280, radius: 30, label: "TERMINAL DE PURGA SECTOR 2", active: true },
    { id: "term3", type: "TERMINAL", x: 1350, y: 750, radius: 30, label: "TERMINAL DE PURGA SECTOR 3", active: true },
  ]);

  // Handle User Input Events
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;

      // Flashlight toggle
      if (e.key.toLowerCase() === "f") {
        soundFX.playFlashlightClick();
        playerRef.current.flashlightOn = !playerRef.current.flashlightOn;
        setFlashlightUi(playerRef.current.flashlightOn);
      }

      // Interaction key
      if (e.key.toLowerCase() === "e" || e.key === " ") {
        handleInteraction();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
    };
  });

  // Survival Timer & Score Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setSurvivalSecs((prev) => {
        const next = prev + 1;
        if (mode === "CONTAINMENT") {
          // Increase score per second survived
          setScore((s) => s + 10);

          // Escalate threat level every 30 seconds
          const newThreat = Math.min(5, Math.floor(next / 30) + 1);
          setThreatLevel(newThreat);

          // Ronald speeds up with threat level
          monsterRef.current.speed = 2.8 + newThreat * 0.28;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode]);

  // Check collision with walls
  const checkWallCollision = (newX: number, newY: number, radius = 18) => {
    for (const wall of walls) {
      if (
        newX + radius > wall.x &&
        newX - radius < wall.x + wall.w &&
        newY + radius > wall.y &&
        newY - radius < wall.y + wall.h
      ) {
        return true;
      }
    }
    return false;
  };

  // Interaction logic (Pickups, Lockers, Terminals, Exit)
  const handleInteraction = () => {
    const p = playerRef.current;

    // If already in locker, exit
    if (p.inLocker) {
      p.inLocker = false;
      p.currentLockerId = null;
      setInLockerUi(false);
      soundFX.playFootstep();
      return;
    }

    // Check nearby items
    for (const item of items) {
      if (item.collected) continue;
      const dist = Math.hypot(p.x - item.x, p.y - item.y);

      if (dist < item.radius + 30) {
        if (item.type === "FRAGMENT") {
          item.collected = true;
          soundFX.playItemPickup();
          setFragmentsCount((c) => {
            const next = c + 1;
            if (next === 3) setExitUnlocked(true);
            return next;
          });
          if (mode === "CONTAINMENT") setScore((s) => s + 350);
          return;
        }

        if (item.type === "BATTERY") {
          item.collected = true;
          soundFX.playItemPickup();
          p.battery = Math.min(100, p.battery + 45);
          setBatteryUi(p.battery);
          return;
        }

        if (item.type === "LOCKER") {
          p.inLocker = true;
          p.currentLockerId = item.id;
          setInLockerUi(true);
          soundFX.playFootstep();
          return;
        }

        if (item.type === "TERMINAL" && mode === "CONTAINMENT") {
          soundFX.playTerminalHack();
          setScore((s) => s + 250);
          item.active = false;
          // Reactivate after 20s
          setTimeout(() => {
            item.active = true;
          }, 20000);
          return;
        }

        if (item.type === "EXIT" && mode === "ESCAPE") {
          if (fragmentsCount >= 3) {
            soundFX.playTerminalHack();
            finishGame("VICTORY", 5000 - survivalSecs * 10, survivalSecs);
          } else {
            soundFX.playHeartbeat(3);
          }
          return;
        }
      }
    }
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let stepSoundTimer = 0;
    let heartbeatTimer = 0;

    const gameLoop = () => {
      const p = playerRef.current;
      const m = monsterRef.current;

      // 1. Player Movement & Stamina Logic
      const keys = keysRef.current;
      const isSprinting = (keys["shift"] || keys["shiftleft"]) && p.stamina > 10;
      const currentSpeed = isSprinting ? 5.2 : 3.2;

      let dx = 0;
      let dy = 0;

      if (!p.inLocker) {
        if (keys["w"] || keys["arrowup"]) dy -= 1;
        if (keys["s"] || keys["arrowdown"]) dy += 1;
        if (keys["a"] || keys["arrowleft"]) dx -= 1;
        if (keys["d"] || keys["arrowright"]) dx += 1;

        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        const nextX = p.x + dx * currentSpeed;
        const nextY = p.y + dy * currentSpeed;

        if (!checkWallCollision(nextX, p.y)) p.x = nextX;
        if (!checkWallCollision(p.x, nextY)) p.y = nextY;

        // Drain / recharge stamina
        if (isSprinting && (dx !== 0 || dy !== 0)) {
          p.stamina = Math.max(0, p.stamina - 0.45);
        } else {
          p.stamina = Math.min(100, p.stamina + 0.25);
        }
        setStaminaUi(Math.floor(p.stamina));

        // Drain flashlight battery
        if (p.flashlightOn) {
          p.battery = Math.max(0, p.battery - 0.02);
          setBatteryUi(Math.floor(p.battery));
        }

        // Footstep sound cadence
        if (dx !== 0 || dy !== 0) {
          stepSoundTimer++;
          const cadence = isSprinting ? 12 : 22;
          if (stepSoundTimer >= cadence) {
            soundFX.playFootstep(isSprinting);
            stepSoundTimer = 0;
          }
        }
      }

      // 2. Camera calculation
      const viewW = canvas.width;
      const viewH = canvas.height;
      const camX = Math.max(0, Math.min(MAP_W - viewW, p.x - viewW / 2));
      const camY = Math.max(0, Math.min(MAP_H - viewH, p.y - viewH / 2));

      // Calculate player flashlight angle from screen center to mouse
      const screenPx = p.x - camX;
      const screenPy = p.y - camY;
      p.angle = Math.atan2(mouseRef.current.y - screenPy, mouseRef.current.x - screenPx);

      // 3. Ronald AI Perception & Decision
      const distToPlayer = Math.hypot(p.x - m.x, p.y - m.y);

      // Heartbeat audio calculation based on proximity
      heartbeatTimer++;
      const heartRate = distToPlayer < 250 ? 25 : distToPlayer < 500 ? 55 : 90;
      if (heartbeatTimer >= heartRate) {
        soundFX.playHeartbeat(distToPlayer < 250 ? 3 : 1);
        heartbeatTimer = 0;
      }

      // Detection tests
      let canSeePlayer = false;
      if (!p.inLocker) {
        // Player flashlight pointing near monster
        const angleToMonster = Math.atan2(m.y - p.y, m.x - p.x);
        const angleDiff = Math.abs(p.angle - angleToMonster);
        const inFlashlightCone = p.flashlightOn && distToPlayer < 320 && (angleDiff < 0.5 || angleDiff > Math.PI * 2 - 0.5);

        // Monster facing player
        const monsterFacingAngle = Math.atan2(p.y - m.y, p.x - m.x);
        const monsterDiff = Math.abs(m.angle - monsterFacingAngle);
        const inMonsterField = distToPlayer < 180 && (monsterDiff < 1.1 || monsterDiff > Math.PI * 2 - 1.1);

        // Sound detection (sprinting creates noise)
        const heardSprinting = isSprinting && (dx !== 0 || dy !== 0) && distToPlayer < 240;

        if (inFlashlightCone || inMonsterField || heardSprinting) {
          canSeePlayer = true;
        }
      }

      if (canSeePlayer) {
        if (m.state !== "CHASE") {
          soundFX.playMonsterGrowl();
          soundFX.startChaseMusic();
        }
        m.state = "CHASE";
        m.alertTimer = 180; // Chase persistence frames
      } else if (m.state === "CHASE") {
        m.alertTimer--;
        if (m.alertTimer <= 0) {
          m.state = "PATROL";
          soundFX.stopChaseMusic();
        }
      }

      // Ronald Movement Execution
      let targetX = 0;
      let targetY = 0;

      if (m.state === "CHASE") {
        targetX = p.x;
        targetY = p.y;
      } else {
        const wp = waypoints[m.waypointIdx];
        targetX = wp.x;
        targetY = wp.y;
        if (Math.hypot(m.x - wp.x, m.y - wp.y) < 25) {
          m.waypointIdx = (m.waypointIdx + 1) % waypoints.length;
        }
      }

      const mAngle = Math.atan2(targetY - m.y, targetX - m.x);
      m.angle = mAngle;
      const mSpeed = m.state === "CHASE" ? m.speed * 1.3 : m.speed;

      const mNextX = m.x + Math.cos(mAngle) * mSpeed;
      const mNextY = m.y + Math.sin(mAngle) * mSpeed;

      if (!checkWallCollision(mNextX, m.y, 22)) m.x = mNextX;
      if (!checkWallCollision(m.x, mNextY, 22)) m.y = mNextY;

      // Check Jumpscare Collision!
      if (!p.inLocker && distToPlayer < 36) {
        triggerJumpscare(() => {
          finishGame("DEFEAT", score, survivalSecs);
        });
        return; // End loop on jumpscare
      }

      // Check nearby interactable for HUD prompt
      let promptText: string | null = null;
      if (p.inLocker) {
        promptText = "[E] SALIR DE LA TAQUILLA";
      } else {
        for (const item of items) {
          if (item.collected) continue;
          if (Math.hypot(p.x - item.x, p.y - item.y) < item.radius + 30) {
            promptText = `[E] ${item.label}`;
            break;
          }
        }
      }
      setInteractPrompt(promptText);

      // ================= RENDERING =================
      // Clear
      ctx.fillStyle = "#09080A";
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.save();
      ctx.translate(-camX, -camY);

      // Floor tiles
      ctx.strokeStyle = "#16101E";
      ctx.lineWidth = 1;
      const tileSize = 60;
      for (let x = 0; x < MAP_W; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, MAP_H);
        ctx.stroke();
      }
      for (let y = 0; y < MAP_H; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(MAP_W, y);
        ctx.stroke();
      }

      // Walls
      ctx.fillStyle = "#120E17";
      ctx.strokeStyle = "#530570";
      ctx.lineWidth = 2;
      for (const wall of walls) {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
      }

      // Draw Items & Interactive Objects
      for (const item of items) {
        if (item.collected) continue;

        if (item.type === "FRAGMENT") {
          ctx.fillStyle = "#00FFC2";
          ctx.beginPath();
          ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
          ctx.fill();
          // Glow pulse
          ctx.strokeStyle = "rgba(0, 255, 194, 0.4)";
          ctx.lineWidth = 4;
          ctx.stroke();
        } else if (item.type === "BATTERY") {
          ctx.fillStyle = "#F59E0B";
          ctx.fillRect(item.x - 6, item.y - 10, 12, 20);
        } else if (item.type === "LOCKER") {
          ctx.fillStyle = "#2D2438";
          ctx.strokeStyle = "#8B1FD4";
          ctx.lineWidth = 1.5;
          ctx.fillRect(item.x - 14, item.y - 14, 28, 28);
          ctx.strokeRect(item.x - 14, item.y - 14, 28, 28);
        } else if (item.type === "EXIT") {
          ctx.fillStyle = exitUnlocked ? "#00FFC2" : "#FF1E42";
          ctx.fillRect(item.x - 20, item.y - 20, 40, 40);
        } else if (item.type === "TERMINAL") {
          ctx.fillStyle = item.active ? "#8B1FD4" : "#4A3B59";
          ctx.fillRect(item.x - 12, item.y - 12, 24, 24);
        }
      }

      // Draw Player Token (unless in locker)
      if (!p.inLocker) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // Survivor body
        ctx.fillStyle = "#F5F3F2";
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Flashlight holder arm
        ctx.fillStyle = "#530570";
        ctx.fillRect(8, -4, 12, 8);

        ctx.restore();
      }

      // Draw Ronald Monster Token
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);

      // Monster Body (deep bio-black with violet outline)
      ctx.fillStyle = "#09080A";
      ctx.strokeStyle = m.state === "CHASE" ? "#FF1E42" : "#530570";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sharp biomechanical claws
      ctx.strokeStyle = "#8B1FD4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, -12);
      ctx.lineTo(26, -18);
      ctx.moveTo(16, 0);
      ctx.lineTo(28, 0);
      ctx.moveTo(14, 12);
      ctx.lineTo(26, 18);
      ctx.stroke();

      // Glowing violet cyber-eyes
      ctx.fillStyle = m.state === "CHASE" ? "#FF1E42" : "#A855F7";
      ctx.beginPath();
      ctx.arc(10, -5, 3.5, 0, Math.PI * 2);
      ctx.arc(10, 5, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // ================= VOLUMETRIC LIGHTING / DARKNESS LAYER =================
      ctx.restore(); // back to screen space

      // Create darkness mask
      ctx.save();
      ctx.fillStyle = "rgba(9, 8, 10, 0.98)";
      ctx.fillRect(0, 0, viewW, viewH);

      // Cut out light using destination-out
      ctx.globalCompositeOperation = "destination-out";

      // 1. Ambient glow around player
      const pScreenX = p.x - camX;
      const pScreenY = p.y - camY;

      if (!p.inLocker) {
        const ambRadius = p.flashlightOn ? 45 : 20;
        const ambGrad = ctx.createRadialGradient(pScreenX, pScreenY, 5, pScreenX, pScreenY, ambRadius);
        ambGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
        ambGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = ambGrad;
        ctx.beginPath();
        ctx.arc(pScreenX, pScreenY, ambRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Flashlight beam cone
        if (p.flashlightOn && p.battery > 0) {
          // Flicker if battery < 15%
          const flicker = p.battery < 15 && Math.random() > 0.4;

          if (!flicker) {
            const beamDist = 270;
            const beamAngle = 0.48; // ~55 degrees

            ctx.beginPath();
            ctx.moveTo(pScreenX, pScreenY);
            ctx.arc(pScreenX, pScreenY, beamDist, p.angle - beamAngle, p.angle + beamAngle);
            ctx.closePath();

            const beamGrad = ctx.createRadialGradient(pScreenX, pScreenY, 15, pScreenX, pScreenY, beamDist);
            beamGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
            beamGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.85)");
            beamGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = beamGrad;
            ctx.fill();
          }
        }
      }

      ctx.restore(); // restore composite mode

      // Ronald's glowing cybernetic eyes pierce through the pitch blackness!
      const mScreenX = m.x - camX;
      const mScreenY = m.y - camY;
      ctx.fillStyle = m.state === "CHASE" ? "#FF1E42" : "#A855F7";
      ctx.beginPath();
      ctx.arc(mScreenX - 4, mScreenY, 2.5, 0, Math.PI * 2);
      ctx.arc(mScreenX + 4, mScreenY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animId);
  }, [mode, exitUnlocked, fragmentsCount, items, score, survivalSecs, triggerJumpscare, finishGame]);

  return (
    <div className="relative w-full h-screen bg-[#09080A] overflow-hidden select-none font-mono">
      {/* 2D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        width={typeof window !== "undefined" ? window.innerWidth : 1280}
        height={typeof window !== "undefined" ? window.innerHeight : 800}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Screen edge CRT vignette */}
      <div className="absolute inset-0 crt-vignette pointer-events-none opacity-80" />

      {/* Top HUD Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 pointer-events-auto cursor-pointer" onClick={goToMenu}>
            <Image src="/images/cooweb-logo.png" alt="CooWeb" fill className="object-contain" />
          </div>
          <div className="bg-[#120E17]/90 border border-[#530570]/70 px-3 py-1.5 rounded text-xs flex items-center gap-2">
            <span className="font-bold text-[#F5F3F2]">
              {mode === "ESCAPE" ? "MODO ESCAPE" : "PROTOCOLO: CONTENCIÓN"}
            </span>
            <span className="text-neutral-500">|</span>
            <span className="text-[#00FFC2] flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              {String(Math.floor(survivalSecs / 60)).padStart(2, "0")}:{String(survivalSecs % 60).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Center Objectives */}
        <div className="bg-[#120E17]/90 border border-[#530570]/70 px-4 py-1.5 rounded text-xs flex items-center gap-3">
          {mode === "ESCAPE" ? (
            <>
              <span className="text-neutral-400">FRAGMENTOS:</span>
              <span className="text-[#00FFC2] font-black">{fragmentsCount} / 3</span>
              <span className="text-neutral-500">|</span>
              <span className={exitUnlocked ? "text-[#00FFC2] font-bold animate-pulse" : "text-[#FF1E42]"}>
                {exitUnlocked ? "ESCLUSA: DESBLOQUEADA" : "ESCLUSA: BLOQUEADA"}
              </span>
            </>
          ) : (
            <>
              <span className="text-neutral-400">PUNTUACIÓN:</span>
              <span className="text-[#00FFC2] font-black">{score.toLocaleString()} PTS</span>
              <span className="text-neutral-500">|</span>
              <span className="text-[#FF1E42] font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                AMENAZA: LVL {threatLevel}
              </span>
            </>
          )}
        </div>

        {/* Top Right: Status Gauges */}
        <div className="flex items-center gap-2">
          {/* Battery */}
          <div className="bg-[#120E17]/90 border border-[#530570]/70 px-3 py-1.5 rounded text-xs flex items-center gap-2">
            {batteryUi < 20 ? (
              <Battery className="w-4 h-4 text-[#FF1E42] animate-bounce" />
            ) : (
              <BatteryCharging className="w-4 h-4 text-[#F59E0B]" />
            )}
            <span className="text-[10px] text-neutral-400">LINTERNA:</span>
            <span className={`font-bold ${batteryUi < 20 ? "text-[#FF1E42]" : "text-[#F59E0B]"}`}>
              {batteryUi}%
            </span>
          </div>

          {/* Flashlight Icon indicator */}
          <button
            onClick={() => {
              soundFX.playFlashlightClick();
              playerRef.current.flashlightOn = !playerRef.current.flashlightOn;
              setFlashlightUi(playerRef.current.flashlightOn);
            }}
            className="p-2 bg-[#120E17] border border-[#530570] hover:border-[#8B1FD4] rounded text-neutral-300 pointer-events-auto"
            title="Conmutar linterna (F)"
          >
            {flashlightUi ? <Eye className="w-4 h-4 text-[#00FFC2]" /> : <EyeOff className="w-4 h-4 text-neutral-500" />}
          </button>
        </div>
      </div>

      {/* Interaction Prompt Box */}
      {interactPrompt && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="px-5 py-2.5 bg-black/90 border border-[#8B1FD4] text-[#F5F3F2] text-xs font-bold rounded shadow-[0_0_20px_rgba(139,31,212,0.6)] animate-bounce flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#00FFC2]" />
            <span>{interactPrompt}</span>
          </div>
        </div>
      )}

      {/* Bottom Status Ribbon (Stamina & Controls) */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs pointer-events-none z-20">
        {/* Stamina bar */}
        <div className="bg-[#120E17]/90 border border-[#530570]/70 px-4 py-2 rounded flex items-center gap-2">
          <Flame className={`w-4 h-4 ${staminaUi < 25 ? "text-[#FF1E42]" : "text-[#8B1FD4]"}`} />
          <span className="text-[10px] text-neutral-400">ESTAMINA:</span>
          <div className="w-24 sm:w-32 h-2 bg-black rounded-full overflow-hidden border border-neutral-700">
            <div
              className={`h-full transition-all ${staminaUi < 25 ? "bg-[#FF1E42]" : "bg-[#8B1FD4]"}`}
              style={{ width: `${staminaUi}%` }}
            />
          </div>
        </div>

        {/* Mobile / Helper controls hint */}
        <div className="hidden sm:block text-[11px] text-neutral-500 bg-black/60 px-3 py-1.5 rounded border border-neutral-800">
          <span>[W,A,S,D] Mover | [Ratón] Linterna | [Shift] Esprintar | [F] Sigilo | [E] Usar</span>
        </div>
      </div>
    </div>
  );
}
