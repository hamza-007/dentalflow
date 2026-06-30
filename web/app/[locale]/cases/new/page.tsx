'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import AppShell from '@/components/layout/AppShell';
import ToothChart from '@/components/cases/ToothChart';
import ProsthesisForm, { type ProsthesisValue } from '@/components/cases/ProsthesisForm';
import { Button, Field, Input, RequiredLegend, Select, Textarea } from '@/components/ui';
import { getProsthesisType } from '@/lib/constants/prosthesisTypes';
import type { Lab, Priority } from '@/types/case';

interface WizardState {
  lab_id: string;
  patient_ref: string;
  teeth: string[];
  prosthesis: ProsthesisValue;
  priority: Priority;
  due_date: string;
  notes: string;
  files: File[];
}

const emptyState: WizardState = {
  lab_id: '',
  patient_ref: '',
  teeth: [],
  prosthesis: { prosthesis_type: '', material: '', shade: '', extra_fields: {} },
  priority: 'normal',
  due_date: '',
  notes: '',
  files: []
};

function Wizard() {
  const t = useTranslations('wizard');
  const tc = useTranslations('case');
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(emptyState);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    api.auth.labs().then(setLabs).catch(() => setLabs([]));
  }, []);

  // Required fields for step 1, with their labels (for the missing-fields list).
  const missing: string[] = [];
  if (!state.lab_id) missing.push(tc('lab'));
  if (!state.patient_ref.trim()) missing.push(tc('patientRef'));
  if (state.teeth.length === 0) missing.push(tc('teeth'));
  if (!state.prosthesis.prosthesis_type) missing.push(tc('type'));
  if (!state.prosthesis.material.trim()) missing.push(tc('material'));
  if (!state.due_date) missing.push(tc('dueDate'));

  function goNext() {
    if (step === 1 && missing.length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep((s) => s + 1);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.cases.create({
        lab_id: state.lab_id,
        patient_ref: state.patient_ref.trim(),
        teeth: state.teeth,
        prosthesis_type: state.prosthesis.prosthesis_type,
        material: state.prosthesis.material.trim(),
        shade: state.prosthesis.shade || undefined,
        priority: state.priority,
        due_date: state.due_date,
        notes: state.notes || undefined,
        extra_fields: state.prosthesis.extra_fields
      });

      // Upload any files collected in step 2 to the freshly created case.
      for (const file of state.files) {
        await api.files.upload(created.id, file, 'photo');
      }

      router.replace(`/cases/${created.id}`);
    } catch {
      setError(t('creating'));
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>

      <ol className="flex gap-2 text-sm">
        {[t('step1'), t('step2'), t('step3')].map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-lg border px-3 py-2 text-center ${
              step === i + 1
                ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                : 'border-slate-200 text-slate-500'
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <div className="space-y-5">
          <RequiredLegend />
          <Field label={tc('lab')} required>
            <Select
              value={state.lab_id}
              onChange={(e) => setState({ ...state, lab_id: e.target.value })}
            >
              <option value="">{t('selectLab')}</option>
              {labs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.clinic_name}
                  {l.city ? ` — ${l.city}` : ''}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={tc('patientRef')} required>
            <Input
              value={state.patient_ref}
              onChange={(e) => setState({ ...state, patient_ref: e.target.value })}
              placeholder="ex. AB-1990"
            />
          </Field>

          <Field label={tc('teeth')} required>
            <ToothChart
              value={state.teeth}
              onChange={(teeth) => setState({ ...state, teeth })}
            />
          </Field>

          <ProsthesisForm
            value={state.prosthesis}
            onChange={(prosthesis) => setState({ ...state, prosthesis })}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={tc('dueDate')} required>
              <Input
                type="date"
                value={state.due_date}
                onChange={(e) => setState({ ...state, due_date: e.target.value })}
              />
            </Field>
            <Field label={tc('priority')}>
              <Select
                value={state.priority}
                onChange={(e) => setState({ ...state, priority: e.target.value as Priority })}
              >
                <option value="normal">{tc('priorityNormal')}</option>
                <option value="urgent">{tc('priorityUrgent')}</option>
              </Select>
            </Field>
          </div>

          <Field label={tc('notes')} optional>
            <Textarea
              rows={3}
              value={state.notes}
              onChange={(e) => setState({ ...state, notes: e.target.value })}
            />
          </Field>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500 hover:bg-slate-100">
            <span>Cliquez pour ajouter des photos</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                setState({ ...state, files: [...state.files, ...Array.from(e.target.files ?? [])] })
              }
            />
          </label>
          {state.files.length > 0 ? (
            <ul className="space-y-1 text-sm text-slate-600">
              {state.files.map((f, i) => (
                <li key={i} className="flex justify-between rounded bg-white px-3 py-2 shadow-sm">
                  <span>{f.name}</span>
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={() =>
                      setState({ ...state, files: state.files.filter((_, idx) => idx !== i) })
                    }
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <p className="text-slate-500">{t('review')}</p>
          <Row label={tc('lab')} value={labs.find((l) => l.id === state.lab_id)?.clinic_name ?? '—'} />
          <Row label={tc('patientRef')} value={state.patient_ref} />
          <Row label={tc('teeth')} value={state.teeth.join(', ')} />
          <Row
            label={tc('type')}
            value={getProsthesisType(state.prosthesis.prosthesis_type)?.label ?? '—'}
          />
          <Row label={tc('material')} value={state.prosthesis.material} />
          <Row label={tc('shade')} value={state.prosthesis.shade || '—'} />
          <Row label={tc('dueDate')} value={state.due_date} />
          <Row
            label={tc('priority')}
            value={state.priority === 'urgent' ? tc('priorityUrgent') : tc('priorityNormal')}
          />
          <Row label="Fichiers" value={`${state.files.length}`} />
          {error ? <p className="text-red-600">{error}</p> : null}
        </div>
      ) : null}

      {step === 1 && showErrors && missing.length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-medium">{t('missingFields')}</p>
          <ul className="mt-1 list-inside list-disc">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          {t('back')}
        </Button>
        {step < 3 ? (
          <Button onClick={goNext}>{t('next')}</Button>
        ) : (
          <Button onClick={submit} loading={submitting}>
            {submitting ? t('creating') : t('submit')}
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1.5 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

export default function NewCasePage() {
  return (
    <AppShell role="dentist">
      <Wizard />
    </AppShell>
  );
}
