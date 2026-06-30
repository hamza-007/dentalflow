// Approximate sRGB hex per VITA Classical shade, for tinting the 3D preview.
// These are visualization approximations, NOT a shade-matching reference.

export const VITA_SHADE_HEX: Record<string, string> = {
  A1: '#E8E2D0',
  A2: '#E4DAC0',
  A3: '#DECBA6',
  'A3.5': '#D8C29A',
  A4: '#CDB488',
  B1: '#ECE7D6',
  B2: '#E6DBC0',
  B3: '#DECDA6',
  B4: '#D3BE94',
  C1: '#DAD4C2',
  C2: '#CFC5AC',
  C3: '#C2B597',
  C4: '#B0A083',
  D2: '#DBD2C0',
  D3: '#CFC3AC',
  D4: '#C3B49B'
};

// Neutral enamel default when no shade is specified.
export const DEFAULT_ENAMEL = '#E7E0CE';

export function shadeToHex(shade?: string | null): string {
  if (!shade) return DEFAULT_ENAMEL;
  return VITA_SHADE_HEX[shade] ?? DEFAULT_ENAMEL;
}
