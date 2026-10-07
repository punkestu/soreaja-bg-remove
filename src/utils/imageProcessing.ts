import { RGBColor, ProcessingOptions } from '../types';

/**
 * Convert RGB to Hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Convert Hex string to RGB
 */
export function hexToRgb(hex: string): RGBColor | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

/**
 * Color distance calculation
 * Euclidean distance scaled to [0, 255] max difference
 */
export function calculateColorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
  metric: 'euclidean' | 'channel' = 'euclidean'
): number {
  if (metric === 'channel') {
    return Math.max(Math.abs(r1 - r2), Math.abs(g1 - g2), Math.abs(b1 - b2));
  }
  // Euclidean 3D color distance normalized to 255
  // max possible distance in RGB is sqrt(255^2 * 3) ~= 441.67
  const diffR = r1 - r2;
  const diffG = g1 - g2;
  const diffB = b1 - b2;
  const euclidean = Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB);
  return (euclidean / 441.673) * 255;
}

/**
 * TSD Core Algorithm: Check if pixel color matches target within tolerance
 */
export function isColorMatch(
  r: number,
  g: number,
  b: number,
  targetR: number,
  targetG: number,
  targetB: number,
  tolerance: number,
  metric: 'euclidean' | 'channel' = 'euclidean'
): boolean {
  if (metric === 'channel') {
    const diffR = Math.abs(r - targetR);
    const diffG = Math.abs(g - targetG);
    const diffB = Math.abs(b - targetB);
    return diffR <= tolerance && diffG <= tolerance && diffB <= tolerance;
  }
  const distance = calculateColorDistance(r, g, b, targetR, targetG, targetB, 'euclidean');
  return distance <= tolerance;
}

/**
 * Core image processing loop as specified in TSD Section 6.2
 * Enhanced with feathering/edge smoothing and optional contiguous flood fill
 */
export function processImageData(
  sourceData: ImageData,
  options: ProcessingOptions
): ImageData {
  const width = sourceData.width;
  const height = sourceData.height;
  const totalPixels = width * height;
  
  // Create output buffer
  const outputData = new ImageData(
    new Uint8ClampedArray(sourceData.data),
    width,
    height
  );
  const src = sourceData.data;
  const dst = outputData.data;

  const { selectedColor, tolerance, feather, contiguous, seedPoint, invert, distanceMetric } = options;
  const targetR = selectedColor.r;
  const targetG = selectedColor.g;
  const targetB = selectedColor.b;

  // Handle Contiguous / Flood-Fill removal mode
  if (contiguous && width > 0 && height > 0) {
    // Array to track visited/removed pixels
    const toRemove = new Uint8Array(totalPixels);
    const queue = new Int32Array(totalPixels);
    let queueStart = 0;
    let queueEnd = 0;

    // Determine seed starting positions
    const seeds: Array<{ x: number; y: number }> = [];
    if (seedPoint && seedPoint.x >= 0 && seedPoint.x < width && seedPoint.y >= 0 && seedPoint.y < height) {
      seeds.push(seedPoint);
    } else {
      // If no explicit seed, sample the 4 border edges of image
      for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
        seeds.push({ x, y: 0 });
        seeds.push({ x, y: height - 1 });
      }
      for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
        seeds.push({ x: 0, y });
        seeds.push({ x: width - 1, y });
      }
    }

    for (const seed of seeds) {
      const idx = seed.y * width + seed.x;
      if (toRemove[idx] === 0) {
        const pIdx = idx * 4;
        const dist = calculateColorDistance(src[pIdx], src[pIdx + 1], src[pIdx + 2], targetR, targetG, targetB, distanceMetric);
        if (dist <= tolerance) {
          toRemove[idx] = 1;
          queue[queueEnd++] = idx;
        }
      }
    }

    // 4-way Breadth-First-Search flood fill
    while (queueStart < queueEnd) {
      const curIdx = queue[queueStart++];
      const cx = curIdx % width;
      const cy = Math.floor(curIdx / width);

      const neighbors = [
        cx > 0 ? curIdx - 1 : -1,
        cx < width - 1 ? curIdx + 1 : -1,
        cy > 0 ? curIdx - width : -1,
        cy < height - 1 ? curIdx + width : -1,
      ];

      for (let i = 0; i < 4; i++) {
        const nIdx = neighbors[i];
        if (nIdx !== -1 && toRemove[nIdx] === 0) {
          const npIdx = nIdx * 4;
          const dist = calculateColorDistance(src[npIdx], src[npIdx + 1], src[npIdx + 2], targetR, targetG, targetB, distanceMetric);
          if (dist <= tolerance) {
            toRemove[nIdx] = 1;
            queue[queueEnd++] = nIdx;
          }
        }
      }
    }

    // Apply alpha updates according to flood map
    for (let i = 0; i < totalPixels; i++) {
      const pIdx = i * 4;
      const isMatched = toRemove[i] === 1;
      const shouldClear = invert ? !isMatched : isMatched;

      if (shouldClear) {
        if (feather > 0) {
          const dist = calculateColorDistance(src[pIdx], src[pIdx + 1], src[pIdx + 2], targetR, targetG, targetB, distanceMetric);
          const edgeLower = Math.max(0, tolerance - feather);
          if (dist >= edgeLower && dist <= tolerance) {
            // Smooth alpha falloff
            const ratio = (dist - edgeLower) / Math.max(1, feather);
            dst[pIdx + 3] = Math.round(src[pIdx + 3] * ratio);
          } else {
            dst[pIdx + 3] = 0;
          }
        } else {
          dst[pIdx + 3] = 0;
        }
      }
    }

    return outputData;
  }

  // Global Removal Mode (TSD section 6.2 loop)
  for (let i = 0; i < dst.length; i += 4) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    const originalAlpha = src[i + 3];

    const dist = calculateColorDistance(r, g, b, targetR, targetG, targetB, distanceMetric);
    const matches = dist <= tolerance;
    const shouldClear = invert ? !matches : matches;

    if (shouldClear) {
      if (feather > 0) {
        const edgeLower = Math.max(0, tolerance - feather);
        if (dist >= edgeLower && dist <= tolerance) {
          const ratio = (dist - edgeLower) / Math.max(1, feather);
          dst[i + 3] = Math.round(originalAlpha * ratio);
        } else {
          dst[i + 3] = 0;
        }
      } else {
        dst[i + 3] = 0;
      }
    }
  }

  return outputData;
}

/**
 * Automatically inspect image border pixels to recommend top background candidate colors
 */
export function detectCandidateBackgroundColors(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): RGBColor[] {
  if (width <= 0 || height <= 0) return [];
  
  const samplePoints: Array<{ x: number; y: number }> = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: 0, y: height - 1 },
    { x: width - 1, y: height - 1 },
    { x: Math.floor(width / 2), y: 0 },
    { x: Math.floor(width / 2), y: height - 1 },
    { x: 0, y: Math.floor(height / 2) },
    { x: width - 1, y: Math.floor(height / 2) },
  ];

  const colors: RGBColor[] = [];
  for (const pt of samplePoints) {
    try {
      const p = ctx.getImageData(pt.x, pt.y, 1, 1).data;
      if (p[3] > 10) { // ignore transparent
        const candidate = { r: p[0], g: p[1], b: p[2] };
        // Check uniqueness against already picked candidates
        const exists = colors.some(
          c => calculateColorDistance(c.r, c.g, c.b, candidate.r, candidate.g, candidate.b) < 18
        );
        if (!exists) {
          colors.push(candidate);
        }
      }
    } catch {
      // ignore
    }
  }

  return colors.slice(0, 5);
}
