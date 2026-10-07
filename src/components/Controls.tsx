import React, { useState } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  Sliders, 
  Feather, 
  Sparkles, 
  Paintbrush, 
  HelpCircle,
  Maximize,
  Grid,
  Palette,
  Minus,
  Plus,
  RefreshCw
} from 'lucide-react';
import { RGBColor, ProcessingOptions, BackdropMode } from '../types';
import { rgbToHex, hexToRgb } from '../utils/imageProcessing';

interface ControlsProps {
  options: ProcessingOptions;
  setOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
  candidateColors: RGBColor[];
  processedDataUrl: string | null;
  processedBlob: Blob | null;
  fileName: string;
  imageDimensions: { width: number; height: number };
  backdropMode: BackdropMode;
  setBackdropMode: (mode: BackdropMode) => void;
  customBackdropColor: string;
  setCustomBackdropColor: (color: string) => void;
  onAutoPickBackground: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  options,
  setOptions,
  candidateColors,
  processedDataUrl,
  processedBlob,
  fileName,
  imageDimensions,
  backdropMode,
  setBackdropMode,
  customBackdropColor,
  setCustomBackdropColor,
  onAutoPickBackground,
}) => {
  const [copied, setCopied] = useState(false);
  const currentHex = rgbToHex(options.selectedColor.r, options.selectedColor.g, options.selectedColor.b);

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const rgb = hexToRgb(val);
    if (rgb) {
      setOptions(prev => ({
        ...prev,
        selectedColor: rgb,
      }));
    }
  };

  const handleToleranceChange = (newVal: number) => {
    const clamped = Math.max(0, Math.min(255, newVal));
    setOptions(prev => ({ ...prev, tolerance: clamped }));
  };

  const handleFeatherChange = (newVal: number) => {
    const clamped = Math.max(0, Math.min(50, newVal));
    setOptions(prev => ({ ...prev, feather: clamped }));
  };

  // Copy PNG image to clipboard
  const handleCopyClipboard = async () => {
    if (!processedBlob) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ 'image/png': processedBlob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  // Preset quick tolerance settings
  const tolerancePresets = [
    { label: 'Tight', value: 15 },
    { label: 'Normal', value: 35 },
    { label: 'Wide', value: 65 },
    { label: 'Heavy', value: 110 },
  ];

  const exportFileName = fileName.replace(/\.[^/.]+$/, '') + '_transparent.png';

  return (
    <div className="w-full bg-neutral-950 border-t border-neutral-800/80 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        
        {/* Section 1: Target Color Picker & Candidates */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Native Color Input wrapper with visual swatch */}
            <label 
              title="Click to choose custom color" 
              className="relative cursor-pointer group shrink-0"
            >
              <div 
                className="w-11 h-11 rounded-lg border-2 border-neutral-700 group-hover:border-amber-400 shadow-md transition-colors"
                style={{ backgroundColor: currentHex }}
              />
              <input
                type="color"
                value={currentHex}
                onChange={handleHexInputChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>

            {/* Readout & Hex manual input */}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-neutral-400">Target Color</span>
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  type="text"
                  value={currentHex}
                  onChange={handleHexInputChange}
                  maxLength={7}
                  className="w-20 px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-mono text-xs font-semibold text-neutral-200 focus:outline-none focus:border-amber-500 uppercase"
                />
                <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                  RGB({options.selectedColor.r}, {options.selectedColor.g}, {options.selectedColor.b})
                </span>
              </div>
            </div>
          </div>

          {/* Auto-detected palette candidates */}
          {candidateColors.length > 0 && (
            <div className="flex items-center gap-2 pl-0 sm:pl-3 sm:border-l border-neutral-800">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <span>Detected</span>
                  <button
                    type="button"
                    onClick={onAutoPickBackground}
                    title="Re-sample edge colors"
                    className="text-neutral-500 hover:text-amber-400 transition-colors"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {candidateColors.map((color, idx) => {
                    const hex = rgbToHex(color.r, color.g, color.b);
                    const isActive = hex === currentHex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setOptions(prev => ({ ...prev, selectedColor: color }))}
                        title={`Select ${hex}`}
                        className={`w-6 h-6 rounded-md border transition-all ${
                          isActive 
                            ? 'border-amber-400 ring-2 ring-amber-400/30 scale-110' 
                            : 'border-neutral-700/80 hover:scale-105'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Tolerance & Feather Controls (Core TSD) */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          {/* Tolerance Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Tolerance</span>
              </span>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-neutral-900 rounded border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => handleToleranceChange(options.tolerance - 5)}
                    className="px-1.5 py-0.5 text-neutral-400 hover:text-neutral-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-amber-400 font-semibold px-1 text-xs tabular-nums">
                    {options.tolerance}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToleranceChange(options.tolerance + 5)}
                    className="px-1.5 py-0.5 text-neutral-400 hover:text-neutral-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="200"
              value={options.tolerance}
              onChange={(e) => handleToleranceChange(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />

            {/* Tolerance Quick Presets */}
            <div className="flex items-center justify-between gap-1 mt-0.5">
              {tolerancePresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleToleranceChange(preset.value)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    Math.abs(options.tolerance - preset.value) < 6
                      ? 'bg-amber-500/20 text-amber-400 font-medium'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {preset.label} ({preset.value})
                </button>
              ))}
            </div>
          </div>

          {/* Feathering / Edge Smoothness */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                <Feather className="w-3.5 h-3.5 text-amber-400" />
                <span>Edge Softness</span>
              </span>
              <span className="font-mono text-neutral-400 text-xs tabular-nums">
                {options.feather}px
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="35"
              value={options.feather}
              onChange={(e) => handleFeatherChange(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />

            {/* Mode & Invert Options */}
            <div className="flex items-center justify-between gap-2 mt-0.5 text-xs">
              <button
                type="button"
                onClick={() => setOptions(prev => ({ ...prev, contiguous: !prev.contiguous }))}
                title="Contiguous mode only removes background connected to your click point"
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  options.contiguous
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 font-medium'
                    : 'border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {options.contiguous ? 'Contiguous (Connected)' : 'Global (All)'}
              </button>

              <button
                type="button"
                onClick={() => setOptions(prev => ({ ...prev, invert: !prev.invert }))}
                title="Invert transparency mask"
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  options.invert
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 font-medium'
                    : 'border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {options.invert ? 'Mask Inverted' : 'Invert Mask'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Preview Backdrop & Download Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Backdrop inspector choices */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            <span className="text-[10px] text-neutral-500 px-1 font-medium hidden xl:inline">Test On:</span>
            
            <button
              type="button"
              onClick={() => setBackdropMode('checkerboard-dark')}
              title="Dark Checkerboard"
              className={`w-6 h-6 rounded border transition-colors bg-checkerboard-dark ${
                backdropMode === 'checkerboard-dark' ? 'border-amber-400 ring-1 ring-amber-400' : 'border-neutral-700'
              }`}
            />
            <button
              type="button"
              onClick={() => setBackdropMode('checkerboard-light')}
              title="Light Checkerboard"
              className={`w-6 h-6 rounded border transition-colors bg-checkerboard-light ${
                backdropMode === 'checkerboard-light' ? 'border-amber-400 ring-1 ring-amber-400' : 'border-neutral-700'
              }`}
            />
            <button
              type="button"
              onClick={() => setBackdropMode('white')}
              title="White Background"
              className={`w-6 h-6 rounded border bg-white transition-colors ${
                backdropMode === 'white' ? 'border-amber-400 ring-1 ring-amber-400' : 'border-neutral-700'
              }`}
            />
            <button
              type="button"
              onClick={() => setBackdropMode('black')}
              title="Black Background"
              className={`w-6 h-6 rounded border bg-black transition-colors ${
                backdropMode === 'black' ? 'border-amber-400 ring-1 ring-amber-400' : 'border-neutral-700'
              }`}
            />
            <button
              type="button"
              onClick={() => setBackdropMode('chroma-green')}
              title="Green Screen"
              className={`w-6 h-6 rounded border bg-[#00ff00] transition-colors ${
                backdropMode === 'chroma-green' ? 'border-amber-400 ring-1 ring-amber-400' : 'border-neutral-700'
              }`}
            />
          </div>

          {/* Copy to Clipboard */}
          {processedBlob && (
            <button
              type="button"
              onClick={handleCopyClipboard}
              title="Copy transparent PNG to clipboard"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          )}

          {/* Download Transparent PNG anchor/button (TSD Section 5.3 C) */}
          {processedDataUrl ? (
            <a
              href={processedDataUrl}
              download={exportFileName}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-md shadow-amber-500/20 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </a>
          ) : (
            <button
              disabled
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-lg cursor-not-allowed opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
