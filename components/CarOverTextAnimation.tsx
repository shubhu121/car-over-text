'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Car } from './Car';
import { ThreeStorefront } from './ThreeStorefront';

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

export const CarOverTextAnimation: React.FC = () => {
  // ----------------------------------------------------
  // SCROLL & PROGRESS STATE (0.0 to 1.0 along the X axis)
  // ----------------------------------------------------
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const prevAngleRef = useRef<number>(0);
  const prevDistRef = useRef<number>(0);
  const wheelRotRef = useRef<number>(0);

  // Dynamic Car state
  const [carState, setCarState] = useState<{
    x: number;
    y: number;
    angle: number;
    wheelRot: number;
    isBraking: boolean;
  }>({
    x: 30,
    y: 340,
    angle: 0,
    wheelRot: 0,
    isBraking: false,
  });

  // Viewport camera position (centers on the car)
  const [camera, setCamera] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Window dimensions for camera tracking
  const [viewport, setViewport] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 800,
  });

  // SVG Path ref and continuous path length
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState<number>(4200);

  // 3D Storefront arrival state
  const [carStoppedAtEnd, setCarStoppedAtEnd] = useState<boolean>(false);
  const [progressVal, setProgressVal] = useState<number>(0);
  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Drag-to-drive interaction state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartProgressRef = useRef<number>(0);

  // Particles (tire dust and celebration sparkles)
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef<number>(0);

  // Audio refs (engine sound synthesis on user interaction)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const audioInitializedRef = useRef<boolean>(false);

  // ----------------------------------------------------
  // CREATIVE 3D TEXT ON WHICH THE CAR TRAVELS
  // Clean, continuous commercial typography (no disjointed dots or breaks)
  // ----------------------------------------------------
  const trackStoryText = useMemo(() => {
    return (
      'WHY WAIT FOR A SALE?   ' +
      'WHY PAY FULL PRICE WHEN YOU CAN GET THE BEST DEALS EVERY SINGLE DAY?   ' +
      'UNBEATABLE PRICES   ' +
      'EXTRAORDINARY VALUE   ' +
      'TOP BRANDS   ' +
      'GENUINE PRODUCTS   ' +
      'FASTEST DELIVERY   ' +
      'WELCOME TO FLIPKART   ' +
      "INDIA'S FAVORITE SHOPPING DESTINATION   " +
      'SHOP NOW'
    );
  }, []);

  // ----------------------------------------------------
  // COMPACT & RESPONSIVE ROLLERCOASTER PATH
  // Coordinate Space: 0 0 4400 700
  // Features:
  // 1. Initial undulating gentle wave (X: 30 to 940)
  // 2. The Valley Dip & Rise (X: 940 to 1820)
  // 3. The Grand 3D Rollercoaster Loop Crest (X: 1820 to 2860) - Zero collision
  // 4. Airtime Wave Hills (X: 2860 to 3480)
  // 5. Level Runway to 3D Flipkart Storefront (X: 3480 to 4200)
  // ----------------------------------------------------
  const trackPathD = useMemo(() => {
    return [
      'M 30,340',
      'C 180,340 320,300 480,300',
      'C 640,300 780,340 940,340',
      'C 1100,340 1220,440 1380,440',
      'C 1540,440 1660,260 1820,260',
      'C 1950,260 2050,340 2160,340',
      'C 2260,340 2340,250 2400,150',
      'C 2450,60 2500,25 2560,25',
      'C 2620,25 2670,70 2720,160',
      'C 2770,250 2820,340 2920,340',
      'C 3040,340 3120,250 3220,250',
      'C 3320,250 3380,340 3480,340',
      'L 4200,340',
    ].join(' ');
  }, []);

  // ----------------------------------------------------
  // INITIALIZE AUDIO (Web Audio engine rumble)
  // ----------------------------------------------------
  const initAudio = () => {
    if (audioInitializedRef.current) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      audioCtxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;
      audioInitializedRef.current = true;
    } catch {
      // Ignore if browser restricts audio
    }
  };

  const updateSound = (velocity: number) => {
    if (!gainRef.current || !oscRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const speed = Math.abs(velocity);
    const targetGain = speed > 0.0002 ? Math.min(0.045, speed * 0.4) : 0;
    const targetFreq = 50 + Math.min(180, speed * 3200);

    gainRef.current.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.08);
    oscRef.current.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.08);
  };

  const handleRestartDrive = () => {
    initAudio();
    targetProgressRef.current = 0;
    setCarStoppedAtEnd(false);
  };

  const handleDriveToEnd = () => {
    initAudio();
    targetProgressRef.current = 0.96;
  };

  // ----------------------------------------------------
  // RESIZE LISTENER
  // ----------------------------------------------------
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ----------------------------------------------------
  // MEASURE PATH LENGTH FOR KINEMATICS
  // ----------------------------------------------------
  useEffect(() => {
    const updateLength = () => {
      if (pathRef.current) {
        const len = pathRef.current.getTotalLength();
        if (len > 0) {
          setPathLength(len);
        }
      }
    };
    updateLength();
    const timer = setTimeout(updateLength, 40);
    return () => clearTimeout(timer);
  }, [trackPathD]);

  // ----------------------------------------------------
  // X-AXIS SCROLL & WHEEL EVENT LISTENER (Small, Effortless Scroll)
  // Handles:
  // - Horizontal trackpad swipes
  // - Standard mouse wheel (mapped directly to X-axis progression with small scroll)
  // - Arrow keys (ArrowRight / ArrowLeft / A / D)
  // ----------------------------------------------------
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      initAudio();

      // Take either deltaX or deltaY so standard vertical mouse wheels drive horizontal journey seamlessly!
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      // High responsiveness makes the scroll small and effortless (a few wheel flicks traverse the track)
      const sensitivity = 0.0007;
      const next = Math.min(1, Math.max(0, targetProgressRef.current + delta * sensitivity));
      targetProgressRef.current = next;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'KeyD' || e.key === 'ArrowDown') {
        e.preventDefault();
        initAudio();
        targetProgressRef.current = Math.min(1, targetProgressRef.current + 0.035);
      } else if (e.key === 'ArrowLeft' || e.key === 'KeyA' || e.key === 'ArrowUp') {
        e.preventDefault();
        initAudio();
        targetProgressRef.current = Math.max(0, targetProgressRef.current - 0.035);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ----------------------------------------------------
  // MOUSE & TOUCH DRAG TO DRIVE (Interactive scrubbing anywhere on screen)
  // ----------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    initAudio();
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartProgressRef.current = targetProgressRef.current;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaPx = dragStartXRef.current - e.clientX;
    // Map screen drag distance to progress (small, responsive scrub)
    const progressDelta = deltaPx / (viewport.width * 0.9);
    const next = Math.min(1, Math.max(0, dragStartProgressRef.current + progressDelta));
    targetProgressRef.current = next;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // ----------------------------------------------------
  // MAIN ANIMATION & CAMERA TRACKING LOOP
  // Continuous Physics LERP with unwrapped rotation and tire particles
  // ----------------------------------------------------
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      // Smooth inertia LERP (spring feeling)
      const prevProg = currentProgressRef.current;
      currentProgressRef.current += (targetProgressRef.current - currentProgressRef.current) * 0.14;
      const newProg = currentProgressRef.current;

      const path = pathRef.current;
      if (path && pathLength > 0) {
        const dist = Math.min(pathLength, Math.max(0, newProg * pathLength));

        // Calculate distance delta for authentic wheel rotation
        const deltaDist = dist - prevDistRef.current;
        prevDistRef.current = dist;

        // Tire radius for scaled car (18 * 0.55 = 9.9px) -> circumference is 2 * PI * 9.9 = 62.2px
        wheelRotRef.current += (deltaDist / 62.2) * 360;

        // Velocity & braking detection
        const velocity = (newProg - prevProg) / (dt || 0.016);
        const isBraking = velocity < -0.0005;

        // Sample point and tangent on path
        const pt = path.getPointAtLength(dist);
        const d1 = Math.max(0, dist - 1.5);
        const d2 = Math.min(pathLength, dist + 1.5);
        const p1 = path.getPointAtLength(d1);
        const p2 = path.getPointAtLength(d2);

        let rawAngle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
        if (isNaN(rawAngle)) rawAngle = 0;

        // Continuous angle unwrapping so car smoothly traverses the 360° vertical loop
        let diff = rawAngle - (prevAngleRef.current % 360);
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        const unwrappedAngle = prevAngleRef.current + diff;
        prevAngleRef.current = unwrappedAngle;

        // Suspension pitch reaction to acceleration
        const suspensionPitch = Math.max(-5, Math.min(5, velocity * 40));
        const finalAngle = unwrappedAngle + suspensionPitch;

        setCarState({
          x: pt.x,
          y: pt.y,
          angle: finalAngle,
          wheelRot: wheelRotRef.current,
          isBraking,
        });

        // Camera Tracking:
        // Position car at ~32% from left of screen, leaving open road visible ahead
        const targetCamX = pt.x - viewport.width * 0.32;
        // Smooth vertical framing: centers gently along road contour
        const targetCamY = (pt.y - viewport.height * 0.52) * 0.48;

        setCamera((prev) => ({
          x: prev.x + (targetCamX - prev.x) * 0.16,
          y: prev.y + (targetCamY - prev.y) * 0.14,
        }));

        // Spawn exhaust/dust particles when moving fast
        if (Math.abs(velocity) > 0.001) {
          const rad = (finalAngle * Math.PI) / 180;
          // Rear wheel contact offset relative to car origin for scale 0.55:
          const rx = pt.x - 29 * Math.cos(rad);
          const ry = pt.y - 29 * Math.sin(rad) + 1;

          setParticles((prev) => {
            const next = prev
              .map((p) => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                alpha: p.alpha - 0.035,
              }))
              .filter((p) => p.alpha > 0);

            if (next.length < 24) {
              particleIdRef.current += 1;
              next.push({
                id: particleIdRef.current,
                x: rx + (Math.random() - 0.5) * 8,
                y: ry + (Math.random() - 0.5) * 4,
                vx: -Math.cos(rad) * (2 + Math.random() * 3),
                vy: -Math.random() * 1.5,
                size: 3 + Math.random() * 5,
                alpha: 0.6,
                color: '#D97706',
              });
            }
            return next;
          });
        }

        // Update synthesized audio engine sound
        updateSound(velocity);

        // Update progress val for UI state
        setProgressVal(newProg);

        // Detect when car arrives at the 3D storefront and comes to a stop
        if (newProg >= 0.93 && Math.abs(velocity) < 0.0006) {
          if (!stopTimerRef.current) {
            stopTimerRef.current = setTimeout(() => {
              setCarStoppedAtEnd(true);
            }, 350);
          }
        } else if (newProg < 0.88) {
          if (stopTimerRef.current) {
            clearTimeout(stopTimerRef.current);
            stopTimerRef.current = null;
          }
          setCarStoppedAtEnd(false);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, [pathLength, viewport.width, viewport.height]);



  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="fixed inset-0 w-full h-full overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing bg-[#FDF8F5]"
      style={{
        background: 'linear-gradient(180deg, #FBF4F0 0%, #F6E9E3 55%, #EDDCD4 100%)',
      }}
    >
      {/* ======================================================== */}
      {/* HIDDEN REFERENCE SVG PATH (For exact path sampling)       */}
      {/* ======================================================== */}
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
        <path ref={pathRef} d={trackPathD} fill="none" />
      </svg>

      {/* ======================================================== */}
      {/* 1. PARALLAX DISTANT BACKGROUND HORIZON & MOUNTAINS       */}
      {/* ======================================================== */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform will-change-transform"
        style={{
          transform: `translate3d(${-camera.x * 0.12}px, ${-camera.y * 0.08}px, 0)`,
        }}
      >
        {/* Glowing Ambient Celestial Light */}
        <div className="absolute top-[12%] left-[25%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-[#FDE68A]/30 via-[#FCA5A5]/20 to-transparent blur-3xl opacity-75" />

        {/* Far Distant Mountain Ridges */}
        <svg
          className="absolute bottom-0 w-[6000px] h-[450px] opacity-40 overflow-visible"
          viewBox="0 0 6000 450"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 450 L 0 310 Q 750 190 1500 320 T 3000 290 T 4500 320 T 6000 300 L 6000 450 Z"
            fill="#DEC9C2"
          />
          <path
            d="M 0 450 L 0 360 Q 600 290 1250 370 T 2600 340 T 4000 370 T 6000 350 L 6000 450 Z"
            fill="#CEB5AC"
            opacity="0.75"
          />
        </svg>
      </div>

      {/* ======================================================== */}
      {/* 2. MIDGROUND PARALLAX DUNES                              */}
      {/* ======================================================== */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform will-change-transform"
        style={{
          transform: `translate3d(${-camera.x * 0.3}px, ${-camera.y * 0.18}px, 0)`,
        }}
      >
        <svg
          className="absolute bottom-0 w-[5000px] h-[350px] opacity-35 overflow-visible"
          viewBox="0 0 5000 350"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 350 L 0 240 Q 450 170 1000 250 T 2100 220 T 3250 250 T 4500 220 T 5000 240 L 5000 350 Z"
            fill="#BFA399"
          />
        </svg>
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN WORLD LAYER (1:1 Tracking with Virtual Camera)   */}
      {/* ======================================================== */}
      <div
        className="absolute top-0 left-0 will-change-transform"
        style={{
          transform: `translate3d(${-camera.x}px, ${-camera.y}px, 0)`,
          width: '4400px',
          height: '750px',
        }}
      >
        {/* THREE.JS 3D STOREFRONT BUILDING (Located at end of road: X=3400, Y=-60) */}
        <div
          className="absolute"
          style={{
            left: '3400px',
            top: '-60px',
            width: '860px',
            height: '490px',
            zIndex: 15,
          }}
        >
          <ThreeStorefront onDriveAgain={handleRestartDrive} />
          {/* Welcoming Storefront Ground Shadow */}
          <div className="w-[820px] h-8 bg-black/20 rounded-full blur-md -mt-3 mx-auto" />
        </div>

        {/* MAIN SVG TRACK CANVAS */}
        <svg
          className="absolute top-0 left-0 w-[4400px] h-[750px] overflow-visible pointer-events-none"
          viewBox="0 0 4400 750"
        >
          <defs>
            {/* The underlying kinematics & text anchor path */}
            <path id="mainTrackPath" ref={pathRef} d={trackPathD} fill="none" />

            {/* 3D Letter Face Gradient (Rich Wine / Magenta from commercial) */}
            <linearGradient id="letterFaceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9D174D" />
              <stop offset="40%" stopColor="#701A75" />
              <stop offset="100%" stopColor="#4A044E" />
            </linearGradient>

            {/* 3D Extrusion Side Gradient (Deep Burgundy Shadow) */}
            <linearGradient id="extSideGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38072B" />
              <stop offset="50%" stopColor="#25051D" />
              <stop offset="100%" stopColor="#14020F" />
            </linearGradient>
          </defs>

          {/* ---------------------------------------------------- */}
          {/* THE 3D ARCHITECTURAL TEXT TRACK (The road IS the text) */}
          {/* Continuous, sleek commercial typography matching video*/}
          {/* No wire line, no random dots, solid typographic track */}
          {/* ---------------------------------------------------- */}
          <g className="text-track-3d">
            {/* 1. Deepest 3D Extrusion Shadow (Solid Deep Burgundy Foundation) */}
            <text
              className="select-none pointer-events-none uppercase"
              style={{
                fontFamily:
                  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                fontSize: '25px',
                fontWeight: 900,
                letterSpacing: '0.07em',
              }}
              dominantBaseline="hanging"
              dy="8"
              fill="#14020F"
              stroke="#14020F"
              strokeWidth="4"
              strokeLinejoin="round"
            >
              <textPath href="#mainTrackPath" startOffset="30px">
                {trackStoryText}
              </textPath>
            </text>

            {/* 2. Mid 3D Extrusion Bevel (Rich Plum / Burgundy) */}
            <text
              className="select-none pointer-events-none uppercase"
              style={{
                fontFamily:
                  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                fontSize: '25px',
                fontWeight: 900,
                letterSpacing: '0.07em',
              }}
              dominantBaseline="hanging"
              dy="4"
              fill="#4A044E"
              stroke="#25051D"
              strokeWidth="2"
              strokeLinejoin="round"
            >
              <textPath href="#mainTrackPath" startOffset="30px">
                {trackStoryText}
              </textPath>
            </text>

            {/* 3. Crisp Front Face (Vibrant Wine/Magenta Commercial Gradient) */}
            <text
              className="select-none pointer-events-none uppercase"
              style={{
                fontFamily:
                  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                fontSize: '25px',
                fontWeight: 900,
                letterSpacing: '0.07em',
              }}
              dominantBaseline="hanging"
              dy="0"
              fill="url(#letterFaceGrad)"
              stroke="#25041A"
              strokeWidth="0.6"
            >
              <textPath href="#mainTrackPath" startOffset="30px">
                {trackStoryText}
              </textPath>
            </text>
          </g>

          {/* ---------------------------------------------------- */}
          {/* TIRE DUST / SMOKE PARTICLES                          */}
          {/* ---------------------------------------------------- */}
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

          {/* ---------------------------------------------------- */}
          {/* THE CAR (Anchored tangent to curve, rolling on text)  */}
          {/* Car shadow completely removed as requested           */}
          {/* Scaled to sit naturally on the minimal text ribbon   */}
          {/* ---------------------------------------------------- */}
          <g
            transform={`translate(${carState.x}, ${carState.y}) rotate(${carState.angle})`}
            className="car-layer transition-none pointer-events-none"
            style={{ transformOrigin: '0px 0px' }}
          >
            {/* The Enhanced Car Component (scaled down for small minimal fonts) */}
            <g transform="translate(-68, -56) scale(0.55)">
              <Car
                wheelRotation={carState.wheelRot}
                width={240}
                height={110}
                headlightsOn={true}
                isBraking={carState.isBraking}
              />
            </g>
          </g>
        </svg>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MINIMAL SCROLL CONTROLS & 3D STORE NAVIGATOR PILL    */}
      {/* ---------------------------------------------------- */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {/* Minimal Scroll Progress Indicator */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/60 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full text-white text-[11px] font-medium shadow-sm">
          <span className="text-slate-400">Scroll</span>
          <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFE500] rounded-full transition-all duration-75"
              style={{ width: `${Math.round(progressVal * 100)}%` }}
            />
          </div>
          <span className="text-[#FFE500] font-bold text-[10px]">
            {Math.round(progressVal * 100)}%
          </span>
        </div>

        {progressVal < 0.9 ? (
          <button
            onClick={handleDriveToEnd}
            className="bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-white border border-white/20 text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Drive to 3D Store →</span>
          </button>
        ) : (
          <button
            onClick={() => setCarStoppedAtEnd(true)}
            className="bg-[#FFE500] hover:bg-yellow-300 text-[#024E9D] font-extrabold text-xs px-4 py-2 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>🏬 Inspect 3D Store</span>
          </button>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3D STOREFRONT INTERACTIVE SHOWROOM MODAL             */}
      {/* Activates just after the car comes to a stop at end   */}
      {/* ---------------------------------------------------- */}
      {carStoppedAtEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl h-[84vh] max-h-[720px] bg-gradient-to-b from-[#0F172A] via-[#090D16] to-[#020617] rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col">
            {/* Top Bar with Brand Badge and Controls */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/70 z-30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFE500] text-[#024E9D] font-black text-sm flex items-center justify-center shadow">
                  f
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Flipkart 3D Flagship Store</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Car Arrived
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Interact with the 3D storefront: drag to orbit, tap pedestals to inspect items
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRestartDrive}
                  className="bg-[#FFE500] hover:bg-yellow-300 text-[#024E9D] font-extrabold text-xs px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>↺ Drive Again</span>
                </button>
                <button
                  onClick={() => setCarStoppedAtEnd(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-all cursor-pointer"
                  title="Close 3D View"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Main Interactive Three.js 3D Viewport */}
            <div className="flex-1 relative w-full h-full min-h-[360px]">
              <ThreeStorefront onDriveAgain={handleRestartDrive} isOverlay={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
