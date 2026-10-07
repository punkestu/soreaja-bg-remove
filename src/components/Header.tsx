import React, { useRef } from 'react';
import { 
  Upload, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Columns, 
  SplitSquareVertical, 
  Eye, 
  Sparkles,
  Download
} from 'lucide-react';
import { ViewLayout, ImageInfo } from '../types';

interface HeaderProps {
  imageInfo: ImageInfo | null;
  viewLayout: ViewLayout;
  setViewLayout: (layout: ViewLayout) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onResetZoom: () => void;
  onFitView: () => void;
  onUploadFile: (file: File) => void;
  onSelectSample: (sampleKey: 'sneaker' | 'headphones') => void;
  onResetAll: () => void;
  canDownload: boolean;
  onTriggerDownload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  imageInfo,
  viewLayout,
  setViewLayout,
  zoom,
  setZoom,
  onResetZoom,
  onFitView,
  onUploadFile,
  onSelectSample,
  onResetAll,
  canDownload,
  onTriggerDownload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
    // reset input value so re-selecting same file triggers change
    if (e.target) e.target.value = '';
  };

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-4 sm:px-6 py-3 sticky top-0 z-40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Zone 1: Wordmark / Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <span className="font-bold text-neutral-950 text-sm tracking-wider">SA</span>
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-neutral-100">
                SoreAja - Background remove
              </span>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 font-normal">
                <span>Client-Side</span>
                <span aria-hidden="true">·</span>
                <span>Canvas API</span>
                <span aria-hidden="true">·</span>
                <span>Lossless PNG</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zone 2: Workspace Viewport & Zoom Controls */}
        <div className="flex items-center gap-2">
          {imageInfo && (
            <>
              {/* Layout Switcher */}
              <div className="flex items-center p-0.5 bg-neutral-900 border border-neutral-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewLayout('side-by-side')}
                  title="Side-by-side Dual Workspace"
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewLayout === 'side-by-side'
                      ? 'bg-neutral-800 text-amber-400 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Dual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('split')}
                  title="Split Slider Compare"
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewLayout === 'split'
                      ? 'bg-neutral-800 text-amber-400 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('single')}
                  title="Cutout Result Only"
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewLayout === 'single'
                      ? 'bg-neutral-800 text-amber-400 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Result</span>
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.25, Number((z - 0.25).toFixed(2))))}
                  title="Zoom Out"
                  className="p-1 text-neutral-400 hover:text-neutral-200 rounded transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onResetZoom}
                  title="Reset to 100%"
                  className="px-1.5 py-0.5 font-mono text-neutral-300 hover:text-amber-400 transition-colors"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(4, Number((z + 0.25).toFixed(2))))}
                  title="Zoom In"
                  className="p-1 text-neutral-400 hover:text-neutral-200 rounded transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onFitView}
                  title="Fit to View"
                  className="p-1 text-neutral-400 hover:text-neutral-200 rounded transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          {/* Sample quick picks */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectSample('sneaker')}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Sample 1</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSample('headphones')}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Sample 2</span>
            </button>
          </div>
        </div>

        {/* Zone 3: Primary Actions (Upload & Download) */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {imageInfo && (
            <button
              type="button"
              onClick={onResetAll}
              title="Reset Image"
              className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 hover:text-white border border-neutral-700/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-300" />
            <span>Upload Image</span>
          </button>

          {canDownload && (
            <button
              type="button"
              onClick={onTriggerDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-md shadow-amber-500/20 whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PNG</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
