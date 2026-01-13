/**
 * APEX Photo Studio - Main Application
 * 
 * Professional photo capture and editing application
 * with premium Lightroom-style interface
 */

import { useEffect } from 'react';
import { Camera } from '@/components/Camera';
import { Editor } from '@/components/Editor';
import { Toolbar } from '@/components/Toolbar';
import { AdjustmentsPanel } from '@/components/AdjustmentsPanel';
import { Histogram } from '@/components/Histogram';
import { useImageStore } from '@/hooks/useImageStore';
import { Keyboard } from 'lucide-react';

function App() {
  const { ui, setUIState, undo, redo, canUndo, canRedo } = useImageStore();
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey && canUndo()) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'y' || (e.key === 'z' && e.shiftKey)) && canRedo()) {
          e.preventDefault();
          redo();
        }
      }
      
      // Mode switching
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'c' || e.key === 'C') {
          setUIState({ mode: 'camera' });
        } else if (e.key === 'e' || e.key === 'E') {
          setUIState({ mode: 'editor' });
        } else if (e.key === 'g' || e.key === 'G') {
          // Cycle through grids
          const grids = ['none', 'thirds', 'golden', 'diagonal', 'center'] as const;
          const idx = grids.indexOf(ui.gridType);
          setUIState({ gridType: grids[(idx + 1) % grids.length] });
        } else if (e.key === 'z' || e.key === 'Z') {
          setUIState({ showZebras: !ui.showZebras });
        } else if (e.key === 'h' || e.key === 'H') {
          setUIState({ showHistogram: !ui.showHistogram });
        } else if (e.key === '\\') {
          // Toggle comparison
          setUIState({ 
            comparisonMode: ui.comparisonMode === 'off' ? 'split-vertical' : 'off' 
          });
        }
      }
      
      // Zoom
      if (e.key === '+' || e.key === '=') {
        setUIState({ zoom: Math.min(4, ui.zoom + 0.25) });
      } else if (e.key === '-') {
        setUIState({ zoom: Math.max(0.25, ui.zoom - 0.25) });
      } else if (e.key === '0') {
        setUIState({ zoom: 1, panOffset: { x: 0, y: 0 } });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ui, setUIState, undo, redo, canUndo, canRedo]);
  
  return (
    <div className="h-screen flex flex-col bg-[var(--apex-bg-base)] text-white overflow-hidden">
      {/* Top Toolbar */}
      <Toolbar />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main View */}
        <div className="flex-1 flex flex-col">
          {ui.mode === 'camera' ? <Camera /> : <Editor />}
        </div>
        
        {/* Right Panel - Only in Editor mode */}
        {ui.mode === 'editor' && (
          <div className="w-72 lg:w-80 glass-panel border-l border-[var(--apex-border)] flex flex-col overflow-hidden animate-slide-in-right">
            {/* Histogram */}
            {ui.showHistogram && (
              <div className="p-3 border-b border-[var(--apex-border)]">
                <Histogram />
              </div>
            )}
            
            {/* Adjustments */}
            <div className="flex-1 overflow-hidden">
              <AdjustmentsPanel />
            </div>
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <footer className="h-7 flex items-center justify-between px-4 glass-panel border-t border-[var(--apex-border)]">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold gradient-text">APEX Photo Studio</span>
          
          {/* Keyboard shortcuts hint */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--apex-text-dim)]">
            <Keyboard className="w-3 h-3 mr-1" />
            <kbd>C</kbd><span className="mx-0.5">Camera</span>
            <span className="mx-1 text-[var(--apex-border)]">·</span>
            <kbd>E</kbd><span className="mx-0.5">Editor</span>
            <span className="mx-1 text-[var(--apex-border)]">·</span>
            <kbd>G</kbd><span className="mx-0.5">Grid</span>
            <span className="mx-1 text-[var(--apex-border)]">·</span>
            <kbd>Z</kbd><span className="mx-0.5">Zebras</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-[10px] text-[var(--apex-text-dim)]">
          <span className="hidden md:inline">Press <kbd>H</kbd> for Histogram</span>
          <div className="w-px h-3 bg-[var(--apex-border)]" />
          <span className="font-mono">v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
