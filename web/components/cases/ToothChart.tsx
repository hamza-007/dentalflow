'use client';

import {
  ALL_TEETH,
  CHART_HEIGHT,
  CHART_WIDTH,
  TOOTH_H,
  TOOTH_POSITIONS,
  TOOTH_W
} from '@/lib/constants/toothChart';

/**
 * Clickable FDI dental chart. Teeth toggle on click; selected values are
 * emitted in FDI order, e.g. ['16','17'].
 */
export default function ToothChart({
  value,
  onChange
}: {
  value: string[];
  onChange: (teeth: string[]) => void;
}) {
  const selected = new Set(value);

  function toggle(fdi: string) {
    const next = new Set(selected);
    if (next.has(fdi)) {
      next.delete(fdi);
    } else {
      next.add(fdi);
    }
    onChange(ALL_TEETH.filter((t) => next.has(t)));
  }

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className="h-auto w-full max-w-2xl select-none"
      role="group"
      aria-label="Schéma dentaire FDI"
    >
      {TOOTH_POSITIONS.map((p) => {
        const isSel = selected.has(p.fdi);
        return (
          <g key={p.fdi} className="cursor-pointer" onClick={() => toggle(p.fdi)}>
            <rect
              x={p.x}
              y={p.y}
              width={TOOTH_W}
              height={TOOTH_H}
              rx={6}
              strokeWidth={1.5}
              className={
                isSel
                  ? 'fill-brand-500 stroke-brand-700'
                  : 'fill-white stroke-slate-300 hover:fill-brand-50'
              }
            />
            <text
              x={p.x + TOOTH_W / 2}
              y={p.y + TOOTH_H / 2}
              textAnchor="middle"
              dominantBaseline="central"
              className={`text-[10px] font-medium ${isSel ? 'fill-white' : 'fill-slate-600'}`}
            >
              {p.fdi}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
