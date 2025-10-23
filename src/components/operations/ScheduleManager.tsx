import React, { useState } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const ScheduleManager: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📅 일정 관리</h1>
            <p className="text-gray-600">
              강의 일정 및 교실 배정을 관리합니다.
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium">
            <PlusIcon className="h-4 w-4" />
            <span>일정 추가</span>
          </button>
        </div>
      </div>

      {/* 네비게이션 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {formatDate(currentDate)}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 캘린더 뷰 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">일정 관리 시스템</h3>
          <p className="text-gray-600 mb-4">
            일정 추가 버튼을 클릭하여 새로운 일정을 등록하세요.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>✅ 캘린더 뷰로 일정 확인</p>
            <p>✅ 강의실 배정 관리</p>
            <p>✅ 강사 및 수강생 정보</p>
          </div>
        </div>
      </div>

      {/* 오늘의 일정 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📌 오늘의 일정</h3>
        <div className="space-y-4">
          {/* 샘플 일정 */}
          <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">BS Basic 과정</h4>
              <p className="text-sm text-gray-600 mt-1">09:00 - 12:00</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  강의실 101
                </span>
                <span>강사: 홍길동</span>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">BS Advanced 과정</h4>
              <p className="text-sm text-gray-600 mt-1">14:00 - 17:00</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  강의실 202
                </span>
                <span>강사: 김교수</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManager;
