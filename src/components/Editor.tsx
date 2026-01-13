/**
 * APEX Photo Studio - Premium Editor Component
 * 
 * Main image editing workspace with:
 * - Image preview canvas with premium shadow
 * - Zoom and pan with custom cursors
 * - Before/after comparison
 * - Grid and zebra overlays
 * - Real-time processing
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useImageStore } from '@/hooks/useImageStore';
import { processImage } from '@/engine/imageProcessing';
import { GridOverlay } from './GridOverlay';
import { ZebraOverlay } from './ZebraOverlay';
import { ImagePlus, Upload } from 'lucide-react';

export function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  const { 
    image, setProcessedImage, 
    adjustments, 
    ui, setUIState 
  } = useImageStore();
  
  // Process image when adjustments change
  useEffect(() => {
    if (!image.original || processingRef.current) return;
    
    processingRef.current = true;
    
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      const processed = processImage(image.original!, adjustments);
      setProcessedImage(processed);
      processingRef.current = false;
    });
  }, [adjustments, image.original, setProcessedImage]);
  
  // Render processed image to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image.processed) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = image.processed.width;
    canvas.height = image.processed.height;
    
    // Draw based on comparison mode
    if (ui.comparisonMode === 'split-vertical' && image.original) {
      const splitX = Math.round(image.processed.width * ui.comparisonPosition);
      
      // Draw original on left
      ctx.putImageData(image.original, 0, 0);
      
      // Draw processed on right
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, image.processed.width - splitX, image.processed.height);
      ctx.clip();
      ctx.putImageData(image.processed, 0, 0);
      ctx.restore();
      
      // Draw split line with gradient glow
      const gradient = ctx.createLinearGradient(splitX - 2, 0, splitX + 2, 0);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.9)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(splitX - 2, 0, 4, image.processed.height);
    } else {
      ctx.putImageData(image.processed, 0, 0);
    }
    
    setDimensions({
      width: image.processed.width,
      height: image.processed.height,
    });
  }, [image.processed, image.original, ui.comparisonMode, ui.comparisonPosition]);
  
  // Handle mouse events for pan and comparison
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (ui.comparisonMode === 'split-vertical') {
      // Check if clicking near the split line
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      if (Math.abs(x - ui.comparisonPosition) < 0.05) {
        setIsDragging(true);
        return;
      }
    }
    
    // Start pan
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - ui.panOffset.x,
      y: e.clientY - ui.panOffset.y,
    };
  }, [ui.comparisonMode, ui.comparisonPosition, ui.panOffset]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    if (ui.comparisonMode === 'split-vertical') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0.1, Math.min(0.9, (e.clientX - rect.left) / rect.width));
      setUIState({ comparisonPosition: x });
    } else {
      setUIState({
        panOffset: {
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y,
        },
      });
    }
  }, [isDragging, ui.comparisonMode, setUIState]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.25, Math.min(4, ui.zoom + delta));
    setUIState({ zoom: newZoom });
  }, [ui.zoom, setUIState]);
  
  if (!image.processed) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--apex-bg-darkest)] checkerboard">
        <div className="text-center animate-fade-in-up">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl glass flex items-center justify-center">
            <ImagePlus className="w-12 h-12 text-[var(--apex-text-dim)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--apex-text-secondary)] mb-2">No image loaded</h3>
          <p className="text-sm text-[var(--apex-text-muted)] max-w-xs">
            Capture from camera or import an image to start editing
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--apex-text-dim)]">
            <Upload className="w-3 h-3" />
            <span>Drag & drop or use Import button</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-hidden bg-[var(--apex-bg-darkest)] checkerboard flex items-center justify-center relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        className="relative animate-scale-in"
        style={{
          transform: `scale(${ui.zoom}) translate(${ui.panOffset.x / ui.zoom}px, ${ui.panOffset.y / ui.zoom}px)`,
          transformOrigin: 'center center',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {/* Canvas with premium shadow */}
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full rounded-sm"
          style={{ 
            imageRendering: ui.zoom > 1 ? 'pixelated' : 'auto',
            boxShadow: '0 25px 80px -20px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255,255,255,0.1)'
          }}
        />
        
        {/* Overlays */}
        <GridOverlay width={dimensions.width} height={dimensions.height} />
        <ZebraOverlay width={dimensions.width} height={dimensions.height} />
        
        {/* Comparison mode labels */}
        {ui.comparisonMode === 'split-vertical' && (
          <>
            <div className="absolute top-3 left-3 glass px-2.5 py-1 rounded-md text-xs font-medium text-white/90">
              Before
            </div>
            <div className="absolute top-3 right-3 glass px-2.5 py-1 rounded-md text-xs font-medium text-[var(--apex-accent)]">
              After
            </div>
          </>
        )}
      </div>
      
      {/* Image info overlay */}
      <div className="absolute bottom-4 left-4 glass px-3 py-2 rounded-lg animate-fade-in-up">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono tabular-nums text-[var(--apex-text-secondary)]">
            {dimensions.width} × {dimensions.height}
          </span>
          {image.fileName && (
            <>
              <div className="w-px h-3 bg-[var(--apex-border)]" />
              <span className="text-[var(--apex-text-muted)] max-w-[200px] truncate">
                {image.fileName}
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Zoom indicator */}
      {ui.zoom !== 1 && (
        <div className="absolute bottom-4 right-4 glass px-3 py-2 rounded-lg text-xs font-mono tabular-nums text-[var(--apex-text-secondary)] animate-fade-in-up">
          {Math.round(ui.zoom * 100)}%
        </div>
      )}
    </div>
  );
}
