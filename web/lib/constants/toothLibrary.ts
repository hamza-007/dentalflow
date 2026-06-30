// Maps an FDI tooth number to a generic tooth-library asset + anatomy bucket.
// The 3D preview is a GENERIC TEMPLATE for visualization only (CLAUDE.md §13.2) —
// never a fitted/millable restoration. Real STL assets live in
// /public/tooth-library/<class>.stl; a procedural fallback renders when absent.

export type ToothClass = 'incisor' | 'canine' | 'premolar' | 'molar';
export type ToothRegion = 'anterior' | 'posterior';

export interface ToothSpec {
  fdi: string;
  toothClass: ToothClass;
  arch: 'upper' | 'lower';
  region: ToothRegion;
  assetUrl: string;
}

// FDI: first digit = quadrant (1,2 upper · 3,4 lower); second digit = position.
function toothClassFor(position: number): ToothClass {
  if (position <= 2) return 'incisor';
  if (position === 3) return 'canine';
  if (position <= 5) return 'premolar';
  return 'molar';
}

export function resolveTooth(fdi: string): ToothSpec {
  const quadrant = Number(fdi[0]);
  const position = Number(fdi[1]);
  const toothClass = toothClassFor(position);
  return {
    fdi,
    toothClass,
    arch: quadrant === 1 || quadrant === 2 ? 'upper' : 'lower',
    region: position <= 3 ? 'anterior' : 'posterior',
    assetUrl: `/tooth-library/${toothClass}.stl`
  };
}

// 3D placement of a tooth along a horseshoe dental arch (units ≈ tooth widths).
export interface ToothPlacement extends ToothSpec {
  isUpper: boolean;
  x: number;
  z: number;
  yaw: number;
}

const ARCH_SPACING = 1.05; // lateral distance per tooth slot
const ARCH_CURVE = 0.16; // how far molars sweep back
const ARCH_YAW = 0.14; // fan rotation per slot

export function placeTooth(fdi: string): ToothPlacement {
  const spec = resolveTooth(fdi);
  const quadrant = Number(fdi[0]);
  const position = Number(fdi[1]);
  const isUpper = spec.arch === 'upper';

  // Quadrants 1 & 4 sit on the patient's right (negative x); 2 & 3 on the left.
  const side = quadrant === 1 || quadrant === 4 ? -1 : 1;
  const slot = position - 0.5; // 0.5 (midline) … 7.5 (third molar)

  return {
    ...spec,
    isUpper,
    x: side * slot * ARCH_SPACING,
    z: (isUpper ? 1 : -1) * slot * slot * ARCH_CURVE,
    yaw: -side * slot * ARCH_YAW
  };
}

