import React from 'react';

interface IconProps {
  className?: string;
}

export const ThermometerIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 10l-2-2m0 0l-2 2m2-2v8m2-2h-4M5 12a7 7 0 1114 0c0 1.644-.22 3.224-.627 4.673a3.499 3.499 0 01-1.22 1.34L12 21l-1.153-1.026a3.499 3.499 0 01-1.22-1.34C5.22 15.224 5 13.644 5 12z"
    />
  </svg>
);

export const DropletIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 7.5l1.5-1.5m-1.5 1.5l-1.5-1.5m3 0l7.5-7.5 7.5 7.5m-15 0l7.5 7.5 7.5-7.5M6 17.25h12V21H6v-3.75z"
    />
  </svg>
);

export const SunIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

export const ZapIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 10.5L21 3m-8.5 8.5L21 21m-6.5-10.5l4-4L21 3m-8.5 8.5l4 4L21 21M4.5 12.75a7.5 7.5 0 0115 0v2.25c0 1.246-.168 2.457-.478 3.593A6.75 6.75 0 0112 21.75c-1.233 0-2.4-.148-3.522-.437A6.75 6.75 0 014.5 15v-2.25z"
    />
  </svg>
);

export const BellIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.137 5.454 1.31A3.375 3.375 0 0012 21.75c1.114 0 2.062-.713 2.574-1.756z"
    />
  </svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z"
    />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348A1.314 1.314 0 0116.023 8c0-.734.024-1.47.072-2.194a.75.75 0 00-.732-.806m-9.58 0L9.5 3.5m-5.455 0c1.109 3.012 3.86 5.539 7.962 5.539 3.065 0 5.688-1.536 7.156-3.818M11.25 10.5h4.5m-4.5 0L12 12m-2.25 1.5l2.25 2.25m-2.25-2.25L9.5 16.5m1.75-6l-1.5 1.5M10.5 16.5h4.5m-4.5 0l1.5-1.5m-2.25-1.5l2.25 2.25m-2.25-2.25L9.5 16.5m-5.455 0c1.109 3.012 3.86 5.539 7.962 5.539 3.065 0 5.688-1.536 7.156-3.818"
    />
  </svg>
);