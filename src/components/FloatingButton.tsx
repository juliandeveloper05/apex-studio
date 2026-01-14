/**
 * APEX Photo Studio - Floating Action Button
 * 
 * Premium floating button with:
 * - Gradient background with dynamic glow
 * - Hover scale animation
 * - Contextual tooltip
 * - Pulse ring effect
 */

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface FloatingButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  color?: string;
  position: {
    bottom?: string;
    right?: string;
    top?: string;
    left?: string;
  };
}

export function FloatingButton({ 
  icon: Icon, 
  label, 
  onClick, 
  color = "#0ea5e9", 
  position 
}: FloatingButtonProps) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="absolute z-20 group"
      style={position}
    >
      {/* Main button */}
      <div 
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          hovered ? 'scale-110' : 'scale-100'
        }`}
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          boxShadow: hovered 
            ? `0 0 40px ${color}aa, 0 10px 30px rgba(0,0,0,0.5)` 
            : `0 0 20px ${color}66, 0 5px 15px rgba(0,0,0,0.3)`,
        }}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      
      {/* Tooltip */}
      {hovered && (
        <div 
          className="absolute left-[-120px] top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-semibold text-white animate-fade-in"
          style={{
            background: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {label}
        </div>
      )}
      
      {/* Pulse ring effect */}
      <div 
        className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
          hovered ? 'animate-pulse-ring opacity-100' : 'opacity-0'
        }`}
        style={{
          border: `2px solid ${color}`,
        }}
      />
    </button>
  );
}

export default FloatingButton;
