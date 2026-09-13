'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Car } from '@/components/Car';
import { ThreeBike } from '@/components/ThreeBike';
import { Motorbike } from '@/components/Motorbike';
import { MonsterTruck } from '@/components/MonsterTruck';
import {
  stepPhysics,
  sampleTrack,
  createInitialPhysicsState,
  VEHICLE_CONFIGS,
  type VehicleType,
  type PhysicsState,
  type PhysicsInputs,
} from '@/lib/physics';
import { getAudioEngine } from '@/lib/audio';

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

// Suspension render mapping per motorized vehicle: inner-artwork scale + body pitch pivot (SVG units)
const SUSP_RENDER: Record<string, { s: number; px: number; py: number }> = {
  car: { s: 0.52, px: 120, py: 60 },
  moto: { s: 0.52, px: 120, py: 60 },
  monster: { s: 0.85, px: 130, py: 70 },
};

// Pre-computed spoke offsets for 24-spoke bicycle wheels (radius 16)
const BIKE_SPOKE_OFFSETS_24: { dx: number; dy: number }[] = Array.from({ length: 24 }, (_, i) => {
  const rad = (i * 15 * Math.PI) / 180;
  return {
    dx: Math.round(16 * Math.cos(rad) * 1000) / 1000,
    dy: Math.round(16 * Math.sin(rad) * 1000) / 1000,
  };
});

// ==================================================================
// MEMOIZED SUB-COMPONENTS (Eliminate 95%+ of React virtual DOM diffing)
// ==================================================================

/**
 * Static letters along the track path (rendered once and never re-evaluated)
 */
const TrackLetters = React.memo(function TrackLetters({ letters }: { letters: LetterItem[] }) {
  return (
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
  );
});

/**
 * Dynamic tire dust & smoke particles
 */
const TrackParticles = React.memo(function TrackParticles({
  particles,
}: {
  particles: Particle[];
}) {
  if (particles.length === 0) return null;
  return (
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
  );
});

/**
 * Cycle A: Precision 2D Vector Road Bike & Articulated Cyclist
 */
