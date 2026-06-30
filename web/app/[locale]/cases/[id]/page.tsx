'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { api } from '@/lib/api/client';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import AppShell from '@/components/layout/AppShell';
import CaseStatusBadge from '@/components/cases/CaseStatusBadge';
import CaseTimeline from '@/components/cases/CaseTimeline';
import MessageThread from '@/components/cases/MessageThread';
import FileUpload from '@/components/cases/FileUpload';
import ReturnForm from '@/components/cases/ReturnForm';
import ReceptionChecklist from '@/components/cases/ReceptionChecklist';
import SignaturePad from '@/components/cases/SignaturePad';
import PatientHistory from '@/components/cases/PatientHistory';
import { Button } from '@/components/ui';
import { Skeleton } from '@/components/ui/Loading';
import { getProsthesisType } from '@/lib/constants/prosthesisTypes';
import { deadlineColor, deadlineColorClasses, deadlineDays } from '@/lib/case/helpers';
import { generateDeliveryNote } from '@/lib/pdf/deliveryNote';
import { ApiClientError } from '@/lib/api/client';
import type {
  Case,
  CaseFile,
  CaseStatus,
  Lab,
  Message,
  ReceptionChecklist as Checklist,
  ReturnReason,
  StatusEvent
} from '@/types/case';

const STATUS_POLL_MS = 15000;
const MESSAGE_POLL_MS = 10000;

function CaseDetail({ caseId }: { caseId: string }) {
  const tc = useTranslations('case');
  const { user } = useAuth();
  const router = useRouter();

  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<CaseFile[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [notFound, setNotFound] = useState(false);

  const loadCase = useCallback(async () => {
    try {
      const [c, h] = await Promise.all([api.cases.get(caseId), api.cases.history(caseId)]);
      setCaseItem(c);
      setEvents(h);
    } catch {
      setNotFound(true);
    }
  }, [caseId]);

  const loadMessages = useCallback(() => {
    api.messages.list(caseId).then(setMessages).catch(() => {});
  }, [caseId]);

  const loadFiles = useCallback(() => {
    api.files.list(caseId).then(setFiles).catch(() => {});
  }, [caseId]);

  useEffect(() => {
    loadCase();
    loadMessages();
    loadFiles();
    api.auth.labs().then(setLabs).catch(() => {});
  }, [loadCase, loadMessages, loadFiles]);

  // Polling: status/history every 15s, messages every 10s (CLAUDE.md §10).
  useEffect(() => {
    const a = setInterval(loadCase, STATUS_POLL_MS);
    const b = setInterval(loadMessages, MESSAGE_POLL_MS);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [loadCase, loadMessages]);

  if (notFound) {
    return <p className="text-slate-500">Cas introuvable.</p>;
  }
  if (!caseItem || !user) {
    return (
      <div className="space-y-8">
        <div className="card space-y-4 p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    );
  }

  const typeLabel = getProsthesisType(caseItem.prosthesis_type)?.label ?? caseItem.prosthesis_type;
  const days = deadlineDays(caseItem.due_date);
  const color = deadlineColor(caseItem.due_date);
  const isLab = user.role === 'lab' && user.id === caseItem.lab_id;
  const isDentist = user.role === 'dentist' && user.id === caseItem.dentist_id;
  const canAdvance = isLab;
  const canDelete = isDentist && caseItem.status === 'new';
  const canReturn = isDentist && (caseItem.status === 'delivered' || caseItem.status === 'ready');
  const showSignature = caseItem.status === 'delivered';
  const labName = labs.find((l) => l.id === caseItem.lab_id)?.clinic_name ?? 'Laboratoire';

  async function onAdvance(status: CaseStatus, note?: string) {
    try {
      await api.cases.updateStatus(caseId, status, note);
      await loadCase();
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'final_photo_required') {
        alert(tc('finalPhotoRequired'));
      } else {
        alert(tc('actionError'));
      }
    }
  }

  async function onReturn(reasons: ReturnReason[], note?: string) {
    await api.cases.returnCase(caseId, reasons, note);
    await loadCase();
  }

  async function onReception(checklist: Checklist) {
    await api.cases.reception(caseId, checklist);
    await loadCase();
  }

  async function onSign(signature: string) {
    await api.cases.sign(caseId, signature);
    await loadCase();
  }

  async function onSend(content: string) {
    const msg = await api.messages.create(caseId, content);
    setMessages((prev) => [...prev, msg]); // optimistic append
  }

  async function onDelete() {
    if (!confirm(tc('deleteConfirm'))) return;
    await api.cases.remove(caseId);
    router.replace('/dashboard');
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{caseItem.patient_ref}</h1>
            <CaseStatusBadge status={caseItem.status} />
          </div>
          <p className="text-slate-500">
            {typeLabel} · {tc('teeth')}: {caseItem.teeth.join(', ')}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`rounded px-2 py-0.5 font-medium ${deadlineColorClasses[color]}`}>
              {tc('dueDate')}: {format(new Date(caseItem.due_date), 'dd/MM/yyyy')} ({days} j)
            </span>
            {caseItem.priority === 'urgent' ? (
              <span className="rounded bg-red-100 px-2 py-0.5 font-medium text-red-700">
                {tc('priorityUrgent')}
              </span>
            ) : null}
            {caseItem.shade ? (
              <span className="rounded bg-slate-100 px-2 py-0.5">
                {tc('shade')}: {caseItem.shade}
              </span>
            ) : null}
            <span className="rounded bg-slate-100 px-2 py-0.5">
              {tc('material')}: {caseItem.material}
            </span>
          </div>
          {caseItem.notes ? <p className="max-w-xl text-sm text-slate-600">{caseItem.notes}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          {caseItem.status === 'delivered' ? (
            <Button onClick={() => generateDeliveryNote(caseItem, labName)}>{tc('download')}</Button>
          ) : null}
          {canReturn ? <ReturnForm onSubmit={onReturn} /> : null}
          {canDelete ? (
            <Button variant="danger" onClick={onDelete}>
              {tc('delete')}
            </Button>
          ) : null}
        </div>
      </div>

      <ReceptionChecklist
        checklist={caseItem.reception_checklist}
        receivedAt={caseItem.received_at}
        editable={isLab}
        onConfirm={onReception}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <CaseTimeline
          events={events}
          currentStatus={caseItem.status}
          canAdvance={canAdvance}
          onAdvance={onAdvance}
        />
        <MessageThread messages={messages} currentUserId={user.id} onSend={onSend} />
      </div>

      <FileUpload caseId={caseId} files={files} currentUserId={user.id} onChange={loadFiles} />

      {showSignature && (isDentist || caseItem.delivery_signature) ? (
        <SignaturePad
          existing={caseItem.delivery_signature}
          onSave={isDentist ? onSign : async () => {}}
        />
      ) : null}

      <PatientHistory patientRef={caseItem.patient_ref} currentCaseId={caseItem.id} />
    </div>
  );
}

export default function CaseDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  return (
    <AppShell>
      <CaseDetail caseId={id} />
    </AppShell>
  );
}
