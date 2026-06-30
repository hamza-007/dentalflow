'use client';

import { useTranslations } from 'next-intl';
import { PROSTHESIS_TYPES, getProsthesisType } from '@/lib/constants/prosthesisTypes';
import { VITA_SHADES } from '@/lib/constants/vitaShades';
import { Field, Input, Select } from '@/components/ui';

export interface ProsthesisValue {
  prosthesis_type: string;
  material: string;
  shade: string;
  extra_fields: Record<string, string>;
}

/**
 * Adaptive clinical form: the visible extra fields change with the selected
 * prosthesis type (CLAUDE.md §6).
 */
export default function ProsthesisForm({
  value,
  onChange
}: {
  value: ProsthesisValue;
  onChange: (v: ProsthesisValue) => void;
}) {
  const t = useTranslations('case');
  const tw = useTranslations('wizard');
  const selectedType = getProsthesisType(value.prosthesis_type);

  function set<K extends keyof ProsthesisValue>(key: K, v: ProsthesisValue[K]) {
    onChange({ ...value, [key]: v });
  }

  function setType(type: string) {
    // Reset extra fields when the type changes.
    onChange({ ...value, prosthesis_type: type, extra_fields: {} });
  }

  function setExtra(name: string, v: string) {
    onChange({ ...value, extra_fields: { ...value.extra_fields, [name]: v } });
  }

  return (
    <div className="space-y-4">
      <Field label={t('type')} required>
        <Select value={value.prosthesis_type} onChange={(e) => setType(e.target.value)}>
          <option value="" disabled>
            {tw('selectType')}
          </option>
          {PROSTHESIS_TYPES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('material')} required>
          <Input value={value.material} onChange={(e) => set('material', e.target.value)} />
        </Field>
        <Field label={t('shade')} optional>
          <Select value={value.shade} onChange={(e) => set('shade', e.target.value)}>
            <option value="">{tw('selectShade')}</option>
            {VITA_SHADES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {selectedType && selectedType.extraFields.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          {selectedType.extraFields.map((f) => {
            const current = value.extra_fields[f.name] ?? '';
            if (f.type === 'checkbox') {
              return (
                <label key={f.name} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={current === 'true'}
                    onChange={(e) => setExtra(f.name, e.target.checked ? 'true' : 'false')}
                  />
                  {f.label}
                </label>
              );
            }
            if (f.type === 'select') {
              return (
                <Field key={f.name} label={f.label} optional>
                  <Select value={current} onChange={(e) => setExtra(f.name, e.target.value)}>
                    <option value="">—</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              );
            }
            return (
              <Field key={f.name} label={f.label} optional>
                <Input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={current}
                  onChange={(e) => setExtra(f.name, e.target.value)}
                />
              </Field>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
