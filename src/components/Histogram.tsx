/**
 * APEX Photo Studio - Premium Histogram Component
 * 
 * Real-time RGB histogram visualization with:
 * - Individual R, G, B channel display
 * - Glassmorphism container
 * - Animated clipping indicators
 */

import { useEffect, useRef } from 'react';
import { useImageStore } from '@/hooks/useImageStore';
import { calculateHistogramFast, renderHistogram } from '@/engine/histogram';
import { AlertTriangle } from 'lucide-react';

interface HistogramProps {
  className?: string;
}

export function Histogram({ className = '' }: HistogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { image, histogram, setHistogram } = useImageStore();
  
  // Calculate histogram when processed image changes
  useEffect(() => {
    if (!image.processed) {
      setHistogram(null as unknown as ReturnType<typeof calculateHistogramFast>);
      return;
    }
    
    const data = calculateHistogramFast(image.processed, 2);
    setHistogram(data);
  }, [image.processed, setHistogram]);
  
  // Render histogram to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !histogram) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    renderHistogram(ctx, histogram, rect.width, rect.height, {
      showRed: true,
      showGreen: true,
      showBlue: true,
      showLuminance: false,
    });
  }, [histogram]);
  
  const hasClipping = histogram && (
    histogram.red[0] > 100 || histogram.red[255] > 100 ||
    histogram.green[0] > 100 || histogram.green[255] > 100 ||
    histogram.blue[0] > 100 || histogram.blue[255] > 100
  );
  
  return (
    <div className={`glass rounded-xl p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[var(--apex-text-secondary)]">Histogram</span>
        {hasClipping && (
          <div className="clipping-indicator">
            <AlertTriangle className="w-3 h-3" />
            <span>Clipping</span>
          </div>
        )}
      </div>
      
      {/* Histogram Canvas */}
      <div className="relative h-24 bg-black/40 rounded-lg overflow-hidden border border-[var(--apex-border)]">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
        
        {/* Gradient scale at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-black via-gray-500 to-white opacity-60" />
        
        {/* Corner highlights */}
        <div className="absolute top-0 left-0 w-6 h-6 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      </div>
      
      {/* Channel indicators */}
      <div className="flex justify-center gap-5 mt-3">
        <div className="flex items-center gap-1.5 group">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 group-hover:shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-shadow" />
          <span className="text-[10px] font-medium text-[var(--apex-text-dim)] group-hover:text-[var(--apex-text-muted)] transition-colors">Red</span>
        </div>
        <div className="flex items-center gap-1.5 group">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 group-hover:shadow-[0_0_8px_rgba(74,222,128,0.6)] transition-shadow" />
          <span className="text-[10px] font-medium text-[var(--apex-text-dim)] group-hover:text-[var(--apex-text-muted)] transition-colors">Green</span>
        </div>
        <div className="flex items-center gap-1.5 group">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.6)] transition-shadow" />
          <span className="text-[10px] font-medium text-[var(--apex-text-dim)] group-hover:text-[var(--apex-text-muted)] transition-colors">Blue</span>
        </div>
      </div>
    </div>
  );
}
