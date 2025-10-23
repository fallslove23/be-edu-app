import React, { useState, useRef, useCallback } from 'react';
import {
  PhotoIcon,
  DocumentIcon,
  TrashIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CameraIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import MobileCamera from '../camera/MobileCamera';
import PhotoPreview from '../camera/PhotoPreview';
import type { BSActivityEntry, ActivityAttachment } from '../../types/activity-journal.types';

interface JournalFormProps {
  entry?: Partial<BSActivityEntry>;
  courseCode: string;
  courseName: string;
  round: number;
  onSave: (entry: Partial<BSActivityEntry>) => Promise<void>;
  onCancel: () => void;
  submissionDeadline: string;
}

const JournalForm: React.FC<JournalFormProps> = ({
  entry,
  courseCode,
  courseName,
  round,
  onSave,
  onCancel,
  submissionDeadline
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: entry?.title || '',
    workSite: entry?.workSite || '',
    workDate: entry?.workDate || new Date().toISOString().split('T')[0],
    workContent: entry?.workContent || '',
    learningPoints: entry?.learningPoints || '',
    challenges: entry?.challenges || '',
    solutions: entry?.solutions || '',
    insights: entry?.insights || '',
    improvementAreas: entry?.improvementAreas || '',
    nextActions: entry?.nextActions || ''
  });

  const [attachments, setAttachments] = useState<ActivityAttachment[]>(entry?.attachments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  // 마감일까지 남은 시간 계산
  const timeUntilDeadline = useCallback(() => {
    const deadline = new Date(submissionDeadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true, text: '마감됨' };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return { expired: false, text: `${days}일 ${hours}시간 남음` };
    return { expired: false, text: `${hours}시간 남음` };
  }, [submissionDeadline]);

  const deadlineInfo = timeUntilDeadline();

  // 입력값 변경 처리
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 카메라로 촬영한 사진 처리
  const handleCameraCapture = (imageData: string, imageFile: File) => {
    try {
      const newAttachment: ActivityAttachment = {
        id: `photo-${Date.now()}-${Math.random()}`,
        fileName: imageFile.name,
        fileType: 'image',
        fileUrl: imageData,
        uploadedAt: new Date().toISOString()
      };

      setAttachments(prev => [...prev, newAttachment]);
      setShowCamera(false);
      
      // 필수 사진 에러 제거
      if (errors.photos) {
        setErrors(prev => ({ ...prev, photos: '' }));
      }
    } catch (error) {
      console.error('사진 저장 실패:', error);
      alert('사진 저장에 실패했습니다.');
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`파일 크기가 너무 큽니다: ${file.name} (최대 10MB)`);
        continue;
      }

      // 지원하는 파일 형식 체크
      const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'];
      if (!supportedTypes.includes(file.type)) {
        alert(`지원하지 않는 파일 형식입니다: ${file.name}`);
        continue;
      }

      try {
        // 실제 환경에서는 서버에 업로드
        const fileUrl = URL.createObjectURL(file);
        const newAttachment: ActivityAttachment = {
          id: `attachment-${Date.now()}-${Math.random()}`,
          fileName: file.name,
          fileType: file.type.startsWith('image/') ? 'image' : 'document',
          fileUrl,
          uploadedAt: new Date().toISOString()
        };

        setAttachments(prev => [...prev, newAttachment]);
      } catch (error) {
        console.error('파일 업로드 실패:', error);
        alert('파일 업로드에 실패했습니다.');
      }
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 첨부파일 삭제
  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  // 폼 검증
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = '제목을 입력해주세요';
    if (!formData.workSite.trim()) newErrors.workSite = '현장 업무 장소를 입력해주세요';
    if (!formData.workDate) newErrors.workDate = '업무 수행 날짜를 선택해주세요';
    if (!formData.workContent.trim()) newErrors.workContent = '수행한 업무 내용을 입력해주세요';
    if (!formData.learningPoints.trim()) newErrors.learningPoints = '학습 포인트를 입력해주세요';
    
    // 필수 사진 체크
    const photoAttachments = attachments.filter(att => att.fileType === 'image');
    if (photoAttachments.length === 0) {
      newErrors.photos = '현장 활동 사진을 최소 1장 이상 촬영해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 임시저장
  const handleSaveDraft = async () => {
    const entryData: Partial<BSActivityEntry> = {
      ...entry,
      courseCode,
      courseName,
      round,
      studentId: user?.id || '',
      studentName: user?.name || '',
      ...formData,
      attachments,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      submissionDeadline,
      isLateSubmission: new Date() > new Date(submissionDeadline)
    };

    try {
      await onSave(entryData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('임시저장 실패:', error);
      alert('임시저장에 실패했습니다.');
    }
  };

  // 제출
  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (deadlineInfo.expired) {
      alert('제출 마감일이 지났습니다.');
      return;
    }

    setIsSubmitting(true);

    const entryData: Partial<BSActivityEntry> = {
      ...entry,
      courseCode,
      courseName,
      round,
      studentId: user?.id || '',
      studentName: user?.name || '',
      ...formData,
      attachments,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submissionDeadline,
      isLateSubmission: new Date() > new Date(submissionDeadline),
      scoreReflected: false
    };

    try {
      await onSave(entryData);
      alert('활동일지가 성공적으로 제출되었습니다!');
      onCancel(); // 폼 닫기
    } catch (error) {
      console.error('제출 실패:', error);
      alert('제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 - 모바일 최적화 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 text-center flex-1">
              BS 활동일지 작성
            </h1>
            <div className="w-10"></div> {/* 균형을 위한 빈 공간 */}
          </div>
          
          <div className="text-sm text-gray-600 text-center">
            {courseCode} · {round}차 · {courseName}
          </div>
          
          {/* 마감일 표시 */}
          <div className={`text-xs text-center mt-2 p-2 rounded-md ${
            deadlineInfo.expired 
              ? 'bg-red-100 text-red-700' 
              : new Date(submissionDeadline).getTime() - Date.now() < 24 * 60 * 60 * 1000
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-blue-100 text-blue-700'
          }`}>
            <ClockIcon className="h-4 w-4 inline mr-1" />
            제출 마감: {new Date(submissionDeadline).toLocaleDateString('ko-KR', { 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })} ({deadlineInfo.text})
          </div>
        </div>
      </div>

      {/* 성공 메시지 */}
      {showSuccess && (
        <div className="fixed top-20 left-4 right-4 z-20 bg-green-100 border border-green-200 rounded-lg p-3 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800 text-sm">임시저장되었습니다</span>
        </div>
      )}

      {/* 폼 내용 */}
      <div className="p-4 space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 기본 정보</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="오늘의 활동을 한 줄로 요약해주세요"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  현장 장소 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.workSite}
                  onChange={(e) => handleInputChange('workSite', e.target.value)}
                  placeholder="OO지점, OO현장 등"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.workSite ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.workSite && <p className="text-red-500 text-xs mt-1">{errors.workSite}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                  업무 날짜 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.workDate}
                  onChange={(e) => handleInputChange('workDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.workDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.workDate && <p className="text-red-500 text-xs mt-1">{errors.workDate}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* 업무 내용 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💼 업무 활동</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수행한 업무 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.workContent}
                onChange={(e) => handleInputChange('workContent', e.target.value)}
                placeholder="오늘 어떤 업무를 수행했는지 구체적으로 작성해주세요"
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.workContent ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.workContent && <p className="text-red-500 text-xs mt-1">{errors.workContent}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학습 포인트 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.learningPoints}
                onChange={(e) => handleInputChange('learningPoints', e.target.value)}
                placeholder="오늘 업무에서 배운 점, 새롭게 알게 된 점을 작성해주세요"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.learningPoints ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.learningPoints && <p className="text-red-500 text-xs mt-1">{errors.learningPoints}</p>}
            </div>
          </div>
        </div>

        {/* 어려움과 해결방안 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🤔 문제해결</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                어려웠던 점
              </label>
              <textarea
                value={formData.challenges}
                onChange={(e) => handleInputChange('challenges', e.target.value)}
                placeholder="업무 수행 중 어렵거나 힘들었던 점이 있다면 작성해주세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                해결 방안
              </label>
              <textarea
                value={formData.solutions}
                onChange={(e) => handleInputChange('solutions', e.target.value)}
                placeholder="어려움을 어떻게 해결했는지, 또는 해결 방안을 작성해주세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* 성찰과 개선 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💡 성찰과 계획</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                배운 점 / 깨달은 점
              </label>
              <textarea
                value={formData.insights}
                onChange={(e) => handleInputChange('insights', e.target.value)}
                placeholder="오늘의 경험을 통해 깨달은 점이나 느낀 점을 작성해주세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                개선이 필요한 부분
              </label>
              <textarea
                value={formData.improvementAreas}
                onChange={(e) => handleInputChange('improvementAreas', e.target.value)}
                placeholder="앞으로 개선하거나 보완해야 할 부분을 작성해주세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                다음에 할 일
              </label>
              <textarea
                value={formData.nextActions}
                onChange={(e) => handleInputChange('nextActions', e.target.value)}
                placeholder="다음 업무나 학습에서 시도해볼 것들을 작성해주세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* 첨부파일 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📷 현장 사진 및 첨부파일 
            <span className="text-red-500 text-sm ml-1">(사진 필수)</span>
          </h2>
          
          <div className="space-y-4">
            {/* 필수 사진 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <ExclamationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">현장 활동 사진 촬영 필수</p>
                  <p className="text-xs text-blue-700 mt-1">
                    현장에서 수행한 업무 활동을 증명할 수 있는 사진을 최소 1장 이상 촬영해주세요.
                  </p>
                </div>
              </div>
            </div>

            {/* 카메라 촬영 버튼 */}
            <button
              onClick={() => setShowCamera(true)}
              className="w-full p-4 border-2 border-dashed border-blue-300 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors bg-blue-25"
            >
              <CameraIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-blue-700 font-medium">📸 현장 사진 촬영하기</p>
              <p className="text-xs text-blue-600 mt-1">모바일 카메라로 현장 활동 사진을 촬영하세요</p>
            </button>

            {/* 기존 파일 업로드 버튼 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <PhotoIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <p className="text-sm text-gray-600">또는 갤러리에서 선택</p>
              <p className="text-xs text-gray-500">최대 10MB, 이미지/PDF/문서 파일</p>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* 에러 메시지 */}
            {errors.photos && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-700">{errors.photos}</p>
                </div>
              </div>
            )}

            {/* 첨부된 파일 목록 */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  첨부된 파일 ({attachments.length})
                </h3>
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {attachment.fileType === 'image' ? (
                        <button
                          onClick={() => setShowPhotoPreview(true)}
                          className="relative group"
                        >
                          <PhotoIcon className="h-5 w-5 text-green-500 group-hover:text-green-600" />
                          {attachment.fileUrl.startsWith('data:') && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </button>
                      ) : (
                        <DocumentIcon className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <span className="text-sm text-gray-700 truncate">{attachment.fileName}</span>
                        {attachment.fileType === 'image' && (
                          <div className="text-xs text-green-600">✓ 현장 사진</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                      title="삭제"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {/* 사진 통계 및 미리보기 버튼 */}
                <div className="text-center mt-3">
                  <div className="text-xs text-gray-500 mb-2">
                    현장 사진: {attachments.filter(att => att.fileType === 'image').length}장 
                    {attachments.filter(att => att.fileType === 'image').length > 0 && 
                      <span className="text-green-600 ml-1">✓ 필수 조건 충족</span>
                    }
                  </div>
                  {attachments.filter(att => att.fileType === 'image').length > 0 && (
                    <button
                      onClick={() => setShowPhotoPreview(true)}
                      className="text-blue-600 text-sm hover:text-blue-700 underline"
                    >
                      📷 사진 전체보기
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 버튼 - 모바일 최적화 */}
      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <div className="flex space-x-3">
          <button
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
          >
            임시저장
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || deadlineInfo.expired}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isSubmitting ? '제출 중...' : deadlineInfo.expired ? '마감됨' : '제출하기'}
          </button>
        </div>
        
        {deadlineInfo.expired && (
          <div className="mt-2 flex items-center justify-center text-red-600 text-sm">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            제출 마감일이 지났습니다
          </div>
        )}
      </div>

      {/* 모바일 카메라 */}
      {showCamera && (
        <MobileCamera
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          isRequired={true}
          maxPhotos={5}
          capturedImages={attachments.filter(att => att.fileType === 'image').map(att => att.fileUrl)}
        />
      )}

      {/* 사진 미리보기 */}
      {showPhotoPreview && (
        <PhotoPreview
          photos={attachments}
          onClose={() => setShowPhotoPreview(false)}
          onDelete={(photoId) => {
            removeAttachment(photoId);
            // 사진이 모두 삭제되면 미리보기 닫기
            const remainingPhotos = attachments.filter(att => att.fileType === 'image' && att.id !== photoId);
            if (remainingPhotos.length === 0) {
              setShowPhotoPreview(false);
            }
          }}
          workSite={formData.workSite}
          workDate={formData.workDate}
        />
      )}
    </div>
  );
};

export default JournalForm;