import React from 'react';
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';

const PracticeEvaluationManagement: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="실습 평가 관리"
        description="실습 과제 평가 및 관리"
        badge="Practice Evaluation"
      />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          실습 평가 관리 기능은 준비 중입니다.
        </p>
      </div>
    </PageContainer>
  );
};

export default PracticeEvaluationManagement;
