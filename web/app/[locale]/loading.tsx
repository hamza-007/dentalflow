import { PageLoader } from '@/components/ui/Loading';

// Route-transition / Suspense fallback for the whole locale subtree.
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <PageLoader />
    </div>
  );
}
