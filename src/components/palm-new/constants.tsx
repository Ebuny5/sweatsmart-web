import React from 'react';
import { SimulationMode, FusedStatus } from './types';

export const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

export const EdaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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

// Warrior Glass palette — purple/pink theme to match Home & Hyper AI dashboards
export const MODE_DETAILS: Record<
  SimulationMode,
  { color: string; activeColor: string; textColor: string; dotColor: string; ranges: string[] }
> = {
  Resting: {
    // Glassmorphic emerald — calm, stable
    color: 'bg-emerald-500/20',
    activeColor: 'bg-emerald-500/40',
    textColor: 'text-emerald-300',
    dotColor: 'bg-emerald-400',
    ranges: ['EDA: 2.0–5.0 μS', 'HR: 60–72 bpm'],
  },
  Active: {
    // Glassmorphic sky — movement, arousal
    color: 'bg-sky-500/20',
    activeColor: 'bg-sky-400/40',
    textColor: 'text-sky-300',
    dotColor: 'bg-sky-300',
    ranges: ['EDA: 5.0–9.0 μS', 'HR: 72–85 bpm'],
  },
  Trigger: {
    // Glassmorphic fuchsia — sympathetic spike, alert
    color: 'bg-fuchsia-500/20',
    activeColor: 'bg-fuchsia-500/50',
    textColor: 'text-fuchsia-300',
    dotColor: 'bg-fuchsia-400',
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
