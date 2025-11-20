/**
 * 강사 프로필 사진 업로드 컴포넌트
 * - 드래그 앤 드롭 지원
 * - 이미지 미리보기
 * - 파일 크기/형식 검증
 */

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { instructorPhotoService } from '../../services/instructor-photo.service';

interface InstructorPhotoUploadProps {
  userId: string;
  currentPhotoUrl?: string;
  onUploadSuccess: (photoUrl: string) => void;
  onUploadError?: (error: Error) => void;
}

export function InstructorPhotoUpload({
  userId,
  currentPhotoUrl,
  onUploadSuccess,
  onUploadError,
}: InstructorPhotoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(currentPhotoUrl || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 처리
  const handleFileSelect = async (file: File) => {
    setError('');

    // 파일 검증
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      const errorMsg = 'JPG, PNG, WebP 형식의 이미지만 업로드 가능합니다.';
      setError(errorMsg);
      if (onUploadError) onUploadError(new Error(errorMsg));
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      const errorMsg = '파일 크기는 5MB를 초과할 수 없습니다.';
      setError(errorMsg);
      if (onUploadError) onUploadError(new Error(errorMsg));
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 업로드
    try {
      setIsUploading(true);
      const photoUrl = await instructorPhotoService.uploadPhoto(userId, file);
      onUploadSuccess(photoUrl);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || '업로드에 실패했습니다.');
      if (onUploadError) onUploadError(err);
    } finally {
      setIsUploading(false);
    }
  };

  // 파일 input 변경
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 드래그 앤 드롭
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 사진 삭제
  const handleDelete = async () => {
    if (!confirm('프로필 사진을 삭제하시겠습니까?')) return;

    try {
      setIsUploading(true);
      await instructorPhotoService.deletePhoto(userId);
      setPreviewUrl('');
      onUploadSuccess('');
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err.message || '삭제에 실패했습니다.');
      if (onUploadError) onUploadError(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 미리보기 영역 */}
      <div className="flex justify-center">
        <div className="relative">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="프로필 사진"
              className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
              <svg
                className="w-16 h-16 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      </div>

      {/* 업로드 영역 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <svg
          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-blue-600 dark:text-blue-400">클릭하여 파일 선택</span>
          {' 또는 드래그 앤 드롭'}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          JPG, PNG, WebP (최대 5MB)
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 삭제 버튼 */}
      {previewUrl && !isUploading && (
        <button
          onClick={handleDelete}
          className="btn-base btn-danger w-full justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          사진 삭제
        </button>
      )}
    </div>
  );
}
