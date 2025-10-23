import React from 'react';
import { createRoot } from 'react-dom/client';

const SimpleApp = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>BS 학습 관리 시스템</h1>
      <p>앱이 정상적으로 로드되었습니다!</p>
      <div>현재 시간: {new Date().toLocaleString('ko-KR')}</div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<SimpleApp />);