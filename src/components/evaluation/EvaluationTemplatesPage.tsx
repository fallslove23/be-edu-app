/**
 * 평가 템플릿 페이지
 * - 평가 템플릿 관리만 표시
 */

import React from 'react';
import EvaluationTemplateManagement from './EvaluationTemplateManagement';

export default function EvaluationTemplatesPage() {
  return (
    <div className="p-6">
      <EvaluationTemplateManagement />
    </div>
  );
}
