import React, { useState, useRef, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  VideoIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // MB 단위
  allowedTypes?: string[];
  accept?: string;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
  uploadProgress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  maxFiles = 10,
  maxSizePerFile = 50,
  allowedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  accept,
  multiple = true,
  className = '',
  children
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <PhotoIcon className="h-8 w-8" />;
    if (type.startsWith('video/')) return <VideoIcon className="h-8 w-8" />;
    if (type.startsWith('audio/')) return <MusicalNoteIcon className="h-8 w-8" />;
    if (type.includes('pdf')) return <DocumentIcon className="h-8 w-8" />;
    if (type.includes('zip') || type.includes('rar')) return <ArchiveBoxIcon className="h-8 w-8" />;
    return <DocumentIcon className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // 파일 크기 검증
    if (file.size > maxSizePerFile * 1024 * 1024) {
      return `파일 크기가 ${maxSizePerFile}MB를 초과합니다.`;
    }

    // 파일 타입 검증
    if (allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some(type => {
        if (type.includes('*')) {
          const baseType = type.split('/')[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isAllowed) {
        return '허용되지 않는 파일 형식입니다.';
      }
    }

    return null;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const processFiles = useCallback(async (files: File[]) => {
    if (uploadedFiles.length + files.length > maxFiles) {
      alert(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`);
      return;
    }

    const newFiles: UploadedFile[] = [];

    for (const file of files) {
      const validationError = validateFile(file);
      const preview = await createFilePreview(file);
      
      const uploadedFile: UploadedFile = {
        file,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        preview,
        status: validationError ? 'error' : 'pending',
        errorMessage: validationError || undefined
      };

      newFiles.push(uploadedFile);
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // 유효한 파일들만 부모 컴포넌트에 전달
    const validFiles = newFiles
      .filter(f => f.status !== 'error')
      .map(f => f.file);
    
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  }, [uploadedFiles.length, maxFiles, onFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
    // input 값 초기화 (같은 파일 다시 선택 가능하게)
    e.target.value = '';
  }, [processFiles]);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // 업로드 시뮬레이션 (실제로는 서버 업로드 로직)
  const simulateUpload = async (fileId: string) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'uploading', uploadProgress: 0 } : f
    ));

    // 진행률 시뮬레이션
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, uploadProgress: progress } : f
      ));
    }

    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'completed', uploadProgress: 100 } : f
    ));
  };

  const uploadAll = async () => {
    setIsUploading(true);
    const pendingFiles = uploadedFiles.filter(f => f.status === 'pending');
    
    for (const file of pendingFiles) {
      await simulateUpload(file.id);
    }
    
    setIsUploading(false);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 파일 드롭 영역 */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept || allowedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        {children ? (
          <div onClick={openFileDialog} className="cursor-pointer">
            {children}
          </div>
        ) : (
          <div className="text-center cursor-pointer" onClick={openFileDialog}>
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-lg font-medium text-gray-900">
                파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {multiple ? `최대 ${maxFiles}개` : '1개'} 파일, 
                각 파일 최대 {maxSizePerFile}MB
              </p>
              <p className="text-xs text-gray-500 mt-1">
                지원 형식: {allowedTypes.join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 업로드된 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              업로드된 파일 ({uploadedFiles.length})
            </h4>
            {uploadedFiles.some(f => f.status === 'pending') && (
              <button
                onClick={uploadAll}
                disabled={isUploading}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? '업로드 중...' : '모두 업로드'}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {/* 파일 미리보기 */}
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt="미리보기"
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        {getFileIcon(uploadedFile.file)}
                      </div>
                    )}
                  </div>

                  {/* 파일 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    
                    {/* 업로드 진행률 */}
                    {uploadedFile.status === 'uploading' && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${uploadedFile.uploadProgress || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {uploadedFile.uploadProgress || 0}% 업로드 중...
                        </p>
                      </div>
                    )}

                    {/* 에러 메시지 */}
                    {uploadedFile.status === 'error' && uploadedFile.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">
                        {uploadedFile.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                {/* 상태 아이콘 및 삭제 버튼 */}
                <div className="flex items-center space-x-2">
                  {uploadedFile.status === 'completed' && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                  {uploadedFile.status === 'error' && (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  )}
                  {uploadedFile.status === 'pending' && (
                    <button
                      onClick={() => simulateUpload(uploadedFile.id)}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      업로드
                    </button>
                  )}
                  
                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;