"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
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
  Radio,
  Crosshair,
  Compass,
} from "lucide-react";

interface HorrorGameCanvasProps {
  mode: "ESCAPE" | "CONTAINMENT";
}

// Map Dimensions (Spacious underground bunker with 4 sectors)
const MAP_W = 1800;
const MAP_H = 1350;

interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Item {
  id: string;
  type: "FRAGMENT" | "BATTERY" | "TERMINAL" | "LOCKER" | "EXIT" | "LORE_TERMINAL";
  x: number;
  y: number;
  radius: number;
  label: string;
  collected?: boolean;
  active?: boolean;
  sector?: string;
  loreText?: string;
}

// Helper to check if a ray line intersects an axis-aligned wall box
function lineIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  // Check if either point is inside the rect
  if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
  if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;

  const linesIntersect = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
    dx: number,
    dy: number
  ) => {
    const denom = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
    if (denom === 0) return false;
    const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denom;
    const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denom;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  };

  if (linesIntersect(x1, y1, x2, y2, rx, ry, rx + rw, ry)) return true;
  if (linesIntersect(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh)) return true;
  if (linesIntersect(x1, y1, x2, y2, rx, ry, rx, ry + rh)) return true;
  if (linesIntersect(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh)) return true;

  return false;
}

// Raycast Line of Sight
function hasLineOfSight(x1: number, y1: number, x2: number, y2: number, wallList: Wall[]): boolean {
  for (const wall of wallList) {
    if (lineIntersectsRect(x1, y1, x2, y2, wall.x, wall.y, wall.w, wall.h)) {
      return false;
    }
  }
  return true;
}

