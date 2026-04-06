import React from 'react';
import { SimulationMode, FusedStatus } from './types';

// Beating heart with ECG pulse line — deep pink
export const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 44 40" fill="none">
    <path d="M22 36 C22 36 4 24 4 13 C4 8 8 4 13 4 C16.5 4 19.5 6 22 9 C24.5 6 27.5 4 31 4 C36 4 40 8 40 13 C40 24 22 36 22 36Z" fill="#d4ff00" opacity="0.25"/>
    <path d="M22 34 C22 34 5 23 5 13 C5 8.5 8.5 5 13 5 C16.5 5 19.5 7 22 10 C24.5 7 27.5 5 31 5 C35.5 5 39 8.5 39 13 C39 23 22 34 22 34Z" stroke="#d4ff00" strokeWidth="2" fill="none"/>
    <polyline points="8,18 13,18 16,11 19,24 22,15 25,20 28,18 36,18" stroke="#d4ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// Realistic skin galvanic sensor with lemon signal — fingertip/electrode design
export const EdaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 44 44" fill="none">
    <rect x="14" y="6" width="16" height="24" rx="8" stroke="#d4ff00" strokeWidth="2" fill="none"/>
    <rect x="18" y="10" width="8" height="12" rx="4" fill="#d4ff00" fillOpacity="0.3"/>
    <line x1="22" y1="30" x2="22" y2="36" stroke="#d4ff00" strokeWidth="2" strokeLinecap="round"/>
    <line x1="16" y1="36" x2="28" y2="36" stroke="#d4ff00" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="10" cy="20" r="3" fill="#d4ff00" fillOpacity="0.5"/>
    <circle cx="34" cy="20" r="3" fill="#d4ff00" fillOpacity="0.5"/>
    <polyline points="2,42 8,42 11,35 14,44 17,39 20,43 23,40 30,40 36,42 42,42" stroke="#d4ff00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2-2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

// Warrior Glass palette — button colors from former design, home-screen accent colors
export const MODE_DETAILS: Record<
  SimulationMode,
  { color: string; activeColor: string; textColor: string; dotColor: string; buttonColor: string; ranges: string[] }
> = {
  Resting: {
    color: 'bg-green-600/20',
    activeColor: 'bg-green-600/50',
    textColor: 'text-green-400',
    dotColor: 'bg-green-500',
    buttonColor: 'bg-[#22c55e] hover:bg-[#16a34a] text-white',
    ranges: ['EDA: 2.0–5.0 μS', 'HR: 60–72 bpm'],
  },
  Active: {
    color: 'bg-cyan-600/20',
    activeColor: 'bg-cyan-600/50',
    textColor: 'text-cyan-400',
    dotColor: 'bg-cyan-500',
    buttonColor: 'bg-[#06b6d4] hover:bg-[#0891b2] text-white',
    ranges: ['EDA: 5.0–9.0 μS', 'HR: 72–85 bpm'],
  },
  Trigger: {
    color: 'bg-red-600/20',
    activeColor: 'bg-red-600/50',
    textColor: 'text-red-400',
    dotColor: 'bg-red-500',
    buttonColor: 'bg-[#dc2626] hover:bg-[#ef4444] text-white',
    ranges: ['EDA: 10.0–15.0 μS', 'HR: 85–105 bpm'],
  },
};

export const STATUS_DETAILS: Record<
  FusedStatus,
  { color: string; textColor: string; ringColor: string; glowColor: string }
> = {
  'Stable': {
    color: 'bg-emerald-500/60',
    textColor: 'text-emerald-300',
    ringColor: 'ring-emerald-400/40',
    glowColor: 'shadow-[0_0_20px_rgba(52,211,153,0.35)]',
  },
  'Early Alert': {
    color: 'bg-amber-500/60',
    textColor: 'text-amber-300',
    ringColor: 'ring-amber-400/40',
    glowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
  },
  'Episode Likely': {
    color: 'bg-fuchsia-600/70',
    textColor: 'text-fuchsia-300',
    ringColor: 'ring-fuchsia-400/40',
    glowColor: 'shadow-[0_0_20px_rgba(192,38,211,0.4)]',
  },
};
