import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pipette, Crosshair } from 'lucide-react';
import { RGBColor } from '../types';
import { rgbToHex } from '../utils/imageProcessing';

interface OriginalImageCanvasProps {
  imageSrc: string;
  onColorSelect: (color: RGBColor, seed?: { x: number; y: number }) => void;
  selectedColor: RGBColor;
  zoom: number;
  lastClickPos: { x: number; y: number } | null;
}

export const OriginalImageCanvas: React.FC<OriginalImageCanvasProps> = ({
  imageSrc,
  onColorSelect,
  selectedColor,
  zoom,
  lastClickPos,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Loupe / Eyedropper state
  const [hoverPixel, setHoverPixel] = useState<{
    x: number;
    y: number;
    screenX: number;
    screenY: number;
    color: RGBColor;
    hex: string;
    patchData: ImageData | null;
  } | null>(null);

  const [isHovering, setIsHovering] = useState(false);

  // Load and render image to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Convert client pointer event coordinates to image canvas pixel coordinates
  const getCanvasPixelCoord = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (
      clientX < rect.left || 
      clientX > rect.right || 
      clientY < rect.top || 
      clientY > rect.bottom
    ) {
      return null;
    }

    // Exact scale ratio between rendered bounding box and natural canvas pixels
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = Math.floor((clientX - rect.left) * scaleX);
    const canvasY = Math.floor((clientY - rect.top) * scaleY);

    const clampedX = Math.max(0, Math.min(canvas.width - 1, canvasX));
    const clampedY = Math.max(0, Math.min(canvas.height - 1, canvasY));

    return { x: clampedX, y: clampedY, clientX, clientY };
  }, []);

  // Handle pointer down / click to pick color (TSD Section 5.3 A)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coord = getCanvasPixelCoord(e);
    if (!coord) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Use ctx.getImageData(x, y, 1, 1).data as specified in TSD
    const pixel = ctx.getImageData(coord.x, coord.y, 1, 1).data;
    const pickedColor: RGBColor = {
      r: pixel[0],
      g: pixel[1],
      b: pixel[2],
      a: pixel[3],
    };

    onColorSelect(pickedColor, { x: coord.x, y: coord.y });
  };

  // Handle pointer move for real-time Loupe magnifier
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coord = getCanvasPixelCoord(e);
    if (!coord) {
      setHoverPixel(null);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const pixel = ctx.getImageData(coord.x, coord.y, 1, 1).data;
    const color: RGBColor = { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] };
    const hex = rgbToHex(color.r, color.g, color.b);

    // Extract a 9x9 pixel patch for magnifier loupe
    const patchSize = 9;
    const halfPatch = Math.floor(patchSize / 2);
    const startX = Math.max(0, Math.min(canvas.width - patchSize, coord.x - halfPatch));
    const startY = Math.max(0, Math.min(canvas.height - patchSize, coord.y - halfPatch));

    let patchData: ImageData | null = null;
    try {
      patchData = ctx.getImageData(startX, startY, patchSize, patchSize);
    } catch {
      patchData = null;
    }

    const containerRect = containerRef.current?.getBoundingClientRect();
    const relScreenX = containerRect ? e.clientX - containerRect.left : e.clientX;
    const relScreenY = containerRect ? e.clientY - containerRect.top : e.clientY;

    setHoverPixel({
      x: coord.x,
      y: coord.y,
      screenX: relScreenX,
      screenY: relScreenY,
      color,
      hex,
      patchData,
    });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-neutral-900/60 rounded-xl border border-neutral-800/80 p-2 sm:p-4 select-none group"
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={() => {
        setIsHovering(false);
        setHoverPixel(null);
      }}
    >
      {/* Top Banner overlay indicator */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-neutral-800 text-xs text-neutral-300">
        <Pipette className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="font-medium text-neutral-200">Original (Click to Pick Color)</span>
      </div>

      {/* Coordinate & Pixel Status indicator */}
      {hoverPixel && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-neutral-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-neutral-800 font-mono text-xs">
          <div 
            className="w-3 h-3 rounded-full border border-neutral-700 shadow-inner"
            style={{ backgroundColor: hoverPixel.hex }}
          />
          <span className="text-amber-400 font-semibold">{hoverPixel.hex}</span>
          <span className="text-neutral-500">·</span>
          <span className="text-neutral-400 tabular-nums">
            X:{hoverPixel.x} Y:{hoverPixel.y}
          </span>
        </div>
      )}

      {/* Canvas Viewport container with Zoom transform */}
      <div 
        className="w-full h-full flex items-center justify-center overflow-auto p-4"
        style={{ cursor: 'crosshair' }}
      >
        <div 
          className="relative transition-transform duration-75 origin-center shadow-2xl rounded-sm"
          style={{ transform: `scale(${zoom})` }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            className="max-w-full max-h-[70vh] object-contain block rounded-sm shadow-md"
            style={{ imageRendering: zoom > 1.5 ? 'pixelated' : 'auto' }}
          />

          {/* Last clicked point crosshair marker */}
          {lastClickPos && canvasRef.current && (
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                left: `${(lastClickPos.x / canvasRef.current.width) * 100}%`,
                top: `${(lastClickPos.y / canvasRef.current.height) * 100}%`,
              }}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-ping absolute opacity-50" />
                <div className="w-4 h-4 rounded-full border border-amber-400 flex items-center justify-center bg-black/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Eyedropper Magnifier Loupe floating tool */}
      {isHovering && hoverPixel && hoverPixel.patchData && (
        <div 
          className="absolute pointer-events-none z-30 transform -translate-x-1/2 -translate-y-full mb-4 shadow-2xl rounded-lg bg-neutral-950/95 border border-amber-500/40 p-1.5 flex flex-col items-center backdrop-blur-md"
          style={{
            left: Math.max(70, Math.min((containerRef.current?.clientWidth || 300) - 70, hoverPixel.screenX)),
            top: Math.max(120, hoverPixel.screenY - 12),
          }}
        >
          {/* Zoomed 9x9 Pixel Grid */}
          <div className="relative w-20 h-20 rounded overflow-hidden border border-neutral-800 bg-neutral-900 grid grid-cols-9 grid-rows-9">
            {Array.from({ length: 81 }).map((_, i) => {
              const pIdx = i * 4;
              const data = hoverPixel.patchData?.data;
              if (!data) return null;
              const r = data[pIdx];
              const g = data[pIdx + 1];
              const b = data[pIdx + 2];
              const isCenter = i === 40; // 9x9 center
              return (
                <div
                  key={i}
                  style={{ backgroundColor: `rgb(${r},${g},${b})` }}
                  className={`w-full h-full ${
                    isCenter ? 'ring-2 ring-amber-400 z-10' : ''
                  }`}
                />
              );
            })}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Crosshair className="w-4 h-4 text-amber-400 drop-shadow" />
            </div>
          </div>

          {/* Color Details readout */}
          <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-neutral-300">
            <span className="font-semibold text-amber-400">{hoverPixel.hex}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-400 tabular-nums">
              RGB({hoverPixel.color.r},{hoverPixel.color.g},{hoverPixel.color.b})
            </span>
          </div>
        </div>
      )}

      {/* Bottom helper tip */}
      <div className="absolute bottom-2.5 z-10 text-[11px] text-neutral-400 bg-neutral-950/70 backdrop-blur-sm px-2 py-0.5 rounded border border-neutral-800/80 pointer-events-none">
        Click any pixel to set color & background seed point
      </div>
    </div>
  );
};
