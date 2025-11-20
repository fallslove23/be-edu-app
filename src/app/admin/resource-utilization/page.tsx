import { ResourceUtilizationDashboard } from '@/components/dashboard/ResourceUtilizationDashboard';

/**
 * 자원 활용도 대시보드 페이지
 * Phase 3: 통합 대시보드
 */
export default function ResourceUtilizationPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <ResourceUtilizationDashboard />
      </div>
    </div>
  );
}
