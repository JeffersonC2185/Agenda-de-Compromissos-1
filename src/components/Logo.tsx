import React from 'react';

export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Calendar Body */}
        <rect x="10" y="20" width="80" height="70" rx="10" fill="#00a650" />
        {/* Calendar Top Rings */}
        <rect x="25" y="5" width="10" height="25" rx="5" fill="#ffc20e" />
        <rect x="65" y="5" width="10" height="25" rx="5" fill="#ffc20e" />
        {/* Calendar Grid Area */}
        <rect x="20" y="45" width="60" height="35" rx="5" fill="white" />
        {/* Calendar Grid Dots/Squares */}
        <rect x="28" y="52" width="12" height="8" rx="2" fill="#ffc20e" />
        <rect x="44" y="52" width="12" height="8" rx="2" fill="#ffc20e" />
        <rect x="60" y="52" width="12" height="8" rx="2" fill="#ffc20e" />
        <rect x="28" y="65" width="12" height="8" rx="2" fill="#ffc20e" />
        <rect x="44" y="65" width="12" height="8" rx="2" fill="#ffc20e" />
        <rect x="60" y="65" width="12" height="8" rx="2" fill="#ffc20e" />
      </svg>
      <span className="font-bold text-xl tracking-tight flex">
        <span style={{ color: '#ffc20e' }}>S</span>
        <span style={{ color: '#00a650' }}>eg</span>
        <span style={{ color: '#ffc20e' }}>A</span>
        <span style={{ color: '#00a650' }}>genda</span>
      </span>
    </div>
  );
}
