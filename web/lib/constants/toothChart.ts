// FDI permanent dentition numbering + SVG layout positions for ToothChart.

// Upper arch, displayed left-to-right (patient's upper-right quadrant first).
export const UPPER_TEETH = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28'
];

// Lower arch, displayed left-to-right.
export const LOWER_TEETH = [
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38'
];

export const ALL_TEETH = [...UPPER_TEETH, ...LOWER_TEETH];

export interface ToothPosition {
  fdi: string;
  x: number;
  y: number;
}

// Layout constants for the SVG grid.
export const TOOTH_W = 30;
export const TOOTH_H = 40;
const GAP = 6;
const PAD = 10;
const ROW_GAP = 24;

function row(teeth: string[], y: number): ToothPosition[] {
  return teeth.map((fdi, i) => ({
    fdi,
    x: PAD + i * (TOOTH_W + GAP),
    y
  }));
}

export const TOOTH_POSITIONS: ToothPosition[] = [
  ...row(UPPER_TEETH, PAD),
  ...row(LOWER_TEETH, PAD + TOOTH_H + ROW_GAP)
];

export const CHART_WIDTH = PAD * 2 + UPPER_TEETH.length * (TOOTH_W + GAP) - GAP;
export const CHART_HEIGHT = PAD * 2 + TOOTH_H * 2 + ROW_GAP;
