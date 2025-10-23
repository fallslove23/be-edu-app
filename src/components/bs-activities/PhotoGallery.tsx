import React, { useState } from 'react';
import {
  PhotoIcon,
  CameraIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import type { ActivityPhoto } from '../../types/bs-activities.types';

interface PhotoGalleryProps {
  photos: ActivityPhoto[];
  onAddPhoto: () => void;
  onDeletePhoto: (photoId: string) => void;
  onUpdateDescription: (photoId: string, description: string) => void;
  readonly?: boolean;
}

interface PhotoViewerProps {
  photo: ActivityPhoto;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onUpdateDescription?: (description: string) => void;
  readonly?: boolean;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photo,
  isOpen,
  onClose,
  onDelete,
  onUpdateDescription,
  readonly = false
}) => {
  const [description, setDescription] = useState(photo.description);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveDescription = () => {
    if (onUpdateDescription) {
      onUpdateDescription(description);
    }
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
        {/* 헤더 */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium">{photo.file_name}</h3>
              <span className="text-sm text-gray-300">
                {new Date(photo.taken_at).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {!readonly && onUpdateDescription && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              )}
              {!readonly && onDelete && (
                <button
                  onClick={onDelete}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-400"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* 이미지 */}
        <div className="relative">
          <img
            src={photo.file_path}
            alt={photo.description}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>

        {/* 하단 설명 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="사진 설명을 입력하세요"
                rows={3}
                className="w-full px-3 py-2 bg-white/90 text-gray-900 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setDescription(photo.description);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveDescription}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <div className="text-white">
              <p className="text-lg">{photo.description || '설명이 없습니다'}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
                <span>크기: {(photo.file_size / (1024 * 1024)).toFixed(1)}MB</span>
                <span>업로드: {new Date(photo.uploaded_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onAddPhoto,
  onDeletePhoto,
  onUpdateDescription,
  readonly = false
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<ActivityPhoto | null>(null);

  const handlePhotoClick = (photo: ActivityPhoto) => {
    setSelectedPhoto(photo);
  };

  const handleDeletePhoto = (photoId: string) => {
    onDeletePhoto(photoId);
    setSelectedPhoto(null);
  };

  const handleUpdateDescription = (photoId: string, description: string) => {
    onUpdateDescription(photoId, description);
    // 선택된 사진의 설명도 업데이트
    if (selectedPhoto && selectedPhoto.id === photoId) {
      setSelectedPhoto({
        ...selectedPhoto,
        description
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          사진 ({photos.length})
        </h3>
        {!readonly && (
          <button
            onClick={onAddPhoto}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CameraIcon className="w-4 h-4 mr-2" />
            사진 추가
          </button>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer"
              onClick={() => handlePhotoClick(photo)}
            >
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={photo.thumbnail_path || photo.file_path}
                  alt={photo.description}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              
              {/* 오버레이 */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                <EyeIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>

              {/* 삭제 버튼 */}
              {!readonly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(photo.id);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}

              {/* 설명 텍스트 */}
              {photo.description && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                  <p className="text-white text-xs truncate">{photo.description}</p>
                </div>
              )}
            </div>
          ))}

          {/* 사진 추가 버튼 */}
          {!readonly && (
            <button
              onClick={onAddPhoto}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              <PlusIcon className="w-8 h-8 mb-2" />
              <span className="text-sm">사진 추가</span>
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">아직 추가된 사진이 없습니다</p>
          {!readonly && (
            <button
              onClick={onAddPhoto}
              className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CameraIcon className="w-4 h-4 mr-2" />
              첫 번째 사진 추가
            </button>
          )}
        </div>
      )}

      {/* 사진 뷰어 */}
      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onDelete={!readonly ? () => handleDeletePhoto(selectedPhoto.id) : undefined}
          onUpdateDescription={!readonly ? (description) => handleUpdateDescription(selectedPhoto.id, description) : undefined}
          readonly={readonly}
        />
      )}
    </div>
  );
};

export default PhotoGallery;