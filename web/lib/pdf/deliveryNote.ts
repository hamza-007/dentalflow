import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { Case } from '@/types/case';
import { getProsthesisType } from '@/lib/constants/prosthesisTypes';

/**
 * Generate and download a delivery note PDF for a delivered case (CLAUDE.md §8).
 * Text-based (no html2canvas) to keep it dependency-light and crisp.
 */
export function generateDeliveryNote(c: Case, labName: string) {
  const doc = new jsPDF();
  const left = 20;
  let y = 24;

  doc.setFontSize(18);
  doc.text('Bon de livraison', left, y);

  doc.setFontSize(11);
  doc.setTextColor(100);
  y += 8;
  doc.text(labName, left, y);
  y += 6;
  doc.text(`Date : ${format(new Date(), 'dd/MM/yyyy')}`, left, y);

  doc.setDrawColor(200);
  y += 6;
  doc.line(left, y, 190, y);

  doc.setTextColor(30);
  doc.setFontSize(12);
  const rows: [string, string][] = [
    ['Réf. patient', c.patient_ref],
    ['Type de prothèse', getProsthesisType(c.prosthesis_type)?.label ?? c.prosthesis_type],
    ['Dents (FDI)', c.teeth.join(', ')],
    ['Matériau', c.material],
    ['Teinte', c.shade ?? '—'],
    ['Échéance', format(new Date(c.due_date), 'dd/MM/yyyy')]
  ];

  y += 12;
  for (const [label, value] of rows) {
    doc.setTextColor(110);
    doc.text(label, left, y);
    doc.setTextColor(30);
    doc.text(String(value), left + 55, y);
    y += 9;
  }

  // Signature: embed the dentist's drawn signature if present.
  y += 18;
  if (c.delivery_signature) {
    try {
      doc.addImage(c.delivery_signature, 'PNG', left, y, 60, 24);
    } catch {
      // ignore an unreadable data URL — fall back to the blank line below
    }
    y += 26;
  } else {
    y += 6;
  }
  doc.setDrawColor(150);
  doc.line(left, y, left + 70, y);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Signature', left, y + 6);

  doc.save(`bon-livraison-${c.patient_ref}.pdf`);
}
