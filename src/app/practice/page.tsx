'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StudentPracticeDashboard from '@/components/evaluation/StudentPracticeDashboard';
import PracticeEvaluationManagement from '@/components/evaluation/PracticeEvaluationManagement';

const PracticePage: React.FC = () => {
  const { user } = useAuth();

  // 교육생은 StudentPracticeDashboard, 관리자/강사는 PracticeEvaluationManagement
  if (user?.role === 'trainee') {
    return <StudentPracticeDashboard />;
  }

  return <PracticeEvaluationManagement />;
};

export default PracticePage;
