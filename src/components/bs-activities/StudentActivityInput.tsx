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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-900">BS 활동 일지</h1>
          <p className="text-sm text-gray-500 mt-1">영업 활동을 기록하세요</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">이번 주 활동</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">3건</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">평균 점수</div>
          <div className="text-2xl font-bold text-green-600 mt-1">4.5점</div>
        </div>
      </div>

      {/* 최근 활동 목록 */}
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>

        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{activityCategoryIcons.new_visit}</span>
                <div>
                  <h3 className="font-medium text-gray-900">신규 고객 방문</h3>
                  <p className="text-xs text-gray-500">2024-08-2{item}</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                제출완료
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              새로운 잠재 고객과의 미팅을 진행하였습니다...
            </p>
            {item === 1 && (
              <div className="mt-3 flex items-center text-sm">
                <span className="text-yellow-500 mr-1">⭐</span>
                <span className="font-medium text-gray-700">4.5점</span>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-gray-500">피드백 있음</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={() => setStep('create')}
          className="btn-primary"
        >
          <DocumentTextIcon className="w-6 h-6 mr-2" />
          새 활동 기록하기
        </button>
      </div>
    </div>
  );

  // 작성 화면
  const renderCreate = () => (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4 flex items-center">
          <button
            onClick={() => setStep('list')}
            className="mr-3 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">활동 기록</h1>
            <p className="text-xs text-gray-500">모든 항목을 작성해주세요</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {/* 날짜 선택 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            활동 날짜 *
          </label>
          <input
            type="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 카테고리 선택 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            활동 유형 *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(activityCategoryLabels) as ActivityCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  category === cat
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{activityCategoryIcons[cat]}</div>
                <div className="text-xs font-medium">{activityCategoryLabels[cat]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 제목 입력 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            활동 제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 신규 고객사 방문"
            maxLength={100}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {title.length}/100
          </div>
        </div>

        {/* 내용 입력 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            활동 내용 *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="활동 내용을 자세히 작성해주세요&#10;- 누구를 만났나요?&#10;- 무엇을 했나요?&#10;- 어떤 결과가 있었나요?"
            rows={6}
            maxLength={1000}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {content.length}/1000
          </div>
        </div>

        {/* 사진 첨부 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            활동 사진 * (최대 5장)
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

          <div className="grid grid-cols-3 gap-2 mb-3">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={image.url}
                  alt={`활동 사진 ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="btn-danger"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {images.length < 5 && (
            <button
              onClick={handleCameraCapture}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center"
            >
              <CameraIcon className="w-5 h-5 mr-2" />
              사진 추가하기
            </button>
          )}
        </div>

        {/* 위치 정보 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            활동 위치 (선택)
          </label>

          {location ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <MapPinIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-green-900">위치가 추가되었습니다</div>
                    <div className="text-xs text-green-700 mt-1">{location.address}</div>
                  </div>
                </div>
                <button
                  onClick={() => setLocation(undefined)}
                  className="text-green-600 hover:text-green-700"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGetLocation}
              className="w-full py-3 border border-gray-300 rounded-lg text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center"
            >
              <MapPinIcon className="w-5 h-5 mr-2" />
              현재 위치 추가하기
            </button>
          )}
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary"
        >
          <CheckIcon className="w-6 h-6 mr-2" />
          {isSubmitting ? '제출 중...' : '제출하기'}
        </button>
        <button
          onClick={handleSaveDraft}
          className="w-full bg-white text-gray-700 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          임시 저장
        </button>
      </div>
    </div>
  );

  return step === 'list' ? renderList() : renderCreate();
};

export default StudentActivityInput;
