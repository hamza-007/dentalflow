import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { Fiche, FicheSource } from '@/types/case';

// Text-based PDF (same approach as deliveryNote.ts) for the fiche de fabrication.
// Every numeric parameter is printed with its cited source.

function sourceLabel(sources: FicheSource[], sourceId: string): string {
  const s = sources.find((x) => x.source_id === sourceId);
  if (!s) return sourceId ? `source ${sourceId.slice(0, 8)}` : '';
  const parts = [s.manufacturer, s.product].filter(Boolean).join(' ');
  return `${parts || s.title}${s.page ? ` p.${s.page}` : ''}`;
}

export function generateFichePdf(fiche: Fiche, patientRef: string) {
  const doc = new jsPDF();
  const left = 18;
  const width = 210 - left * 2;
  let y = 22;

  const line = (text: string, size = 11, color = 30, gap = 6) => {
    doc.setFontSize(size);
    doc.setTextColor(color);
    for (const row of doc.splitTextToSize(text, width) as string[]) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(row, left, y);
      y += gap;
    }
  };

  doc.setFontSize(18);
  doc.text('Fiche de fabrication', left, y);
  y += 8;
  const cs = fiche.content.case_summary;
  line(
    `${cs.type} · ${cs.material}${cs.shade ? ` · teinte ${cs.shade}` : ''} · dents ${cs.teeth.join(', ')}`,
    11,
    110
  );
  line(`Patient ${patientRef} · version ${fiche.version} · ${format(new Date(fiche.created_at), 'dd/MM/yyyy')}`, 10, 130, 7);

  y += 2;
  for (const stage of [...fiche.content.stages].sort((a, b) => a.order - b.order)) {
    line(`${stage.order}. ${stage.title}`, 13, 20, 7);
    if (stage.instructions) line(stage.instructions, 10, 80);
    for (const p of stage.parameters) {
      const cite = p.source_id ? `  [${sourceLabel(fiche.sources, p.source_id)}]` : '';
      line(`• ${p.label} : ${p.value}${p.unit ? ` ${p.unit}` : ''}${cite}`, 10, 50);
    }
    y += 2;
  }

  if (fiche.content.qc_checklist.length) {
    line('Contrôle qualité', 12, 20, 7);
    fiche.content.qc_checklist.forEach((q) => line(`☐ ${q}`, 10, 50));
  }
  if (fiche.content.missing_data.length) {
    y += 2;
    line('Données manquantes (consulter l’IFU du fabricant)', 12, 150, 7);
    fiche.content.missing_data.forEach((m) => line(`– ${m}`, 10, 150));
  }

  y += 4;
  line(fiche.content.disclaimer || 'Aide à la décision. Le prothésiste reste responsable.', 9, 130);

  doc.save(`fiche-${patientRef}-v${fiche.version}.pdf`);
}
