import { CaseGridSkeleton } from '@/components/ui/Loading';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="skeleton mb-6 h-8 w-40 rounded-md" />
      <CaseGridSkeleton />
    </div>
  );
}
