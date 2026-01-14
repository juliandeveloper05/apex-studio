/**
 * APEX Photo Studio - Stats Panel
 * 
 * Real-time status panel with glassmorphism:
 * - Status indicator (READY/IDLE)
 * - Current mode display
 * - Zoom level
 * - Slide-in animation
 */

interface StatsPanelProps {
  mode: string;
  zoom: number;
  imageLoaded: boolean;
}

export function StatsPanel({ mode, zoom, imageLoaded }: StatsPanelProps) {
  return (
    <div 
      className="absolute top-20 right-6 z-20 px-5 py-3 rounded-xl animate-slide-in"
      style={{
        background: 'rgba(10, 10, 10, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(14, 165, 233, 0.3)',
        boxShadow: '0 0 30px rgba(14, 165, 233, 0.2)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${imageLoaded ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`} />
          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Status</span>
          <span className="text-xs text-white font-semibold">{imageLoaded ? 'READY' : 'IDLE'}</span>
        </div>
        
        <div className="w-px h-5 bg-gray-700" />
        
        {/* Mode display */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Mode</span>
          <span className="text-xs font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {mode.toUpperCase()}
          </span>
        </div>
        
        {/* Zoom level */}
        {zoom && (
          <>
            <div className="w-px h-5 bg-gray-700" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Zoom</span>
              <span className="text-xs text-white font-mono">{Math.round(zoom * 100)}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StatsPanel;
