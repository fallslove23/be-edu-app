'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StudentExamDashboard from '@/components/exam/StudentExamDashboard';
import ExamManagement from '@/components/exam/ExamManagement';

const ExamsPage: React.FC = () => {
  const { user } = useAuth();

  // 교육생은 StudentExamDashboard, 관리자/강사는 ExamManagement
  if (user?.role === 'trainee') {
    return <StudentExamDashboard />;
  }

  return <ExamManagement />;
};

export default ExamsPage;
