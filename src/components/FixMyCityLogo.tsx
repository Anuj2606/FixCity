import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColorClass?: string;
}

export const FixMyCityLogo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 32, 
  showText = true,
  textColorClass = 'text-gray-900'
}) => {
  return (
    <div className={`flex items-center space-x-2.5 ${className}`} id="fixmycity-logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* 1. Outer Circle Outline (Vibrant Green) */}
        <path
          d="M 43 130 A 72 72 0 1 1 168 130"
          stroke="#10B981"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />

        {/* 2. Background Skyscrapers */}
        {/* Outer Left Building */}
        <path d="M 48 100 L 54 100 L 54 140 L 48 140 Z" fill="#3B82F6" />
        <path d="M 54 100 L 60 100 L 60 140 L 54 140 Z" fill="#1D4ED8" />
        {/* Outer Left Building Windows */}
        <rect x="50" y="106" width="1.5" height="4" fill="#FFFFFF" opacity="0.9" />
        <rect x="56" y="106" width="1.5" height="4" fill="#E0F2FE" opacity="0.9" />
        <rect x="50" y="116" width="1.5" height="4" fill="#FFFFFF" opacity="0.9" />
        <rect x="56" y="116" width="1.5" height="4" fill="#E0F2FE" opacity="0.9" />

        {/* Mid Left Building */}
        <path d="M 64 78 L 71 78 L 71 140 L 64 140 Z" fill="#3B82F6" />
        <path d="M 71 78 L 78 78 L 78 140 L 71 140 Z" fill="#1D4ED8" />
        {/* Mid Left Building Windows */}
        <rect x="66" y="86" width="2" height="5" fill="#FFFFFF" opacity="0.9" />
        <rect x="73" y="86" width="2" height="5" fill="#E0F2FE" opacity="0.9" />
        <rect x="66" y="98" width="2" height="5" fill="#FFFFFF" opacity="0.9" />
        <rect x="73" y="98" width="2" height="5" fill="#E0F2FE" opacity="0.9" />

        {/* Center Building - Left Half (Light Blue) */}
        <path
          d="M 100 35 L 100 140 L 85 140 L 85 55 L 89 55 L 89 50 L 100 40 Z"
          fill="#3B82F6"
        />
        {/* Center Building - Right Half (Dark Blue) */}
        <path
          d="M 100 35 L 100 140 L 115 140 L 115 55 L 111 55 L 111 50 L 100 40 Z"
          fill="#1D4ED8"
        />
        {/* Center Building Windows */}
        <rect x="90" y="60" width="2.5" height="6" fill="#FFFFFF" opacity="0.9" />
        <rect x="107" y="60" width="2.5" height="6" fill="#E0F2FE" opacity="0.9" />
        <rect x="90" y="74" width="2.5" height="6" fill="#FFFFFF" opacity="0.9" />
        <rect x="107" y="74" width="2.5" height="6" fill="#E0F2FE" opacity="0.9" />
        <rect x="90" y="88" width="2.5" height="6" fill="#FFFFFF" opacity="0.9" />
        <rect x="107" y="88" width="2.5" height="6" fill="#E0F2FE" opacity="0.9" />

        {/* Mid Right Building */}
        <path d="M 122 78 L 129 78 L 129 140 L 122 140 Z" fill="#3B82F6" />
        <path d="M 129 78 L 136 78 L 136 140 L 129 140 Z" fill="#1D4ED8" />
        {/* Mid Right Building Windows */}
        <rect x="124" y="86" width="2" height="5" fill="#FFFFFF" opacity="0.9" />
        <rect x="131" y="86" width="2" height="5" fill="#E0F2FE" opacity="0.9" />
        <rect x="124" y="98" width="2" height="5" fill="#FFFFFF" opacity="0.9" />
        <rect x="131" y="98" width="2" height="5" fill="#E0F2FE" opacity="0.9" />

        {/* Outer Right Building */}
        <path d="M 140 100 L 146 100 L 146 140 L 140 140 Z" fill="#3B82F6" />
        <path d="M 146 100 L 152 100 L 152 140 L 146 140 Z" fill="#1D4ED8" />
        {/* Outer Right Building Windows */}
        <rect x="142" y="106" width="1.5" height="4" fill="#FFFFFF" opacity="0.9" />
        <rect x="148" y="106" width="1.5" height="4" fill="#E0F2FE" opacity="0.9" />
        <rect x="142" y="116" width="1.5" height="4" fill="#FFFFFF" opacity="0.9" />
        <rect x="148" y="116" width="1.5" height="4" fill="#E0F2FE" opacity="0.9" />

        {/* 3. Curved Blue Horizon (Dynamic Wave) */}
        <path
          d="M 10 152 Q 100 122 190 152 Q 100 137 10 152 Z"
          fill="#1D4ED8"
        />
        <path
          d="M 10 152 Q 100 125 190 152 Q 100 134 10 152 Z"
          fill="#2563EB"
          opacity="0.8"
        />

        {/* 4. Green Leaf / Tree on the Right */}
        <rect x="163.5" y="132" width="2" height="15" fill="#047857" />
        {/* Left Half of Leaf */}
        <path
          d="M 164.5 110 C 156 122 158 134 164.5 136 Z"
          fill="#10B981"
        />
        {/* Right Half of Leaf */}
        <path
          d="M 164.5 110 C 173 122 171 134 164.5 136 Z"
          fill="#059669"
        />

        {/* 5. Green Map Pin (Middle Foreground) */}
        <path
          d="M 100 172 C 75 140 70 122 70 112 A 30 30 0 1 1 130 112 C 130 122 125 140 100 172 Z"
          fill="#10B981"
        />

        {/* 6. White Circle & Checkmark inside Map Pin */}
        <circle cx="100" cy="112" r="16" fill="#FFFFFF" />
        <path
          d="M 91 112 L 97 118 L 109 105"
          stroke="#10B981"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span className={`font-display font-black text-xl tracking-tight leading-none ${textColorClass}`}>
          FixMyCity
        </span>
      )}
    </div>
  );
};
