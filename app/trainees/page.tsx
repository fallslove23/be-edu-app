'use client';

import React from 'react';
import TraineeManagement from '../../src/components/trainees/TraineeManagement';
import RoleGuard from '../../src/components/auth/RoleGuard';

const TraineesPage: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <TraineeManagement />
    </RoleGuard>
  );
};

export default TraineesPage;
