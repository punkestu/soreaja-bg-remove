import React from 'react';
import { 
  UploadCloud, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Pipette, 
  Layers 
} from 'lucide-react';
import { 
  RGBColor, 
  ProcessingOptions, 
  ViewLayout, 
  BackdropMode, 
  ImageInfo 
} from '../types';
import { OriginalImageCanvas } from './OriginalImageCanvas';
import { ModifiedImageCanvas } from './ModifiedImageCanvas';

interface WorkspaceProps {
  imageInfo: ImageInfo | null;
  onUploadFile: (file: File) => void;
  onSelectSample: (sampleKey: 'sneaker' | 'headphones') => void;
  viewLayout: ViewLayout;
  zoom: number;
  selectedColor: RGBColor;
  onColorSelect: (color: RGBColor, seed?: { x: number; y: number }) => void;
  lastClickPos: { x: number; y: number } | null;
  processingOptions: ProcessingOptions;
  onProcessComplete: (dataUrl: string, blob: Blob | null) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  backdropMode: BackdropMode;
  customBackdropColor: string;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  imageInfo,
  onUploadFile,
  onSelectSample,
  viewLayout,
  zoom,
  selectedColor,
  onColorSelect,
  lastClickPos,
  processingOptions,
  onProcessComplete,
  isProcessing,
  setIsProcessing,
  backdropMode,
  customBackdropColor,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onUploadFile(file);
    }
  };

  // If no image is uploaded yet, show refined Empty / Dropzone state
  if (!imageInfo) {
    return (
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden"
      >
        <div className="max-w-2xl w-full flex flex-col items-center text-center">
          {/* Main Upload Drop Area */}
          <div 
            className={`w-full p-8 md:p-12 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center bg-neutral-900/40 backdrop-blur-sm ${
              isDragOver 
                ? 'border-amber-400 bg-amber-500/5 scale-[1.01]' 
                : 'border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 shadow-lg shadow-amber-500/5">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-100">
              Drop your image here to remove background
            </h2>
            <p className="mt-2 text-sm text-neutral-400 max-w-md">
              Supports PNG, JPG, WebP, SVG. Select any color to make transparent in real-time. No data leaves your browser.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-md shadow-amber-500/20">
                <UploadCloud className="w-4 h-4" />
                <span>Browse Files</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadFile(f);
                  }}
                  className="hidden"
                />
              </label>

              <span className="text-xs text-neutral-500">or paste from clipboard (Ctrl+V)</span>
            </div>

            {/* Quick Sample Image Loaders */}
            <div className="mt-8 pt-6 border-t border-neutral-800/80 w-full flex flex-col items-center">
              <span className="text-xs text-neutral-400 mb-3 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Try an instant studio test image:</span>
              </span>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onSelectSample('sneaker')}
                  className="flex items-center gap-2.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-850 hover:border-neutral-700 border border-neutral-800 rounded-xl text-xs font-medium text-neutral-200 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="w-5 h-5 rounded bg-neutral-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    👟
                  </div>
                  <span>Sneaker Product (Gray BG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectSample('headphones')}
                  className="flex items-center gap-2.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-850 hover:border-neutral-700 border border-neutral-800 rounded-xl text-xs font-medium text-neutral-200 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="w-5 h-5 rounded bg-neutral-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    🎧
                  </div>
                  <span>Studio Headphones (Yellow BG)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Value Props & Technical Advantages */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
            <div className="p-3.5 rounded-xl bg-neutral-900/30 border border-neutral-800/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Private</span>
              </div>
              <p className="mt-1 text-[11px] text-neutral-400 leading-relaxed">
                Rendered entirely on client HTML5 Canvas. Zero uploads to external servers.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900/30 border border-neutral-800/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                <Pipette className="w-4 h-4 text-amber-400" />
                <span>Precision Eyedropper</span>
              </div>
              <p className="mt-1 text-[11px] text-neutral-400 leading-relaxed">
                Click any pixel or hover with the 9x9 magnifier loupe to target color shades.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900/30 border border-neutral-800/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                <Zap className="w-4 h-4 text-orange-400" />
                <span>Zero Latency</span>
              </div>
              <p className="mt-1 text-[11px] text-neutral-400 leading-relaxed">
                Real-time tolerance and feathering sliders calculate pixel alpha instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Workspace Layouts
  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 w-full p-2 sm:p-4 md:p-6 overflow-hidden flex flex-col min-h-0"
    >
      {viewLayout === 'side-by-side' && (
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Left Panel: Original Image Canvas (TSD Section 5.3 A) */}
          <div className="h-full min-h-[350px] flex flex-col">
            <OriginalImageCanvas
              imageSrc={imageInfo.dataUrl}
              onColorSelect={onColorSelect}
              selectedColor={selectedColor}
              zoom={zoom}
              lastClickPos={lastClickPos}
            />
          </div>

          {/* Right Panel: Modified Image Canvas (TSD Section 5.3 B) */}
          <div className="h-full min-h-[350px] flex flex-col">
            <ModifiedImageCanvas
              imageSrc={imageInfo.dataUrl}
              processingOptions={processingOptions}
              onProcessComplete={onProcessComplete}
              zoom={zoom}
              backdropMode={backdropMode}
              customBackdropColor={customBackdropColor}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              viewLayout={viewLayout}
            />
          </div>
        </div>
      )}

      {viewLayout === 'split' && (
        <div className="w-full h-full flex-1 min-h-[450px]">
          <ModifiedImageCanvas
            imageSrc={imageInfo.dataUrl}
            processingOptions={processingOptions}
            onProcessComplete={onProcessComplete}
            zoom={zoom}
            backdropMode={backdropMode}
            customBackdropColor={customBackdropColor}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            viewLayout="split"
          />
        </div>
      )}

      {viewLayout === 'single' && (
        <div className="w-full h-full flex-1 min-h-[450px]">
          <ModifiedImageCanvas
            imageSrc={imageInfo.dataUrl}
            processingOptions={processingOptions}
            onProcessComplete={onProcessComplete}
            zoom={zoom}
            backdropMode={backdropMode}
            customBackdropColor={customBackdropColor}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            viewLayout="single"
          />
        </div>
      )}
    </div>
  );
};
