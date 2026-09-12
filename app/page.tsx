'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Car } from '@/components/Car';
import { ThreeBike } from '@/components/ThreeBike';
import { Motorbike } from '@/components/Motorbike';

interface LetterItem {
  char: string;
  x: number;
  y: number;
  angle: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

// Pre-computed spoke offsets (dx, dy) for 5-spoke wheel at [0°, 72°, 144°, 216°, 288°]
// Avoids SSR hydration mismatch from floating-point Math.cos/sin differences
const SPOKE_OFFSETS: { dx: number; dy: number }[] = [0, 72, 144, 216, 288].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return { dx: Math.round(8 * Math.cos(rad) * 1000) / 1000, dy: Math.round(8 * Math.sin(rad) * 1000) / 1000 };
});

// Pre-computed spoke offsets for 24-spoke bicycle wheels (radius 16)
const BIKE_SPOKE_OFFSETS_24: { dx: number; dy: number }[] = Array.from({ length: 24 }, (_, i) => {
  const rad = (i * 15 * Math.PI) / 180;
  return { dx: Math.round(16 * Math.cos(rad) * 1000) / 1000, dy: Math.round(16 * Math.sin(rad) * 1000) / 1000 };
});

/**
 * Minimal white page with "let's fuckingggg goooo" text
 * laid out along an upside-down roller coaster loop path.
 * Features:
 * - Detailed vintage yellow car from the commercial with headlight beam, braking glow, and tire smoke
 * - Cycle A (detailed 2D vector bicycle with clear leg pedaling kinematics)
 * - Cycle B (3D Three.js articulated road bike with dynamic 2-link IK legs)
 * - Smooth inertia physics, spring camera tracking, and interactive toggle
 */
