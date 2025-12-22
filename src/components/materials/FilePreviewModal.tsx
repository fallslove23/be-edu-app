'use client';

import React from 'react';
import { XMarkIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import type { Material } from '@/types/material.types';

interface FilePreviewModalProps {
  material: Material;
  onClose: () => void;
  onDownload: () => void;
}

export default function FilePreviewModal({ material, onClose, onDownload }: FilePreviewModalProps) {
  const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const getFileType = (fileName: string): string => {
    const ext = getFileExtension(fileName);

    // 이미지
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) return 'image';
    // PDF
    if (ext === 'pdf') return 'pdf';
    // 비디오
    if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
    // 오디오
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return 'audio';
    // 텍스트
    if (['txt', 'md', 'json', 'xml', 'csv'].includes(ext)) return 'text';

    return 'unsupported';
  };

  const renderPreview = () => {
    const fileType = getFileType(material.file_name);

    switch (fileType) {
      case 'image':
        return (
          <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <img
              src={material.file_path}
              alt={material.title}
              className="max-w-full max-h-[60vh] object-contain rounded-lg"
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-[70vh] bg-gray-50 dark:bg-gray-900 rounded-lg">
            <iframe
              src={`${material.file_path}#toolbar=1`}
              className="w-full h-full rounded-lg"
              title={material.title}
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <video
              controls
              className="max-w-full max-h-[60vh] rounded-lg"
              preload="metadata"
            >
              <source src={material.file_path} type={material.mime_type} />
              브라우저가 비디오를 지원하지 않습니다.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
            <div className="w-full max-w-md">
              <div className="mb-4 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
                  <svg className="w-10 h-10 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {material.title}
                </h4>
              </div>
              <audio
                controls
                className="w-full"
                preload="metadata"
              >
                <source src={material.file_path} type={material.mime_type} />
                브라우저가 오디오를 지원하지 않습니다.
              </audio>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 max-h-[60vh] overflow-auto">
              <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
                텍스트 파일 미리보기는 직접 다운로드 후 확인해주세요.
              </pre>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              미리보기를 지원하지 않는 파일 형식입니다
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {material.file_name}
            </p>
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <CloudArrowDownIcon className="h-5 w-5" />
              파일 다운로드
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-5xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {material.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {material.file_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <CloudArrowDownIcon className="h-4 w-4" />
              다운로드
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 미리보기 영역 */}
        <div className="p-6">
          {renderPreview()}
        </div>

        {/* 파일 정보 */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">파일 크기</span>
              <p className="text-gray-900 dark:text-white font-medium mt-1">
                {(material.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">파일 형식</span>
              <p className="text-gray-900 dark:text-white font-medium mt-1">
                {getFileExtension(material.file_name).toUpperCase()}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">업로드 일시</span>
              <p className="text-gray-900 dark:text-white font-medium mt-1">
                {new Date(material.uploaded_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">다운로드</span>
              <p className="text-gray-900 dark:text-white font-medium mt-1">
                {material.download_count}회
              </p>
            </div>
          </div>

          {material.description && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400 text-sm">설명</span>
              <p className="text-gray-900 dark:text-white mt-1">
                {material.description}
              </p>
            </div>
          )}

          {material.tags && material.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400 text-sm">태그</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {material.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
