// Prosthesis types and their type-specific extra fields (CLAUDE.md §6).

export type ExtraFieldType = 'text' | 'number' | 'select' | 'checkbox';

export interface ExtraField {
  name: string;
  label: string;
  type: ExtraFieldType;
  options?: { value: string; label: string }[];
}

export interface ProsthesisType {
  value: string;
  label: string;
  extraFields: ExtraField[];
}

export const PROSTHESIS_TYPES: ProsthesisType[] = [
  {
    value: 'crown',
    label: 'Couronne',
    extraFields: [
      { name: 'preparation_type', label: 'Type de préparation', type: 'text' },
      { name: 'margin_level', label: 'Niveau de limite', type: 'text' },
      { name: 'occlusion_notes', label: "Notes d'occlusion", type: 'text' }
    ]
  },
  {
    value: 'bridge',
    label: 'Bridge',
    extraFields: [
      { name: 'span', label: 'Étendue (dents)', type: 'text' },
      { name: 'pontic_design', label: 'Design du pontique', type: 'text' }
    ]
  },
  {
    value: 'inlay_onlay',
    label: 'Inlay / Onlay',
    extraFields: [
      { name: 'cavity_class', label: 'Classe de cavité', type: 'text' },
      { name: 'restoration_extent', label: 'Étendue de la restauration', type: 'text' }
    ]
  },
  {
    value: 'veneer',
    label: 'Facette',
    extraFields: [
      { name: 'preparation_depth', label: 'Profondeur de préparation', type: 'text' },
      { name: 'characterizations', label: 'Caractérisations', type: 'text' }
    ]
  },
  {
    value: 'partial_denture',
    label: 'Prothèse amovible partielle',
    extraFields: []
  },
  {
    value: 'full_denture',
    label: 'Prothèse amovible totale',
    extraFields: [
      {
        name: 'arch',
        label: 'Arcade',
        type: 'select',
        options: [
          { value: 'upper', label: 'Supérieure' },
          { value: 'lower', label: 'Inférieure' },
          { value: 'both', label: 'Les deux' }
        ]
      },
      { name: 'retention_type', label: 'Type de rétention', type: 'text' }
    ]
  },
  {
    value: 'implant',
    label: 'Prothèse sur implant',
    extraFields: [
      { name: 'implant_brand', label: "Marque de l'implant", type: 'text' },
      { name: 'implant_ref', label: "Référence de l'implant", type: 'text' },
      { name: 'screw_retained', label: 'Vissée', type: 'checkbox' }
    ]
  },
  {
    value: 'aligner',
    label: 'Aligneurs',
    extraFields: [
      { name: 'num_stages', label: "Nombre d'étapes", type: 'number' },
      { name: 'movement_type', label: 'Type de mouvement', type: 'text' },
      { name: 'extraction_planned', label: 'Extraction prévue', type: 'checkbox' }
    ]
  },
  {
    value: 'temporary',
    label: 'Provisoire',
    extraFields: []
  }
];

export function getProsthesisType(value: string): ProsthesisType | undefined {
  return PROSTHESIS_TYPES.find((t) => t.value === value);
}