const CycleA = React.memo(function CycleA({
  wheelRot,
}: {
  wheelRot: number;
}) {
  const pa = (wheelRot * 1.5 * Math.PI) / 180;
  const cl = 13;
  const bx = 72;
  const by = 78;
  const f1x = bx + cl * Math.cos(pa);
  const f1y = by + cl * Math.sin(pa);
  const f2x = bx - cl * Math.cos(pa);
  const f2y = by - cl * Math.sin(pa);

  const hx = 58;
  const hy = 26;
  const k1x = (f1x + hx) / 2 - 3.5;
  const k1y = (f1y + hy) / 2 - 11.5;
  const k2x = (f2x + hx) / 2 - 3.5;
  const k2y = (f2y + hy) / 2 - 11.5;

  return (
    <g transform="translate(-25, -41) scale(0.35)">
      {/* Ground contact shadow */}
      <ellipse cx="74" cy="100" rx="58" ry="3.5" fill="#000" opacity="0.1" />

      {/* ======== REAR WHEEL (Deep-Section Carbon Aero) ======== */}
      <g transform={`rotate(${wheelRot}, 28, 82)`}>
        <circle cx="28" cy="82" r="22" fill="none" stroke="#141414" strokeWidth="4.2" />
        <circle cx="28" cy="82" r="19.8" fill="none" stroke="#252525" strokeWidth="0.8" />
        <circle cx="28" cy="82" r="16.5" fill="none" stroke="#202020" strokeWidth="6.5" />
        <circle cx="28" cy="82" r="18.5" fill="none" stroke="#2a2a2a" strokeWidth="0.8" />
        <circle cx="28" cy="82" r="13.2" fill="none" stroke="#333333" strokeWidth="0.8" />
        {BIKE_SPOKE_OFFSETS_24.map((s, i) => (
          <line
            key={`brs-${i}`}
            x1="28"
            y1="82"
            x2={28 + s.dx * 0.82}
            y2={82 + s.dy * 0.82}
            stroke="#3a3a3a"
            strokeWidth="0.65"
          />
        ))}
        <circle cx="28" cy="82" r="8.2" fill="#3a3a3a" stroke="#555" strokeWidth="0.8" />
        <circle cx="28" cy="82" r="6.2" fill="#202020" />
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <circle
              key={`rrh-${deg}`}
              cx={28 + 7.2 * Math.cos(rad)}
              cy={82 + 7.2 * Math.sin(rad)}
              r="0.7"
              fill="#141414"
            />
          );
        })}
        <circle cx="28" cy="82" r="4.2" fill="#181818" stroke="#333" strokeWidth="0.8" />
        <circle cx="28" cy="82" r="1.5" fill="#666" />
      </g>

      {/* ======== FRONT WHEEL (Deep-Section Carbon Aero) ======== */}
      <g transform={`rotate(${wheelRot}, 120, 82)`}>
        <circle cx="120" cy="82" r="22" fill="none" stroke="#141414" strokeWidth="4.2" />
        <circle cx="120" cy="82" r="19.8" fill="none" stroke="#252525" strokeWidth="0.8" />
        <circle cx="120" cy="82" r="16.5" fill="none" stroke="#202020" strokeWidth="6.5" />
        <circle cx="120" cy="82" r="18.5" fill="none" stroke="#2a2a2a" strokeWidth="0.8" />
        <circle cx="120" cy="82" r="13.2" fill="none" stroke="#333333" strokeWidth="0.8" />
        {BIKE_SPOKE_OFFSETS_24.map((s, i) => (
          <line
            key={`bfs-${i}`}
            x1="120"
            y1="82"
            x2={120 + s.dx * 0.82}
            y2={82 + s.dy * 0.82}
            stroke="#3a3a3a"
            strokeWidth="0.65"
          />
        ))}
        <circle cx="120" cy="82" r="8.2" fill="#3a3a3a" stroke="#555" strokeWidth="0.8" />
        <circle cx="120" cy="82" r="6.2" fill="#202020" />
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <circle
              key={`frh-${deg}`}
              cx={120 + 7.2 * Math.cos(rad)}
              cy={82 + 7.2 * Math.sin(rad)}
              r="0.7"
              fill="#141414"
            />
          );
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

      {/* ======== PEDALS + MUSCULAR RIDER ======== */}
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

      {/* Front leg */}
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
});

// ==================================================================
// MAIN HOMEPAGE COMPONENT
// ==================================================================

