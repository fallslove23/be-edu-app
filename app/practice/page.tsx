'use client';

import React from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import StudentPracticeDashboard from '../../src/components/evaluation/StudentPracticeDashboard';
import PracticeEvaluationManagement from '../../src/components/evaluation/PracticeEvaluationManagement';

const PracticePage: React.FC = () => {
  const { user } = useAuth();

  // 교육생은 StudentPracticeDashboard, 관리자/강사는 PracticeEvaluationManagement
  if (user?.role === 'trainee') {
    return <StudentPracticeDashboard />;
  }

  return <PracticeEvaluationManagement />;
};

export default PracticePage;
