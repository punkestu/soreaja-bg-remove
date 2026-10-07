export interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export type RemovalMode = 'global' | 'contiguous';

export type BackdropMode = 
  | 'checkerboard-dark' 
  | 'checkerboard-light' 
  | 'black' 
  | 'white' 
  | 'chroma-green' 
  | 'custom';

export type ViewLayout = 'side-by-side' | 'split' | 'single';

export interface ImageInfo {
  name: string;
  width: number;
  height: number;
  sizeBytes?: number;
  dataUrl: string;
}

export interface ProcessingOptions {
  selectedColor: RGBColor;
  tolerance: number; // 0 to 255
  feather: number;   // 0 to 50 (soft edge blend)
  contiguous: boolean; // true = flood fill from clicked point, false = global
  seedPoint?: { x: number; y: number } | null;
  invert: boolean;
  distanceMetric: 'euclidean' | 'channel';
}