export default function HomePage() {
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const scrollVelocityRef = useRef<number>(0);
  const prevAngleRef = useRef<number>(0);
  const prevDistRef = useRef<number>(0);
  const wheelRotRef = useRef<number>(0);
  const isFirstFrameRef = useRef<boolean>(true);

  const [vehiclePos, setVehiclePos] = useState<{
    x: number;
    y: number;
    angle: number;
    wheelRot: number;
    isBraking: boolean;
  }>({ x: 50, y: 480, angle: 0, wheelRot: 0, isBraking: false });

  const [vehicle, setVehicle] = useState<'car' | 'moto' | 'bikeA' | 'bikeB'>('car');

  const [camera, setCamera] = useState<{ x: number; y: number }>({ x: -400, y: 0 });
  const [viewport, setViewport] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 800,
  });

  const pathRef = useRef<SVGPathElement | null>(null);
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [pathLength, setPathLength] = useState<number>(4000);
  const [progressVal, setProgressVal] = useState<number>(0);

  // Tire smoke & dust particles
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef<number>(0);

  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartProgressRef = useRef<number>(0);

  // ================================================
  // TEXT
  // ================================================
  const trackText = useMemo(() => {
    return Array(32).fill("let's fuckingggg goooo   ").join('');
  }, []);

  // ================================================
  // PATH: Gentle approach → Teardrop loop (crossing) → Hills & Waves
  // ViewBox: 0 0 5000 750
  // The teardrop loop forms a crossing 'X' at the bottom
  // and reaches full inversion (upside down) at the apex.
  // ================================================
  const trackPathD = useMemo(() => {
    return [
      // Gentle start runway
      'M 50,480',
      'C 250,480 500,480 750,480',
      // Slight pre-dip before entering the loop (acceleration dip)
      'C 830,480 890,505 960,510',
      // === TEARDROP LOOP-THE-LOOP (roller coaster vertical loop) ===
      // Ascent to the bottom crossing intersection
      'C 1100,510 1255,460 1300,370',
      // Rising up the right flank of the loop
      'C 1345,280 1395,210 1390,160',
      // Reaching the top apex (completely inverted/upside-down!)
      'C 1385,110 1350,50 1300,50',
      // Descending down the left flank of the loop
      'C 1250,50 1215,110 1210,160',
      // Descending through the crossing intersection (forming the teardrop X)
      'C 1205,210 1255,280 1300,370',
      // Exiting the loop downwards to the ground
      'C 1345,460 1500,510 1640,510',
      // === POST-LOOP ROLLER COASTER SECTIONS ===
      // Smooth recovery to ground level
      'C 1720,510 1780,480 1860,480',
      // Big airtime hill (camelback)
      'C 1960,480 2040,360 2160,360',
      'C 2280,360 2360,480 2460,480',
      // Second speed hump
      'C 2560,480 2640,410 2740,410',
      'C 2840,410 2920,480 3020,480',
      // Third gentle swell
      'C 3140,480 3220,440 3320,440',
      'C 3420,440 3500,480 3600,480',
      // High-speed flat runway to finish
      'L 4800,480',
    ].join(' ');
  }, []);

  // ================================================
  // RESIZE
  // ================================================
  useEffect(() => {
    const onResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ================================================
  // SAMPLE LETTERS ALONG PATH
  // ================================================
  const sampleLetters = useCallback(() => {
    const path = pathRef.current;
    if (!path) return;
    const totalLen = path.getTotalLength();
    if (totalLen <= 0) return;
    setPathLength(totalLen);

    const getAdv = (c: string): number => {
      if (c === ' ') return 6;
      if (c === 'i' || c === 'l' || c === '\'' || c === '!') return 5.5;
      if (c === 'w' || c === 'm') return 10;
      if (c === 'o' || c === 'g') return 8.5;
      if (c === 'f' || c === 'k' || c === 'n') return 7.5;
      return 7;
    };

    const items: LetterItem[] = [];
    let dist = 20;
    let idx = 0;

    while (dist < totalLen - 20) {
      const c = trackText[idx % trackText.length];
      const pt = path.getPointAtLength(dist);
      const d1 = Math.max(0, dist - 1);
      const d2 = Math.min(totalLen, dist + 1);
      const p1 = path.getPointAtLength(d1);
      const p2 = path.getPointAtLength(d2);
      const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;

      if (c !== ' ') {
        items.push({
          char: c,
          x: pt.x,
          y: pt.y,
          angle: isNaN(angle) ? 0 : angle,
        });
      }

      const adv = getAdv(c);
      const nextChar = trackText[(idx + 1) % trackText.length];
      const nextAdv = getAdv(nextChar);
      dist += (adv + nextAdv) / 2 + 0.8;
      idx++;
    }

    setLetters(items);
  }, [trackText]);

  useEffect(() => {
    const timer = setTimeout(sampleLetters, 50);
    return () => clearTimeout(timer);
  }, [sampleLetters]);

  // ================================================
  // SMOOTH CONTROLS (Small, natural scroll feel)
  // ================================================
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const clampedDelta = Math.sign(raw) * Math.min(Math.abs(raw), 100);
      const deltaVelocity = clampedDelta * 0.00007;

      scrollVelocityRef.current += deltaVelocity;
      scrollVelocityRef.current = Math.max(
        -0.006,
        Math.min(0.006, scrollVelocityRef.current)
      );
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'KeyD' || e.key === 'ArrowDown') {
        e.preventDefault();
        targetProgressRef.current = Math.min(1, targetProgressRef.current + 0.025);
      } else if (e.key === 'ArrowLeft' || e.key === 'KeyA' || e.key === 'ArrowUp') {
        e.preventDefault();
        targetProgressRef.current = Math.max(0, targetProgressRef.current - 0.025);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // ================================================
  // DRAG TO DRIVE
  // ================================================
  const onPointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartProgressRef.current = targetProgressRef.current;
    scrollVelocityRef.current = 0;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = dragStartXRef.current - e.clientX;
    targetProgressRef.current = Math.min(
      1,
      Math.max(0, dragStartProgressRef.current + dx / (viewport.width * 0.85))
    );
  };
  const onPointerUp = () => {
    isDraggingRef.current = false;
  };

  // ================================================
  // ANIMATION LOOP (Ultra-smooth physics, LERP & camera)
  // ================================================
  useEffect(() => {
    let raf: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000) || 0.016;
      lastTime = time;

      // Apply velocity momentum with natural decay friction
      if (Math.abs(scrollVelocityRef.current) > 0.000002) {
        targetProgressRef.current = Math.min(
          1,
          Math.max(0, targetProgressRef.current + scrollVelocityRef.current)
        );
        scrollVelocityRef.current *= 0.89; // Buttery friction deceleration
      } else {
        scrollVelocityRef.current = 0;
      }

      // Frame-rate independent spring LERP for ultra-smooth gliding motion
      const prevProg = currentProgressRef.current;
      const lerpSpeed = 1 - Math.exp(-8.5 * dt);
      currentProgressRef.current +=
        (targetProgressRef.current - currentProgressRef.current) * lerpSpeed;
      const prog = currentProgressRef.current;

      const path = pathRef.current;
      if (path && pathLength > 0) {
        const dist = Math.min(pathLength, Math.max(0, prog * pathLength));
        const dd = dist - prevDistRef.current;
        prevDistRef.current = dist;
        wheelRotRef.current += (dd / 38) * 360;

        const velocity = (prog - prevProg) / (dt || 0.016);
        const isBraking = velocity < -0.0005;

        const pt = path.getPointAtLength(dist);
        const d1 = Math.max(0, dist - 1.5);
        const d2 = Math.min(pathLength, dist + 1.5);
        const p1 = path.getPointAtLength(d1);
        const p2 = path.getPointAtLength(d2);
        let raw = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
        if (isNaN(raw)) raw = 0;

        let diff = raw - (prevAngleRef.current % 360);
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        const unwrapped = prevAngleRef.current + diff;
        prevAngleRef.current = unwrapped;

        // Subtle suspension pitch/lean into acceleration
        const suspensionPitch = Math.max(-4, Math.min(4, velocity * 35));
        const finalAngle = unwrapped + suspensionPitch;

        setVehiclePos({
          x: pt.x,
          y: pt.y,
          angle: finalAngle,
          wheelRot: wheelRotRef.current,
          isBraking,
        });

        // Smooth cinematic camera tracking with subtle lookahead
        const tCamX = pt.x - viewport.width * 0.38 + velocity * 250;
        const tCamY = (pt.y - viewport.height * 0.5) * 0.5;
        if (isFirstFrameRef.current) {
          isFirstFrameRef.current = false;
          setCamera({ x: tCamX, y: tCamY });
        } else {
          const camLerp = 1 - Math.exp(-6.5 * dt);
          setCamera((prev) => ({
            x: prev.x + (tCamX - prev.x) * camLerp,
            y: prev.y + (tCamY - prev.y) * camLerp,
          }));
        }

        // Spawn exhaust / dust particles when vehicle drives fast
        if ((vehicle === 'car' || vehicle === 'moto') && Math.abs(velocity) > 0.001) {
          const rad = (finalAngle * Math.PI) / 180;
          // Offset near rear tire contact
          const rx = pt.x - 28 * Math.cos(rad);
          const ry = pt.y - 28 * Math.sin(rad) - 6;

          setParticles((prev) => {
            const next = prev
              .map((p) => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                alpha: p.alpha - 0.038,
              }))
              .filter((p) => p.alpha > 0);

            if (next.length < 22) {
              particleIdRef.current += 1;
              next.push({
                id: particleIdRef.current,
                x: rx + (Math.random() - 0.5) * 6,
                y: ry + (Math.random() - 0.5) * 4,
                vx: -Math.cos(rad) * (1.8 + Math.random() * 2.2),
                vy: -Math.random() * 1.2,
                size: 2.2 + Math.random() * 3.8,
                alpha: 0.55,
                color: '#D97706',
              });
            }
            return next;
          });
        }

        setProgressVal(prog);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pathLength, viewport.width, viewport.height, vehicle]);

  const pct = Math.round(progressVal * 100);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="fixed inset-0 w-full h-full overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
      style={{ background: '#ffffff' }}
    >
      {/* Hidden path for sampling */}
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
        <path ref={pathRef} d={trackPathD} fill="none" />
      </svg>

      {/* ======== WORLD LAYER ======== */}
      <div
        className="absolute top-0 left-0 will-change-transform"
        style={{
          transform: `translate3d(${-camera.x}px, ${-camera.y}px, 0)`,
          width: '5000px',
          height: '750px',
        }}
      >
        <svg
          className="absolute top-0 left-0 overflow-visible pointer-events-none"
          style={{ width: '5000px', height: '750px' }}
          viewBox="0 0 5000 750"
        >
          {/* Tire dust / smoke particles */}
          <g className="particles-layer">
            {particles.map((p) => (
              <circle
                key={`p-${p.id}`}
                cx={p.x}
                cy={p.y}
                r={p.size}
                fill={p.color}
                opacity={p.alpha}
              />
            ))}
          </g>

          {/* Letters */}
          <g className="letters-layer">
            {letters.map((item, i) => (
              <text
                key={`l-${i}`}
                x={item.x}
                y={item.y}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${item.angle}, ${item.x}, ${item.y})`}
                fill="#1a1a1a"
                className="select-none pointer-events-none"
                style={{
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '13px',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                }}
              >
                {item.char}
              </text>
            ))}
          </g>

          {/* ---- CAR (Detailed vintage yellow car with beam & brake animation) ---- */}
          {vehicle === 'car' && (
            <g
              transform={`translate(${vehiclePos.x}, ${vehiclePos.y}) rotate(${vehiclePos.angle})`}
              style={{ transformOrigin: '0px 0px' }}
              className="pointer-events-none"
            >
              <g transform="translate(-65, -60) scale(0.52)">
                <Car
                  wheelRotation={vehiclePos.wheelRot}
                  width={240}
                  height={110}
                  headlightsOn={true}
                  isBraking={vehiclePos.isBraking}
                />
              </g>
            </g>
          )}

          {/* ---- MOTORBIKE (Red sport bike with rider, beam & brake glow) ---- */}
          {vehicle === 'moto' && (
            <g
              transform={`translate(${vehiclePos.x}, ${vehiclePos.y}) rotate(${vehiclePos.angle})`}
              style={{ transformOrigin: '0px 0px' }}
              className="pointer-events-none"
            >
              <g transform="translate(-65, -60) scale(0.52)">
                <Motorbike
                  wheelRotation={vehiclePos.wheelRot}
                  width={240}
                  height={110}
                  headlightsOn={true}
                  isBraking={vehiclePos.isBraking}
                />
              </g>
            </g>
          )}

          {/* ---- CYCLE A (Original 2D Vector Bike with high-contrast pedaling legs) ---- */}
          {vehicle === 'bikeA' && (
            <g
              transform={`translate(${vehiclePos.x}, ${vehiclePos.y}) rotate(${vehiclePos.angle})`}
              style={{ transformOrigin: '0px 0px' }}
              className="pointer-events-none"
            >
              <g transform="translate(-25, -41) scale(0.35)">
                {/* Ground contact shadow */}
                <ellipse cx="74" cy="100" rx="58" ry="3.5" fill="#000" opacity="0.1" />

                {/* ======== REAR WHEEL (Deep-Section Carbon Aero) ======== */}
                <g transform={`rotate(${vehiclePos.wheelRot}, 28, 82)`}>
                  <circle cx="28" cy="82" r="22" fill="none" stroke="#141414" strokeWidth="4.2" />
                  <circle cx="28" cy="82" r="19.8" fill="none" stroke="#252525" strokeWidth="0.8" />
                  <circle cx="28" cy="82" r="16.5" fill="none" stroke="#202020" strokeWidth="6.5" />
                  <circle cx="28" cy="82" r="18.5" fill="none" stroke="#2a2a2a" strokeWidth="0.8" />
                  <circle cx="28" cy="82" r="13.2" fill="none" stroke="#333333" strokeWidth="0.8" />
                  {BIKE_SPOKE_OFFSETS_24.map((s, i) => (
                    <line key={`brs-${i}`} x1="28" y1="82" x2={28 + s.dx * 0.82} y2={82 + s.dy * 0.82} stroke="#3a3a3a" strokeWidth="0.65" />
                  ))}
                  <circle cx="28" cy="82" r="8.2" fill="#3a3a3a" stroke="#555" strokeWidth="0.8" />
                  <circle cx="28" cy="82" r="6.2" fill="#202020" />
                  {[0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return <circle key={`rrh-${deg}`} cx={28 + 7.2 * Math.cos(rad)} cy={82 + 7.2 * Math.sin(rad)} r="0.7" fill="#141414" />;
                  })}
                  <circle cx="28" cy="82" r="4.2" fill="#181818" stroke="#333" strokeWidth="0.8" />
                  <circle cx="28" cy="82" r="1.5" fill="#666" />
                </g>

                {/* ======== FRONT WHEEL (Deep-Section Carbon Aero) ======== */}
                <g transform={`rotate(${vehiclePos.wheelRot}, 120, 82)`}>
                  <circle cx="120" cy="82" r="22" fill="none" stroke="#141414" strokeWidth="4.2" />
                  <circle cx="120" cy="82" r="19.8" fill="none" stroke="#252525" strokeWidth="0.8" />
                  <circle cx="120" cy="82" r="16.5" fill="none" stroke="#202020" strokeWidth="6.5" />
                  <circle cx="120" cy="82" r="18.5" fill="none" stroke="#2a2a2a" strokeWidth="0.8" />
                  <circle cx="120" cy="82" r="13.2" fill="none" stroke="#333333" strokeWidth="0.8" />
                  {BIKE_SPOKE_OFFSETS_24.map((s, i) => (
                    <line key={`bfs-${i}`} x1="120" y1="82" x2={120 + s.dx * 0.82} y2={82 + s.dy * 0.82} stroke="#3a3a3a" strokeWidth="0.65" />
                  ))}
                  <circle cx="120" cy="82" r="8.2" fill="#3a3a3a" stroke="#555" strokeWidth="0.8" />
                  <circle cx="120" cy="82" r="6.2" fill="#202020" />
                  {[0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return <circle key={`frh-${deg}`} cx={120 + 7.2 * Math.cos(rad)} cy={82 + 7.2 * Math.sin(rad)} r="0.7" fill="#141414" />;
                  })}
                  <circle cx="120" cy="82" r="4.2" fill="#181818" stroke="#333" strokeWidth="0.8" />
                  <circle cx="120" cy="82" r="1.5" fill="#666" />
                </g>

                {/* ======== DISC BRAKE CALIPERS & HYDRAULIC LINES ======== */}
                <rect x="23" y="74" width="5.5" height="4.5" rx="1.2" fill="#151515" stroke="#333" strokeWidth="0.6" />
                <rect x="114" y="74" width="5.5" height="4.5" rx="1.2" fill="#151515" stroke="#333" strokeWidth="0.6" />
                <path d="M 115,74 C 114,64 110,48 106,38" fill="none" stroke="#262626" strokeWidth="0.8" />
                <path d="M 24,74 C 36,76 60,78 106,38" fill="none" stroke="#262626" strokeWidth="0.8" />

                {/* ======== AERO CARBON FRAME ======== */}
                <path d="M 67,78 L 28,84 L 28,80 L 72,75 Z" fill="#1a1a1a" stroke="#141414" strokeWidth="0.8" />
                <path d="M 58,37 L 28,81 L 31,83 L 61,39 Z" fill="#262626" stroke="#181818" strokeWidth="0.8" />
                <path d="M 58,34 L 63,34 L 75,77 L 67,81 C 59,70 54,54 58,34 Z" fill="#1e1e1e" stroke="#161616" strokeWidth="0.8" />
                <path d="M 102,38 L 106,44 L 76,82 L 67,78 Z" fill="#1e1e1e" stroke="#161616" strokeWidth="0.8" />
                <path d="M 103,40 L 73,78 L 76,82 L 106,44 Z" fill="#282828" opacity="0.6" />
                <line x1="95" y1="46" x2="81" y2="64" stroke="#ffffff" strokeWidth="0.8" opacity="0.85" />
                <path d="M 104,32 L 104,37 L 58,40 L 58,35 Z" fill="#242424" stroke="#181818" strokeWidth="0.8" />
                <line x1="104" y1="32" x2="58" y2="35" stroke="#3d3d3d" strokeWidth="0.8" />
                <path d="M 102,31 L 106,31 L 106,46 L 102,46 Z" fill="#262626" stroke="#181818" strokeWidth="0.8" />
                <rect x="104" y="36" width="1.8" height="4" rx="0.4" fill="#888" />
                <path d="M 102,45 L 106,45 L 122,83 L 118,83 Z" fill="#202020" stroke="#161616" strokeWidth="0.8" />
                <rect x="101" y="44" width="6" height="2.5" rx="1" fill="#181818" />

                {/* ======== COCKPIT & ELECTRONICS ======== */}
                <polygon points="103,32 112,30 113,34 104,36" fill="#181818" />
                <path d="M 112,30 C 117,30 120,33 118,39 L 115,39 C 116,35 114,33 111,33 Z" fill="#202020" />
                <line x1="113" y1="31" x2="113" y2="34" stroke="#333" strokeWidth="0.6" />
                <line x1="115" y1="32" x2="115" y2="35" stroke="#333" strokeWidth="0.6" />
                <rect x="116" y="31" width="4.5" height="5" rx="1.5" fill="#2c2c2c" stroke="#1a1a1a" strokeWidth="0.5" />
                <line x1="117" y1="35" x2="116" y2="41" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
                <rect x="112" y="26" width="5.5" height="4.5" rx="1" fill="#111" stroke="#333" strokeWidth="0.4" />
                <rect x="112.8" y="26.8" width="3.9" height="2.9" rx="0.5" fill="#38bdf8" opacity="0.9" />

                {/* ======== SADDLE & REAR TAILLIGHT ======== */}
                <polygon points="57,28 61,28 62,36 58,36" fill="#181818" />
                <path d="M 48,25 C 51,23 58,22 64,23 C 68,23.5 70,25 69,27 C 67,29 60,30 55,29 C 50,29 47,27 48,25 Z" fill="#1c1c1c" stroke="#111" strokeWidth="0.6" />
                <line x1="53" y1="26" x2="62" y2="26" stroke="#111" strokeWidth="0.8" />
                <line x1="51" y1="27" x2="63" y2="27" stroke="#444" strokeWidth="0.8" />
                <rect x="55.5" y="31" width="2.2" height="4.2" rx="0.8" fill="#ef4444" opacity="0.95" />

                {/* ======== DRIVETRAIN ======== */}
                <circle cx="72" cy="78" r="11" fill="#181818" stroke="#2e2e2e" strokeWidth="0.8" />
                <circle cx="72" cy="78" r="9" fill="#222" stroke="#282828" strokeWidth="0.6" />
                <circle cx="72" cy="78" r="11.5" fill="none" stroke="#444" strokeWidth="0.6" strokeDasharray="1.2 1" />
                {[0, 72, 144, 216, 288].map((deg) => {
                  const rad = (deg * Math.PI) / 180;
                  return <circle key={`cbolt-${deg}`} cx={72 + 7.5 * Math.cos(rad)} cy={78 + 7.5 * Math.sin(rad)} r="0.8" fill="#555" />;
                })}
                <circle cx="28" cy="82" r="5.5" fill="#3a3a3a" stroke="#555" strokeWidth="0.8" />
                <polygon points="26,85 30,85 32,90 28,91" fill="#202020" stroke="#151515" strokeWidth="0.5" />
                <circle cx="30" cy="87" r="1.5" fill="#333" />
                <circle cx="29" cy="91" r="1.5" fill="#333" />
                <line x1="72" y1="67" x2="28" y2="76.5" stroke="#444" strokeWidth="1.2" />
                <line x1="72" y1="89" x2="28" y2="87.5" stroke="#444" strokeWidth="1.2" />
                <line x1="72" y1="67" x2="28" y2="76.5" stroke="#666" strokeWidth="0.4" strokeDasharray="2 1.5" />

                {/* ======== DUAL WATER BOTTLES ======== */}
                <rect x="80.5" y="54" width="3.5" height="15" rx="1.5" fill="#2a2a2a" stroke="#1c1c1c" strokeWidth="0.5" />
                <rect x="81" y="53" width="2.5" height="2" rx="0.8" fill="#444" />
                <line x1="81" y1="60" x2="83.5" y2="60" stroke="#888" strokeWidth="0.5" />
                <rect x="63" y="47" width="3.5" height="13" rx="1.5" fill="#2a2a2a" stroke="#1c1c1c" strokeWidth="0.5" transform="rotate(-15, 63, 47)" />

                {/* ======== PEDALS + MUSCULAR RIDER (Cycle A Dynamic Anatomy IK) ======== */}
                {(() => {
                  const pa = (vehiclePos.wheelRot * 1.5 * Math.PI) / 180;
                  const cl = 13;
                  const bx = 72, by = 78;
                  const f1x = bx + cl * Math.cos(pa);
                  const f1y = by + cl * Math.sin(pa);
                  const f2x = bx - cl * Math.cos(pa);
                  const f2y = by - cl * Math.sin(pa);

                  const hx = 58, hy = 26;
                  const k1x = (f1x + hx) / 2 - 3.5;
                  const k1y = (f1y + hy) / 2 - 11.5;
                  const k2x = (f2x + hx) / 2 - 3.5;
                  const k2y = (f2y + hy) / 2 - 11.5;

                  return (
                    <g>
                      {/* Back crank */}
                      <line x1={bx} y1={by} x2={f2x} y2={f2y} stroke="#888" strokeWidth="2.8" strokeLinecap="round" />

                      {/* Back leg */}
                      <polygon points={`${hx - 2},${hy + 1} ${hx + 3},${hy} ${k2x + 3},${k2y + 2} ${k2x - 2},${k2y + 3}`} fill="#ba7c48" />
                      <polygon points={`${hx - 2},${hy + 1} ${hx + 3},${hy} ${(hx * 0.45 + k2x * 0.55) + 2.5},${(hy * 0.45 + k2y * 0.55) + 1} ${(hx * 0.45 + k2x * 0.55) - 2},${(hy * 0.45 + k2y * 0.55) + 2}`} fill="#161616" />
                      <path d={`M ${k2x - 1},${k2y + 1} C ${k2x - 3},${(k2y + f2y) / 2} ${f2x - 3},${f2y - 2} ${f2x - 1},${f2y} L ${f2x + 2},${f2y} C ${f2x + 3},${f2y - 3} ${k2x + 3},${(k2y + f2y) / 2} ${k2x + 2},${k2y + 1} Z`} fill="#a86e3f" />
                      <rect x={f2x - 2} y={f2y - 4} width="4" height="3" rx="0.5" fill="#e5e5e5" />
                      <polygon points={`${f2x - 3},${f2y + 2} ${f2x + 6},${f2y + 2} ${f2x + 7},${f2y - 1} ${f2x + 4},${f2y - 3} ${f2x - 3},${f2y - 2}`} fill="#141414" />
                      <rect x={f2x - 4} y={f2y + 2} width="8" height="2.2" rx="0.7" fill="#f59e0b" />

                      {/* Back arm */}
                      <line x1="82" y1="10" x2="96" y2="19" stroke="#1c1c1c" strokeWidth="3.2" strokeLinecap="round" />
                      <line x1="96" y1="19" x2="114" y2="32" stroke="#1c1c1c" strokeWidth="2.8" strokeLinecap="round" />
                      <circle cx="114" cy="32" r="2.2" fill="#141414" />

                      {/* Torso */}
                      <path d="M 56,27 C 56,22 62,20 78,12 L 84,10 L 86,13 C 83,18 78,21 68,26 C 62,29 57,28 56,27 Z" fill="#202020" stroke="#161616" strokeWidth="0.8" />
                      <path d="M 64,22 C 72,17 78,14 83,11" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                      <rect x="56" y="24" width="4.5" height="3" rx="0.5" fill="#ffffff" opacity="0.85" />
                      <line x1="83" y1="11" x2="67" y2="24" stroke="#333" strokeWidth="0.6" />
                      <path d="M 83,9 C 85,8 87,9 88,10" fill="none" stroke="#444" strokeWidth="1" />

                      {/* Front leg (Clear skin tone + white socks so movement is obvious!) */}
                      <polygon points={`${hx - 2},${hy} ${hx + 4},${hy - 1} ${k1x + 4},${k1y + 1} ${k1x - 2},${k1y + 2}`} fill="#e5a672" stroke="#ca8a04" strokeWidth="0.4" />
                      <polygon points={`${hx - 2},${hy} ${hx + 4},${hy - 1} ${(hx * 0.45 + k1x * 0.55) + 3},${(hy * 0.45 + k1y * 0.55)} ${(hx * 0.45 + k1x * 0.55) - 2},${(hy * 0.45 + k1y * 0.55) + 1}`} fill="#181818" />
                      <line x1={(hx * 0.45 + k1x * 0.55) - 1.5} y1={(hy * 0.45 + k1y * 0.55) + 1} x2={(hx * 0.45 + k1x * 0.55) + 3} y2={(hy * 0.45 + k1y * 0.55)} stroke="#ffffff" strokeWidth="0.9" />
                      <path d={`M ${k1x - 1},${k1y + 1} C ${k1x - 4},${(k1y + f1y) / 2} ${f1x - 3},${f1y - 2} ${f1x - 1},${f1y} L ${f1x + 3},${f1y} C ${f1x + 4},${f1y - 3} ${k1x + 4},${(k1y + f1y) / 2} ${k1x + 2},${k1y + 1} Z`} fill="#e5a672" stroke="#ca8a04" strokeWidth="0.4" />
                      <circle cx={k1x + 1} cy={k1y + 1} r="2.2" fill="#df9b64" />
                      <rect x={f1x - 2} y={f1y - 5} width="4.8" height="3.8" rx="0.6" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.4" />
                      <polygon points={`${f1x - 3},${f1y + 2} ${f1x + 7},${f1y + 2} ${f1x + 8},${f1y - 1} ${f1x + 5},${f1y - 3} ${f1x - 3},${f1y - 2}`} fill="#181818" stroke="#111" strokeWidth="0.5" />
                      <line x1={f1x - 3} y1={f1y + 2} x2={f1x + 7} y2={f1y + 2} stroke="#333" strokeWidth="1.2" />
                      <circle cx={f1x + 2} cy={f1y - 1.5} r="0.9" fill="#eab308" />
                      <rect x={f1x - 4} y={f1y + 2} width="8" height="2.5" rx="0.8" fill="#f59e0b" />

                      {/* Front crank */}
                      <line x1={bx} y1={by} x2={f1x} y2={f1y} stroke="#ddd" strokeWidth="3" strokeLinecap="round" />

                      {/* Front arm */}
                      <line x1="84" y1="11" x2="98" y2="20" stroke="#282828" strokeWidth="3.8" strokeLinecap="round" />
                      <line x1="98" y1="20" x2="116" y2="33" stroke="#262626" strokeWidth="3.2" strokeLinecap="round" />
                      <circle cx="98" cy="20" r="1.8" fill="#333" />
                      <circle cx="116" cy="33" r="2.5" fill="#181818" stroke="#333" strokeWidth="0.5" />
                      <line x1="114" y1="31" x2="118" y2="33" stroke="#ffffff" strokeWidth="0.6" opacity="0.85" />

                      {/* Head & Helmet */}
                      <line x1="85" y1="8" x2="82" y2="12" stroke="#222" strokeWidth="3" strokeLinecap="round" />
                      <path d="M 87,4 C 86,-2 92,-5 98,-5 C 104,-5 108,-1 106,4 C 104,8 98,9 93,8 C 88,8 86,6 87,4 Z" fill="#242424" stroke="#181818" strokeWidth="0.8" />
                      <polygon points="90,5 80,2 87,-1" fill="#1e1e1e" />
                      <line x1="93" y1="-3" x2="97" y2="-3.5" stroke="#3a3a3a" strokeWidth="0.8" strokeLinecap="round" />
                      <line x1="99" y1="-3.5" x2="103" y2="-2" stroke="#3a3a3a" strokeWidth="0.8" strokeLinecap="round" />
                      <path d="M 94,-1 L 98,-3 L 102,-1" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.85" />
                      <path d="M 94,3 C 97,1 102,1 105,3 C 106,5 104,6 100,6 C 96,6 94,5 94,3 Z" fill="#111" stroke="#333" strokeWidth="0.5" />
                      <line x1="96" y1="2.5" x2="102" y2="2.5" stroke="#777" strokeWidth="0.6" strokeLinecap="round" />
                      <polygon points="94,7 98,7 96,9" fill="#242424" />
                    </g>
                  );
                })()}
              </g>
            </g>
          )}
        </svg>

        {/* ---- CYCLE B (Three.js 3D Road Bike & Cyclist) ---- */}
        {vehicle === 'bikeB' && (
          <div
            className="absolute pointer-events-none select-none overflow-visible"
            style={{
              left: 0,
              top: 0,
              transform: `translate(${vehiclePos.x}px, ${vehiclePos.y}px) rotate(${vehiclePos.angle}deg)`,
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
          >
            <div
              style={{
                transform: 'translate(-65px, -91px)',
              }}
            >
              <ThreeBike wheelRot={vehiclePos.wheelRot} width={130} height={100} />
            </div>
          </div>
        )}
      </div>

      {/* ======== UI ======== */}

      {/* Progress bar — top right */}
      <div className="fixed top-5 right-5 z-40 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-white border border-neutral-200 px-3 py-1.5 rounded-full text-neutral-500 text-[11px] font-medium shadow-sm">
          <div className="w-16 h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-900 rounded-full transition-all duration-75"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-neutral-900 font-semibold text-[10px] tabular-nums">{pct}%</span>
        </div>
      </div>

      {/* Toggle + instruction — bottom center */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
        {/* Vehicle toggle: Car, Cycle A, Cycle B */}
        <div className="flex items-center bg-white border border-neutral-200 rounded-full shadow-sm p-0.5">
          <button
            onClick={() => setVehicle('car')}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-all rounded-full cursor-pointer ${
              vehicle === 'car'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            🚗 Car
          </button>
          <button
            onClick={() => setVehicle('moto')}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-all rounded-full cursor-pointer ${
              vehicle === 'moto'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            🏍️ Moto
          </button>
          <button
            onClick={() => setVehicle('bikeA')}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-all rounded-full cursor-pointer ${
              vehicle === 'bikeA'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            🚲 Cycle A
          </button>
          <button
            onClick={() => setVehicle('bikeB')}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-all rounded-full cursor-pointer ${
              vehicle === 'bikeB'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            🚴 Cycle B (3D)
          </button>
        </div>

        {/* Instruction */}
        <div className="flex items-center gap-2.5 bg-white border border-neutral-200 px-4 py-2 rounded-full text-neutral-400 text-[11px] font-medium shadow-sm">
          <span>scroll · drag · arrow keys</span>
        </div>
      </div>

      {/* Google Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500&display=swap');
      `}</style>
    </div>
  );
}
