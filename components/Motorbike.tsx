import React from 'react';
export interface MotorbikeProps { wheelRotation?: number; width?: number; height?: number; className?: string; headlightsOn?: boolean; isBraking?: boolean; }
export const Motorbike: React.FC<MotorbikeProps> = ({ wheelRotation = 0, width = 240, height = 110, className = '', headlightsOn = true, isBraking = false }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 240 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={`select-none overflow-visible ${className}`} aria-label="Sport Motorbike">
      <defs>
        <linearGradient id="mbFair" x1="90" y1="30" x2="160" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCA5A5" /><stop offset="25%" stopColor="#EF4444" /><stop offset="60%" stopColor="#991B1B" /><stop offset="100%" stopColor="#450A0A" />
        </linearGradient>
        <linearGradient id="mbChrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" /><stop offset="50%" stopColor="#94A3B8" /><stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="mbBeam" x1="205" y1="55" x2="285" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.8" /><stop offset="100%" stopColor="#FEF9C3" stopOpacity="0" />
        </linearGradient>
      </defs>
      {headlightsOn && <polygon points="208,52 285,38 285,72 208,60" fill="url(#mbBeam)" opacity="0.55" />}
      <ellipse cx="122" cy="104" rx="78" ry="4.5" fill="#000" opacity="0.14" />
      <g transform={`rotate(${wheelRotation} 60 84)`}>
        <circle cx="60" cy="84" r="19" fill="#111827" stroke="#020617" strokeWidth="1.4" />
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((d) => (
          <line key={`rt${d}`} x1={60+15.5*Math.cos(d*Math.PI/180)} y1={84+15.5*Math.sin(d*Math.PI/180)} x2={60+18.6*Math.cos(d*Math.PI/180)} y2={84+18.6*Math.sin(d*Math.PI/180)} stroke="#334155" strokeWidth="1.6" />
        ))}
        <circle cx="60" cy="84" r="9" fill="#9CA3AF" stroke="#1F2937" strokeWidth="0.8" />
        {[0,72,144,216,288].map((d) => (
          <g key={`rs${d}`} transform={`rotate(${d} 60 84)`}><polygon points="60,84 57.5,74 62.5,74" fill="url(#mbChrome)" stroke="#334155" strokeWidth="0.4" /></g>
        ))}
        <circle cx="60" cy="84" r="3.6" fill="url(#mbChrome)" stroke="#0F172A" strokeWidth="0.8" />
      </g>
      <g transform={`rotate(${wheelRotation} 184 84)`}>
        <circle cx="184" cy="84" r="19" fill="#111827" stroke="#020617" strokeWidth="1.4" />
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((d) => (
          <line key={`ft${d}`} x1={184+15.5*Math.cos(d*Math.PI/180)} y1={84+15.5*Math.sin(d*Math.PI/180)} x2={184+18.6*Math.cos(d*Math.PI/180)} y2={84+18.6*Math.sin(d*Math.PI/180)} stroke="#334155" strokeWidth="1.6" />
        ))}
        <circle cx="184" cy="84" r="10.5" fill="none" stroke="#9CA3AF" strokeWidth="2.2" />
        {[0,72,144,216,288].map((d) => (
          <g key={`fs${d}`} transform={`rotate(${d} 184 84)`}><polygon points="184,84 181.5,74 186.5,74" fill="url(#mbChrome)" stroke="#334155" strokeWidth="0.4" /></g>
        ))}
        <circle cx="184" cy="84" r="3.6" fill="url(#mbChrome)" stroke="#0F172A" strokeWidth="0.8" />
      </g>
      <rect x="192" y="74" width="6" height="5" rx="1.2" fill="#B91C1C" />
      <polygon points="60,84 108,74 108,80 60,88" fill="#1F2937" stroke="#0B1220" strokeWidth="0.8" />
      <line x1="60" y1="86.5" x2="112" y2="77" stroke="#52525B" strokeWidth="1.4" strokeDasharray="3 1.5" />
      <polygon points="102,78 48,84 48,92 102,86" fill="url(#mbChrome)" stroke="#0F172A" strokeWidth="0.8" />
      <ellipse cx="48" cy="88" rx="3" ry="4.2" fill="#020617" />
      <rect x="108" y="68" width="32" height="18" rx="3" fill="#27272A" stroke="#0A0A0A" strokeWidth="0.9" />
      <polygon points="112,68 148,52 152,56 116,72" fill="#18181B" />
      <path d="M 108,60 C 118,48 138,44 152,50 C 158,52 160,57 156,60 C 144,66 120,68 108,60 Z" fill="url(#mbFair)" stroke="#450A0A" strokeWidth="0.9" />
      <path d="M 116,52 C 126,48 142,47 151,51" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
      <path d="M 78,54 L 110,56 L 106,64 L 76,62 Z" fill="#18181B" stroke="#09090B" strokeWidth="0.8" />
      <path d="M 52,52 L 80,50 L 84,58 L 54,60 Z" fill="url(#mbFair)" stroke="#450A0A" strokeWidth="0.9" />
      <rect x="50" y="56" width="6" height="3" rx="1" fill={isBraking ? '#FF2222' : '#7F1D1D'} />
      {isBraking && <ellipse cx="53" cy="57.5" rx="10" ry="7" fill="#EF4444" opacity="0.35" />}
      <path d="M 148,48 C 165,46 188,48 202,55 C 206,57 207,60 203,62 C 190,68 168,70 150,64 C 144,58 144,52 148,48 Z" fill="url(#mbFair)" stroke="#450A0A" strokeWidth="1" />
      <path d="M 160,50 C 175,49 192,52 200,56" fill="none" stroke="#FECACA" strokeWidth="1.4" opacity="0.8" strokeLinecap="round" />
      <path d="M 162,48 C 170,36 182,32 190,34 C 188,40 180,46 168,50 Z" fill="#0F172A" stroke="#334155" strokeWidth="0.7" />
      <ellipse cx="203" cy="58" rx="4.5" ry="3.2" fill="#FFFBEB" stroke="#450A0A" strokeWidth="0.8" />
      <circle cx="203" cy="58" r="2" fill="#FDE047" />
      <path d="M 172,68 C 178,66 190,66 196,70 L 194,74 L 174,73 Z" fill="#B91C1C" stroke="#450A0A" strokeWidth="0.7" />
      <line x1="172" y1="44" x2="178" y2="36" stroke="#18181B" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="180" cy="34" rx="4.5" ry="2.5" fill="#18181B" />
      <line x1="176" y1="52" x2="186" y2="82" stroke="url(#mbChrome)" strokeWidth="3.2" strokeLinecap="round" />
      <line x1="170" y1="54" x2="180" y2="83" stroke="#27272A" strokeWidth="3.2" strokeLinecap="round" />
      <polygon points="108,62 118,62 122,74 112,76" fill="#0F172A" stroke="#020617" strokeWidth="0.6" />
      <polygon points="110,74 122,74 124,78 110,78" fill="#09090B" />
      <polygon points="118,52 142,52 130,64 112,62" fill="#1E293B" stroke="#020617" strokeWidth="0.7" />
      <path d="M 120,50 C 132,42 148,36 162,38 C 166,39 167,42 164,45 C 152,52 134,58 122,56 C 118,54 117,52 120,50 Z" fill="#0F172A" stroke="#020617" strokeWidth="0.8" />
      <ellipse cx="122" cy="44" rx="7" ry="5" fill="#18181B" stroke="#09090B" strokeWidth="0.7" />
      <polygon points="158,40 172,50 168,54 154,44" fill="#1E293B" stroke="#020617" strokeWidth="0.6" />
      <circle cx="173" cy="52" r="2.6" fill="#09090B" />
      <circle cx="152" cy="30" r="11" fill="#B91C1C" stroke="#450A0A" strokeWidth="1" />
      <circle cx="148" cy="26" r="3" fill="#fff" opacity="0.5" />
      <path d="M 154,26 L 164,28 L 162,33 L 153,31 Z" fill="#0F172A" stroke="#E0F2FE" strokeWidth="0.7" />
      <circle cx="138" cy="60" r="5.5" fill="#fff" stroke="#450A0A" strokeWidth="0.6" />
      <text x="138" y="62.2" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#B91C1C" fontFamily="Arial,sans-serif">46</text>
    </svg>
  );
};
