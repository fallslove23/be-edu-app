import React from 'react';

function TestApp() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">🧪 초간단 테스트 앱</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2">앱이 정상적으로 로드되었습니다!</h2>
        <p className="text-gray-600">이 메시지가 보인다면 React 앱이 올바르게 렌더링되고 있습니다.</p>
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p className="text-green-800">✅ 렌더링 성공</p>
        </div>
      </div>
    </div>
  );
}

export default TestApp;