'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, fileUrl } from '@/lib/api/client';
import type { CaseFile } from '@/types/case';
import { Button, Select } from '@/components/ui';

const IMAGE_RE = /\.(png|jpe?g|gif|webp|bmp)$/i;
const FILE_TYPES = ['photo', 'scan', 'xray', 'final', 'other'] as const;

export default function FileUpload({
  caseId,
  files,
  currentUserId,
  onChange
}: {
  caseId: string;
  files: CaseFile[];
  currentUserId: string;
  onChange: () => void;
}) {
  const t = useTranslations('files');
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState<string>('photo');

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(list)) {
        await api.files.upload(caseId, file, fileType);
      }
      onChange();
    } finally {
      setUploading(false);
    }
  }

  async function remove(fileId: string) {
    await api.files.remove(caseId, fileId);
    onChange();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{t('title')}</h2>
        <Select value={fileType} onChange={(e) => setFileType(e.target.value)} className="max-w-[10rem]">
          {FILE_TYPES.map((ft) => (
            <option key={ft} value={ft}>
              {t(`type.${ft}`)}
            </option>
          ))}
        </Select>
      </div>

      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 hover:bg-slate-100"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <span>{uploading ? t('uploading') : t('drop')}</span>
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {files.length === 0 ? (
        <p className="text-sm text-slate-500">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((f) => (
            <div key={f.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {IMAGE_RE.test(f.file_name) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(f.file_url)} alt={f.file_name} className="h-28 w-full object-cover" />
              ) : (
                <div className="flex h-28 items-center justify-center text-xs text-slate-400">
                  {f.file_name}
                </div>
              )}
              <div className="flex items-center justify-between gap-1 p-2">
                <span className="truncate text-xs text-slate-600">
                  <span className="mr-1 rounded bg-slate-100 px-1 text-[10px] uppercase text-slate-500">
                    {f.file_type}
                  </span>
                  {f.file_name}
                </span>
                {f.uploaded_by === currentUserId ? (
                  <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => remove(f.id)}>
                    {t('delete')}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
