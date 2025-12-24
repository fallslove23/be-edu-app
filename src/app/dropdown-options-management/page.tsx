'use client';

import React from 'react';
import DropdownOptionsManagement from '@/components/admin/DropdownOptionsManagement';
import RoleGuard from '@/components/auth/RoleGuard';

const DropdownOptionsManagementPage: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <DropdownOptionsManagement />
    </RoleGuard>
  );
};

export default DropdownOptionsManagementPage;
