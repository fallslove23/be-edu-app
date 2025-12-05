import React from 'react';

const ScheduleViewerWrapper: React.FC = () => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
        🗓️ 시간표 뷰어
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {/* 요일 헤더 */}
        {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
          <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center font-bold text-gray-700 dark:text-gray-200">
            {day}
          </div>
        ))}

        {/* 시간표 그리드 */}
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl min-h-[200px] bg-white dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 text-center">
              {new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </div>
            {index === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-2 shadow-sm">
                <div className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-1">BS 기초과정</div>
                <div className="text-xs text-blue-600 dark:text-blue-300">09:00 - 12:00</div>
                <div className="text-xs text-blue-600 dark:text-blue-300">1강의실</div>
              </div>
            )}
            {index === 2 && (
              <div className="bg-green-500/10 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-2 shadow-sm">
                <div className="text-sm font-bold text-green-800 dark:text-green-200 mb-1">BS 심화과정</div>
                <div className="text-xs text-green-600 dark:text-green-300">14:00 - 17:00</div>
                <div className="text-xs text-green-600 dark:text-green-300">2강의실</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
        <button className="btn-secondary">
          이전 주
        </button>
        <span className="font-bold text-gray-800 dark:text-gray-200">
          2025년 1월 6일 - 1월 12일
        </span>
        <button className="btn-secondary">
          다음 주
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        ※ Firebase 플래너와 연동하여 실시간 스케줄을 표시합니다.
      </div>
    </div>
  );
};

export default ScheduleViewerWrapper;