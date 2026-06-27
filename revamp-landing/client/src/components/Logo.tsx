import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({ className = "", size = "md", showText = true }: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Sleek, glowing vector lock shield icon */}
      <svg
        className={`${iconSizes[size]} text-primary filter drop-shadow-[0_0_8px_rgba(255,107,0,0.3)] transition-transform duration-300 group-hover:scale-105`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield background */}
        <path
          d="M12 2L3 6v6c0 5.52 4.48 10 10 10s10-4.48 10-10V6l-9-4z"
          fill="url(#shieldGrad)"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Inner Lock Shackle */}
        <path
          d="M9 11V9c0-1.66 1.34-3 3-3s3 1.34 3 3v2"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Inner Lock Body */}
        <rect
          x="8"
          y="11"
          width="8"
          height="6"
          rx="1"
          fill="currentColor"
          stroke="#ffffff"
          strokeWidth="1"
        />
        {/* Keyhole */}
        <circle cx="12" cy="14" r="1" fill="#ffffff" />
        
        <defs>
          <linearGradient id="shieldGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={`font-sans font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary ${textSizes[size]}`}>
          TerraSept <span className="text-primary font-extrabold">Auth</span>
        </span>
      )}
    </div>
  );
}
