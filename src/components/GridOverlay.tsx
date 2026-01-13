/**
 * APEX Photo Studio - Grid Overlay Component
 * 
 * Composition guides for photography:
 * - Rule of thirds
 * - Golden ratio / spiral
 * - Diagonal lines
 * - Center cross
 */

import { useImageStore } from '@/hooks/useImageStore';

interface GridOverlayProps {
  width: number;
  height: number;
}

export function GridOverlay({ width, height }: GridOverlayProps) {
  const { ui } = useImageStore();
  
  if (ui.gridType === 'none' || width === 0 || height === 0) {
    return null;
  }
  
  const strokeColor = 'rgba(255, 255, 255, 0.5)';
  const strokeWidth = 1;
  
  const renderThirds = () => (
    <g stroke={strokeColor} strokeWidth={strokeWidth}>
      {/* Vertical lines at 1/3 and 2/3 */}
      <line x1={width / 3} y1={0} x2={width / 3} y2={height} />
      <line x1={(width * 2) / 3} y1={0} x2={(width * 2) / 3} y2={height} />
      {/* Horizontal lines at 1/3 and 2/3 */}
      <line x1={0} y1={height / 3} x2={width} y2={height / 3} />
      <line x1={0} y1={(height * 2) / 3} x2={width} y2={(height * 2) / 3} />
      {/* Intersection points */}
      <circle cx={width / 3} cy={height / 3} r={4} fill="none" />
      <circle cx={(width * 2) / 3} cy={height / 3} r={4} fill="none" />
      <circle cx={width / 3} cy={(height * 2) / 3} r={4} fill="none" />
      <circle cx={(width * 2) / 3} cy={(height * 2) / 3} r={4} fill="none" />
    </g>
  );
  
  const renderGolden = () => {
    const phi = 1.618033988749;
    const w1 = width / phi;
    const w2 = width - w1;
    const h1 = height / phi;
    const h2 = height - h1;
    
    return (
      <g stroke={strokeColor} strokeWidth={strokeWidth}>
        <line x1={w2} y1={0} x2={w2} y2={height} />
        <line x1={w1} y1={0} x2={w1} y2={height} />
        <line x1={0} y1={h2} x2={width} y2={h2} />
        <line x1={0} y1={h1} x2={width} y2={h1} />
      </g>
    );
  };
  
  const renderDiagonal = () => (
    <g stroke={strokeColor} strokeWidth={strokeWidth}>
      <line x1={0} y1={0} x2={width} y2={height} />
      <line x1={width} y1={0} x2={0} y2={height} />
    </g>
  );
  
  const renderCenter = () => (
    <g stroke={strokeColor} strokeWidth={strokeWidth}>
      <line x1={width / 2} y1={0} x2={width / 2} y2={height} />
      <line x1={0} y1={height / 2} x2={width} y2={height / 2} />
      <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.1} fill="none" />
    </g>
  );
  
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ width: '100%', height: '100%' }}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {ui.gridType === 'thirds' && renderThirds()}
      {ui.gridType === 'golden' && renderGolden()}
      {ui.gridType === 'diagonal' && renderDiagonal()}
      {ui.gridType === 'center' && renderCenter()}
    </svg>
  );
}
