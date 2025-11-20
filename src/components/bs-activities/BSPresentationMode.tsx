import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BSActivityService } from '../../services/bs-activity.service';
import type { BSActivity, BSPresentationOrder } from '../../types/bs-activity.types';
import { activityCategoryLabels, activityCategoryIcons } from '../../types/bs-activity.types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  UserGroupIcon,
  PresentationChartLineIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

interface BSPresentationModeProps {
  courseId: string;
  presentationDate: string;
  onClose: () => void;
}

const BSPresentationMode: React.FC<BSPresentationModeProps> = ({
  courseId,
  presentationDate,
  onClose
}) => {
  const { user } = useAuth();
  const [presentationOrders, setPresentationOrders] = useState<BSPresentationOrder[]>([]);
  const [currentPresenterIndex, setCurrentPresenterIndex] = useState(0);
  const [currentActivities, setCurrentActivities] = useState<BSActivity[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadPresentationData();
  }, [courseId, presentationDate]);

  useEffect(() => {
    if (presentationOrders.length > 0) {
      loadCurrentPresenterActivities();
    }
  }, [currentPresenterIndex, presentationOrders]);

  const loadPresentationData = async () => {
    try {
      setLoading(true);
      const orders = await BSActivityService.getPresentationOrders(courseId, presentationDate);
      setPresentationOrders(orders);
    } catch (error) {
      console.error('Load presentation data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentPresenterActivities = async () => {
    if (!presentationOrders[currentPresenterIndex]) return;

    try {
      const activities = await BSActivityService.getActivities({
        trainee_id: presentationOrders[currentPresenterIndex].trainee_id,
        course_id: courseId,
        submission_status: 'submitted'
      });
      setCurrentActivities(activities);
      setCurrentActivityIndex(0);
      setCurrentImageIndex(0);
    } catch (error) {
      console.error('Load activities error:', error);
    }
  };

  const handlePreviousPresenter = () => {
    if (currentPresenterIndex > 0) {
      setCurrentPresenterIndex(currentPresenterIndex - 1);
    }
  };

  const handleNextPresenter = () => {
    if (currentPresenterIndex < presentationOrders.length - 1) {
      setCurrentPresenterIndex(currentPresenterIndex + 1);
    }
  };

  const handlePreviousActivity = () => {
    if (currentActivityIndex > 0) {
      setCurrentActivityIndex(currentActivityIndex - 1);
      setCurrentImageIndex(0);
    }
  };

  const handleNextActivity = () => {
    if (currentActivityIndex < currentActivities.length - 1) {
      setCurrentActivityIndex(currentActivityIndex + 1);
      setCurrentImageIndex(0);
    }
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    const currentActivity = currentActivities[currentActivityIndex];
    if (currentActivity && currentImageIndex < currentActivity.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  if (presentationOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <PresentationChartLineIcon className="h-24 w-24 mb-4 text-gray-600" />
        <p className="text-xl">발표 순서가 설정되지 않았습니다.</p>
        <button
          onClick={onClose}
          className="mt-6 btn-primary"
        >
          닫기
        </button>
      </div>
    );
  }

  const currentPresenter = presentationOrders[currentPresenterIndex];
  const currentActivity = currentActivities[currentActivityIndex];
  const currentImage = currentActivity?.images[currentImageIndex];

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <UserGroupIcon className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-lg font-semibold">BS 활동 발표</h2>
            <p className="text-sm text-gray-400">
              발표자 {currentPresenterIndex + 1}/{presentationOrders.length}: {currentPresenter.trainee_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-gray-700 rounded-full hover:bg-gray-600"
          >
            {isFullscreen ? '전체화면 종료' : '전체화면'}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* 발표자 네비게이션 */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <button
          onClick={handlePreviousPresenter}
          disabled={currentPresenterIndex === 0}
          className="px-3 py-1 bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-5 w-5 inline" /> 이전 발표자
        </button>
        <div className="flex space-x-2">
          {presentationOrders.map((order, idx) => (
            <button
              key={order.id}
              onClick={() => setCurrentPresenterIndex(idx)}
              className={`px-3 py-1 rounded ${
                idx === currentPresenterIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        <button
          onClick={handleNextPresenter}
          disabled={currentPresenterIndex === presentationOrders.length - 1}
          className="px-3 py-1 bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          다음 발표자 <ChevronRightIcon className="h-5 w-5 inline" />
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽: 이미지 슬라이드 */}
        <div className="flex-1 flex items-center justify-center bg-black relative">
          {currentImage ? (
            <>
              <img
                src={currentImage.url}
                alt={currentActivity.title}
                className="max-h-full max-w-full object-contain"
              />
              {currentActivity.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black bg-opacity-50 px-4 py-2 rounded-full">
                  <button
                    onClick={handlePreviousImage}
                    disabled={currentImageIndex === 0}
                    className="p-2 hover:bg-gray-700 rounded-full disabled:opacity-30"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <span className="text-sm">
                    {currentImageIndex + 1} / {currentActivity.images.length}
                  </span>
                  <button
                    onClick={handleNextImage}
                    disabled={currentImageIndex === currentActivity.images.length - 1}
                    className="p-2 hover:bg-gray-700 rounded-full disabled:opacity-30"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-center">
              <PresentationChartLineIcon className="h-24 w-24 mx-auto mb-4" />
              <p>이미지가 없습니다</p>
            </div>
          )}
        </div>

        {/* 오른쪽: 발표 노트 */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          {currentActivity ? (
            <div className="p-6 space-y-4">
              {/* 활동 제목 */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-3xl">{activityCategoryIcons[currentActivity.category]}</span>
                  <span className="text-sm text-gray-400">
                    {activityCategoryLabels[currentActivity.category]}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-2">{currentActivity.title}</h3>
              </div>

              {/* 활동 메타 정보 */}
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {currentActivity.activity_date}
                </div>
                {currentActivity.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {currentActivity.location.address}
                  </div>
                )}
              </div>

              {/* 활동 내용 */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="font-semibold mb-2">활동 내용</h4>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {currentActivity.content}
                </p>
              </div>

              {/* 피드백 */}
              {currentActivity.feedback && (
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="font-semibold mb-2">강사 피드백</h4>
                  <div className="bg-blue-900 bg-opacity-30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        {currentActivity.feedback.reviewer_name}
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < currentActivity.feedback!.score ? 'text-yellow-400' : 'text-gray-600'}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300">{currentActivity.feedback.comment}</p>
                  </div>
                </div>
              )}

              {/* 활동 네비게이션 */}
              <div className="border-t border-gray-700 pt-4 flex justify-between">
                <button
                  onClick={handlePreviousActivity}
                  disabled={currentActivityIndex === 0}
                  className="px-4 py-2 bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-30"
                >
                  <ChevronLeftIcon className="h-5 w-5 inline" /> 이전 활동
                </button>
                <span className="text-sm text-gray-400 self-center">
                  {currentActivityIndex + 1} / {currentActivities.length}
                </span>
                <button
                  onClick={handleNextActivity}
                  disabled={currentActivityIndex === currentActivities.length - 1}
                  className="px-4 py-2 bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-30"
                >
                  다음 활동 <ChevronRightIcon className="h-5 w-5 inline" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>활동 내역이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 키보드 단축키 안내 */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-xs text-gray-500 flex justify-center space-x-6">
        <span>← → : 이미지 이동</span>
        <span>↑ ↓ : 활동 이동</span>
        <span>[ ] : 발표자 이동</span>
        <span>F : 전체화면</span>
        <span>ESC : 종료</span>
      </div>
    </div>
  );
};

export default BSPresentationMode;
