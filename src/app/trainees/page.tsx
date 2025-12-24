'use client';

import React from 'react';
import TraineeManagement from '@/components/trainees/TraineeManagement';
import RoleGuard from '@/components/auth/RoleGuard';

const TraineesPage: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <TraineeManagement />
    </RoleGuard>
  );
};

export default TraineesPage;
