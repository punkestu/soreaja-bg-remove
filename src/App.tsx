/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RGBColor, 
  ProcessingOptions, 
  ViewLayout, 
  BackdropMode, 
  ImageInfo 
} from './types';
import { Header } from './components/Header';
import { Workspace } from './components/Workspace';
import { Controls } from './components/Controls';
import { 
  detectCandidateBackgroundColors,
  rgbToHex,
  calculateColorDistance 
} from './utils/imageProcessing';

// Static asset references for instant testing
import sampleSneakerImg from './assets/images/sample_sneaker_product_1791382700555.jpg';
import sampleHeadphonesImg from './assets/images/sample_headphones_1791382715697.jpg';

export default function App() {
  // Image metadata and data URL
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);

  // Core TSD State (Section 5.2)
  const [selectedColor, setSelectedColor] = useState<RGBColor>({ r: 240, g: 240, b: 240 });
  const [tolerance, setTolerance] = useState<number>(35);
  const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);

  // Advanced enhancement state
  const [feather, setFeather] = useState<number>(2);
  const [contiguous, setContiguous] = useState<boolean>(false);
  const [seedPoint, setSeedPoint] = useState<{ x: number; y: number } | null>(null);
  const [lastClickPos, setLastClickPos] = useState<{ x: number; y: number } | null>(null);
  const [invert, setInvert] = useState<boolean>(false);
  const [distanceMetric, setDistanceMetric] = useState<'euclidean' | 'channel'>('euclidean');

  // UI and viewport state
  const [viewLayout, setViewLayout] = useState<ViewLayout>('side-by-side');
  const [zoom, setZoom] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [backdropMode, setBackdropMode] = useState<BackdropMode>('checkerboard-dark');
  const [customBackdropColor, setCustomBackdropColor] = useState<string>('#3b82f6');
  const [candidateColors, setCandidateColors] = useState<RGBColor[]>([]);

  // Package options for processing canvas
  const processingOptions: ProcessingOptions = {
    selectedColor,
    tolerance,
    feather,
    contiguous,
    seedPoint,
    invert,
    distanceMetric,
  };

  // Helper to load image data URL into state
  const loadImage = useCallback((src: string, name: string, sizeBytes?: number) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageInfo({
        name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        sizeBytes,
        dataUrl: src,
      });

      // Sample candidate background colors from border
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const candidates = detectCandidateBackgroundColors(ctx, img.naturalWidth, img.naturalHeight);
        setCandidateColors(candidates);

        // Auto-select the top candidate background color
        if (candidates.length > 0) {
          setSelectedColor(candidates[0]);
        }
      }

      setZoom(1);
      setSeedPoint(null);
      setLastClickPos(null);
    };
    img.src = src;
  }, []);

  // Handle local file upload (TSD Section 7.2)
  const handleUploadFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        loadImage(result, file.name, file.size);
      }
    };
    reader.readAsDataURL(file);
  }, [loadImage]);

  // Load sample image
  const handleSelectSample = useCallback((key: 'sneaker' | 'headphones') => {
    if (key === 'sneaker') {
      loadImage(sampleSneakerImg, 'sample_sneaker_product.jpg');
    } else {
      loadImage(sampleHeadphonesImg, 'sample_headphones.jpg');
    }
  }, [loadImage]);

  // Handle color selection from clicking the Original canvas (TSD Section 5.3 A)
  const handleColorSelect = useCallback((color: RGBColor, seed?: { x: number; y: number }) => {
    setSelectedColor(color);
    if (seed) {
      setSeedPoint(seed);
      setLastClickPos(seed);
    }
  }, []);

  // Handle completion of modified canvas processing (TSD Section 5.3 B)
  const handleProcessComplete = useCallback((dataUrl: string, blob: Blob | null) => {
    setProcessedDataUrl(dataUrl);
    setProcessedBlob(blob);
  }, []);

  // Trigger file download programmatically if requested from header
  const handleTriggerDownload = useCallback(() => {
    if (!processedDataUrl) return;
    const a = document.createElement('a');
    a.href = processedDataUrl;
    const outName = (imageInfo?.name || 'cutout').replace(/\.[^/.]+$/, '') + '_transparent.png';
    a.download = outName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [processedDataUrl, imageInfo]);

  // Re-detect background candidates
  const handleAutoPickBackground = useCallback(() => {
    if (!imageInfo) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const candidates = detectCandidateBackgroundColors(ctx, img.naturalWidth, img.naturalHeight);
        setCandidateColors(candidates);
        if (candidates.length > 0) {
          setSelectedColor(candidates[0]);
        }
      }
    };
    img.src = imageInfo.dataUrl;
  }, [imageInfo]);

  // Reset to initial clean state
  const handleResetAll = useCallback(() => {
    setImageInfo(null);
    setProcessedDataUrl(null);
    setProcessedBlob(null);
    setLastClickPos(null);
    setSeedPoint(null);
  }, []);

  // Fit image to view
  const handleFitView = useCallback(() => {
    setZoom(1);
  }, []);

  // Global clipboard paste listener (Ctrl+V anywhere in app)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleUploadFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleUploadFile]);

  // Load sample on first mount so the user has something immediately interactive
  useEffect(() => {
    handleSelectSample('sneaker');
  }, [handleSelectSample]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased selection:bg-amber-500 selection:text-neutral-950">
      {/* 1. Header & Navigation Controls */}
      <Header
        imageInfo={imageInfo}
        viewLayout={viewLayout}
        setViewLayout={setViewLayout}
        zoom={zoom}
        setZoom={setZoom}
        onResetZoom={() => setZoom(1)}
        onFitView={handleFitView}
        onUploadFile={handleUploadFile}
        onSelectSample={handleSelectSample}
        onResetAll={handleResetAll}
        canDownload={Boolean(processedDataUrl)}
        onTriggerDownload={handleTriggerDownload}
      />

      {/* 2. Main Workspace (Original & Modified Canvases) */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        <Workspace
          imageInfo={imageInfo}
          onUploadFile={handleUploadFile}
          onSelectSample={handleSelectSample}
          viewLayout={viewLayout}
          zoom={zoom}
          selectedColor={selectedColor}
          onColorSelect={handleColorSelect}
          lastClickPos={lastClickPos}
          processingOptions={processingOptions}
          onProcessComplete={handleProcessComplete}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          backdropMode={backdropMode}
          customBackdropColor={customBackdropColor}
        />
      </main>

      {/* 3. Bottom Controls Panel (Color Swatch, Tolerance, Feathering, Export) */}
      {imageInfo && (
        <Controls
          options={processingOptions}
          setOptions={(update) => {
            if (typeof update === 'function') {
              const next = update(processingOptions);
              setSelectedColor(next.selectedColor);
              setTolerance(next.tolerance);
              setFeather(next.feather);
              setContiguous(next.contiguous);
              setSeedPoint(next.seedPoint ?? null);
              setInvert(next.invert);
              setDistanceMetric(next.distanceMetric);
            } else {
              setSelectedColor(update.selectedColor);
              setTolerance(update.tolerance);
              setFeather(update.feather);
              setContiguous(update.contiguous);
              setSeedPoint(update.seedPoint ?? null);
              setInvert(update.invert);
              setDistanceMetric(update.distanceMetric);
            }
          }}
          candidateColors={candidateColors}
          processedDataUrl={processedDataUrl}
          processedBlob={processedBlob}
          fileName={imageInfo.name}
          imageDimensions={{ width: imageInfo.width, height: imageInfo.height }}
          backdropMode={backdropMode}
          setBackdropMode={setBackdropMode}
          customBackdropColor={customBackdropColor}
          setCustomBackdropColor={setCustomBackdropColor}
          onAutoPickBackground={handleAutoPickBackground}
        />
      )}
    </div>
  );
}
