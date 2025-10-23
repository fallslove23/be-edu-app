import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  CameraIcon,
  PhotoIcon,
  LinkIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import type { BSActivityEntry as BSActivityEntryType } from '../../types/activity-journal.types';

interface BSActivityEntryProps {
  courseCode: string;
  courseName: string;
  round: number;
  submissionDeadline: string;
  onSave: (entry: Partial<BSActivityEntryType>) => Promise<void>;
  onCancel: () => void;
  editingEntry?: Partial<BSActivityEntryType>;
}

const BSActivityEntry: React.FC<BSActivityEntryProps> = ({
  courseCode,
  courseName,
  round,
  submissionDeadline,
  onSave,
  onCancel,
  editingEntry
}) => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState<Partial<BSActivityEntryType>>({
    title: '',
    workSite: '',
    workDate: new Date().toISOString().split('T')[0],
    workContent: '',
    learningPoints: '',
    challenges: '',
    solutions: '',
    insights: '',
    improvementAreas: '',
    nextActions: '',
    attachments: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeadlineWarning, setShowDeadlineWarning] = useState(false);

  useEffect(() => {
    // 모바일 기기 감지
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // 편집 모드인 경우 기존 데이터 로드
    if (editingEntry) {
      setFormData(editingEntry);
    }
  }, [editingEntry]);

  useEffect(() => {
    // 마감 시간 체크 (발표 전날 23:59)
    const checkDeadline = () => {
      const now = new Date();
      const deadline = new Date(submissionDeadline);
      const timeRemaining = deadline.getTime() - now.getTime();
      const hoursRemaining = timeRemaining / (1000 * 60 * 60);
      
      setShowDeadlineWarning(hoursRemaining <= 24 && hoursRemaining > 0);
    };

    checkDeadline();
    const interval = setInterval(checkDeadline, 60000); // 1분마다 체크
    return () => clearInterval(interval);
  }, [submissionDeadline]);

  // 발표 윈도우 계산 (과정 시작일 기준 1/3/5/7/9/11일차)
  const calculatePresentationWindow = (courseStartDate: string, currentDate: string) => {
    const start = new Date(courseStartDate);
    const current = new Date(currentDate);
    const diffTime = Math.abs(current.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const presentationDays = [1, 3, 5, 7, 9, 11];
    const nextPresentationDay = presentationDays.find(day => day >= diffDays);
    
    return {
      currentDay: diffDays,
      nextPresentationDay,
      isPresentationWindow: presentationDays.includes(diffDays)
    };
  };

  // 모바일 최적화 이미지 촬영/선택
  const handleImageCapture = async () => {
    if (isMobile && 'mediaDevices' in navigator) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } // 후면 카메라 사용
        });
        
        // 실제 구현에서는 카메라 UI를 표시하고 촬영된 이미지를 처리
        console.log('카메라 스트림 획득:', stream);
        
        // 임시로 파일 선택 대화상자 표시
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = handleFileSelect;
        input.click();
        
      } catch (error) {
        console.error('카메라 접근 실패:', error);
        // 폴백: 파일 선택
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = handleFileSelect;
        input.click();
      }
    } else {
      // 데스크탑: 파일 선택
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = handleFileSelect;
      input.click();
    }
  };

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const newAttachments = Array.from(target.files).map(file => ({
        id: `attachment-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString()
      }));
      
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...newAttachments]
      }));
    }
  };

  // 위치 정보 자동 입력 (모바일 최적화)
  const handleLocationCapture = async () => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5분
          });
        });
        
        const { latitude, longitude } = position.coords;
        
        // 실제 환경에서는 역지오코딩 API를 사용해 주소로 변환
        const locationName = `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`;
        
        setFormData(prev => ({
          ...prev,
          workSite: prev.workSite ? `${prev.workSite} (${locationName})` : locationName
        }));
        
      } catch (error) {
        console.error('위치 정보 획득 실패:', error);
        alert('위치 정보를 가져올 수 없습니다. 수동으로 입력해주세요.');
      }
    } else {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
    }
  };

  const handleSubmit = async (isDraft = false) => {
    if (!formData.title?.trim() || !formData.workContent?.trim()) {
      alert('제목과 업무 내용은 필수 입력 항목입니다.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData: Partial<BSActivityEntryType> = {
        ...formData,
        id: editingEntry?.id,
        courseCode,
        courseName,
        round,
        studentId: user?.id,
        studentName: user?.name,
        status: isDraft ? 'draft' : 'submitted',
        submittedAt: isDraft ? undefined : new Date().toISOString(),
        submissionDeadline,
        isLateSubmission: new Date() > new Date(submissionDeadline)
      };

      await onSave(submitData);
      
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleString('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-safe' : ''}`}>
      {/* 모바일 최적화 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {editingEntry ? 'BS 활동 수정' : 'BS 활동 기록'}
              </h1>
              <p className="text-sm text-gray-600">
                {isMobile ? <DevicePhoneMobileIcon className="h-4 w-4 inline mr-1" /> : <ComputerDesktopIcon className="h-4 w-4 inline mr-1" />}
                {courseName} {round}차
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            ) : (
              <>
                <button
                  onClick={() => handleSubmit(true)}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  임시저장
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  제출
                </button>
              </>
            )}
          </div>
        </div>

        {/* 마감 시간 경고 */}
        {showDeadlineWarning && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mx-4 mb-2 rounded">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">마감 임박!</p>
                <p className="text-xs text-yellow-700">
                  제출 마감: {formatDeadline(submissionDeadline)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 모바일 최적화 폼 */}
      <div className="p-4 space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📝 기본 정보</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                활동 제목 *
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="오늘 수행한 주요 활동을 한 줄로 요약해주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  활동 현장 *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.workSite || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, workSite: e.target.value }))}
                    placeholder="예: 서울 강남지점, 고객사 A"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {isMobile && (
                    <button
                      type="button"
                      onClick={handleLocationCapture}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                      title="현재 위치 추가"
                    >
                      <MapPinIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  활동 날짜 *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.workDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, workDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <CalendarDaysIcon className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 활동 내용 - 모바일 최적화 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">💼 활동 내용</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수행한 업무 내용 *
              </label>
              <textarea
                value={formData.workContent || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, workContent: e.target.value }))}
                placeholder="오늘 현장에서 수행한 구체적인 업무 내용을 상세히 작성해주세요..."
                rows={isMobile ? 4 : 6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학습 포인트
              </label>
              <textarea
                value={formData.learningPoints || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, learningPoints: e.target.value }))}
                placeholder="오늘 활동을 통해 새롭게 배운 점이나 깨달은 점을 작성해주세요..."
                rows={isMobile ? 3 : 4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* 개선 및 발전 방향 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 개선 및 발전</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                어려웠던 점 / 문제점
              </label>
              <textarea
                value={formData.challenges || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
                placeholder="활동 중 어려웠던 점이나 발생한 문제점을 작성해주세요..."
                rows={isMobile ? 3 : 4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                해결 방안 / 개선 아이디어
              </label>
              <textarea
                value={formData.solutions || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, solutions: e.target.value }))}
                placeholder="문제 해결을 위한 방안이나 개선 아이디어를 작성해주세요..."
                rows={isMobile ? 3 : 4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                다음 활동 계획
              </label>
              <textarea
                value={formData.nextActions || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, nextActions: e.target.value }))}
                placeholder="다음 활동에서 적용하거나 개선하고 싶은 점을 작성해주세요..."
                rows={isMobile ? 3 : 4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* 첨부 파일 - 모바일 최적화 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">📎 첨부 파일</h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleImageCapture}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                {isMobile ? <CameraIcon className="h-4 w-4" /> : <PhotoIcon className="h-4 w-4" />}
                <span>{isMobile ? '촬영' : '이미지'}</span>
              </button>
            </div>
          </div>

          {formData.attachments && formData.attachments.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {formData.attachments.map((attachment) => (
                <div key={attachment.id} className="relative">
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-full h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      attachments: prev.attachments?.filter(a => a.id !== attachment.id)
                    }))}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 모바일 하단 고정 버튼 */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe">
            <div className="flex space-x-3">
              <button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="flex-1 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
              >
                임시저장
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
              >
                {isSubmitting ? '제출 중...' : '제출하기'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BSActivityEntry;