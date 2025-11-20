import React from 'react';

const ScheduleViewerWrapper: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">🗓️ 시간표 뷰어</h2>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {/* 요일 헤더 */}
        {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg text-center font-medium">
            {day}
          </div>
        ))}
        
        {/* 시간표 그리드 */}
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg min-h-[200px]">
            <div className="text-sm text-gray-500 mb-2">
              {new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </div>
            {index === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                <div className="text-sm font-medium text-blue-800">BS 기초과정</div>
                <div className="text-xs text-blue-600">09:00 - 12:00</div>
                <div className="text-xs text-blue-600">1강의실</div>
              </div>
            )}
            {index === 2 && (
              <div className="bg-green-500/10 border border-green-200 rounded p-2 mb-2">
                <div className="text-sm font-medium text-green-800">BS 심화과정</div>
                <div className="text-xs text-green-600">14:00 - 17:00</div>
                <div className="text-xs text-green-600">2강의실</div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <button className="btn-primary rounded-full">
          이전 주
        </button>
        <span className="font-medium text-gray-700">
          2025년 1월 6일 - 1월 12일
        </span>
        <button className="btn-primary rounded-full">
          다음 주
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        ※ Firebase 플래너와 연동하여 실시간 스케줄을 표시합니다.
      </div>
    </div>
  );
};

export default ScheduleViewerWrapper;