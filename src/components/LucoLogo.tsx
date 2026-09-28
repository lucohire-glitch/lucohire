import React from 'react';

interface LucoLogoProps {
  size?: number;
  className?: string;
}

export default function LucoLogo({ size = 32, className = '' }: LucoLogoProps) {
  const gradientId = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="LucoHire logo"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="25%"
          y1="15%"
          x2="85%"
          y2="85%"
        >
          <stop offset="0%" stopColor="#0080FF" />
          <stop offset="35%" stopColor="#1A52F5" />
          <stop offset="70%" stopColor="#5B16E6" />
          <stop offset="100%" stopColor="#6E02E6" />
        </linearGradient>
      </defs>

      {/* The main 'L' lettermark stem and bottom curve */}
      <path
        d="M36 28 C36 23.5 39.5 20 44 20 C48.5 20 52 23.5 52 28 V56 C52 58.5 53.5 60.5 56 61 C58.2 61.5 59.8 63.8 59.2 66.5 C58.5 69.5 55.5 71.5 52 71.5 H44 C39.5 71.5 36 68 36 63.5 V28 Z"
        fill={`url(#${gradientId})`}
      />

      {/* Head of the talent person figure */}
      <circle cx="56" cy="51" r="5.5" fill={`url(#${gradientId})`} />

      {/* Torso & arm swoosh at bottom right */}
      <path
        d="M51.5 60.2 C54.5 57.5 61 57.5 65.5 59.5 C68.8 61 70 64 69 67.5 C67.8 71.2 64.5 73 59.5 73 C56 73 53.8 70.8 52.8 67.5 C52 64.8 51.5 62.5 51.5 60.2 Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}
