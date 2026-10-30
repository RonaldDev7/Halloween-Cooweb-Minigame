// Web Audio API Procedural Sound Engine for COOWEB: THE LAST PROTOCOL

class SurvivalAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientRunning: boolean = false;
  private chaseOsc: OscillatorNode | null = null;
  private chaseGain: GainNode | null = null;
  private isChaseRunning: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cooweb_sound_muted");
      this.isMuted = saved === "true";
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("cooweb_sound_muted", String(this.isMuted));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
    }
    if (this.isMuted) {
      this.stopAmbient();
      this.stopChaseMusic();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Player Footstep (subtle thud on metallic floor)
  public playFootstep(isSprinting = false) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const baseFreq = isSprinting ? 95 : 75;
      osc.frequency.setValueAtTime(baseFreq + Math.random() * 15, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      const vol = isSprinting ? 0.12 : 0.05;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  // Flashlight click switch
  public playFlashlightClick() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.025);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  }

  // Heartbeat pulse (escalating with threat proximity)
  public playHeartbeat(threatLevel = 1) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      // Lub-dub double pulse
      [0, 0.12].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(55 + threatLevel * 5, now + offset);
        osc.frequency.exponentialRampToValueAtTime(35, now + offset + 0.1);

        const vol = Math.min(0.25, 0.06 + threatLevel * 0.04);
        gain.gain.setValueAtTime(vol, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + offset);
        osc.stop(now + offset + 0.11);
      });
    } catch {}
  }

  // Item pickup (Fragment, Battery, Keycard)
  public playItemPickup() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      [659.25, 880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.07;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch {}
  }

  // Terminal Purge Hack Success
  public playTerminalHack() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  // Ronald Monster Growl (nearby in the dark)
  public playMonsterGrowl() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.4);
      osc.frequency.linearRampToValueAtTime(65, now + 0.8);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(220, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.95);
    } catch {}
  }

  // Ronald Jumpscare Screech (death/capture)
  public playJumpscare() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;

      // Harsh dissonant high screech
      const osc1 = ctx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(850, now);
      osc1.frequency.linearRampToValueAtTime(2200, now + 0.15);
      osc1.frequency.linearRampToValueAtTime(400, now + 0.8);

      // Low violent distorted slam
      const osc2 = ctx.createOscillator();
      osc2.type = "square";
      osc2.frequency.setValueAtTime(90, now);
      osc2.frequency.exponentialRampToValueAtTime(30, now + 0.6);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.25);
      osc2.stop(now + 1.25);
    } catch {}
  }

  // Atmospheric dark laboratory drone
  public startAmbient() {
    if (this.isMuted || this.isAmbientRunning) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      this.ambientOsc1 = ctx.createOscillator();
      this.ambientOsc1.type = "sawtooth";
      this.ambientOsc1.frequency.setValueAtTime(42, now);

      this.ambientOsc2 = ctx.createOscillator();
      this.ambientOsc2.type = "sine";
      this.ambientOsc2.frequency.setValueAtTime(45.5, now);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(110, now);

      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.linearRampToValueAtTime(0.04, now + 1.5);

      this.ambientOsc1.connect(filter);
      this.ambientOsc2.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.masterGain);

      this.ambientOsc1.start(now);
      this.ambientOsc2.start(now);
      this.isAmbientRunning = true;
    } catch {}
  }

  public stopAmbient() {
    if (!this.isAmbientRunning) return;
    try {
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      }
      setTimeout(() => {
        try { this.ambientOsc1?.stop(); this.ambientOsc1?.disconnect(); } catch {}
        try { this.ambientOsc2?.stop(); this.ambientOsc2?.disconnect(); } catch {}
        this.ambientGain = null;
        this.ambientOsc1 = null;
        this.ambientOsc2 = null;
        this.isAmbientRunning = false;
      }, 550);
    } catch {
      this.isAmbientRunning = false;
    }
  }

  // Dynamic Chase Pulse (Intense pulsing bass during active pursuit)
  public startChaseMusic() {
    if (this.isMuted || this.isChaseRunning) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      this.chaseOsc = ctx.createOscillator();
      this.chaseOsc.type = "sawtooth";
      this.chaseOsc.frequency.setValueAtTime(95, now);

      this.chaseGain = ctx.createGain();
      this.chaseGain.gain.setValueAtTime(0.001, now);
      this.chaseGain.gain.linearRampToValueAtTime(0.12, now + 0.3);

      this.chaseOsc.connect(this.chaseGain);
      this.chaseGain.connect(this.masterGain);

      this.chaseOsc.start(now);
      this.isChaseRunning = true;
    } catch {}
  }

  public stopChaseMusic() {
    if (!this.isChaseRunning) return;
    try {
      if (this.chaseGain && this.ctx) {
        this.chaseGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
      }
      setTimeout(() => {
        try { this.chaseOsc?.stop(); this.chaseOsc?.disconnect(); } catch {}
        this.chaseGain = null;
        this.chaseOsc = null;
        this.isChaseRunning = false;
      }, 350);
    } catch {
      this.isChaseRunning = false;
    }
  }

  public playClick() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }
}

export const soundFX = new SurvivalAudioEngine();