export default function HomePage() {
  const [vehicle, setVehicle] = useState<VehicleType>('car');
  const vehicleRef = useRef<VehicleType>('car');
  vehicleRef.current = vehicle;

  const physicsStateRef = useRef<PhysicsState>(createInitialPhysicsState(50));
  const physicsInputsRef = useRef<PhysicsInputs>({
    throttle: 0,
    brake: 0,
    impulseVelocity: 0,
    isDragging: false,
    dragVelocity: 0,
  });

  // Continuous smoothing refs
  const scrollImpulseRef = useRef<number>(0);
  const prevAngleRef = useRef<number>(0);
  const isFirstFrameRef = useRef<boolean>(true);
  const cameraPosRef = useRef<{ x: number; y: number }>({ x: -400, y: 0 });

  // Hardware-accelerated direct DOM refs (eliminates per-frame React reconciliations & GC pauses)
  const vehicleGRef = useRef<SVGGElement | null>(null);
  const bikeBRef = useRef<HTMLDivElement | null>(null);
  const particlesGRef = useRef<SVGGElement | null>(null);
  const progressTextRef = useRef<HTMLSpanElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Cached vehicle sub-nodes (queried once per vehicle mount, never per frame)
  const rearWheelElRef = useRef<Element | null>(null);
  const frontWheelElRef = useRef<Element | null>(null);
  const suspBodyElRef = useRef<Element | null>(null);
  // Last-written transform values (skip redundant DOM writes when idle)
  const lastDomRef = useRef({
    x: NaN, y: NaN, a: NaN, spin: NaN, dy: NaN, pitch: NaN,
    camX: NaN, camY: NaN, bx: NaN, by: NaN, ba: NaN,
  });

  // Braking state (only toggles on change, zero per-frame renders)
  const [isBraking, setIsBraking] = useState<boolean>(false);
  const prevIsBrakingRef = useRef<boolean>(false);
  const prevPctRef = useRef<number>(0);

  // Audio state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  // Camera viewport
  const [viewport, setViewport] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 800,
  });

  const worldRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [pathLength, setPathLength] = useState<number>(4000);

  // Tire smoke & dust particles (fixed pre-allocated pool, mutated in place)
  const particlesRef = useRef<Particle[]>(
    Array.from({ length: 24 }, () => ({
      id: 0, x: 0, y: 0, vx: 0, vy: 0, size: 0, alpha: 0, color: '',
    }))
  );
  const particleCountRef = useRef<number>(0);

  // Drag interaction tracking with low-pass velocity filtering
  const isDraggingRef = useRef<boolean>(false);
  const dragLastXRef = useRef<number>(0);
  const dragLastTimeRef = useRef<number>(0);
  const dragSmoothedVRef = useRef<number>(0);

  // Keyboard keys
  const keysHeldRef = useRef<{ [key: string]: boolean }>({});

  // ================================================
  // TEXT
  // ================================================
  const trackText = useMemo(() => {
    return Array(32).fill("let's fuckingggg goooo   ").join('');
  }, []);

  // ================================================
  // PATH: Gentle approach → Teardrop loop (crossing) → Hills & Waves
  //   → Dip → Big Crest → Wave sets → Valley → Final straight
  // (every joint keeps a +x tangent so the ride stays smooth)
  const trackPathD = useMemo(() => {
    return [
      'M 50,480',
      'C 250,480 500,480 750,480',
      'C 830,480 890,505 960,510',
      'C 1100,510 1255,460 1300,370',
      'C 1345,280 1395,210 1390,160',
      'C 1385,110 1350,50 1300,50',
      'C 1250,50 1215,110 1210,160',
      'C 1205,210 1255,280 1300,370',
      'C 1345,460 1500,510 1640,510',
      'C 1720,510 1780,480 1860,480',
      'C 1960,480 2040,360 2160,360',
      'C 2280,360 2360,480 2460,480',
      'C 2560,480 2640,410 2740,410',
      'C 2840,410 2920,480 3020,480',
      'C 3140,480 3220,440 3320,440',
      'C 3420,440 3500,480 3600,480',
      'L 4800,480',
      'C 4900,480 4960,560 5060,560',
      'C 5160,560 5220,480 5320,480',
      'C 5420,480 5480,360 5600,360',
      'C 5720,360 5780,480 5880,480',
      'C 5980,480 6030,415 6130,415',
      'C 6230,415 6280,480 6380,480',
      'C 6480,480 6530,425 6630,425',
      'C 6730,425 6780,480 6880,480',
      'C 6980,480 7060,555 7180,555',
      'C 7300,555 7380,480 7500,480',
      'L 7900,480',
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
      const d1 = Math.max(0, dist - 1.5);
      const d2 = Math.min(totalLen, dist + 1.5);
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
    sampleLetters();
    const timer = setTimeout(sampleLetters, 60);
    const timer2 = setTimeout(sampleLetters, 220);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [sampleLetters]);

  // ================================================
  // AUDIO UNLOCK & CONTROLS
  // ================================================
  const unlockAudio = useCallback(() => {
    const audio = getAudioEngine();
    const ok = audio.init();
    if (ok) {
      setIsAudioActive(true);
      setIsAudioMuted(audio.getIsMuted());
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const audio = getAudioEngine();
    const muted = audio.toggleMute();
    setIsAudioMuted(muted);
    setIsAudioActive(!muted);
  }, []);

  // Automated test hook (e.g. ?vehicle=moto)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const vParam = params.get('vehicle');
    if (vParam && ['car', 'moto', 'bikeA', 'bikeB', 'monster'].includes(vParam)) {
      setVehicle(vParam as VehicleType);
    }
  }, []);

  // Re-cache vehicle sub-nodes whenever the mounted vehicle changes
  useEffect(() => {
    const g = vehicleGRef.current;
    rearWheelElRef.current = g ? g.querySelector('.rear-wheel') : null;
    frontWheelElRef.current = g ? g.querySelector('.front-wheel') : null;
    suspBodyElRef.current = g ? g.querySelector('.susp-body') : null;
    // Force fresh writes for the new artwork
    const l = lastDomRef.current;
    l.x = l.y = l.a = l.spin = l.dy = l.pitch = NaN;
  }, [vehicle]);

  // ================================================
  // KEYBOARD & SCROLL CONTROLS
  // ================================================
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      unlockAudio();

      if (e.code === 'Space' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        getAudioEngine().triggerHorn(vehicleRef.current);
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if (
        ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'KeyD', 'KeyA', 'KeyW', 'KeyS'].includes(
          e.code
        )
      ) {
        e.preventDefault();
        keysHeldRef.current[e.code] = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (
        ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'KeyD', 'KeyA', 'KeyW', 'KeyS'].includes(
          e.code
        )
      ) {
        keysHeldRef.current[e.code] = false;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      unlockAudio();
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const clampedDelta = Math.sign(raw) * Math.min(Math.abs(raw), 75);

      // Smooth kinetic impulse buffer for fluid gliding scroll feel
      scrollImpulseRef.current += clampedDelta * 0.45;
      scrollImpulseRef.current = Math.max(-250, Math.min(320, scrollImpulseRef.current));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('wheel', onWheel);
    };
  }, [unlockAudio, handleToggleMute]);

  // ================================================
  // DRAG TO DRIVE / FLING PHYSICS
  // ================================================
  const onPointerDown = (e: React.PointerEvent) => {
    unlockAudio();
    isDraggingRef.current = true;
    dragLastXRef.current = e.clientX;
    dragLastTimeRef.current = performance.now();
    dragSmoothedVRef.current = 0;
    physicsInputsRef.current.isDragging = true;
    physicsInputsRef.current.dragVelocity = 0;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const dt = Math.max(0.001, (now - dragLastTimeRef.current) / 1000);
    const dx = e.clientX - dragLastXRef.current;

    // Convert screen drag delta to track velocity with low-pass filtering
    const rawV = (dx / dt) * 1.35;
    dragSmoothedVRef.current = dragSmoothedVRef.current * 0.55 + rawV * 0.45;
    physicsInputsRef.current.dragVelocity = dragSmoothedVRef.current;

    dragLastXRef.current = e.clientX;
    dragLastTimeRef.current = now;
  };

  const onPointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    physicsInputsRef.current.isDragging = false;
    // Release fling velocity naturally into physics momentum
    physicsInputsRef.current.impulseVelocity = dragSmoothedVRef.current * 0.55;
    dragSmoothedVRef.current = 0;
  };

  // ================================================
  // MAIN ANIMATION & GRAVITY PHYSICS LOOP (120FPS FLUID)
  // ================================================
  useEffect(() => {
    let raf: number;
    let lastTime = performance.now();
    const audioEngine = getAudioEngine();

    const loop = (time: number) => {
      const dt = Math.min(0.04, (time - lastTime) / 1000) || 0.016;
      lastTime = time;

      const path = pathRef.current;
      if (path && pathLength > 0) {
        // 1. Sample track at current distance
        const currentDist = physicsStateRef.current.distance;
        const trackSample = sampleTrack(path, currentDist, pathLength);

        // 2. Bleed scroll impulse smoothly into physics velocity with continuous momentum (~350ms duration)
        if (Math.abs(scrollImpulseRef.current) > 0.05) {
          const bleedRate = 1 - Math.exp(-6.5 * dt);
          const deltaV = scrollImpulseRef.current * bleedRate;
          scrollImpulseRef.current -= deltaV;
          physicsInputsRef.current.impulseVelocity += deltaV;
        } else {
          scrollImpulseRef.current = 0;
        }

        // 3. Digital throttle & brake inputs (zero fractional chatter)
        const keys = keysHeldRef.current;
        physicsInputsRef.current.throttle =
          keys['ArrowRight'] || keys['KeyD'] || keys['ArrowDown'] || keys['KeyW'] ? 1 : 0;
        physicsInputsRef.current.brake =
          keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowUp'] || keys['KeyS'] ? 1 : 0;

        // 4. Step physics simulation (gravity, drive, braking, drag, G-force)
        const currentConfig = VEHICLE_CONFIGS[vehicleRef.current];
        const nextPhysics = stepPhysics(
          physicsStateRef.current,
          physicsInputsRef.current,
          trackSample,
          currentConfig,
          pathLength,
          dt
        );
        physicsStateRef.current = nextPhysics;
        const L = lastDomRef.current;

        // 5. Canonical angle unwrapping (100% flush with track tangent, zero wobble)
        const rawAngle = trackSample.angleDeg;
        const diff = ((rawAngle - prevAngleRef.current + 180) % 360 + 360) % 360 - 180;
        const unwrapped = prevAngleRef.current + diff;
        prevAngleRef.current = unwrapped;

        // Render point: micro-hop lifts the whole sprite (wheels stay attached);
        // rigid bikes also carry the tiny heave; motorized bodies bob via .susp-body
        const vType = vehicleRef.current;
        const isRigidBike = vType === 'bikeA' || vType === 'bikeB';
        const ux = trackSample.tangent.y;
        const uy = -trackSample.tangent.x;
        const lift = nextPhysics.hopH + (isRigidBike ? nextPhysics.bodyH : 0);
        const renderX = trackSample.pt.x + ux * lift;
        const renderY = trackSample.pt.y + uy * lift;

        // 5. Synchronous GPU vehicle transform (cached nodes, 0.1px rounding
        // kills sub-pixel shimmer, skip-if-same avoids writes entirely when idle)
        if (vehicleGRef.current) {
          if (!rearWheelElRef.current) {
            rearWheelElRef.current = vehicleGRef.current.querySelector('.rear-wheel');
            frontWheelElRef.current = vehicleGRef.current.querySelector('.front-wheel');
            suspBodyElRef.current = vehicleGRef.current.querySelector('.susp-body');
          }
          const rx1 = Math.round(renderX * 10) / 10;
          const ry1 = Math.round(renderY * 10) / 10;
          const an1 = Math.round(unwrapped * 10) / 10;
          if (rx1 !== L.x || ry1 !== L.y || an1 !== L.a) {
            L.x = rx1;
            L.y = ry1;
            L.a = an1;
            vehicleGRef.current.setAttribute(
              'transform',
              `translate(${rx1}, ${ry1}) rotate(${an1})`
            );
          }

          // Direct wheel rotation with zero React reconciliation
          const rearWheel = rearWheelElRef.current;
          const frontWheel = frontWheelElRef.current;
          if (rearWheel && frontWheel) {
            const spin1 = Math.round(nextPhysics.wheelRot * 10) / 10;
            if (spin1 !== L.spin) {
              L.spin = spin1;
              if (vType === 'car') {
                rearWheel.setAttribute('transform', `rotate(${spin1} 72 84)`);
                frontWheel.setAttribute('transform', `rotate(${spin1} 176 84)`);
              } else if (vType === 'moto') {
                rearWheel.setAttribute('transform', `rotate(${spin1} 60 84)`);
                frontWheel.setAttribute('transform', `rotate(${spin1} 184 84)`);
              } else if (vType === 'bikeA') {
                rearWheel.setAttribute('transform', `rotate(${spin1}, 28, 82)`);
                frontWheel.setAttribute('transform', `rotate(${spin1}, 120, 82)`);
              } else if (vType === 'monster') {
                rearWheel.setAttribute('transform', `rotate(${spin1} 70 105)`);
                frontWheel.setAttribute('transform', `rotate(${spin1} 190 105)`);
              }
            }
          }

          // Sprung body heave + dive/squat pitch (wheels stay planted on the track)
          if (!isRigidBike) {
            const suspBody = suspBodyElRef.current;
            const suspCfg = SUSP_RENDER[vType];
            if (suspBody && suspCfg) {
              const dy1 = Math.round((-nextPhysics.bodyH / suspCfg.s) * 100) / 100;
              const pitch1 = Math.round(nextPhysics.suspensionPitch * 100) / 100;
              if (dy1 !== L.dy || pitch1 !== L.pitch) {
                L.dy = dy1;
                L.pitch = pitch1;
                suspBody.setAttribute(
                  'transform',
                  `translate(0 ${dy1}) rotate(${pitch1} ${suspCfg.px} ${suspCfg.py})`
                );
              }
            }
          }
        }

        if (bikeBRef.current) {
          const bbx = Math.round(renderX * 10) / 10;
          const bby = Math.round(renderY * 10) / 10;
          const bba = Math.round(unwrapped * 10) / 10;
          if (bbx !== L.bx || bby !== L.by || bba !== L.ba) {
            L.bx = bbx;
            L.by = bby;
            L.ba = bba;
            bikeBRef.current.style.transform = `translate(${bbx}px, ${bby}px) rotate(${bba}deg)`;
          }
        }

        // Only toggle braking state when it transitions (0 per-frame renders)
        if (nextPhysics.isBraking !== prevIsBrakingRef.current) {
          prevIsBrakingRef.current = nextPhysics.isBraking;
          setIsBraking(nextPhysics.isBraking);
        }

        // 6. Update audio engine with real-time physics parameters
        audioEngine.update(nextPhysics, vehicleRef.current);

        // 7. Synchronous GPU camera tracking: horizontal lock eliminates relative micro-hitching
        const tCamX = renderX - viewport.width * 0.38;
        const tCamY = (renderY - viewport.height * 0.5) * 0.5;

        let nextY = tCamY;
        if (isFirstFrameRef.current) {
          isFirstFrameRef.current = false;
          cameraPosRef.current = { x: tCamX, y: tCamY };
        } else {
          const camLerpY = 1 - Math.exp(-8.0 * dt);
          nextY = cameraPosRef.current.y + (tCamY - cameraPosRef.current.y) * camLerpY;
          cameraPosRef.current = { x: tCamX, y: nextY };
        }

        // Direct hardware-accelerated GPU transform on the world layer
        if (worldRef.current) {
          const cx1 = Math.round(-tCamX * 10) / 10;
          const cy1 = Math.round(-nextY * 10) / 10;
          if (cx1 !== L.camX || cy1 !== L.camY) {
            L.camX = cx1;
            L.camY = cy1;
            worldRef.current.style.transform = `translate3d(${cx1}px, ${cy1}px, 0)`;
          }
        }

        // 8. Progress pill direct DOM update (zero VDOM reconciliation)
        const prog = Math.min(1, Math.max(0, nextPhysics.distance / pathLength));
        const nextPct = Math.round(prog * 100);
        if (nextPct !== prevPctRef.current) {
          prevPctRef.current = nextPct;
          if (progressTextRef.current) {
            progressTextRef.current.textContent = `${nextPct}%`;
          }
          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${nextPct}%`;
          }
        }

        // 9. In-place particle pool (zero per-frame allocation: mutate live
        // particles, swap-remove the dead, spawn into free slots)
        const isMotorized = vehicleRef.current === 'car' || vehicleRef.current === 'moto' || vehicleRef.current === 'monster';
        const isHighPower =
          Math.abs(nextPhysics.velocity) > 80 &&
          (nextPhysics.throttleApplied || nextPhysics.isSkidding);

        const pool = particlesRef.current;
        let count = particleCountRef.current;
        const liveFade = nextPhysics.isSkidding ? 0.025 : 0.038;
        for (let i = 0; i < count; i++) {
          const q = pool[i];
          q.x += q.vx;
          q.y += q.vy;
          q.alpha -= isMotorized && isHighPower ? liveFade : 0.045;
          if (q.alpha <= 0) {
            count--;
            pool[i] = pool[count];
            pool[count] = q;
            i--;
          }
        }
        if (isMotorized && isHighPower && count < pool.length) {
          const rad = (unwrapped * Math.PI) / 180;
          const isSkid = nextPhysics.isSkidding;
          const q = pool[count++];
          q.x = renderX - 28 * Math.cos(rad) + (Math.random() - 0.5) * 8;
          q.y = renderY - 28 * Math.sin(rad) - 6 + (Math.random() - 0.5) * 6;
          q.vx = -Math.cos(rad) * (1.8 + Math.random() * 2.5);
          q.vy = -Math.random() * (isSkid ? 2.2 : 1.2);
          q.size = isSkid ? 3.5 + Math.random() * 4.5 : 2.2 + Math.random() * 3.5;
          q.alpha = isSkid ? 0.75 : 0.55;
          q.color = isSkid
            ? '#78716C'
            : vType === 'car' ? '#D97706' : vType === 'monster' ? '#22C55E' : '#EF4444';
        }
        particleCountRef.current = count;

        if (particlesGRef.current) {
          const circles = particlesGRef.current.children;
          for (let i = 0; i < circles.length; i++) {
            const circle = circles[i] as SVGCircleElement;
            if (i < count) {
              const p = pool[i];
              circle.setAttribute('cx', p.x.toFixed(1));
              circle.setAttribute('cy', p.y.toFixed(1));
              circle.setAttribute('r', p.size.toFixed(1));
              circle.setAttribute('fill', p.color);
              circle.setAttribute('opacity', p.alpha.toFixed(2));
            } else if (circle.getAttribute('opacity') !== '0') {
              circle.setAttribute('opacity', '0');
            }
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pathLength, viewport.width, viewport.height]);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="fixed inset-0 w-full h-full overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
      style={{ background: '#ffffff' }}
    >
      {/* ======== WORLD LAYER (Hardware accelerated, isolated layout) ======== */}
      <div
        ref={worldRef}
        className="absolute top-0 left-0 will-change-transform"
        style={{
          transform: 'translate3d(-400px, 0px, 0)',
          width: '8000px',
          height: '750px',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <svg
          className="absolute top-0 left-0 overflow-visible pointer-events-none"
          style={{ width: '8000px', height: '750px' }}
          viewBox="0 0 8000 750"
        >
          {/* Track path reference for geometry sampling */}
          <path ref={pathRef} d={trackPathD} fill="none" stroke="transparent" />

          {/* Pre-allocated high-performance particle pool (zero VDOM allocations) */}
          <g ref={particlesGRef} className="particles-layer pointer-events-none">
            {Array.from({ length: 24 }, (_, i) => (
              <circle key={i} cx="0" cy="0" r="0" fill="transparent" opacity="0" />
            ))}
          </g>

          {/* Memoized letters along the track */}
          <TrackLetters letters={letters} />

          {/* ---- CAR (Vintage yellow car) ---- */}
          {vehicle === 'car' && (
            <g
              ref={vehicleGRef}
              transform="translate(50, 480) rotate(0)"
              style={{ transformOrigin: '0px 0px' }}
              className="pointer-events-none"
            >
              <g transform="translate(-65, -60) scale(0.52)">
                <Car
                  width={240}
                  height={110}
                  headlightsOn={true}
                  isBraking={isBraking}
                />
              </g>
            </g>
          )}

          {/* ---- MOTORBIKE (Red sport bike) ---- */}
          {vehicle === 'moto' && (
            <g
              ref={vehicleGRef}
              transform="translate(50, 480) rotate(0)"
              style={{ transformOrigin: '0px 0px' }}
              className="pointer-events-none"
            >
              <g transform="translate(-65, -60) scale(0.52)">
                <Motorbike
                  width={240}
                  height={110}
                  headlightsOn={true}
                  isBraking={isBraking}
                />
              </g>
            </g>
          )}

          {/* ---- CYCLE A (Memoized 2D Vector Bike & Articulated Rider) ---- */}
          {vehicle === 'bikeA' && (
            <g
              ref={vehicleGRef}
              transform="translate(50, 480) rotate(0)"
              style={{ transformOrigin: '0px 0px' }}
              className="pointer-events-none"
            >
              <CycleA wheelRot={0} />
            </g>
          )}

          {/* ---- MONSTER TRUCK ---- */}
          {vehicle === 'monster' && (
            <g
              ref={vehicleGRef}
              transform="translate(50, 480) rotate(0)"
              style={{ transformOrigin: '0px 0px' }}
              className="pointer-events-none"
            >
              <g transform="translate(-110, -118) scale(0.85)">
                <MonsterTruck
                  width={260}
                  height={140}
                  headlightsOn={true}
                  isBraking={isBraking}
                />
              </g>
            </g>
          )}
        </svg>

        {/* ---- CYCLE B (Three.js 3D Road Bike & Cyclist) ---- */}
        {vehicle === 'bikeB' && (
          <div
            ref={bikeBRef}
            className="absolute pointer-events-none select-none overflow-visible"
            style={{
              left: 0,
              top: 0,
              transform: 'translate(50px, 480px) rotate(0deg)',
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
          >
            <div style={{ transform: 'translate(-65px, -91px)' }}>
              <ThreeBike wheelRot={0} width={130} height={100} />
            </div>
          </div>
        )}
      </div>

      {/* ======== MINIMAL UI OVERLAY ======== */}

      {/* Progress bar & sound toggle — top right */}
      <div className="fixed top-5 right-5 z-40 flex items-center gap-2">
        <button
          onClick={handleToggleMute}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 shadow-sm cursor-pointer transition-all active:scale-95"
          title="Toggle Sound (M)"
        >
          <span className="text-xs">{!isAudioMuted && isAudioActive ? '🔊' : '🔇'}</span>
        </button>

        <div className="flex items-center gap-2 bg-white border border-neutral-200 px-3 py-1.5 rounded-full text-neutral-500 text-[11px] font-medium shadow-sm">
          <div className="w-16 h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="h-full bg-neutral-900 rounded-full"
              style={{ width: '0%' }}
            />
          </div>
          <span
            ref={progressTextRef}
            className="text-neutral-900 font-semibold text-[10px] tabular-nums"
          >
            0%
          </span>
        </div>
      </div>

      {/* Toggle + instruction — bottom center */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
        <div className="flex items-center bg-white border border-neutral-200 rounded-full shadow-sm p-0.5 whitespace-nowrap">
          <button
            onClick={() => {
              setVehicle('car');
              unlockAudio();
            }}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-all rounded-full cursor-pointer whitespace-nowrap ${
              vehicle === 'car'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            🚗 Car
          </button>
          <button
            onClick={() => {
              setVehicle('moto');
              unlockAudio();
            }}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-all rounded-full cursor-pointer whitespace-nowrap ${
              vehicle === 'moto'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            🏍️ Moto
          </button>
          <button
            onClick={() => {
              setVehicle('bikeA');
              unlockAudio();
            }}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-all rounded-full cursor-pointer whitespace-nowrap ${
              vehicle === 'bikeA'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            🚲 Cycle A
          </button>
          <button
            onClick={() => {
              setVehicle('monster');
              unlockAudio();
            }}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-all rounded-full cursor-pointer whitespace-nowrap ${
              vehicle === 'monster'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            🛻 Monster
          </button>
          <button
            onClick={() => {
              setVehicle('bikeB');
              unlockAudio();
            }}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-all rounded-full cursor-pointer whitespace-nowrap ${
              vehicle === 'bikeB'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            🚴 Cycle B (3D)
          </button>
        </div>

        <div className="flex items-center gap-2.5 bg-white border border-neutral-200 px-4 py-2 rounded-full text-neutral-400 text-[11px] font-medium shadow-sm whitespace-nowrap">
          <span>scroll · drag · arrow keys</span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}
