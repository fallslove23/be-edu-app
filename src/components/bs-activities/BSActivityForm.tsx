import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BSActivityService } from '../../services/bs-activity.service';
import type { ActivityCategory, ActivityImage, ActivityLocation } from '../../types/bs-activity.types';
import { activityCategoryLabels, activityCategoryIcons, DEFAULT_IMAGE_UPLOAD_OPTIONS } from '../../types/bs-activity.types';
import {
  CameraIcon,
  MapPinIcon,
  XMarkIcon,
  PhotoIcon,
  DocumentTextIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface BSActivityFormProps {
  courseId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;  // 수정 모드용
}

const BSActivityForm: React.FC<BSActivityFormProps> = ({
  courseId,
  onSuccess,
  onCancel,
  initialData
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 폼 상태
  const [activityDate, setActivityDate] = useState(initialData?.activity_date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ActivityCategory>(initialData?.category || 'new_visit');
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [images, setImages] = useState<ActivityImage[]>(initialData?.images || []);
  const [location, setLocation] = useState<ActivityLocation | undefined>(initialData?.location);

  // UI 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 이미지 선택 핸들러
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 이미지 개수 제한 체크
    if (images.length + files.length > DEFAULT_IMAGE_UPLOAD_OPTIONS.max_count) {
      setError(`최대 ${DEFAULT_IMAGE_UPLOAD_OPTIONS.max_count}장까지 업로드 가능합니다.`);
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const uploadPromises = files.map(async (file) => {
        // 파일 크기 체크
        if (file.size > DEFAULT_IMAGE_UPLOAD_OPTIONS.max_size_mb * 1024 * 1024) {
          throw new Error(`${file.name}: 파일 크기는 ${DEFAULT_IMAGE_UPLOAD_OPTIONS.max_size_mb}MB 이하여야 합니다.`);
        }

        // 파일 타입 체크
        if (!DEFAULT_IMAGE_UPLOAD_OPTIONS.allowed_types.includes(file.type)) {
          throw new Error(`${file.name}: 지원하지 않는 파일 형식입니다.`);
        }

        // 이미지 업로드
        if (user?.id) {
          return await BSActivityService.uploadImage(file, user.id);
        }
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages([...images, ...uploadedImages]);
    } catch (err: any) {
      setError(err.message || '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 이미지 삭제 핸들러
  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 위치 정보 가져오기
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('위치 정보를 지원하지 않는 브라우저입니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: '위치 정보 추출 중...' // TODO: Reverse geocoding
        });
      },
      (error) => {
        setError('위치 정보를 가져올 수 없습니다.');
        console.error('Geolocation error:', error);
      }
    );
  };

  // 임시 저장
  const handleSaveDraft = async () => {
    if (!user?.id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await BSActivityService.createActivity({
        trainee_id: user.id,
        course_id: courseId,
        activity_date: activityDate,
        category,
        title,
        content,
        images,
        location,
        submission_status: 'draft'
      });

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || '임시 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    // 유효성 검사
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      setError('활동 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await BSActivityService.createActivity({
        trainee_id: user.id,
        course_id: courseId,
        activity_date: activityDate,
        category,
        title,
        content,
        images,
        location,
        submission_status: 'submitted'
      });

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || '제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 활동 날짜 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <CalendarIcon className="h-5 w-5 inline mr-2" />
          활동 날짜
        </label>
        <input
          type="date"
          value={activityDate}
          onChange={(e) => setActivityDate(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          required
        />
      </div>

      {/* 카테고리 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <TagIcon className="h-5 w-5 inline mr-2" />
          활동 유형
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(activityCategoryLabels) as ActivityCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{activityCategoryIcons[cat]}</span>
              {activityCategoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <DocumentTextIcon className="h-5 w-5 inline mr-2" />
          제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="활동 제목을 입력하세요"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          required
        />
      </div>

      {/* 활동 내용 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          활동 내용
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="활동 내용을 상세히 기록해주세요"
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
          required
        />
      </div>

      {/* 사진 업로드 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <PhotoIcon className="h-5 w-5 inline mr-2" />
          사진 ({images.length}/{DEFAULT_IMAGE_UPLOAD_OPTIONS.max_count})
        </label>

        {/* 이미지 미리보기 */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={image.url}
                  alt={`활동 사진 ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className="btn-danger"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 업로드 버튼 */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= DEFAULT_IMAGE_UPLOAD_OPTIONS.max_count || isUploadingImage}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CameraIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            {isUploadingImage ? '업로드 중...' : '사진 촬영 또는 선택'}
          </p>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* 위치 정보 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPinIcon className="h-5 w-5 inline mr-2" />
          위치 정보
        </label>
        {location ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">📍 {location.address}</p>
            <button
              type="button"
              onClick={() => setLocation(undefined)}
              className="text-xs text-green-600 hover:text-green-700 mt-1"
            >
              위치 정보 제거
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGetLocation}
            className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            현재 위치 가져오기
          </button>
        )}
      </div>

      {/* 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 grid grid-cols-3 gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            취소
          </button>
        )}
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
        >
          임시저장
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? '제출 중...' : '제출'}
        </button>
      </div>
    </form>
  );
};

export default BSActivityForm;
