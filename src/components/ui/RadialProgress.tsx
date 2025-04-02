
import React from 'react';

interface RadialProgressProps {
  value: number;
  max: number;
  size?: number;
  thickness?: number;
  color?: string;
  bgColor?: string;
  className?: string;
}

export const RadialProgress: React.FC<RadialProgressProps> = ({
  value,
  max,
  size = 120,
  thickness = 10,
  color = '#3b82f6',
  bgColor = '#e5e7eb',
  className = '',
}) => {
  // Calculate percentage
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  // Calculate radius and center point
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  // Calculate the dash offset based on percentage
  const dashOffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={thickness}
          stroke={bgColor}
          fill="none"
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={thickness}
          stroke={color}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      
      {/* Text in the center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{Math.round(percentage)}%</span>
        <span className="text-xs text-muted-foreground">Concluído</span>
      </div>
    </div>
  );
};
