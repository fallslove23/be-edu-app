'use client';

import React from 'react';
import InstructorManagement from '../../src/components/admin/InstructorManagement';
import RoleGuard from '../../src/components/auth/RoleGuard';

const InstructorManagementPage: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <InstructorManagement />
    </RoleGuard>
  );
};

export default InstructorManagementPage;
