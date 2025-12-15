'use client';

import React from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import StudentExamDashboard from '../../src/components/exam/StudentExamDashboard';
import ExamManagement from '../../src/components/exam/ExamManagement';

const ExamsPage: React.FC = () => {
  const { user } = useAuth();

  // 교육생은 StudentExamDashboard, 관리자/강사는 ExamManagement
  if (user?.role === 'trainee') {
    return <StudentExamDashboard />;
  }

  return <ExamManagement />;
};

export default ExamsPage;
