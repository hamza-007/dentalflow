'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, ApiClientError } from '@/lib/api/client';
import { generateFichePdf } from '@/lib/pdf/fiche';
import { Button, Spinner } from '@/components/ui';
import type { Fiche, FicheSource } from '@/types/case';

function sourceLabel(sources: FicheSource[], sourceId: string): string {
  const s = sources.find((x) => x.source_id === sourceId);
  if (!s) return '';
  const head = [s.manufacturer, s.product].filter(Boolean).join(' ') || s.title;
  return `${head}${s.page ? ` p.${s.page}` : ''}`;
}

export default function FichePanel({
  caseId,
  isLab,
  patientRef
}: {
  caseId: string;
  isLab: boolean;
  patientRef: string;
}) {
  const t = useTranslations('fiche');
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.cases.fiche
      .latest(caseId)
      .then(setFiche)
      .catch(() => setFiche(null))
      .finally(() => setLoading(false));
  }, [caseId]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      setFiche(await api.cases.fiche.generate(caseId));
    } catch (e) {
      const key =
        e instanceof ApiClientError && e.code === 'fiche_unverified'
          ? 'errors.unverified'
          : 'errors.generic';
      setError(t(key));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{t('title')}</h3>
        <div className="flex gap-2">
          {fiche ? (
            <Button variant="secondary" onClick={() => generateFichePdf(fiche, patientRef)}>
              {t('download')}
            </Button>
          ) : null}
          {isLab ? (
            <Button onClick={generate} loading={generating}>
              {fiche ? t('regenerate') : t('generate')}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <Spinner />
      ) : !fiche ? (
        <p className="text-sm text-slate-500">{t('empty')}</p>
      ) : (
        <div className="space-y-4">
          <p className="data text-xs text-slate-400">
            v{fiche.version} · {fiche.content.case_summary.material}
          </p>

          {[...fiche.content.stages]
            .sort((a, b) => a.order - b.order)
            .map((stage) => (
              <div key={stage.order} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold text-ink">
                  {stage.order}. {stage.title}
                </p>
                {stage.instructions ? (
                  <p className="mt-1 text-sm text-slate-600">{stage.instructions}</p>
                ) : null}
                {stage.parameters.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {stage.parameters.map((p, i) => (
                      <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        <span className="text-slate-500">{p.label}:</span>
                        <span className="data font-medium text-slate-800">
                          {p.value}
                          {p.unit ? ` ${p.unit}` : ''}
                        </span>
                        {p.source_id ? (
                          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] text-brand-700">
                            {sourceLabel(fiche.sources, p.source_id) || t('cited')}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}

          {fiche.content.qc_checklist.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-slate-700">{t('qc')}</p>
              <ul className="mt-1 space-y-0.5 text-sm text-slate-600">
                {fiche.content.qc_checklist.map((q, i) => (
                  <li key={i}>☐ {q}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {fiche.content.missing_data.length > 0 ? (
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-800">{t('missing')}</p>
              <ul className="mt-1 space-y-0.5 text-sm text-amber-700">
                {fiche.content.missing_data.map((m, i) => (
                  <li key={i}>– {m}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-xs italic text-slate-400">{fiche.content.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
