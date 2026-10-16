'use client';
import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDealPilot, getResumeRoute } from '@/context/DealPilotContext';

export default function DealIndexPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const router = useRouter();
  const { deal, role } = useDealPilot();

  useEffect(() => {
    if (deal) {
      const target = getResumeRoute(deal, role);
      router.replace(target);
    } else {
      router.replace(`/deals/${dealId}/brief`);
    }
  }, [deal, role, dealId, router]);

  return (
    <div className="task-page-container">
      <div className="empty">
        <p>Loading destination…</p>
      </div>
    </div>
  );
}