export function HorrorGameCanvas({ mode }: HorrorGameCanvasProps) {
  const { finishGame, triggerJumpscare, goToMenu } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player state
  const playerRef = useRef({
    x: 220,
    y: 220,
    angle: 0,
    speed: 3.4,
    stamina: 100,
    flashlightOn: true,
    battery: 100,
    inLocker: false,
    currentLockerId: null as string | null,
    walkFrame: 0,
  });

  // Ronald Monster state (Spawns in open Central East Corridor, actively patrolling)
  const monsterRef = useRef({
    x: 1080,
    y: 660,
    angle: 0,
    speed: 2.9,
    state: "PATROL" as "PATROL" | "ALERT" | "CHASE",
    alertTimer: 0,
    waypointIdx: 1,
    stunnedTimer: 0,
    animFrame: 0,
    lastSeenX: 1080,
    lastSeenY: 660,
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
  const [threatNear, setThreatNear] = useState(false);
  const threatNearRef = useRef(false);
  const [radioMsg, setRadioMsg] = useState<{ text: string; sender: string; time: number } | null>({
    text:
      mode === "ESCAPE"
        ? "OBJETIVO: Encuentra los 3 fragmentos de la cura en el búnker y alcanza la esclusa."
        : "PROTOCOLO DE CONTENCIÓN: Sobrevive a Ronald y purga las terminales con pulsos EMP.",
    sender: "E.V.A. // BIO-RADAR",
    time: Date.now() + 6000,
  });

  // EMP visual pulse animation
  const [empFlash, setEmpFlash] = useState(false);

  // Key states
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef({ x: 400, y: 300 });

  // Map elements definition (Detailed 4-Sector Laboratory with Navigable Doorways)
  const walls: Wall[] = [
    // Outer perimeter
    { x: 0, y: 0, w: MAP_W, h: 25 },
    { x: 0, y: MAP_H - 25, w: MAP_W, h: 25 },
    { x: 0, y: 0, w: 25, h: MAP_H },
    { x: MAP_W - 25, y: 0, w: 25, h: MAP_H },

    // Sector 1: West Biolab (Top-Left)
    { x: 480, y: 25, w: 25, h: 420 },
    { x: 25, y: 445, w: 320, h: 25 }, // Generous Door gap at x:345-480

    // Sector 2: Server Core (Bottom-Left)
    { x: 480, y: 565, w: 25, h: 420 },
    { x: 25, y: 960, w: 320, h: 25 }, // Door gap at x:345-480

    // Central Pillar & Server Banks
    { x: 740, y: 340, w: 220, h: 200 },
    { x: 740, y: 780, w: 220, h: 200 },

    // Sector 3: Cryo Vault & Archives (Bottom-Right)
    { x: 1200, y: 520, w: 25, h: 440 },
    { x: 1200, y: 520, w: 280, h: 25 }, // Door gap at x:1480-1620
    { x: 1620, y: 520, w: 155, h: 25 },

    // Dividing wall between Cryo Vault and Sector Gamma (with 140px doorway!)
    { x: 1200, y: 960, w: 240, h: 25 }, // Doorway from x: 1440 to 1580
    { x: 1580, y: 960, w: 195, h: 25 },

    // Sector 4: Airlock & Decontamination (Top-Right)
    { x: 1200, y: 25, w: 25, h: 380 },
    { x: 1200, y: 405, w: 280, h: 25 }, // Door gap at x:1480-1620
    { x: 1620, y: 405, w: 155, h: 25 },
  ];

  // Patrol waypoints for Ronald (100% connected corridor & doorway graph)
  const waypoints = [
    { x: 1080, y: 660 }, // 0: East Central Hub (Spawn)
    { x: 1080, y: 220 }, // 1: North-East Corridor
    { x: 600, y: 220 },  // 2: North-West Corridor
    { x: 600, y: 505 },  // 3: Outside Sector 1 Door
    { x: 410, y: 505 },  // 4: Sector 1 Doorway Threshold
    { x: 240, y: 240 },  // 5: Inside Sector 1 Biolab
    { x: 410, y: 505 },  // 6: Exit Sector 1 Doorway
    { x: 600, y: 660 },  // 7: West Central Corridor
    { x: 600, y: 1120 }, // 8: South-West Corridor
    { x: 240, y: 1150 }, // 9: Sector 2 Server Core
    { x: 600, y: 1120 }, // 10: Exit Sector 2
    { x: 1080, y: 1120 },// 11: South-East Corridor
    { x: 1510, y: 1120 },// 12: Sector Gamma South
    { x: 1510, y: 750 }, // 13: Cryo Vault (through doorway x:1440..1580, y:960)
    { x: 1550, y: 462 }, // 14: East Wing Hall (through doorway x:1480..1620, y:520)
    { x: 1550, y: 220 }, // 15: Sector 4 Airlock (through doorway x:1480..1620, y:405)
    { x: 1550, y: 462 }, // 16: Exit Sector 4
    { x: 1080, y: 462 }, // 17: Back to East Corridor (through doorway x:1200, y:405..520)
  ];

  // Items initialized based on game mode
  const [items, setItems] = useState<Item[]>(() => {
    const commonItems: Item[] = [
      // Flashlight Batteries
      { id: "bat1", type: "BATTERY", x: 380, y: 140, radius: 22, label: "BATERÍA DE LITIO (+45%)", sector: "SECTOR ALPHA" },
      { id: "bat2", type: "BATTERY", x: 1080, y: 380, radius: 22, label: "BATERÍA DE LITIO (+45%)", sector: "PASILLO CENTRAL" },
      { id: "bat3", type: "BATTERY", x: 1620, y: 920, radius: 22, label: "BATERÍA DE LITIO (+45%)", sector: "CRYO VAULT" },
      { id: "bat4", type: "BATTERY", x: 320, y: 1120, radius: 22, label: "BATERÍA DE LITIO (+45%)", sector: "SERVER CORE" },

      // Lockers (Safe Hiding Spots)
      { id: "lock1", type: "LOCKER", x: 420, y: 80, radius: 30, label: "TAQUILLA METÁLICA (ESCONDERSE)", sector: "SECTOR ALPHA" },
      { id: "lock2", type: "LOCKER", x: 850, y: 600, radius: 30, label: "ARMARIO DE SEGURIDAD (ESCONDERSE)", sector: "NÚCLEO CENTRAL" },
      { id: "lock3", type: "LOCKER", x: 1350, y: 600, radius: 30, label: "CÁPSULA DE AISLAMIENTO (ESCONDERSE)", sector: "CRYO VAULT" },
      { id: "lock4", type: "LOCKER", x: 180, y: 880, radius: 30, label: "TAQUILLA DE MANTENIMIENTO", sector: "SERVER CORE" },
    ];

    if (mode === "ESCAPE") {
      return [
        ...commonItems,
        // The 3 Cure Fragments
        {
          id: "frag1",
          type: "FRAGMENT",
          x: 180,
          y: 720,
          radius: 26,
          label: "FRAGMENTO 01 [CÓDIGO GENÉTICO]",
          sector: "SECTOR ALPHA",
          loreText: "Secuencia ADN alterada por E.V.A. recuperada.",
        },
        {
          id: "frag2",
          type: "FRAGMENT",
          x: 1550,
          y: 240,
          radius: 26,
          label: "FRAGMENTO 02 [SUPRESIÓN NEURAL]",
          sector: "SECTOR BETA",
          loreText: "Algoritmo de neutralización del virus CooWeb.",
        },
        {
          id: "frag3",
          type: "FRAGMENT",
          x: 1050,
          y: 1200,
          radius: 26,
          label: "FRAGMENTO 03 [ANTÍDOTO SINTÉTICO]",
          sector: "SECTOR GAMMA",
          loreText: "Fórmula molecular final sintetizada por Ronald.",
        },
        // Decontamination Exit Door
        { id: "exit", type: "EXIT", x: 1680, y: 80, radius: 42, label: "ESCLUSA DE DESCONTAMINACIÓN", sector: "SALIDA" },
      ];
    } else {
      // Containment Mode Terminals (Purge & EMP)
      return [
        ...commonItems,
        {
          id: "term1",
          type: "TERMINAL",
          x: 240,
          y: 350,
          radius: 32,
          label: "TERMINAL DE PURGA ALPHA",
          sector: "SECTOR ALPHA",
          active: true,
        },
        {
          id: "term2",
          type: "TERMINAL",
          x: 1050,
          y: 320,
          radius: 32,
          label: "TERMINAL DE PURGA BETA",
          sector: "PASILLO CENTRAL",
          active: true,
        },
        {
          id: "term3",
          type: "TERMINAL",
          x: 1550,
          y: 820,
          radius: 32,
          label: "TERMINAL DE PURGA GAMMA",
          sector: "CRYO VAULT",
          active: true,
        },
        {
          id: "term4",
          type: "TERMINAL",
          x: 250,
          y: 1200,
          radius: 32,
          label: "TERMINAL DE PURGA DELTA",
          sector: "SERVER CORE",
          active: true,
        },
      ];
    }
  });

  // Start sound ambient loop on mount, stop on unmount
  useEffect(() => {
    soundFX.startAmbient();
    return () => {
      soundFX.stopAmbient();
      soundFX.stopChaseMusic();
    };
  }, []);

  // Handle Window Resize dynamically
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
      if (lightCanvasRef.current) {
        lightCanvasRef.current.width = window.innerWidth;
        lightCanvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle User Input Events
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;

      // Flashlight toggle (F)
      if (e.key.toLowerCase() === "f") {
        soundFX.playFlashlightClick();
        playerRef.current.flashlightOn = !playerRef.current.flashlightOn;
        setFlashlightUi(playerRef.current.flashlightOn);
        setRadioMsg({
          text: playerRef.current.flashlightOn
            ? "LINTERNA ENCENDIDA: Visibilidad máxima (Riesgo de detección alto)."
            : "MODO SIGILO ACTIVO: Linterna apagada (Detección reducida al 25%).",
          sender: "TRAJE BIOMÉTRICO",
          time: Date.now() + 3500,
        });
      }

      // Interaction key (E or Space)
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
          setScore((s) => s + 15);

          // Escalate threat level every 30 seconds
          const newThreat = Math.min(5, Math.floor(next / 30) + 1);
          setThreatLevel(newThreat);

          // Ronald speeds up with threat level
          monsterRef.current.speed = 2.7 + newThreat * 0.32;
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

  // Obstacle-avoiding navigation for Ronald (Context Steering + Anti-Pinning)
  const moveWithAvoidance = (
    entity: { x: number; y: number; angle: number },
    targetX: number,
    targetY: number,
    speed: number,
    radius = 12
  ) => {
    const desiredAngle = Math.atan2(targetY - entity.y, targetX - entity.x);

    // Multi-angle test fanning out left and right to glide around walls
    const angleOffsets = [
      0,
      0.35, -0.35,
      0.7, -0.7,
      1.05, -1.05,
      1.4, -1.4,
      1.75, -1.75,
      2.1, -2.1,
      2.5, -2.5,
      Math.PI,
    ];

    for (const offset of angleOffsets) {
      const testAngle = desiredAngle + offset;
      const nextX = entity.x + Math.cos(testAngle) * speed;
      const nextY = entity.y + Math.sin(testAngle) * speed;

      if (!checkWallCollision(nextX, nextY, radius)) {
        entity.x = nextX;
        entity.y = nextY;
        entity.angle = testAngle;
        return true;
      }
    }

    // Secondary fallback: slide along individual X or Y axis
    const nextXOnly = entity.x + Math.cos(desiredAngle) * speed;
    if (!checkWallCollision(nextXOnly, entity.y, radius)) {
      entity.x = nextXOnly;
      entity.angle = desiredAngle;
      return true;
    }

    const nextYOnly = entity.y + Math.sin(desiredAngle) * speed;
    if (!checkWallCollision(entity.x, nextYOnly, radius)) {
      entity.y = nextYOnly;
      entity.angle = desiredAngle;
      return true;
    }

    // Emergency unstick if ever overlapping a wall corner
    entity.x += Math.cos(desiredAngle) * speed;
    entity.y += Math.sin(desiredAngle) * speed;
    entity.angle = desiredAngle;
    return true;
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
      setRadioMsg({
        text: "HAS SALIDO DE LA TAQUILLA. Mantente alerta.",
        sender: "BIO-RADAR",
        time: Date.now() + 3000,
      });
      return;
    }

    // Check nearby items
    for (const item of items) {
      if (item.collected) continue;
      const dist = Math.hypot(p.x - item.x, p.y - item.y);

      if (dist < item.radius + 35) {
        // Collect Cure Fragment (Escape Mode)
        if (item.type === "FRAGMENT") {
          item.collected = true;
          soundFX.playItemPickup();
          setFragmentsCount((c) => {
            const next = c + 1;
            if (next === 3) {
              setExitUnlocked(true);
              soundFX.playTerminalHack();
              setRadioMsg({
                text: "¡TODOS LOS FRAGMENTOS ASEGURADOS! ¡LA ESCLUSA DE ESCAPE ESTÁ DESBLOQUEADA!",
                sender: "E.V.A. // ALERTA MÁXIMA",
                time: Date.now() + 8000,
              });
            } else {
              setRadioMsg({
                text: `FRAGMENTO [${next}/3] ASEGURADO: ${item.loreText}`,
                sender: "DATOS RECUPERADOS",
                time: Date.now() + 5000,
              });
            }
            return next;
          });
          return;
        }

        // Collect Flashlight Battery
        if (item.type === "BATTERY") {
          item.collected = true;
          soundFX.playItemPickup();
          p.battery = Math.min(100, p.battery + 45);
          setBatteryUi(p.battery);
          setRadioMsg({
            text: "BATERÍA DE LITIO CARGADA (+45% ENERGÍA)",
            sender: "LINTERNA TÁCTICA",
            time: Date.now() + 3000,
          });
          return;
        }

        // Hide in Locker
        if (item.type === "LOCKER") {
          p.inLocker = true;
          p.currentLockerId = item.id;
          setInLockerUi(true);
          soundFX.playFootstep();
          setRadioMsg({
            text: "OCULTO EN LA TAQUILLA. Ronald pasará de largo si no te vio entrar.",
            sender: "MODO SIGILO",
            time: Date.now() + 4000,
          });
          return;
        }

        // Hack Terminal (Containment Mode)
        if (item.type === "TERMINAL" && mode === "CONTAINMENT") {
          if (!item.active) return;
          soundFX.playTerminalHack();
          setScore((s) => s + 500);
          item.active = false;

          // Trigger EMP Stun on Ronald
          monsterRef.current.stunnedTimer = 180; // 3 seconds at 60fps
          setEmpFlash(true);
          setTimeout(() => setEmpFlash(false), 400);

          setRadioMsg({
            text: "¡PURGA EXITOSA (+500 PTS)! PULSO EMP GENERADO: Ronald aturdido por 3 segundos.",
            sender: "SISTEMA DE PURGA",
            time: Date.now() + 5000,
          });

          // Reactivate terminal after 22s
          setTimeout(() => {
            item.active = true;
          }, 22000);
          return;
        }

        // Exit Airlock (Escape Mode)
        if (item.type === "EXIT" && mode === "ESCAPE") {
          if (fragmentsCount >= 3) {
            soundFX.playTerminalHack();
            finishGame("VICTORY", Math.max(1000, 5000 - survivalSecs * 12), survivalSecs);
          } else {
            soundFX.playHeartbeat(3);
            setRadioMsg({
              text: `ACCESO DENEGADO: Faltan ${3 - fragmentsCount} fragmentos del código para desbloquear la esclusa.`,
              sender: "PUERTA BLINDADA",
              time: Date.now() + 4000,
            });
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

    // Create or resize offscreen lighting canvas
    if (!lightCanvasRef.current) {
      lightCanvasRef.current = document.createElement("canvas");
    }
    const lightCanvas = lightCanvasRef.current;
    lightCanvas.width = canvas.width;
    lightCanvas.height = canvas.height;
    const lightCtx = lightCanvas.getContext("2d");

    let animId: number;
    let stepSoundTimer = 0;
    let heartbeatTimer = 0;

    const gameLoop = () => {
      const p = playerRef.current;
      const m = monsterRef.current;

      const viewW = canvas.width;
      const viewH = canvas.height;

      // 1. Player Movement & Stamina Logic
      const keys = keysRef.current;
      const isSprinting = (keys["shift"] || keys["shiftleft"]) && p.stamina > 10;
      const currentSpeed = isSprinting ? 5.2 : 3.4;

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
          p.stamina = Math.min(100, p.stamina + 0.3);
        }
        setStaminaUi(Math.floor(p.stamina));

        // Drain flashlight battery
        if (p.flashlightOn) {
          p.battery = Math.max(0, p.battery - 0.018);
          setBatteryUi(Math.floor(p.battery));
        }

        // Animate walk cycle
        if (dx !== 0 || dy !== 0) {
          p.walkFrame += isSprinting ? 0.28 : 0.16;
          stepSoundTimer++;
          const cadence = isSprinting ? 12 : 20;
          if (stepSoundTimer >= cadence) {
            soundFX.playFootstep(isSprinting);
            stepSoundTimer = 0;
          }
        }
      }

      // 2. Camera calculation (Centered smoothly, clamping within MAP bounds)
      const camX =
        viewW >= MAP_W
          ? -(viewW - MAP_W) / 2
          : Math.max(0, Math.min(MAP_W - viewW, p.x - viewW / 2));
      const camY =
        viewH >= MAP_H
          ? -(viewH - MAP_H) / 2
          : Math.max(0, Math.min(MAP_H - viewH, p.y - viewH / 2));

      // Calculate player flashlight angle from screen position to mouse
      const screenPx = p.x - camX;
      const screenPy = p.y - camY;
      p.angle = Math.atan2(mouseRef.current.y - screenPy, mouseRef.current.x - screenPx);

      // 3. Ronald AI Perception & Decision
      const distToPlayer = Math.hypot(p.x - m.x, p.y - m.y);
      const isNear = (distToPlayer < 360 || m.state === "CHASE") && !p.inLocker;
      if (isNear !== threatNearRef.current) {
        threatNearRef.current = isNear;
        setThreatNear(isNear);
      }

      // Handle Ronald Stun from EMP
      if (m.stunnedTimer > 0) {
        m.stunnedTimer--;
      } else {
        // Heartbeat audio calculation based on proximity
        heartbeatTimer++;
        const heartRate = distToPlayer < 280 ? 22 : distToPlayer < 550 ? 50 : 85;
        if (heartbeatTimer >= heartRate) {
          soundFX.playHeartbeat(distToPlayer < 280 ? 3 : 1);
          heartbeatTimer = 0;
        }

        // Line-of-sight test (cannot see through solid walls)
        const hasLOS = hasLineOfSight(m.x, m.y, p.x, p.y, walls);

        // Detection tests
        let canSeePlayer = false;
        if (!p.inLocker) {
          // 1. Player flashlight pointing near monster (requires LOS)
          const angleToMonster = Math.atan2(m.y - p.y, m.x - p.x);
          const angleDiff = Math.abs(p.angle - angleToMonster);
          const inFlashlightCone =
            p.flashlightOn &&
            p.battery > 0 &&
            distToPlayer < 420 &&
            hasLOS &&
            (angleDiff < 0.6 || angleDiff > Math.PI * 2 - 0.6);

          // 2. Monster vision cone facing player (requires LOS)
          const monsterFacingAngle = Math.atan2(p.y - m.y, p.x - m.x);
          const monsterDiff = Math.abs(m.angle - monsterFacingAngle);
          const inMonsterVision =
            distToPlayer < 260 &&
            hasLOS &&
            (monsterDiff < 1.25 || monsterDiff > Math.PI * 2 - 1.25);

          // 3. Close proximity hearing / breath (even around corners)
          const closeProximity = distToPlayer < 85;

          // 4. Sprinting noise
          const heardSprinting =
            isSprinting &&
            (dx !== 0 || dy !== 0) &&
            (distToPlayer < 190 || (distToPlayer < 350 && hasLOS));

          if (inFlashlightCone || inMonsterVision || closeProximity || heardSprinting) {
            canSeePlayer = true;
          }
        }

        if (canSeePlayer) {
          m.lastSeenX = p.x;
          m.lastSeenY = p.y;
          if (m.state !== "CHASE") {
            soundFX.playMonsterGrowl();
            soundFX.startChaseMusic();
            setRadioMsg({
              text: "¡PELIGRO! ¡RONALD HA DETECTADO TU PRESENCIA Y TE ESTÁ PERSIGUIENDO!",
              sender: "ALERTA BIOMÉTRICA",
              time: Date.now() + 5000,
            });
          }
          m.state = "CHASE";
          m.alertTimer = 240; // Persistence frames (~4 seconds)
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
          if (hasLOS) {
            targetX = p.x;
            targetY = p.y;
          } else {
            // Find the doorway/corridor waypoint visible to Ronald that gets him closest to the player
            let bestWp = { x: m.lastSeenX, y: m.lastSeenY };
            let bestDist = Infinity;
            for (const wp of waypoints) {
              const dToMonster = Math.hypot(wp.x - m.x, wp.y - m.y);
              if (dToMonster > 35 && hasLineOfSight(m.x, m.y, wp.x, wp.y, walls)) {
                const dToPlayer = Math.hypot(wp.x - p.x, wp.y - p.y);
                if (dToPlayer < bestDist) {
                  bestDist = dToPlayer;
                  bestWp = wp;
                }
              }
            }
            targetX = bestWp.x;
            targetY = bestWp.y;
          }
        } else {
          const wp = waypoints[m.waypointIdx];
          targetX = wp.x;
          targetY = wp.y;
          if (Math.hypot(m.x - wp.x, m.y - wp.y) < 35) {
            m.waypointIdx = (m.waypointIdx + 1) % waypoints.length;
          }
        }

        const mSpeed = m.state === "CHASE" ? m.speed * 1.35 : m.speed;
        moveWithAvoidance(m, targetX, targetY, mSpeed, 12);
        m.animFrame += m.state === "CHASE" ? 0.28 : 0.12;
        if (typeof window !== "undefined") {
          (window as unknown as { __RONALD_POS?: { x: number; y: number; state: string } }).__RONALD_POS = {
            x: Math.round(m.x),
            y: Math.round(m.y),
            state: m.state,
          };
        }

        // Check Jumpscare Collision!
        if (!p.inLocker && distToPlayer < 42) {
          soundFX.stopChaseMusic();
          triggerJumpscare(() => {
            finishGame("DEFEAT", score, survivalSecs);
          });
          return; // End loop on jumpscare
        }
      }

      // Check nearby interactable for HUD prompt
      let promptText: string | null = null;
      if (p.inLocker) {
        promptText = "[E] SALIR DE LA TAQUILLA";
      } else {
        for (const item of items) {
          if (item.collected) continue;
          if (Math.hypot(p.x - item.x, p.y - item.y) < item.radius + 35) {
            if (item.type === "TERMINAL" && !item.active) {
              promptText = "TERMINAL REINICIÁNDOSE... (ESPERA)";
            } else {
              promptText = `[E] ${item.label}`;
            }
            break;
          }
        }
      }
      setInteractPrompt(promptText);

      // ==========================================
      // RENDERING STAGE 1: WORLD & ENTITIES TO MAIN CTX
      // ==========================================
      ctx.fillStyle = "#09080A";
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.save();
      ctx.translate(-camX, -camY);

      // 1.1 Lab Floor (Dark metallic tiles with subtle panel grids)
      const tileSize = 80;
      for (let x = 0; x < MAP_W; x += tileSize) {
        for (let y = 0; y < MAP_H; y += tileSize) {
          // Checkered subtle tint
          const isAlt = ((x / tileSize) + (y / tileSize)) % 2 === 0;
          ctx.fillStyle = isAlt ? "#0E0C12" : "#120F18";
          ctx.fillRect(x, y, tileSize, tileSize);

          ctx.strokeStyle = "rgba(83, 5, 112, 0.15)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }

      // 1.2 Sector Floor Decals & Hazard Stripes
      ctx.font = "bold 22px monospace";
      ctx.fillStyle = "rgba(139, 31, 212, 0.25)";
      ctx.fillText("SECTOR ALPHA // LAB. GENÉTICO", 60, 80);
      ctx.fillText("SECTOR BETA // ARCHIVO CENTRAL", 1300, 80);
      ctx.fillText("SECTOR GAMMA // CRYO STORAGE", 1300, 1020);
      ctx.fillText("SECTOR DELTA // SERVER NUCLEUS", 60, 1020);

      // Warning hazard stripes around doorways
      ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(345, 440, 135, 25); // Sector 1 Biolab door
      ctx.strokeRect(345, 955, 135, 25); // Sector 2 Server door
      ctx.strokeRect(1480, 515, 140, 25); // Sector 3 Cryo door
      ctx.strokeRect(1440, 955, 140, 25); // Sector Gamma door
      ctx.strokeRect(1480, 400, 140, 25); // Sector 4 Airlock door
      ctx.setLineDash([]);

      // Mutant bio-fluid puddles / blood stains on the ground
      ctx.fillStyle = "rgba(120, 10, 30, 0.35)";
      ctx.beginPath();
      ctx.ellipse(320, 300, 35, 20, 0.4, 0, Math.PI * 2);
      ctx.ellipse(980, 720, 45, 28, -0.3, 0, Math.PI * 2);
      ctx.ellipse(1400, 880, 50, 32, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // 1.3 Solid Walls with High-Tech Bevels
      for (const wall of walls) {
        // Base Wall
        ctx.fillStyle = "#181220";
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

        // Neon conduit strip along the wall
        ctx.strokeStyle = "#530570";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

        // Inner bevel highlight
        ctx.fillStyle = "rgba(139, 31, 212, 0.25)";
        ctx.fillRect(wall.x + 2, wall.y + 2, Math.max(1, wall.w - 4), 3);
      }

      // 1.4 Interactive Objects (Fragments, Batteries, Terminals, Lockers, Exit)
      for (const item of items) {
        if (item.collected) continue;

        if (item.type === "FRAGMENT") {
          // Holographic DNA / Cure Data Core
          const floatOffset = Math.sin(Date.now() / 250) * 4;
          ctx.fillStyle = "#00FFC2";
          ctx.beginPath();
          ctx.arc(item.x, item.y + floatOffset, 10, 0, Math.PI * 2);
          ctx.fill();

          // Pulsing cyan aura ring
          ctx.strokeStyle = "rgba(0, 255, 194, 0.6)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(item.x, item.y + floatOffset, 18 + Math.sin(Date.now() / 200) * 4, 0, Math.PI * 2);
          ctx.stroke();

          // Label
          ctx.font = "bold 9px monospace";
          ctx.fillStyle = "#00FFC2";
          ctx.textAlign = "center";
          ctx.fillText("CURE CODE", item.x, item.y + floatOffset - 16);
        } else if (item.type === "BATTERY") {
          // Battery Pack (High visibility amber canister)
          ctx.fillStyle = "#F59E0B";
          ctx.fillRect(item.x - 7, item.y - 12, 14, 24);
          ctx.fillStyle = "#FDE68A";
          ctx.fillRect(item.x - 4, item.y - 15, 8, 4);

          ctx.font = "bold 8px monospace";
          ctx.fillStyle = "#F59E0B";
          ctx.textAlign = "center";
          ctx.fillText("PWR", item.x, item.y - 18);
        } else if (item.type === "LOCKER") {
          // Metal Locker / Hiding place
          ctx.fillStyle = "#261D32";
          ctx.strokeStyle = "#8B1FD4";
          ctx.lineWidth = 2;
          ctx.fillRect(item.x - 16, item.y - 16, 32, 32);
          ctx.strokeRect(item.x - 16, item.y - 16, 32, 32);

          // Ventilation slots
          ctx.fillStyle = "#120E17";
          ctx.fillRect(item.x - 10, item.y - 8, 20, 3);
          ctx.fillRect(item.x - 10, item.y - 1, 20, 3);
          ctx.fillRect(item.x - 10, item.y + 6, 20, 3);

          // Door Status LED (Green = Available, Red = Occupied)
          ctx.fillStyle = p.inLocker && p.currentLockerId === item.id ? "#FF1E42" : "#00FFC2";
          ctx.beginPath();
          ctx.arc(item.x + 10, item.y - 10, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === "TERMINAL") {
          // Supercomputer Terminal
          ctx.fillStyle = item.active ? "#361D4C" : "#1A1522";
          ctx.strokeStyle = item.active ? "#8B1FD4" : "#4A3B59";
          ctx.lineWidth = 2;
          ctx.fillRect(item.x - 16, item.y - 16, 32, 32);
          ctx.strokeRect(item.x - 16, item.y - 16, 32, 32);

          // CRT Screen with scrolling code
          ctx.fillStyle = item.active ? "#00FFC2" : "#555";
          ctx.fillRect(item.x - 10, item.y - 10, 20, 14);

          // Terminal Status Label
          ctx.font = "bold 8px monospace";
          ctx.fillStyle = item.active ? "#00FFC2" : "#888";
          ctx.textAlign = "center";
          ctx.fillText(item.active ? "EMP READY" : "REBOOT", item.x, item.y - 20);
        } else if (item.type === "EXIT") {
          // Massive Decontamination Airlock
          ctx.fillStyle = exitUnlocked ? "rgba(0, 255, 194, 0.2)" : "rgba(255, 30, 66, 0.2)";
          ctx.strokeStyle = exitUnlocked ? "#00FFC2" : "#FF1E42";
          ctx.lineWidth = 3;
          ctx.fillRect(item.x - 30, item.y - 30, 60, 60);
          ctx.strokeRect(item.x - 30, item.y - 30, 60, 60);

          // Heavy diagonal hazard pattern
          ctx.beginPath();
          ctx.moveTo(item.x - 30, item.y - 30);
          ctx.lineTo(item.x + 30, item.y + 30);
          ctx.moveTo(item.x + 30, item.y - 30);
          ctx.lineTo(item.x - 30, item.y + 30);
          ctx.stroke();

          ctx.font = "bold 11px monospace";
          ctx.fillStyle = exitUnlocked ? "#00FFC2" : "#FF1E42";
          ctx.textAlign = "center";
          ctx.fillText(exitUnlocked ? "ESCLUSA ABIERTA" : "ESCLUSA BLOQUEADA", item.x, item.y + 44);
        }
      }

      // 1.5 Survivor Player Character
      if (!p.inLocker) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // Survivor tactical suit
        ctx.fillStyle = "#1E293B"; // Tactical dark blue vest
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Shoulder pads
        ctx.fillStyle = "#334155";
        ctx.fillRect(-6, -14, 12, 6);
        ctx.fillRect(-6, 8, 12, 6);

        // Head with tactical helmet
        ctx.fillStyle = "#F5F3F2";
        ctx.beginPath();
        ctx.arc(2, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Directional flashlight emitter in hand
        ctx.fillStyle = "#00FFC2";
        ctx.fillRect(10, 4, 10, 5);

        ctx.restore();
      }

      // 1.6 Ronald Biomechanical Monster
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);

      // Biomechanical torso (deep bio-black with jagged edges)
      ctx.fillStyle = "#09080A";
      ctx.strokeStyle = m.state === "CHASE" ? "#FF1E42" : "#530570";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cybernetic spine & cables along back
      ctx.strokeStyle = "#8B1FD4";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-4, 0);
      ctx.moveTo(-14, -6);
      ctx.lineTo(-6, -6);
      ctx.moveTo(-14, 6);
      ctx.lineTo(-6, 6);
      ctx.stroke();

      // Sharp biomechanical claws (animated twitching)
      const clawReach = Math.sin(m.animFrame) * 4;
      ctx.strokeStyle = m.state === "CHASE" ? "#FF1E42" : "#A855F7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, -14);
      ctx.lineTo(26 + clawReach, -20);
      ctx.moveTo(18, 0);
      ctx.lineTo(30 + clawReach, 0);
      ctx.moveTo(14, 14);
      ctx.lineTo(26 + clawReach, 20);
      ctx.stroke();

      // Glowing cyber-eyes
      ctx.fillStyle = m.state === "CHASE" ? "#FF1E42" : "#A855F7";
      ctx.beginPath();
      ctx.arc(12, -6, 3.5, 0, Math.PI * 2);
      ctx.arc(12, 6, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Stunned electrical sparks if hit by EMP
      if (m.stunnedTimer > 0) {
        ctx.strokeStyle = "#00FFC2";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-20, -15);
        ctx.lineTo(-5, 0);
        ctx.lineTo(20, -10);
        ctx.stroke();
      }

      ctx.restore();

      ctx.restore(); // Exit world coordinate translation

      // ==========================================
      // RENDERING STAGE 2: VOLUMETRIC LIGHTING & FOG OF WAR
      // (Using persistent offscreen canvas to avoid destroying scene)
      // ==========================================
      if (lightCtx) {
        // Reset offscreen composite mode
        lightCtx.globalCompositeOperation = "source-over";

        // Ambient Bunker Darkness (0.86 allows faint perception of walls & corridors)
        lightCtx.fillStyle = "rgba(9, 8, 10, 0.86)";
        lightCtx.fillRect(0, 0, viewW, viewH);

        // Switch to punch out holes in the darkness
        lightCtx.globalCompositeOperation = "destination-out";

        const pScreenX = p.x - camX;
        const pScreenY = p.y - camY;

        // 2.1 Player Ambient Circle (Immediate surroundings clearly visible)
        if (!p.inLocker) {
          const ambRadius = p.flashlightOn ? 115 : 45;
          const ambGrad = lightCtx.createRadialGradient(
            pScreenX,
            pScreenY,
            15,
            pScreenX,
            pScreenY,
            ambRadius
          );
          ambGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
          ambGrad.addColorStop(0.75, "rgba(0, 0, 0, 0.85)");
          ambGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

          lightCtx.fillStyle = ambGrad;
          lightCtx.beginPath();
          lightCtx.arc(pScreenX, pScreenY, ambRadius, 0, Math.PI * 2);
          lightCtx.fill();

          // 2.2 Volumetric Flashlight Beam Cone
          if (p.flashlightOn && p.battery > 0) {
            const flicker = p.battery < 15 && Math.random() > 0.45;

            if (!flicker) {
              const beamDist = 420;
              const beamAngle = 0.58; // ~66 degrees cone

              lightCtx.beginPath();
              lightCtx.moveTo(pScreenX, pScreenY);
              lightCtx.arc(pScreenX, pScreenY, beamDist, p.angle - beamAngle, p.angle + beamAngle);
              lightCtx.closePath();

              const beamGrad = lightCtx.createRadialGradient(
                pScreenX,
                pScreenY,
                25,
                pScreenX,
                pScreenY,
                beamDist
              );
              beamGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
              beamGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.9)");
              beamGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

              lightCtx.fillStyle = beamGrad;
              lightCtx.fill();
            }
          }
        }

        // 2.3 Objective Beacon Cutouts (Fragments, Terminals, and Exit glow through the dark)
        for (const item of items) {
          if (item.collected) continue;
          const itemScreenX = item.x - camX;
          const itemScreenY = item.y - camY;

          // Only cut out if reasonably near the view screen
          if (
            itemScreenX >= -100 &&
            itemScreenX <= viewW + 100 &&
            itemScreenY >= -100 &&
            itemScreenY <= viewH + 100
          ) {
            let glowRad = 50;
            if (item.type === "FRAGMENT") glowRad = 65;
            if (item.type === "EXIT") glowRad = 90;

            const objGrad = lightCtx.createRadialGradient(
              itemScreenX,
              itemScreenY,
              5,
              itemScreenX,
              itemScreenY,
              glowRad
            );
            objGrad.addColorStop(0, "rgba(0, 0, 0, 0.85)");
            objGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            lightCtx.fillStyle = objGrad;
            lightCtx.beginPath();
            lightCtx.arc(itemScreenX, itemScreenY, glowRad, 0, Math.PI * 2);
            lightCtx.fill();
          }
        }

        // Draw the darkness layer over the world!
        ctx.drawImage(lightCanvas, 0, 0);
      }

      // ==========================================
      // RENDERING STAGE 3: VOLUMETRIC TINT & PIERCING CYBER-EYES
      // ==========================================
      const mScreenX = m.x - camX;
      const mScreenY = m.y - camY;

      // Ronald's glowing cybernetic eyes pierce through the dark shadows!
      ctx.fillStyle = m.state === "CHASE" ? "#FF1E42" : "#A855F7";
      ctx.shadowColor = m.state === "CHASE" ? "#FF1E42" : "#A855F7";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(mScreenX - 5, mScreenY, 3, 0, Math.PI * 2);
      ctx.arc(mScreenX + 5, mScreenY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow

      // Tactical Mini-Radar HUD in the corner
      renderMiniRadar(ctx, viewW, viewH, p, m, items);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animId);
  }, [mode, exitUnlocked, fragmentsCount, items, score, survivalSecs, triggerJumpscare, finishGame]);

  // Holographic Mini-Radar Drawer
  const renderMiniRadar = (
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    p: { x: number; y: number; angle: number },
    m: { x: number; y: number; state: string },
    currentItems: Item[]
  ) => {
    const radarW = 150;
    const radarH = 112;
    const radarX = viewW - radarW - 20;
    const radarY = viewH - radarH - 65;

    // Background Panel
    ctx.save();
    ctx.fillStyle = "rgba(9, 8, 10, 0.85)";
    ctx.strokeStyle = "rgba(83, 5, 112, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.fillRect(radarX, radarY, radarW, radarH);
    ctx.strokeRect(radarX, radarY, radarW, radarH);

    // Radar scanline grid
    ctx.strokeStyle = "rgba(139, 31, 212, 0.15)";
    ctx.beginPath();
    ctx.moveTo(radarX + radarW / 2, radarY);
    ctx.lineTo(radarX + radarW / 2, radarY + radarH);
    ctx.moveTo(radarX, radarY + radarH / 2);
    ctx.lineTo(radarX + radarW, radarY + radarH / 2);
    ctx.stroke();

    const scaleX = radarW / MAP_W;
    const scaleY = radarH / MAP_H;

    // Draw Items on Radar
    for (const item of currentItems) {
      if (item.collected) continue;
      const ix = radarX + item.x * scaleX;
      const iy = radarY + item.y * scaleY;

      if (item.type === "FRAGMENT") {
        ctx.fillStyle = "#00FFC2";
        ctx.beginPath();
        ctx.arc(ix, iy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === "EXIT") {
        ctx.fillStyle = exitUnlocked ? "#00FFC2" : "#FF1E42";
        ctx.fillRect(ix - 2, iy - 2, 5, 5);
      } else if (item.type === "TERMINAL" && item.active) {
        ctx.fillStyle = "#8B1FD4";
        ctx.beginPath();
        ctx.arc(ix, iy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Always Draw Ronald Monster on Radar so player sees his patrol & chase movement
    const mx = radarX + m.x * scaleX;
    const my = radarY + m.y * scaleY;
    ctx.fillStyle = m.state === "CHASE" ? "#FF1E42" : "#A855F7";
    ctx.beginPath();
    ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Pulse ring around Ronald on radar
    ctx.strokeStyle = m.state === "CHASE" ? "rgba(255,30,66,0.7)" : "rgba(168,85,247,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mx, my, 5 + Math.sin(Date.now() / 150) * 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Player dot & direction on radar
    const px = radarX + p.x * scaleX;
    const py = radarY + p.y * scaleY;
    ctx.fillStyle = "#00FFC2";
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Player cone
    ctx.strokeStyle = "rgba(0, 255, 194, 0.4)";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(p.angle) * 10, py + Math.sin(p.angle) * 10);
    ctx.stroke();

    // Radar Header label
    ctx.font = "bold 8px monospace";
    ctx.fillStyle = "#8B1FD4";
    ctx.fillText("BIO-RADAR [E.V.A.]", radarX + 6, radarY + 12);

    ctx.restore();
  };

  return (
    <div className="relative w-full h-screen bg-[#09080A] overflow-hidden select-none font-mono">
      {/* EMP Shockwave Screen Flash */}
      {empFlash && (
        <div className="fixed inset-0 z-30 bg-[#8B1FD4]/40 mix-blend-screen pointer-events-none animate-pulse" />
      )}

      {/* Red Terror Heartbeat Border when Ronald is near */}
      {threatNear && (
        <div className="fixed inset-0 z-20 pointer-events-none border-4 border-[#FF1E42]/50 shadow-[inset_0_0_90px_rgba(255,30,66,0.45)] animate-pulse" />
      )}

      {/* 2D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        width={typeof window !== "undefined" ? window.innerWidth : 1280}
        height={typeof window !== "undefined" ? window.innerHeight : 800}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Screen edge CRT vignette */}
      <div className="absolute inset-0 crt-vignette pointer-events-none opacity-80" />

      {/* TOP HUD BAR */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        {/* Top Left: Logo, Menu & Timer */}
        <div className="flex items-center gap-3">
          <button
            onClick={goToMenu}
            className="pointer-events-auto flex items-center gap-2 px-2.5 py-1.5 rounded bg-black/80 border border-[#530570]/80 hover:border-[#8B1FD4] transition-all cursor-pointer"
            title="Volver al menú principal"
          >
            <img
              src="/images/cooweb-logo.png"
              alt="CooWeb"
              style={{ width: "28px", height: "28px", objectFit: "contain", flexShrink: 0 }}
            />
            <span className="text-[10px] text-neutral-300 font-bold hidden sm:inline">MENÚ</span>
          </button>
          <div className="bg-[#120E17]/90 border border-[#530570]/70 px-3 py-1.5 rounded text-xs flex items-center gap-2">
            <span className="font-bold text-[#F5F3F2]">
              {mode === "ESCAPE" ? "MODO ESCAPE" : "PROTOCOLO: CONTENCIÓN"}
            </span>
            <span className="text-neutral-500">|</span>
            <span className="text-[#00FFC2] flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              {String(Math.floor(survivalSecs / 60)).padStart(2, "0")}:
              {String(survivalSecs % 60).padStart(2, "0")}
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

      {/* Tactical Radio Transmission Toast (Lore & Guidance) */}
      {radioMsg && Date.now() < radioMsg.time && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-[90%] max-w-xl">
          <div className="px-4 py-2 bg-black/90 border-l-4 border-l-[#8B1FD4] border border-[#530570]/70 rounded shadow-[0_0_25px_rgba(83,5,112,0.5)] flex items-center gap-3">
            <Radio className="w-4 h-4 text-[#00FFC2] shrink-0 animate-pulse" />
            <div className="text-left">
              <div className="text-[9px] font-bold text-[#8B1FD4] uppercase tracking-wider">
                {radioMsg.sender}
              </div>
              <div className="text-xs text-[#F5F3F2] font-semibold">{radioMsg.text}</div>
            </div>
          </div>
        </div>
      )}

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

        {/* Helper controls hint */}
        <div className="hidden sm:block text-[11px] text-neutral-400 bg-black/80 px-3 py-1.5 rounded border border-neutral-800">
          <span>[W,A,S,D] Mover | [Ratón] Linterna | [Shift] Esprintar | [F] Sigilo | [E] Interactuar</span>
        </div>
      </div>
    </div>
  );
}
