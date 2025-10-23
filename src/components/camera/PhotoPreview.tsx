import React, { useState } from 'react';
import {
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  InformationCircleIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import type { ActivityAttachment } from '../../types/activity-journal.types';

interface PhotoPreviewProps {
  photos: ActivityAttachment[];
  onClose: () => void;
  onDelete?: (photoId: string) => void;
  workSite?: string;
  workDate?: string;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photos,
  onClose,
  onDelete,
  workSite,
  workDate
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const imagePhotos = photos.filter(photo => photo.fileType === 'image');

  if (imagePhotos.length === 0) {
    return null;
  }

  const currentPhoto = imagePhotos[selectedPhotoIndex];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrevious = () => {
    setSelectedPhotoIndex((prev) => 
      prev === 0 ? imagePhotos.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setSelectedPhotoIndex((prev) => 
      prev === imagePhotos.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-black bg-opacity-75 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <EyeIcon className="h-6 w-6" />
          <div>
            <h2 className="font-medium">현장 사진 미리보기</h2>
            <p className="text-sm text-gray-300">
              {selectedPhotoIndex + 1} / {imagePhotos.length}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onDelete && (
            <button
              onClick={() => onDelete(currentPhoto.id)}
              className="p-2 text-red-400 hover:bg-red-500 hover:bg-opacity-20 rounded-lg"
              title="삭제"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* 메인 이미지 */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        <img
          src={currentPhoto.fileUrl}
          alt={currentPhoto.fileName}
          className={`max-w-full max-h-full object-contain ${
            isFullscreen ? 'w-full h-full' : ''
          }`}
          onClick={() => setIsFullscreen(!isFullscreen)}
        />

        {/* 이전/다음 버튼 */}
        {imagePhotos.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* 풀스크린 안내 */}
        {!isFullscreen && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
            탭하면 확대됩니다
          </div>
        )}
      </div>

      {/* 하단 정보 */}
      <div className="bg-black bg-opacity-75 text-white p-4">
        {/* 사진 정보 */}
        <div className="mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <div className="flex items-center space-x-1">
              <InformationCircleIcon className="h-4 w-4" />
              <span>{currentPhoto.fileName}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(currentPhoto.uploadedAt)}</span>
            </div>
          </div>
          
          {/* 현장 정보 */}
          {(workSite || workDate) && (
            <div className="mt-2 flex items-center space-x-4 text-sm text-blue-300">
              {workSite && (
                <div className="flex items-center space-x-1">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{workSite}</span>
                </div>
              )}
              {workDate && (
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>업무일: {new Date(workDate).toLocaleDateString('ko-KR')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 썸네일 네비게이션 */}
        {imagePhotos.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {imagePhotos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === selectedPhotoIndex
                    ? 'border-blue-400 ring-2 ring-blue-400 ring-opacity-50'
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                <img
                  src={photo.fileUrl}
                  alt={`썸네일 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoPreview;