/**
 * APEX Photo Studio - Zebra Overlay Component
 * 
 * Visual exposure warning overlay:
 * - Red stripes for overexposed areas
 * - Blue tint for underexposed areas
 */

import { useEffect, useRef } from 'react';
import { useImageStore } from '@/hooks/useImageStore';
import { createClippingMask } from '@/engine/histogram';

interface ZebraOverlayProps {
  width: number;
  height: number;
}

export function ZebraOverlay({ width: _width, height: _height }: ZebraOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { image, ui } = useImageStore();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image.processed || !ui.showZebras) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { processed } = image;
    
    // Set canvas size to match image
    canvas.width = processed.width;
    canvas.height = processed.height;
    
    // Create clipping mask
    const mask = createClippingMask(
      processed,
      ui.zebraThreshold.high,
      ui.zebraThreshold.low
    );
    
    // Create zebra pattern
    const stripeWidth = 4;
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = stripeWidth * 2;
    patternCanvas.height = stripeWidth * 2;
    const patternCtx = patternCanvas.getContext('2d')!;
    
    // Diagonal stripes
    patternCtx.fillStyle = 'rgba(255, 0, 0, 0.6)';
    patternCtx.beginPath();
    patternCtx.moveTo(0, 0);
    patternCtx.lineTo(stripeWidth, 0);
    patternCtx.lineTo(stripeWidth * 2, stripeWidth);
    patternCtx.lineTo(stripeWidth * 2, stripeWidth * 2);
    patternCtx.lineTo(stripeWidth, stripeWidth * 2);
    patternCtx.lineTo(0, stripeWidth);
    patternCtx.closePath();
    patternCtx.fill();
    
    // Pattern created for future use in zebra stripe rendering
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw clipping overlay
    const outputData = ctx.createImageData(processed.width, processed.height);
    
    for (let i = 0; i < mask.length; i++) {
      const idx = i * 4;
      
      if (mask[i] === 1) {
        // Highlight clipping - red
        outputData.data[idx] = 255;
        outputData.data[idx + 1] = 0;
        outputData.data[idx + 2] = 0;
        outputData.data[idx + 3] = 150;
      } else if (mask[i] === 2) {
        // Shadow clipping - blue
        outputData.data[idx] = 0;
        outputData.data[idx + 1] = 100;
        outputData.data[idx + 2] = 255;
        outputData.data[idx + 3] = 150;
      }
    }
    
    ctx.putImageData(outputData, 0, 0);
  }, [image.processed, ui.showZebras, ui.zebraThreshold]);
  
  if (!ui.showZebras || !image.processed) return null;
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}
