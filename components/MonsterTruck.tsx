import React from 'react';

export interface MonsterTruckProps {
  wheelRotation?: number;
  width?: number;
  height?: number;
  className?: string;
  headlightsOn?: boolean;
  isBraking?: boolean;
}

/**
 * Highly detailed monster truck, matching the Car/Motorbike component contract.
 * - Big knobby tires with tread blocks, beadlock rims, 6-spoke hubs
 * - Lifted 4x4 chassis: frame rails, axles, leaf springs, coilover shocks
 * - Pickup cab + bed with roll bar, flames, roof lights, exhaust stacks
 * - Driver silhouette, chrome bumpers, bull bar, headlights + brake lamps
 *
 * Wheel centers: rear (70, 105), front (190, 105). Outer tire radius 28.
 */
export const MonsterTruck: React.FC<MonsterTruckProps> = React.memo(({
  wheelRotation = 0,
  width = 260,
  height = 140,
  className = '',
  headlightsOn = true,
  isBraking = false,
}) => {
  const treadAngles = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5];
  const spokeAngles = [0, 60, 120, 180, 240, 300];
  const boltAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  const renderWheel = (cx: number, cls: 'rear-wheel' | 'front-wheel', keyPrefix: string) => (
    <g className={cls} transform={`rotate(${wheelRotation} ${cx} 105)`}>
      {/* Outer knobby tire */}
      <circle cx={cx} cy={105} r={28} fill="#111827" stroke="#020617" strokeWidth={2} />
      {/* Knobby tread blocks */}
      {treadAngles.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const tx = cx + 26.5 * Math.cos(rad);
        const ty = 105 + 26.5 * Math.sin(rad);
        return (
          <rect
            key={`${keyPrefix}-tread-${deg}`}
            x={tx - 4}
            y={ty - 2.5}
            width={8}
            height={5}
            rx={1}
            fill="#1F2937"
            stroke="#030712"
            strokeWidth={0.5}
            transform={`rotate(${deg} ${tx} ${ty})`}
          />
        );
      })}
      {/* Sidewall rings */}
      <circle cx={cx} cy={105} r={22.5} fill="none" stroke="#374151" strokeWidth={1} />
      <circle cx={cx} cy={105} r={19.5} fill="none" stroke="#1E293B" strokeWidth={0.8} />
      {/* Sidewall lettering dots */}
      {[30, 150, 210, 330].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <circle
            key={`${keyPrefix}-sw-${deg}`}
            cx={cx + 21 * Math.cos(rad)}
            cy={105 + 21 * Math.sin(rad)}
            r={0.9}
            fill="#4B5563"
          />
        );
      })}
      {/* Beadlock rim outer */}
      <circle cx={cx} cy={105} r={15} fill="url(#mtChrome)" stroke="#0F172A" strokeWidth={1} />
      {/* Rim well */}
      <circle cx={cx} cy={105} r={12} fill="#0B1220" />
      {/* 6 chunky spokes */}
      {spokeAngles.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={`${keyPrefix}-spoke-${deg}`}
            x1={cx}
            y1={105}
            x2={cx + 11 * Math.cos(rad)}
            y2={105 + 11 * Math.sin(rad)}
            stroke="url(#mtChrome)"
            strokeWidth={4.5}
            strokeLinecap="round"
          />
        );
      })}
      {/* Beadlock bolts */}
      {boltAngles.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <circle
            key={`${keyPrefix}-bolt-${deg}`}
            cx={cx + 13.5 * Math.cos(rad)}
            cy={105 + 13.5 * Math.sin(rad)}
            r={1.1}
            fill="#0F172A"
            stroke="#94A3B8"
            strokeWidth={0.4}
          />
        );
      })}
      {/* Hub */}
      <circle cx={cx} cy={105} r={4.5} fill="url(#mtChrome)" stroke="#0F172A" strokeWidth={0.8} />
      <circle cx={cx} cy={105} r={2} fill="#DC2626" />
    </g>
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 260 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none overflow-visible ${className}`}
      aria-label="Monster Truck"
    >
      <defs>
        <linearGradient id="mtBody" x1="130" y1="20" x2="130" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="30%" stopColor="#22C55E" />
          <stop offset="70%" stopColor="#15803D" />
          <stop offset="100%" stopColor="#052E16" />
        </linearGradient>
        <linearGradient id="mtFlame" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="55%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="mtChrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="mtGlass" x1="130" y1="28" x2="130" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id="mtBeam" x1="232" y1="60" x2="330" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FEF9C3" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="mtBrakeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#DC2626" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#991B1B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Headlight beam */}
      {headlightsOn && (
        <polygon points="238,62 330,44 330,86 238,72" fill="url(#mtBeam)" opacity="0.55" className="pointer-events-none" />
      )}

      {/* Ground shadow */}
      <ellipse cx="130" cy="136" rx="95" ry="5" fill="#000" opacity="0.14" />

      {/* ============ LIFTED CHASSIS (unsprung: axles, springs, shocks stay planted) ============ */}
      <g>
        {/* Axles */}
        <rect x="58" y="96" width="24" height="7" rx="2" fill="#374151" stroke="#0B1220" strokeWidth="0.7" />
        <rect x="178" y="96" width="24" height="7" rx="2" fill="#374151" stroke="#0B1220" strokeWidth="0.7" />
        {/* Differentials */}
        <circle cx="70" cy="99.5" r="5" fill="#4B5563" stroke="#0B1220" strokeWidth="0.7" />
        <circle cx="190" cy="99.5" r="5" fill="#4B5563" stroke="#0B1220" strokeWidth="0.7" />
        {/* Driveshaft */}
        <line x1="70" y1="99" x2="190" y2="99" stroke="#6B7280" strokeWidth="2.5" />
        {/* Leaf springs */}
        <path d="M 52,92 Q 70,98 88,92" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
        <path d="M 172,92 Q 190,98 208,92" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
        {/* Coilover shocks (red body, chrome rod) */}
        <line x1="88" y1="86" x2="78" y2="100" stroke="url(#mtChrome)" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="82" y="86" width="7" height="9" rx="2" fill="#DC2626" stroke="#7F1D1D" strokeWidth="0.6" transform="rotate(18 85 90)" />
        <line x1="172" y1="86" x2="182" y2="100" stroke="url(#mtChrome)" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="171" y="86" width="7" height="9" rx="2" fill="#2563EB" stroke="#1E3A8A" strokeWidth="0.6" transform="rotate(-18 174 90)" />
        {/* Mud flaps */}
        <rect x="96" y="88" width="7" height="16" rx="1.5" fill="#111827" />
        <rect x="157" y="88" width="7" height="16" rx="1.5" fill="#111827" />
      </g>

      {/* ============ BODY (sprung mass, moves on suspension) ============ */}
      <g className="susp-body">
        {/* Frame rails (body-mounted: shell + frame stay attached as one unit) */}
        <rect x="55" y="82" width="150" height="7" rx="2" fill="#1F2937" stroke="#020617" strokeWidth="0.8" />
        {/* Bed + cab main shell */}
        <path
          d="M 38 78 L 40 52 L 78 50 L 92 30 L 150 28 L 168 50 L 224 52 L 228 78 L 222 82 L 36 82 Z"
          fill="url(#mtBody)"
          stroke="#052E16"
          strokeWidth="1.2"
        />
        {/* Hood scoop */}
        <path d="M 176,50 L 196,38 L 214,38 L 220,50 Z" fill="#052E16" stroke="#020617" strokeWidth="0.8" />
        <rect x="188" y="40" width="18" height="4" rx="1" fill="#111827" />
        {/* Flame decals along lower body */}
        <path
          d="M 40,72 C 60,60 70,74 90,64 C 104,58 112,70 130,62 C 148,54 158,70 178,62 C 198,54 210,70 226,64 L 226,76 L 40,76 Z"
          fill="url(#mtFlame)"
          opacity="0.95"
          stroke="#7C2D12"
          strokeWidth="0.6"
        />
        {/* Door shut line + handle */}
        <path d="M 138,52 L 136,80" stroke="#052E16" strokeWidth="1" opacity="0.8" />
        <rect x="142" y="58" width="12" height="3.5" rx="1.7" fill="url(#mtChrome)" stroke="#052E16" strokeWidth="0.5" />
        {/* Racing number roundel */}
        <circle cx="112" cy="64" r="9" fill="#fff" stroke="#052E16" strokeWidth="1" />
        <text x="112" y="67.5" textAnchor="middle" fontSize="10" fontWeight="900" fill="#15803D" fontFamily="Arial,sans-serif">69</text>
        {/* Side exhaust stack */}
        <rect x="214" y="30" width="7" height="34" rx="2" fill="url(#mtChrome)" stroke="#0F172A" strokeWidth="0.7" />
        <ellipse cx="217.5" cy="30" rx="3.5" ry="1.8" fill="#020617" />
        {/* Windshield + side glass */}
        <path d="M 96,34 L 106,52 L 164,52 L 148,32 Z" fill="url(#mtGlass)" />
        <polygon points="110,36 102,51 108,51 116,36" fill="#fff" opacity="0.25" />
        {/* Driver */}
        <circle cx="132" cy="42" r="5" fill="#0F172A" />
        <path d="M 124,54 C 124,47 128,44 132,44 C 136,44 140,47 140,54 Z" fill="#0F172A" />
        <ellipse cx="145" cy="48" rx="3" ry="6" fill="none" stroke="#64748B" strokeWidth="1.4" />
        {/* Roll bar in bed */}
        <path d="M 52,50 L 56,32 L 76,32 L 80,50" fill="none" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
        <line x1="54" y1="41" x2="78" y2="41" stroke="#111827" strokeWidth="3" />
        {/* Roof light bar */}
        <rect x="112" y="22" width="44" height="7" rx="2" fill="#111827" stroke="#020617" strokeWidth="0.7" />
        {[118, 128, 138, 148].map((x) => (
          <circle key={`roof-${x}`} cx={x} cy={25.5} r="2.6" fill="#FEF08A" stroke="#B45309" strokeWidth="0.6" />
        ))}
        {/* Antenna + flag */}
        <line x1="44" y1="50" x2="38" y2="22" stroke="#475569" strokeWidth="1.2" />
        <polygon points="38,22 52,25 38,29" fill="#DC2626" />
        {/* Bull bar */}
        <path d="M 226,56 L 238,56 L 236,80 L 224,80" fill="none" stroke="url(#mtChrome)" strokeWidth="3" strokeLinecap="round" />
        {/* Front grille + headlights */}
        <rect x="224" y="60" width="6" height="12" rx="1.5" fill="#0F172A" stroke="#020617" strokeWidth="0.6" />
        <ellipse cx="227" cy="58" rx="3.4" ry="2.8" fill="#FFFBEB" stroke="#052E16" strokeWidth="0.7" />
        <circle cx="227" cy="58" r="1.4" fill="#FDE047" />
        {/* Front bumper */}
        <rect x="220" y="76" width="22" height="6" rx="2" fill="url(#mtChrome)" stroke="#0F172A" strokeWidth="0.8" />
        {/* Rear bumper + tailgate */}
        <rect x="30" y="76" width="14" height="6" rx="2" fill="url(#mtChrome)" stroke="#0F172A" strokeWidth="0.8" />
        {isBraking && <ellipse cx="33" cy="70" rx="12" ry="9" fill="url(#mtBrakeGlow)" />}
        <rect x="30" y="64" width="7" height="10" rx="1.5" fill={isBraking ? '#FF2222' : '#7F1D1D'} stroke="#450A0A" strokeWidth="0.6" />
        {/* Fender flares */}
        <path d="M 40,82 A 32 32 0 0 1 100,82" fill="none" stroke="#052E16" strokeWidth="3" />
        <path d="M 160,82 A 32 32 0 0 1 220,82" fill="none" stroke="#052E16" strokeWidth="3" />
      </g>

      {/* ============ WHEELS (rotate with velocity) ============ */}
      {renderWheel(70, 'rear-wheel', 'r')}
      {renderWheel(190, 'front-wheel', 'f')}
    </svg>
  );
});
