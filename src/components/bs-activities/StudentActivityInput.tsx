import React, { useState, useRef } from 'react';
import {
  CameraIcon,
  MapPinIcon,
  PhotoIcon,
  XMarkIcon,
  CheckIcon,
  ArrowLeftIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import {
  ActivityCategory,
  activityCategoryLabels,
  activityCategoryIcons,
  CreateBSActivityData,
  ActivityImage,
  ActivityLocation
} from '../../types/bs-activity.types';
import toast from 'react-hot-toast';

interface StudentActivityInputProps {
  traineeId: string;
  courseId: string;
  onSubmit?: (data: CreateBSActivityData) => Promise<void>;
  skipList?: boolean; // 목록 건너뛰고 바로 작성 화면으로
}

const StudentActivityInput: React.FC<StudentActivityInputProps> = ({
  traineeId,
  courseId,
  onSubmit,
  skipList = false
}) => {
  const [step, setStep] = useState<'list' | 'create'>(skipList ? 'create' : 'list');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ActivityCategory>('new_visit');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<ActivityImage[]>([]);
  const [location, setLocation] = useState<ActivityLocation | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 카메라 촬영
  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 이미지 파일 선택
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ActivityImage[] = [];

    for (let i = 0; i < Math.min(files.length, 5 - images.length); i++) {
      const file = files[i];

      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}은(는) 파일 크기가 너무 큽니다. (최대 5MB)`);
        continue;
      }

      // 이미지 URL 생성
      const url = URL.createObjectURL(file);

      newImages.push({
        url,
        file_name: file.name,
        file_size: file.size,
        uploaded_at: new Date().toISOString()
      });
    }

    setImages([...images, ...newImages]);
  };

  // 이미지 삭제
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 위치 정보 가져오기
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('위치 정보를 사용할 수 없습니다.');
      return;
    }

    toast.loading('위치 정보를 가져오는 중...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // 여기서 실제로는 Reverse Geocoding API를 사용하여 주소를 가져와야 함
        const address = `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`;

        setLocation({
          latitude,
          longitude,
          address
        });

        toast.dismiss();
        toast.success('위치 정보가 추가되었습니다.');
      },
      (error) => {
        toast.dismiss();
        toast.error('위치 정보를 가져올 수 없습니다.');
        console.error('Location error:', error);
      }
    );
  };

  // 임시 저장
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    const data: CreateBSActivityData = {
      trainee_id: traineeId,
      course_id: courseId,
      activity_date: activityDate,
      category,
      title: title.trim(),
      content: content.trim(),
      images,
      location,
      submission_status: 'draft'
    };

    try {
      if (onSubmit) {
        await onSubmit(data);
      }
      toast.success('임시 저장되었습니다.');
      resetForm();
      setStep('list');
    } catch (error) {
      toast.error('임시 저장에 실패했습니다.');
      console.error('Save draft error:', error);
    }
  };

  // 제출
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      toast.error('활동 내용을 입력해주세요.');
      return;
    }

    if (images.length === 0) {
      toast.error('최소 1장 이상의 사진을 추가해주세요.');
      return;
    }

    const data: CreateBSActivityData = {
      trainee_id: traineeId,
      course_id: courseId,
      activity_date: activityDate,
      category,
      title: title.trim(),
      content: content.trim(),
      images,
      location,
      submission_status: 'submitted'
    };

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(data);
      }
      toast.success('활동이 제출되었습니다.');
      resetForm();
      setStep('list');
    } catch (error) {
      toast.error('제출에 실패했습니다.');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setActivityDate(new Date().toISOString().split('T')[0]);
    setCategory('new_visit');
    setTitle('');
    setContent('');
    setImages([]);
    setLocation(undefined);
  };

  // 목록 화면
  const renderList = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BS 활동 일지</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">치과 방문 활동을 기록하고 강사 피드백을 받으세요</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
          <div className="text-sm font-medium text-blue-700 dark:text-blue-400">이번 주 활동</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">3건</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 p-5 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
          <div className="text-sm font-medium text-green-700 dark:text-green-400">평균 점수</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">4.5점</div>
        </div>
      </div>

      {/* 최근 활동 목록 */}
      <div className="px-6 pb-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">최근 활동</h2>

        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  {activityCategoryIcons.new_visit}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">신규 병원 방문</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">2024-08-2{item}</p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">
                제출완료
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
              새로운 치과병원을 방문하여 제품 소개 및 미팅을 진행하였습니다...
            </p>
            {item === 1 && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-lg ${star <= 4 ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">4.5점</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">강사 피드백 있음</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
        <button
          onClick={() => setStep('create')}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <DocumentTextIcon className="w-6 h-6" />
          새 활동 기록하기
        </button>
      </div>
    </div>
  );

  // 작성 화면
  const renderCreate = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="p-5 flex items-center">
          <button
            onClick={() => setStep('list')}
            className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">활동 기록</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">모든 항목을 작성해주세요</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 pb-32">
        {/* 날짜 선택 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            활동 날짜 *
          </label>
          <input
            type="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>

        {/* 카테고리 선택 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            활동 유형 *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(activityCategoryLabels) as ActivityCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  category === cat
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-3xl mb-2">{activityCategoryIcons[cat]}</div>
                <div className="text-sm font-medium">{activityCategoryLabels[cat]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 제목 입력 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            활동 제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 신규 병원 방문 및 제품 소개"
            maxLength={100}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
            {title.length}/100
          </div>
        </div>

        {/* 내용 입력 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            활동 내용 *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="활동 내용을 자세히 작성해주세요&#10;- 누구를 만났나요?&#10;- 무엇을 했나요?&#10;- 어떤 결과가 있었나요?"
            rows={8}
            maxLength={1000}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none leading-relaxed"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
            {content.length}/1000
          </div>
        </div>

        {/* 사진 첨부 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            활동 사진 * <span className="text-gray-500 dark:text-gray-400">({images.length}/5)</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {images.map((image, index) => (
                <div key={index} className="relative aspect-square group">
                  <img
                    src={image.url}
                    alt={`활동 사진 ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 dark:bg-red-600 text-white rounded-full hover:bg-red-600 dark:hover:bg-red-700 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 5 && (
            <button
              type="button"
              onClick={handleCameraCapture}
              className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              <PhotoIcon className="w-6 h-6" />
              <span className="font-medium">사진 추가하기</span>
            </button>
          )}
        </div>

        {/* 위치 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            활동 위치 (선택)
          </label>

          {location ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <MapPinIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-900 dark:text-green-100">위치가 추가되었습니다</div>
                    <div className="text-xs text-green-700 dark:text-green-300 mt-1 break-all">{location.address}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLocation(undefined)}
                  className="ml-2 p-1.5 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGetLocation}
              className="w-full py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <MapPinIcon className="w-5 h-5" />
              <span className="font-medium">현재 위치 추가하기</span>
            </button>
          )}
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 shadow-lg">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckIcon className="w-6 h-6" />
          {isSubmitting ? '제출 중...' : '제출하기'}
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          className="w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          임시 저장
        </button>
      </div>
    </div>
  );

  return step === 'list' ? renderList() : renderCreate();
};

export default StudentActivityInput;
