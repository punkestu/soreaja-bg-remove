import React, { useEffect, useRef, useState } from 'react';
import { Layers, CheckCircle2, Sliders } from 'lucide-react';
import { ProcessingOptions, BackdropMode } from '../types';
import { processImageData } from '../utils/imageProcessing';

interface ModifiedImageCanvasProps {
  imageSrc: string;
  processingOptions: ProcessingOptions;
  onProcessComplete: (dataUrl: string, blob: Blob | null) => void;
  zoom: number;
  backdropMode: BackdropMode;
  customBackdropColor: string;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  viewLayout: 'side-by-side' | 'split' | 'single';
}

export const ModifiedImageCanvas: React.FC<ModifiedImageCanvasProps> = ({
  imageSrc,
  processingOptions,
  onProcessComplete,
  zoom,
  backdropMode,
  customBackdropColor,
  isProcessing,
  setIsProcessing,
  viewLayout,
}) => {
  const visibleCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Split view slider percentage (0 to 100)
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stats
  const [removedPixelCount, setRemovedPixelCount] = useState<number>(0);
  const [totalPixelCount, setTotalPixelCount] = useState<number>(0);

  // Initialize offscreen canvas and cached source image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      originalImageRef.current = img;

      const offscreen = document.createElement('canvas');
      offscreen.width = img.naturalWidth;
      offscreen.height = img.naturalHeight;
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (offCtx) {
        offCtx.drawImage(img, 0, 0);
      }
      offscreenCanvasRef.current = offscreen;

      // Trigger initial processing
      runProcess();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Main processing effect whenever processingOptions changes (TSD Section 5.3 B)
  const runProcess = () => {
    const offscreen = offscreenCanvasRef.current;
    const visibleCanvas = visibleCanvasRef.current;
    if (!offscreen || !visibleCanvas) return;

    setIsProcessing(true);

    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    const visCtx = visibleCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx || !visCtx) {
      setIsProcessing(false);
      return;
    }

    const width = offscreen.width;
    const height = offscreen.height;

    visibleCanvas.width = width;
    visibleCanvas.height = height;

    try {
      // 1. Get raw pixel data from original image
      const sourceImageData = offCtx.getImageData(0, 0, width, height);

      // 2. Execute color removal algorithm (TSD Section 6)
      const processedImageData = processImageData(sourceImageData, processingOptions);

      // Calculate stats
      let transparentCount = 0;
      const totalPixels = width * height;
      const data = processedImageData.data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) transparentCount++;
      }
      setRemovedPixelCount(transparentCount);
      setTotalPixelCount(totalPixels);

      // 3. Put modified ImageData onto visible canvas
      visCtx.clearRect(0, 0, width, height);
      visCtx.putImageData(processedImageData, 0, 0);

      // 4. Convert canvas to PNG Data URL and export blob
      const pngDataUrl = visibleCanvas.toDataURL('image/png');
      visibleCanvas.toBlob((blob) => {
        onProcessComplete(pngDataUrl, blob);
        setIsProcessing(false);
      }, 'image/png');
    } catch (err) {
      console.error('Error during image processing:', err);
      setIsProcessing(false);
    }
  };

  // Re-run processing whenever options change
  useEffect(() => {
    if (originalImageRef.current && offscreenCanvasRef.current) {
      runProcess();
    }
  }, [
    processingOptions.selectedColor.r,
    processingOptions.selectedColor.g,
    processingOptions.selectedColor.b,
    processingOptions.tolerance,
    processingOptions.feather,
    processingOptions.contiguous,
    processingOptions.seedPoint?.x,
    processingOptions.seedPoint?.y,
    processingOptions.invert,
    processingOptions.distanceMetric,
  ]);

  // Handle split slider drag
  const handleSplitDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSplitPercent(pct);
  };

  // Backdrop style generator
  const getBackdropClass = () => {
    switch (backdropMode) {
      case 'checkerboard-light':
        return 'bg-checkerboard-light';
      case 'black':
        return 'bg-black';
      case 'white':
        return 'bg-white';
      case 'chroma-green':
        return 'bg-[#00ff00]';
      case 'custom':
        return '';
      case 'checkerboard-dark':
      default:
        return 'bg-checkerboard-dark';
    }
  };

  const percentRemoved = totalPixelCount > 0 
    ? Math.round((removedPixelCount / totalPixelCount) * 100) 
    : 0;

  return (
    <div 
      ref={containerRef}
      onPointerMove={handleSplitDrag}
      onPointerUp={() => setIsDraggingSplit(false)}
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-neutral-900/60 rounded-xl border border-neutral-800/80 p-2 sm:p-4 select-none"
    >
      {/* Top Banner overlay indicator */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-neutral-800 text-xs text-neutral-300">
        <Layers className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-medium text-neutral-200">Cutout Result (Transparent PNG)</span>
      </div>

      {/* Real-time removal stats badge */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-neutral-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-neutral-800 text-xs">
        {isProcessing ? (
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-neutral-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400">Cleared:</span>
            <span className="font-mono text-amber-400 font-medium tabular-nums">{percentRemoved}%</span>
          </span>
        )}
      </div>

      {/* Main Canvas Viewport with Backdrop */}
      <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
        <div 
          className="relative transition-transform duration-75 origin-center shadow-2xl rounded-sm overflow-hidden"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Backdrop layer */}
          <div 
            className={`w-full h-full rounded-sm ${getBackdropClass()}`}
            style={backdropMode === 'custom' ? { backgroundColor: customBackdropColor } : undefined}
          >
            {/* Split comparison mode */}
            {viewLayout === 'split' ? (
              <div className="relative overflow-hidden">
                {/* Original background image */}
                {originalImageRef.current && (
                  <img
                    src={imageSrc}
                    alt="Original comparison"
                    className="max-w-full max-h-[70vh] object-contain block opacity-100"
                  />
                )}

                {/* Overlaid modified cutout canvas, clipped by split position */}
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 0 0 ${splitPercent}%)` }}
                >
                  <canvas
                    ref={visibleCanvasRef}
                    className="max-w-full max-h-[70vh] object-contain block"
                    style={{ imageRendering: zoom > 1.5 ? 'pixelated' : 'auto' }}
                  />
                </div>

                {/* Draggable Divider bar */}
                <div
                  onPointerDown={() => setIsDraggingSplit(true)}
                  className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)] cursor-ew-resize z-30 flex items-center justify-center"
                  style={{ left: `${splitPercent}%` }}
                >
                  <div className="w-6 h-6 rounded-full bg-neutral-900 border-2 border-amber-400 shadow-md flex items-center justify-center text-amber-400">
                    <Sliders className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ) : (
              /* Standard modified canvas */
              <canvas
                ref={visibleCanvasRef}
                className="max-w-full max-h-[70vh] object-contain block rounded-sm shadow-md"
                style={{ imageRendering: zoom > 1.5 ? 'pixelated' : 'auto' }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom helper tip */}
      <div className="absolute bottom-2.5 z-10 text-[11px] text-neutral-400 bg-neutral-950/70 backdrop-blur-sm px-2 py-0.5 rounded border border-neutral-800/80 pointer-events-none">
        {viewLayout === 'split' 
          ? 'Drag center handle to compare before & after' 
          : 'Background replaced with alpha transparency'}
      </div>
    </div>
  );
};
