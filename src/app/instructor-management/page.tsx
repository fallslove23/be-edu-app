'use client';

import React from 'react';
import InstructorManagement from '@/components/admin/InstructorManagement';
import RoleGuard from '@/components/auth/RoleGuard';

const InstructorManagementPage: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <InstructorManagement />
    </RoleGuard>
  );
};

export default InstructorManagementPage;
