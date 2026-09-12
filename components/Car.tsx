import React from 'react';

export interface CarProps {
  wheelRotation?: number;
  width?: number;
  height?: number;
  className?: string;
  headlightsOn?: boolean;
  isBraking?: boolean;
}

/**
 * Highly detailed vintage yellow hatchback car, authentically matching the reference commercial.
 * Features:
 * - Rich multi-layer metallic yellow paint with highlights and reflections
 * - Detailed round chrome headlights with inner reflector lens, amber turn signals, and luminous light beam
 * - Static brake calipers with spinning alloy wheels, drilled rotors, and tire tread
 * - Cabin interior with tinted glass, specular highlights, driver silhouette, steering wheel
 * - Heavy-duty chrome bumpers, grille, mirrors, door handles, and antenna
 * - Responsive tail lamp with brake illumination
 */
export const Car: React.FC<CarProps> = React.memo(({
  wheelRotation = 0,
  width = 220,
  height = 100,
  className = '',
  headlightsOn = true,
  isBraking = false,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none overflow-visible ${className}`}
      aria-label="Yellow Vintage Car"
    >
      <defs>
        {/* Rich Metallic Yellow Car Body Gradient */}
        <linearGradient id="bodyMetallic" x1="120" y1="20" x2="120" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF59D" />
          <stop offset="10%" stopColor="#FDD835" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="80%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Roof Highlight Sheen */}
        <linearGradient id="roofSheen" x1="70" y1="22" x2="175" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Hood Glare */}
        <linearGradient id="hoodGlare" x1="180" y1="50" x2="220" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF9C4" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2" />
        </linearGradient>

        {/* Tinted Cabin Glass Gradient */}
        <linearGradient id="glassTint" x1="120" y1="26" x2="120" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="45%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Chrome Gradient (Bumpers, Handles, Trim) */}
        <linearGradient id="chromeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#F1F5F9" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="75%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Headlight Projector Glow */}
        <radialGradient id="headlightReflector" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FEF08A" />
          <stop offset="80%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>

        {/* Headlight Forward Projection Beam (Cast onto text) */}
        <linearGradient id="lightBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.5" />
          <stop offset="35%" stopColor="#FDE047" stopOpacity="0.3" />
          <stop offset="75%" stopColor="#FEF08A" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
        </linearGradient>

        {/* Brake Lamp Glow */}
        <radialGradient id="brakeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#DC2626" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#991B1B" stopOpacity="0" />
        </radialGradient>

        {/* Rubber Tire Gradient */}
        <radialGradient id="tireRubber" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="65%" stopColor="#1F2937" />
          <stop offset="90%" stopColor="#111827" />
          <stop offset="100%" stopColor="#030712" />
        </radialGradient>

        {/* Alloy Rim Gradient */}
        <linearGradient id="rimAlloy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Brake Disc Gradient */}
        <radialGradient id="brakeRotor" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="75%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#334155" />
        </radialGradient>
      </defs>

      {/* ======================================================== */}
      {/* 1. HEADLIGHT CONE BEAM (Projects forward onto text path) */}
      {/* ======================================================== */}
      {headlightsOn && (
        <g className="headlight-beam pointer-events-none">
          {/* Main Cone Beam */}
          <polygon
            points="224,67 380,42 410,100 220,77"
            fill="url(#lightBeam)"
            opacity="0.9"
          />
          {/* Hot Center Beam */}
          <polygon
            points="225,69 340,58 355,86 222,74"
            fill="#FEF08A"
            opacity="0.25"
          />
        </g>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN CAR CHASSIS GROUP (No car drop shadow)           */}
      {/* ======================================================== */}
      <g>
        {/* Antenna */}
        <line x1="62" y1="33" x2="48" y2="12" stroke="#475569" strokeWidth="1" strokeLinecap="round" />
        <circle cx="47.5" cy="11.5" r="1.5" fill="#DC2626" />

        {/* Underbody dark mechanical shadow */}
        <path
          d="M 24 84 L 54 84 A 19 19 0 0 1 82 84 L 160 84 A 19 19 0 0 1 188 84 L 218 84 L 216 88 L 20 88 Z"
          fill="#0F172A"
        />

        {/* Twin Exhaust Pipe & Tips (Rear) */}
        <rect x="10" y="80" width="14" height="4" rx="2" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="0.5" />
        <ellipse cx="12" cy="82" rx="1.5" ry="1.5" fill="#0F172A" />
        <rect x="10" y="84.5" width="14" height="4" rx="2" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="0.5" />
        <ellipse cx="12" cy="86.5" rx="1.5" ry="1.5" fill="#0F172A" />

        {/* ---------------------------------------------------- */}
        {/* CAR BODY PROFILE (Curved vintage European hatchback) */}
        {/* ---------------------------------------------------- */}
        <path
          d="M 18 72
             C 16 68 18 64 22 62
             L 30 61
             C 34 52 40 44 52 38
             C 66 26 82 22 108 21
             L 152 21
             C 166 21 178 25 186 33
             L 204 53
             C 212 55 220 59 224 64
             C 226 67 226 71 224 74
             L 220 80
             C 218 83 214 84 210 84
             L 190 84
             C 190 70 162 70 162 84
             L 86 84
             C 86 70 58 70 58 84
             L 26 84
             C 20 84 17 80 17 76 Z"
          fill="url(#bodyMetallic)"
          stroke="#B45309"
          strokeWidth="1.2"
        />

        {/* Roof Highlight Line */}
        <path
          d="M 68 33 C 86 23 104 21 148 21 C 160 21 170 24 178 31"
          stroke="url(#roofSheen)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Lower Body Side Reflection & Shadow */}
        <path
          d="M 30 76 L 56 76 C 60 70 84 70 88 76 L 160 76 C 164 70 188 70 192 76 L 216 76 C 218 79 216 83 210 83 L 28 83 Z"
          fill="#78350F"
          opacity="0.4"
        />

        {/* Body Horizontal Shoulder Crease Line */}
        <path
          d="M 28 62 C 60 62 165 59 222 63"
          stroke="#FEF08A"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M 28 63.5 C 60 63.5 165 60.5 222 64.5"
          stroke="#92400E"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* ---------------------------------------------------- */}
        {/* CABIN GLASS & INTERIOR                               */}
        {/* ---------------------------------------------------- */}
        {/* Main Window Cutout */}
        <path
          d="M 58 44
             C 70 30 82 25 106 24
             L 150 24
             C 162 24 172 28 178 35
             L 196 52
             L 58 52 Z"
          fill="url(#glassTint)"
        />

        {/* Interior: Driver Silhouette at Steering Wheel */}
        <g className="interior-driver" opacity="0.75">
          {/* Driver Cap / Head */}
          <circle cx="138" cy="35" r="5" fill="#0F172A" />
          <path d="M 136 34 L 145 34" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
          {/* Driver Shoulders/Body */}
          <path d="M 128 52 C 128 44 133 41 138 41 C 143 41 148 44 148 52 Z" fill="#0F172A" />
          {/* Steering Wheel Rim */}
          <ellipse cx="157" cy="45" rx="3.5" ry="7" fill="none" stroke="#64748B" strokeWidth="1.5" transform="rotate(-15 157 45)" />
          {/* Rear Headrest */}
          <rect x="88" y="34" width="7" height="9" rx="3" fill="#1E293B" />
          {/* Rearview Mirror */}
          <polygon points="172,27 178,27 177,31 171,31" fill="#94A3B8" />
        </g>

        {/* Glass Specular Glare Streaks */}
        <polygon points="86,26 74,51 83,51 97,26" fill="#FFFFFF" opacity="0.32" />
        <polygon points="126,25 116,51 123,51 135,25" fill="#FFFFFF" opacity="0.25" />
        <polygon points="164,26 152,51 158,51 172,26" fill="#FFFFFF" opacity="0.2" />

        {/* Window Pillars (A, B, C) */}
        {/* A-Pillar (Front windshield slope) */}
        <path d="M 178 35 L 184 32 L 202 51 L 195 52 Z" fill="#F59E0B" />
        {/* B-Pillar (Center post) */}
        <rect x="118" y="24" width="7.5" height="28" fill="#181D24" />
        <line x1="122" y1="24" x2="122" y2="52" stroke="#475569" strokeWidth="0.8" />
        {/* C-Pillar (Rear quarter) */}
        <polygon points="156,24 163,24 160,52 154,52" fill="#181D24" />

        {/* Chrome Window Trim Outline */}
        <path
          d="M 57 46 C 69 31 81 25 106 24 L 150 24 C 162 24 172 28 179 36 L 197 52 L 57 52 Z"
          fill="none"
          stroke="url(#chromeGrad)"
          strokeWidth="1.4"
        />

        {/* ---------------------------------------------------- */}
        {/* EXTERIOR DETAILS (Doors, Seams, Chrome Accessories)  */}
        {/* ---------------------------------------------------- */}
        {/* Front Door Shut Line */}
        <path d="M 120 52 L 118 80" stroke="#78350F" strokeWidth="1" strokeLinecap="round" opacity="0.75" />
        <path d="M 121 52 L 119 80" stroke="#FEF08A" strokeWidth="0.6" strokeLinecap="round" opacity="0.5" />

        {/* Rear Door Shut Line */}
        <path d="M 68 52 L 67 80" stroke="#78350F" strokeWidth="1" strokeLinecap="round" opacity="0.75" />

        {/* Front Fender Shut Line */}
        <path d="M 174 53 C 176 63 174 74 172 80" stroke="#78350F" strokeWidth="1" strokeLinecap="round" opacity="0.7" />

        {/* Chrome Door Handles */}
        <g className="door-handles">
          {/* Rear Handle */}
          <rect x="92" y="56" width="13" height="4" rx="2" fill="url(#chromeGrad)" stroke="#78350F" strokeWidth="0.5" />
          <circle cx="102" cy="58" r="0.8" fill="#0F172A" />
          {/* Front Handle */}
          <rect x="140" y="56" width="13" height="4" rx="2" fill="url(#chromeGrad)" stroke="#78350F" strokeWidth="0.5" />
          <circle cx="150" cy="58" r="0.8" fill="#0F172A" />
        </g>

        {/* Chrome Vintage Side Mirror */}
        <g className="side-mirror">
          <path d="M 172 52 L 169 50" stroke="url(#chromeGrad)" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="172" cy="49" rx="5" ry="3.8" fill="url(#bodyMetallic)" stroke="url(#chromeGrad)" strokeWidth="1" />
          <ellipse cx="171.5" cy="49" rx="3.5" ry="2.5" fill="#E2E8F0" />
        </g>

        {/* Chrome Windshield Wiper */}
        <line x1="184" y1="52" x2="198" y2="44" stroke="url(#chromeGrad)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="184" cy="52" r="1.2" fill="#1E293B" />

        {/* Fuel Filler Cap */}
        <circle cx="42" cy="54" r="3.5" fill="url(#chromeGrad)" stroke="#78350F" strokeWidth="0.5" />
        <circle cx="42" cy="54" r="2.2" fill="none" stroke="#94A3B8" strokeWidth="0.5" />

        {/* ---------------------------------------------------- */}
        {/* FRONT FACIA: HEADLIGHT, GRILLE & BUMPER             */}
        {/* ---------------------------------------------------- */}
        <g className="front-grille">
          <path d="M 218 69 L 222 69 C 223 72 223 75 220 78 L 216 78 Z" fill="#1E293B" stroke="#78350F" strokeWidth="0.5" />
          <line x1="218" y1="71.5" x2="222" y2="71.5" stroke="url(#chromeGrad)" strokeWidth="0.8" />
          <line x1="217" y1="74" x2="221" y2="74" stroke="url(#chromeGrad)" strokeWidth="0.8" />
          <line x1="216" y1="76.5" x2="220" y2="76.5" stroke="url(#chromeGrad)" strokeWidth="0.8" />
        </g>

        {/* Iconic Round Front Headlamp */}
        <g className="front-headlight">
          <ellipse cx="212" cy="62" rx="8" ry="7" fill="url(#chromeGrad)" stroke="#B45309" strokeWidth="0.8" />
          <ellipse cx="212" cy="62" rx="6" ry="5.2" fill="url(#headlightReflector)" />
          <circle cx="212.5" cy="61.5" r="2.5" fill="#FFFFFF" />
          <line x1="210" y1="59" x2="210" y2="65" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.8" />
          <line x1="214" y1="59" x2="214" y2="65" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.8" />
          {/* Amber Turn Signal Below Headlight */}
          <ellipse cx="221" cy="64" rx="2.5" ry="1.8" fill="#F59E0B" stroke="#D97706" strokeWidth="0.5" />
        </g>

        {/* Heavy Duty Chrome Front Bumper with Bumperette */}
        <g className="front-bumper">
          <path
            d="M 214 77 C 225 77 228 80 227 84 C 224 86 214 85 210 84 Z"
            fill="url(#chromeGrad)"
            stroke="#475569"
            strokeWidth="0.8"
          />
          <rect x="220" y="75" width="4.5" height="11" rx="1.5" fill="#1E293B" stroke="#334155" strokeWidth="0.5" />
        </g>

        {/* ---------------------------------------------------- */}
        {/* REAR FACIA: TAILLIGHT & REAR BUMPER                 */}
        {/* ---------------------------------------------------- */}
        {/* Brake Lamp Glow (Visible when braking) */}
        {isBraking && (
          <circle cx="16" cy="71" r="16" fill="url(#brakeGlow)" className="pointer-events-none" />
        )}

        {/* Classic Vintage Tail Lamp */}
        <g className="rear-taillight">
          <rect x="15" y="63" width="7" height="13" rx="2.5" fill="url(#chromeGrad)" stroke="#78350F" strokeWidth="0.5" />
          <rect x="16" y="64.5" width="5" height="4" rx="1" fill="#F59E0B" stroke="#B45309" strokeWidth="0.4" />
          <rect
            x="16"
            y="69.5"
            width="5"
            height="5.5"
            rx="1"
            fill={isBraking ? '#FF1E1E' : '#DC2626'}
            stroke="#991B1B"
            strokeWidth="0.4"
          />
          <circle cx="18.5" cy="72" r="1.5" fill={isBraking ? '#FFF' : '#FECA57'} opacity="0.9" />
        </g>

        {/* Heavy Duty Chrome Rear Bumper with Bumperette */}
        <g className="rear-bumper">
          <path
            d="M 12 78 C 8 79 7 83 11 85 C 16 86 22 84 24 82 Z"
            fill="url(#chromeGrad)"
            stroke="#475569"
            strokeWidth="0.8"
          />
          <rect x="15" y="76" width="4.5" height="11" rx="1.5" fill="#1E293B" stroke="#334155" strokeWidth="0.5" />
        </g>

        {/* Wheel Arch Moldings (Fender Lip) */}
        <path d="M 54 84 A 20 20 0 0 1 90 84" stroke="#78350F" strokeWidth="2.2" fill="none" opacity="0.9" />
        <path d="M 158 84 A 20 20 0 0 1 194 84" stroke="#78350F" strokeWidth="2.2" fill="none" opacity="0.9" />

        {/* STATIC BRAKE CALIPERS (Mounted to suspension, NOT rotating with wheel) */}
        <rect x="74" y="76" width="4" height="6.5" rx="1.2" fill="#DC2626" stroke="#991B1B" strokeWidth="0.6" />
        <rect x="178" y="76" width="4" height="6.5" rx="1.2" fill="#DC2626" stroke="#991B1B" strokeWidth="0.6" />
      </g>

      {/* ======================================================== */}
      {/* 4. ROTATING WHEELS (Synchronized with scroll / velocity) */}
      {/* Rear Wheel Center: (72, 84), Front Wheel Center: (176, 84) */}
      {/* ======================================================== */}

      {/* REAR WHEEL */}
      <g className="rear-wheel" transform={`rotate(${wheelRotation} 72 84)`}>
        {/* Rubber Tire Outer */}
        <circle cx="72" cy="84" r="18" fill="url(#tireRubber)" stroke="#030712" strokeWidth="1.2" />
        {/* Radial Tire Tread Grooves */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={`r-tread-${deg}`}
            x1={72 + 14.5 * Math.cos((deg * Math.PI) / 180)}
            y1={84 + 14.5 * Math.sin((deg * Math.PI) / 180)}
            x2={72 + 17.8 * Math.cos((deg * Math.PI) / 180)}
            y2={84 + 17.8 * Math.sin((deg * Math.PI) / 180)}
            stroke="#1E293B"
            strokeWidth="1.4"
          />
        ))}
        {/* Sidewall Groove Ring */}
        <circle cx="72" cy="84" r="14.5" fill="none" stroke="#1E293B" strokeWidth="0.8" />

        {/* Chrome Rim Lip */}
        <circle cx="72" cy="84" r="12" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="0.8" />
        {/* Deep Dish Rim Well */}
        <circle cx="72" cy="84" r="9.5" fill="#0F172A" />
        {/* Disc Brake Rotor */}
        <circle cx="72" cy="84" r="8" fill="url(#brakeRotor)" stroke="#334155" strokeWidth="0.5" />
        {/* Rotor ventilation holes */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <circle
            key={`r-hole-${deg}`}
            cx={72 + 6 * Math.cos((deg * Math.PI) / 180)}
            cy={84 + 6 * Math.sin((deg * Math.PI) / 180)}
            r="0.5"
            fill="#1E293B"
          />
        ))}

        {/* 8-Spoke Classic Alloy Wheel */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={`r-spoke-${deg}`}
            x1="72"
            y1="84"
            x2={72 + 10.5 * Math.cos((deg * Math.PI) / 180)}
            y2={84 + 10.5 * Math.sin((deg * Math.PI) / 180)}
            stroke="url(#chromeGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}

        {/* Central Chrome Hubcap & Lug Nuts */}
        <circle cx="72" cy="84" r="4.2" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="0.6" />
        <circle cx="72" cy="84" r="2" fill="#F59E0B" />
        {/* 4 Lug Nuts */}
        {[0, 90, 180, 270].map((deg) => (
          <circle
            key={`r-lug-${deg}`}
            cx={72 + 2.8 * Math.cos(((deg + 22.5) * Math.PI) / 180)}
            cy={84 + 2.8 * Math.sin(((deg + 22.5) * Math.PI) / 180)}
            r="0.8"
            fill="#1E293B"
          />
        ))}
      </g>

      {/* FRONT WHEEL */}
      <g className="front-wheel" transform={`rotate(${wheelRotation} 176 84)`}>
        {/* Rubber Tire Outer */}
        <circle cx="176" cy="84" r="18" fill="url(#tireRubber)" stroke="#030712" strokeWidth="1.2" />
        {/* Radial Tire Tread Grooves */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={`f-tread-${deg}`}
            x1={176 + 14.5 * Math.cos((deg * Math.PI) / 180)}
            y1={84 + 14.5 * Math.sin((deg * Math.PI) / 180)}
            x2={176 + 17.8 * Math.cos((deg * Math.PI) / 180)}
            y2={84 + 17.8 * Math.sin((deg * Math.PI) / 180)}
            stroke="#1E293B"
            strokeWidth="1.4"
          />
        ))}
        {/* Sidewall Groove Ring */}
        <circle cx="176" cy="84" r="14.5" fill="none" stroke="#1E293B" strokeWidth="0.8" />

        {/* Chrome Rim Lip */}
        <circle cx="176" cy="84" r="12" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="0.8" />
        {/* Deep Dish Rim Well */}
        <circle cx="176" cy="84" r="9.5" fill="#0F172A" />
        {/* Disc Brake Rotor */}
        <circle cx="176" cy="84" r="8" fill="url(#brakeRotor)" stroke="#334155" strokeWidth="0.5" />
        {/* Rotor ventilation holes */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <circle
            key={`f-hole-${deg}`}
            cx={176 + 6 * Math.cos((deg * Math.PI) / 180)}
            cy={84 + 6 * Math.sin((deg * Math.PI) / 180)}
            r="0.5"
            fill="#1E293B"
          />
        ))}

        {/* 8-Spoke Classic Alloy Wheel */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={`f-spoke-${deg}`}
            x1="176"
            y1="84"
            x2={176 + 10.5 * Math.cos((deg * Math.PI) / 180)}
            y2={84 + 10.5 * Math.sin((deg * Math.PI) / 180)}
            stroke="url(#chromeGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}

        {/* Central Chrome Hubcap & Lug Nuts */}
        <circle cx="176" cy="84" r="4.2" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="0.6" />
        <circle cx="176" cy="84" r="2" fill="#F59E0B" />
        {/* 4 Lug Nuts */}
        {[0, 90, 180, 270].map((deg) => (
          <circle
            key={`f-lug-${deg}`}
            cx={176 + 2.8 * Math.cos(((deg + 22.5) * Math.PI) / 180)}
            cy={84 + 2.8 * Math.sin(((deg + 22.5) * Math.PI) / 180)}
            r="0.8"
            fill="#1E293B"
          />
        ))}
      </g>
    </svg>
  );
});
