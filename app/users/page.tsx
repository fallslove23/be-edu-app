'use client';

import React from 'react';
import UserManagement from '../../src/components/users/UserManagement';
import RoleGuard from '../../src/components/auth/RoleGuard';

const UsersPage: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <UserManagement />
    </RoleGuard>
  );
};

export default UsersPage;
