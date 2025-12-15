import React from 'react';
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';

const InstructorEvaluation: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="강사 평가"
        description="학생 평가 입력"
        badge="Instructor Evaluation"
      />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          강사 평가 기능은 준비 중입니다.
        </p>
      </div>
    </PageContainer>
  );
};

export default InstructorEvaluation;
