'use client';

import React from 'react';
import DropdownOptionsManagement from '../../src/components/admin/DropdownOptionsManagement';
import RoleGuard from '../../src/components/auth/RoleGuard';

const DropdownOptionsManagementPage: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <DropdownOptionsManagement />
    </RoleGuard>
  );
};

export default DropdownOptionsManagementPage;
