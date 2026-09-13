/**
 * Procedural Web Audio Engine for Vehicles & Roller Coaster Track
 * 
 * Features:
 * - 100% self-contained Web Audio API synthesis (zero external audio files, zero load lag)
 * - Distinct, authentic sound models for:
 *   1. Car (vintage 4-cyl throaty engine, throttle load sweep, tire skids, vintage horn)
 *   2. Motorbike (screaming high-RPM sportbike, tuned exhaust rasp, gear blips, sport horn)
 *   3. Cycle A (rhythmic pedaling drivetrain whirr, road bike freehub ratchet clicking, brass bell)
 *   4. Cycle B (carbon aero rim resonance, ceramic high-engagement ratchet pawls, titanium bell)
 * - Physics-driven atmosphere:
 *   - Dynamic wind rush scaling with velocity through steep drops
 *   - Sub-bass coaster track rumble under high G-force loop compression
 * - Safe browser autoplay unlocking with smooth gain interpolation
 */

import { PhysicsState, VehicleType } from './physics';

export class VehicleAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private initialized: boolean = false;

  // Car audio nodes
  private carOsc1: OscillatorNode | null = null;
  private carOsc2: OscillatorNode | null = null;
  private carSubOsc: OscillatorNode | null = null;
  private carFilter: BiquadFilterNode | null = null;
  private carGain: GainNode | null = null;

  // Motorbike audio nodes
  private motoOsc: OscillatorNode | null = null;
  private motoSubOsc: OscillatorNode | null = null;
  private motoFilter: BiquadFilterNode | null = null;
  private motoDistortion: WaveShaperNode | null = null;
  private motoGain: GainNode | null = null;

  // Bike A audio nodes
  private bikeAChainOsc: OscillatorNode | null = null;
  private bikeAChainGain: GainNode | null = null;
  private bikeAFreehubGain: GainNode | null = null;
  private bikeAFreehubFilter: BiquadFilterNode | null = null;

  // Bike B audio nodes
  private bikeBChainOsc: OscillatorNode | null = null;
  private bikeBChainGain: GainNode | null = null;
  private bikeBFreehubGain: GainNode | null = null;
  private bikeBAeroGain: GainNode | null = null;

  // Atmosphere nodes
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private gRumbleGain: GainNode | null = null;
  private gRumbleOsc: OscillatorNode | null = null;
  private tireScreechGain: GainNode | null = null;
  private tireScreechFilter: BiquadFilterNode | null = null;

  // Noise generator source
  private noiseNode: AudioBufferSourceNode | null = null;

  // Freehub clicking timer
  private lastRatchetClickTime: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  /**
   * Initializes AudioContext and builds the audio graph
   */
  public init(): boolean {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return false;

      this.ctx = new AudioCtxClass();
      const ctx = this.ctx;

      // Master gain
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, ctx.currentTime);
      this.masterGain.connect(ctx.destination);

      // Create white noise buffer for wind, tire screech, and freehub clicks
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      this.noiseNode = ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;
      this.noiseNode.start();

      // =====================================
      // 1. CAR ENGINE AUDIO GRAPH
      // =====================================
      this.carOsc1 = ctx.createOscillator();
      this.carOsc1.type = 'sawtooth';
      this.carOsc1.frequency.setValueAtTime(36, ctx.currentTime);

      this.carOsc2 = ctx.createOscillator();
      this.carOsc2.type = 'triangle';
      this.carOsc2.frequency.setValueAtTime(73, ctx.currentTime);

      this.carSubOsc = ctx.createOscillator();
      this.carSubOsc.type = 'sine';
      this.carSubOsc.frequency.setValueAtTime(36, ctx.currentTime);

      this.carFilter = ctx.createBiquadFilter();
      this.carFilter.type = 'lowpass';
      this.carFilter.frequency.setValueAtTime(320, ctx.currentTime);
      this.carFilter.Q.setValueAtTime(2.2, ctx.currentTime);

      this.carGain = ctx.createGain();
      this.carGain.gain.setValueAtTime(0, ctx.currentTime);

      this.carOsc1.connect(this.carFilter);
      this.carOsc2.connect(this.carFilter);
      this.carSubOsc.connect(this.carFilter);
      this.carFilter.connect(this.carGain);
      this.carGain.connect(this.masterGain);

      this.carOsc1.start();
      this.carOsc2.start();
      this.carSubOsc.start();

      // =====================================
      // 2. MOTORBIKE AUDIO GRAPH
      // =====================================
      this.motoOsc = ctx.createOscillator();
      this.motoOsc.type = 'sawtooth';
      this.motoOsc.frequency.setValueAtTime(75, ctx.currentTime);

      this.motoSubOsc = ctx.createOscillator();
      this.motoSubOsc.type = 'triangle';
      this.motoSubOsc.frequency.setValueAtTime(150, ctx.currentTime);

      this.motoDistortion = ctx.createWaveShaper();
      this.motoDistortion.curve = this.makeDistortionCurve(18) as Float32Array<ArrayBuffer>;
      this.motoDistortion.oversample = '2x';

      this.motoFilter = ctx.createBiquadFilter();
      this.motoFilter.type = 'peaking';
      this.motoFilter.frequency.setValueAtTime(1400, ctx.currentTime);
      this.motoFilter.Q.setValueAtTime(3.5, ctx.currentTime);
      this.motoFilter.gain.setValueAtTime(6, ctx.currentTime);

      this.motoGain = ctx.createGain();
      this.motoGain.gain.setValueAtTime(0, ctx.currentTime);

      this.motoOsc.connect(this.motoDistortion);
      this.motoSubOsc.connect(this.motoDistortion);
      this.motoDistortion.connect(this.motoFilter);
      this.motoFilter.connect(this.motoGain);
      this.motoGain.connect(this.masterGain);

      this.motoOsc.start();
      this.motoSubOsc.start();

      // =====================================
      // 3. CYCLE A (ROAD BIKE) AUDIO GRAPH
      // =====================================
      this.bikeAChainOsc = ctx.createOscillator();
      this.bikeAChainOsc.type = 'triangle';
      this.bikeAChainOsc.frequency.setValueAtTime(180, ctx.currentTime);

      this.bikeAChainGain = ctx.createGain();
      this.bikeAChainGain.gain.setValueAtTime(0, ctx.currentTime);

      this.bikeAChainOsc.connect(this.bikeAChainGain);
      this.bikeAChainGain.connect(this.masterGain);
      this.bikeAChainOsc.start();

      this.bikeAFreehubFilter = ctx.createBiquadFilter();
      this.bikeAFreehubFilter.type = 'highpass';
      this.bikeAFreehubFilter.frequency.setValueAtTime(2400, ctx.currentTime);

      this.bikeAFreehubGain = ctx.createGain();
      this.bikeAFreehubGain.gain.setValueAtTime(0, ctx.currentTime);

      this.noiseNode.connect(this.bikeAFreehubFilter);
      this.bikeAFreehubFilter.connect(this.bikeAFreehubGain);
      this.bikeAFreehubGain.connect(this.masterGain);

      // =====================================
      // 4. CYCLE B (3D AERO BIKE) AUDIO GRAPH
      // =====================================
      this.bikeBChainOsc = ctx.createOscillator();
      this.bikeBChainOsc.type = 'sine';
      this.bikeBChainOsc.frequency.setValueAtTime(220, ctx.currentTime);

      this.bikeBChainGain = ctx.createGain();
      this.bikeBChainGain.gain.setValueAtTime(0, ctx.currentTime);

      this.bikeBChainOsc.connect(this.bikeBChainGain);
      this.bikeBChainGain.connect(this.masterGain);
      this.bikeBChainOsc.start();

      this.bikeBFreehubGain = ctx.createGain();
      this.bikeBFreehubGain.gain.setValueAtTime(0, ctx.currentTime);

      this.bikeBAeroGain = ctx.createGain();
      this.bikeBAeroGain.gain.setValueAtTime(0, ctx.currentTime);

      const bikeBAeroFilter = ctx.createBiquadFilter();
      bikeBAeroFilter.type = 'bandpass';
      bikeBAeroFilter.frequency.setValueAtTime(850, ctx.currentTime);
      bikeBAeroFilter.Q.setValueAtTime(2.0, ctx.currentTime);

      this.noiseNode.connect(bikeBAeroFilter);
      bikeBAeroFilter.connect(this.bikeBAeroGain);
      this.bikeBAeroGain.connect(this.masterGain);

      // =====================================
      // 5. ATMOSPHERE: WIND WHOOSH & G-RUMBLE
      // =====================================
      this.windFilter = ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(650, ctx.currentTime);
      this.windFilter.Q.setValueAtTime(1.2, ctx.currentTime);

      this.windGain = ctx.createGain();
      this.windGain.gain.setValueAtTime(0, ctx.currentTime);

      this.noiseNode.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);

      this.gRumbleOsc = ctx.createOscillator();
      this.gRumbleOsc.type = 'sine';
      this.gRumbleOsc.frequency.setValueAtTime(46, ctx.currentTime);

      this.gRumbleGain = ctx.createGain();
      this.gRumbleGain.gain.setValueAtTime(0, ctx.currentTime);

      this.gRumbleOsc.connect(this.gRumbleGain);
      this.gRumbleGain.connect(this.masterGain);
      this.gRumbleOsc.start();

      // Tire screech node
      this.tireScreechFilter = ctx.createBiquadFilter();
      this.tireScreechFilter.type = 'bandpass';
      this.tireScreechFilter.frequency.setValueAtTime(2700, ctx.currentTime);
      this.tireScreechFilter.Q.setValueAtTime(3.8, ctx.currentTime);

      this.tireScreechGain = ctx.createGain();
      this.tireScreechGain.gain.setValueAtTime(0, ctx.currentTime);

      this.noiseNode.connect(this.tireScreechFilter);
      this.tireScreechFilter.connect(this.tireScreechGain);
      this.tireScreechGain.connect(this.masterGain);

      this.initialized = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper to create waveshaper distortion curve
   */
  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * Toggle mute / unmute state
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 0.65;
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.05);
    }
    if (!this.isMuted) {
      this.init();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Triggers the appropriate vehicle horn or bicycle bell
   */
  public triggerHorn(vehicle: VehicleType): void {
    if (!this.ctx || this.isMuted) {
      this.init();
      if (this.isMuted) return;
    }
    if (!this.ctx || !this.masterGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (vehicle === 'car') {
      // Vintage dual-tone car horn: 415Hz + 520Hz chord
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const hornGain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(415, now);
      osc2.frequency.setValueAtTime(520, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      hornGain.gain.setValueAtTime(0, now);
      hornGain.gain.linearRampToValueAtTime(0.4, now + 0.03);
      hornGain.gain.setValueAtTime(0.4, now + 0.28);
      hornGain.gain.linearRampToValueAtTime(0, now + 0.38);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(hornGain);
      hornGain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } else if (vehicle === 'moto') {
      // Sport motorcycle horn: high-pitch 760Hz
      const osc = ctx.createOscillator();
      const hornGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(760, now);

      hornGain.gain.setValueAtTime(0, now);
      hornGain.gain.linearRampToValueAtTime(0.38, now + 0.02);
      hornGain.gain.setValueAtTime(0.38, now + 0.2);
      hornGain.gain.linearRampToValueAtTime(0, now + 0.28);

      osc.connect(hornGain);
      hornGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.3);
    } else if (vehicle === 'monster') {
      // Monster truck air horn: deep dual-tone 110Hz + 165Hz blast
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const hornGain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(110, now);
      osc2.frequency.setValueAtTime(165, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      hornGain.gain.setValueAtTime(0, now);
      hornGain.gain.linearRampToValueAtTime(0.45, now + 0.04);
      hornGain.gain.setValueAtTime(0.45, now + 0.4);
      hornGain.gain.linearRampToValueAtTime(0, now + 0.55);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(hornGain);
      hornGain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } else {
      // Bicycle bell: dual harmonic bright brass "ding-ding!"
      const playChime = (timeOffset: number) => {
        const chimeOsc1 = ctx.createOscillator();
        const chimeOsc2 = ctx.createOscillator();
        const chimeGain = ctx.createGain();

        chimeOsc1.type = 'sine';
        chimeOsc2.type = 'sine';
        chimeOsc1.frequency.setValueAtTime(vehicle === 'bikeA' ? 2080 : 2350, now + timeOffset);
        chimeOsc2.frequency.setValueAtTime(vehicle === 'bikeA' ? 2850 : 3400, now + timeOffset);

        chimeGain.gain.setValueAtTime(0, now + timeOffset);
        chimeGain.gain.linearRampToValueAtTime(0.35, now + timeOffset + 0.005);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.65);

        chimeOsc1.connect(chimeGain);
        chimeOsc2.connect(chimeGain);
        chimeGain.connect(this.masterGain!);

        chimeOsc1.start(now + timeOffset);
        chimeOsc2.start(now + timeOffset);
        chimeOsc1.stop(now + timeOffset + 0.7);
        chimeOsc2.stop(now + timeOffset + 0.7);
      };

      playChime(0);
      playChime(0.12); // Second chime for "ding-ding"
    }
  }

  /**
   * Main per-frame audio update loop
   */
  public update(physics: PhysicsState, vehicle: VehicleType): void {
    if (!this.initialized || !this.ctx || this.isMuted) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const absSpeed = Math.abs(physics.velocity);

    // Dynamic smoothing time
    const ramp = 0.05;

    // Zero out gains for non-active vehicles
    const isCar = vehicle === 'car';
    const isMoto = vehicle === 'moto';
    const isBikeA = vehicle === 'bikeA';
    const isBikeB = vehicle === 'bikeB';
    const isMonster = vehicle === 'monster';

    // =====================================
    // 1. UPDATE CAR SOUND
    // =====================================
    if (this.carGain && this.carOsc1 && this.carOsc2 && this.carSubOsc && this.carFilter) {
      if (isCar || isMonster) {
        // Fundamental frequency scales with speed and uphill slope load
        // Monster truck runs a deeper, louder big-block V8
        const speedRatio = Math.min(1.2, absSpeed / (isMonster ? 1550 : 1600));
        // Engine load increases when climbing uphill (-slope) with throttle
        const slopeLoad = Math.max(0, -physics.slopeDeg / 60) * (physics.throttleApplied ? 0.35 : 0.1);
        const engineRPMFactor = speedRatio + slopeLoad;

        const baseFreq = (isMonster ? 26 : 34) + engineRPMFactor * (isMonster ? 110 : 135);
        this.carOsc1.frequency.setTargetAtTime(baseFreq, now, ramp);
        this.carOsc2.frequency.setTargetAtTime(baseFreq * 2.03, now, ramp);
        this.carSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, ramp);

        // Lowpass filter opens wide under throttle / load (throaty roar)
        const filterCutoff = 260 + engineRPMFactor * 1250 + (physics.throttleApplied ? 450 : 0);
        this.carFilter.frequency.setTargetAtTime(Math.min(2600, filterCutoff), now, ramp);

        // Gain: gentle purr when idle, rises with speed and throttle
        const targetCarGain =
          (isMonster ? 0.24 : 0.18) + engineRPMFactor * (isMonster ? 0.38 : 0.32) + (physics.throttleApplied ? 0.15 : 0);
        this.carGain.gain.setTargetAtTime(targetCarGain, now, ramp);
      } else {
        this.carGain.gain.setTargetAtTime(0, now, ramp);
      }
    }

    // =====================================
    // 2. UPDATE MOTORBIKE SOUND
    // =====================================
    if (this.motoGain && this.motoOsc && this.motoSubOsc && this.motoFilter) {
      if (isMoto) {
        // High-revving sport motorcycle with virtual gear progression
        const speedRatio = Math.min(1.25, absSpeed / 2200);
        // 4 gear bands for gear shift pitch simulation
        const gearProgress = (speedRatio * 3.5) % 1;
        const gearBase = Math.floor(speedRatio * 3.5) * 45;

        const motoFreq = 78 + gearBase + gearProgress * 320 + (physics.throttleApplied ? 65 : 0);
        this.motoOsc.frequency.setTargetAtTime(motoFreq, now, ramp);
        this.motoSubOsc.frequency.setTargetAtTime(motoFreq * 1.5, now, ramp);

        const motoFilterCutoff = 1100 + speedRatio * 2200 + (physics.throttleApplied ? 700 : 0);
        this.motoFilter.frequency.setTargetAtTime(Math.min(4200, motoFilterCutoff), now, ramp);

        const targetMotoGain = 0.14 + speedRatio * 0.36 + (physics.throttleApplied ? 0.18 : 0);
        this.motoGain.gain.setTargetAtTime(targetMotoGain, now, ramp);
      } else {
        this.motoGain.gain.setTargetAtTime(0, now, ramp);
      }
    }

    // =====================================
    // 3. UPDATE CYCLE A & B SOUND
    // =====================================
    if (isBikeA || isBikeB) {
      const bikeSpeedRatio = Math.min(1.2, absSpeed / 1200);
      const isPedaling = physics.throttleApplied;
      const isCoasting = !isPedaling && absSpeed > 35;

      // Pedaling drivetrain whirr (active under throttle)
      if (isBikeA && this.bikeAChainGain && this.bikeAChainOsc) {
        const cadenceFreq = 90 + bikeSpeedRatio * 220;
        this.bikeAChainOsc.frequency.setTargetAtTime(cadenceFreq, now, ramp);
        this.bikeAChainGain.gain.setTargetAtTime(isPedaling ? 0.16 + bikeSpeedRatio * 0.14 : 0, now, ramp);
      }

      if (isBikeB && this.bikeBChainGain && this.bikeBChainOsc && this.bikeBAeroGain) {
        const cadenceFreq = 110 + bikeSpeedRatio * 260;
        this.bikeBChainOsc.frequency.setTargetAtTime(cadenceFreq, now, ramp);
        this.bikeBChainGain.gain.setTargetAtTime(isPedaling ? 0.15 + bikeSpeedRatio * 0.12 : 0, now, ramp);
        // Carbon aero wheel hum at speed
        this.bikeBAeroGain.gain.setTargetAtTime(bikeSpeedRatio * 0.12, now, ramp);
      }

      // Freehub Ratchet Clicks (when coasting downhill or with momentum)
      if (isCoasting && now - this.lastRatchetClickTime > Math.max(0.015, 0.16 - bikeSpeedRatio * 0.14)) {
        this.lastRatchetClickTime = now;
        this.playRatchetClick(isBikeB ? 2800 : 1900, isBikeB ? 0.12 : 0.08);
      }
    } else {
      if (this.bikeAChainGain) this.bikeAChainGain.gain.setTargetAtTime(0, now, ramp);
      if (this.bikeBChainGain) this.bikeBChainGain.gain.setTargetAtTime(0, now, ramp);
      if (this.bikeBAeroGain) this.bikeBAeroGain.gain.setTargetAtTime(0, now, ramp);
    }

    // =====================================
    // 4. ATMOSPHERE: WIND WHOOSH
    // =====================================
    if (this.windGain && this.windFilter) {
      // Wind rushes past during high speed (> 300 px/s)
      const windSpeedRatio = Math.max(0, (absSpeed - 250) / 1600);
      const windTargetGain = Math.min(0.38, Math.pow(windSpeedRatio, 1.4) * 0.45);
      this.windGain.gain.setTargetAtTime(windTargetGain, now, ramp);

      const windCutoff = 450 + windSpeedRatio * 1800;
      this.windFilter.frequency.setTargetAtTime(windCutoff, now, ramp);
    }

    // =====================================
    // 5. ATMOSPHERE: G-FORCE LOOP RUMBLE
    // =====================================
    if (this.gRumbleGain && this.gRumbleOsc) {
      // Sub-bass coaster track rumble under high Gs in loop (G > 1.6)
      const gExcess = Math.max(0, physics.gForce - 1.4);
      const rumbleGain = Math.min(0.32, gExcess * 0.14);
      this.gRumbleGain.gain.setTargetAtTime(rumbleGain, now, ramp);
    }

    // =====================================
    // 6. TIRE SCREECH / SKID SOUND
    // =====================================
    if (this.tireScreechGain) {
      // Screech during hard braking or high-slip cornering
      const screechGain = physics.isSkidding ? 0.35 : 0;
      this.tireScreechGain.gain.setTargetAtTime(screechGain, now, 0.03);
    }
  }

  /**
   * Play a crisp mechanical click for bicycle freehub ratchet
   */
  private playRatchetClick(freq: number, gainLevel: number): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.014);
  }

  public destroy(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.initialized = false;
    }
  }
}

// Global audio engine singleton
let globalAudioEngine: VehicleAudioEngine | null = null;

export function getAudioEngine(): VehicleAudioEngine {
  if (!globalAudioEngine) {
    globalAudioEngine = new VehicleAudioEngine();
  }
  return globalAudioEngine;
}
