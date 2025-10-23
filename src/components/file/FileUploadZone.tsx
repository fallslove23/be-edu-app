import React, { useState, useCallback, useRef } from 'react';
import { 
  CloudArrowUpIcon, 
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { FileManager, FileInfo, UploadProgress, FILE_CONFIGS } from '../../utils/fileManager';
import { useAuth } from '../../contexts/AuthContext';

interface FileUploadZoneProps {
  category?: 'course_material' | 'assignment' | 'profile' | 'certificate' | 'other';
  courseName?: string;
  courseId?: string;
  onUploadComplete?: (files: FileInfo[]) => void;
  onUploadProgress?: (progress: UploadProgress[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  category = 'other',
  courseName,
  courseId,
  onUploadComplete,
  onUploadProgress,
  maxFiles = 10,
  disabled = false
}) => {
  const { user } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadProgress[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileName: string) => {
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();
    
    if (FILE_CONFIGS.ALLOWED_TYPES.documents.includes(extension)) {
      return <DocumentIcon className="h-8 w-8 text-blue-600" />;
    }
    if (FILE_CONFIGS.ALLOWED_TYPES.images.includes(extension)) {
      return <PhotoIcon className="h-8 w-8 text-green-600" />;
    }
    if (FILE_CONFIGS.ALLOWED_TYPES.videos.includes(extension)) {
      return <FilmIcon className="h-8 w-8 text-purple-600" />;
    }
    if (FILE_CONFIGS.ALLOWED_TYPES.audio.includes(extension)) {
      return <MusicalNoteIcon className="h-8 w-8 text-yellow-600" />;
    }
    if (FILE_CONFIGS.ALLOWED_TYPES.archives.includes(extension)) {
      return <ArchiveBoxIcon className="h-8 w-8 text-gray-600" />;
    }
    
    return <DocumentIcon className="h-8 w-8 text-gray-600" />;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, [disabled]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const processFiles = async (files: File[]) => {
    if (!user) return;

    const newErrors: string[] = [];
    const validFiles: File[] = [];

    // 파일 개수 제한 확인
    if (uploadedFiles.length + uploadingFiles.length + files.length > maxFiles) {
      newErrors.push(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`);
      setErrors(newErrors);
      return;
    }

    // 각 파일 유효성 검사
    for (const file of files) {
      const validation = FileManager.validateFile(file, category);
      if (!validation.valid) {
        newErrors.push(`${file.name}: ${validation.error}`);
      } else {
        validFiles.push(file);
      }
    }

    // 사용자 용량 확인
    if (validFiles.length > 0) {
      const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
      const quotaCheck = await FileManager.checkUserQuota(user.id, user.role, totalSize);
      
      if (!quotaCheck.allowed) {
        newErrors.push(`용량 초과: ${Math.round(quotaCheck.currentUsage)}MB/${quotaCheck.quota}MB 사용 중`);
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    // 에러 클리어 및 업로드 시작
    setErrors([]);
    const progressList: UploadProgress[] = validFiles.map(file => ({
      fileId: `temp_${Date.now()}_${file.name}`,
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }));

    setUploadingFiles(prev => [...prev, ...progressList]);
    onUploadProgress?.(progressList);

    // 파일 업로드 실행
    const uploadResults: FileInfo[] = [];
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const progressItem = progressList[i];

      try {
        // 업로드 시작
        setUploadingFiles(prev => 
          prev.map(p => 
            p.fileId === progressItem.fileId 
              ? { ...p, status: 'uploading' as const }
              : p
          )
        );

        const fileInfo = await FileManager.uploadFile(
          file,
          {
            category,
            courseName,
            courseId,
            uploadedBy: user.id,
            isPublic: false
          },
          (progress) => {
            setUploadingFiles(prev => 
              prev.map(p => 
                p.fileId === progressItem.fileId 
                  ? { ...p, progress }
                  : p
              )
            );
          }
        );

        // 업로드 완료
        setUploadingFiles(prev => 
          prev.map(p => 
            p.fileId === progressItem.fileId 
              ? { ...p, status: 'completed' as const, progress: 100 }
              : p
          )
        );

        uploadResults.push(fileInfo);

      } catch (error) {
        console.error(`파일 업로드 실패: ${file.name}`, error);
        
        setUploadingFiles(prev => 
          prev.map(p => 
            p.fileId === progressItem.fileId 
              ? { 
                  ...p, 
                  status: 'error' as const, 
                  error: error instanceof Error ? error.message : '업로드 실패' 
                }
              : p
          )
        );
      }
    }

    // 완료된 파일들을 상태에 추가
    setUploadedFiles(prev => [...prev, ...uploadResults]);
    
    // 완료 콜백 호출
    if (uploadResults.length > 0) {
      onUploadComplete?.(uploadResults);
    }

    // 3초 후 완료된 업로드 상태 클리어
    setTimeout(() => {
      setUploadingFiles(prev => 
        prev.filter(p => p.status === 'uploading' || p.status === 'pending')
      );
    }, 3000);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    FileManager.deleteFile(fileId).catch(console.error);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return (
    <div className="space-y-4">
      {/* 에러 메시지 */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-2">업로드 오류</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
            <button 
              onClick={clearErrors}
              className="text-red-400 hover:text-red-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* 드래그 & 드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : disabled 
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept={Object.values(FILE_CONFIGS.ALLOWED_TYPES).flat().join(',')}
          disabled={disabled}
        />

        <CloudArrowUpIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          파일을 드래그하여 업로드하거나 클릭하여 선택
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          {Object.values(FILE_CONFIGS.ALLOWED_TYPES).flat().join(', ')} 파일 지원
        </p>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>최대 {maxFiles}개 파일, 파일당 최대 크기:</p>
          <p>
            문서: {FILE_CONFIGS.MAX_SIZES.documents}MB, 
            이미지: {FILE_CONFIGS.MAX_SIZES.images}MB, 
            비디오: {FILE_CONFIGS.MAX_SIZES.videos}MB
          </p>
        </div>
      </div>

      {/* 업로드 진행 상황 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">업로드 진행 상황</h4>
          {uploadingFiles.map((progress) => (
            <div key={progress.fileId} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getFileIcon(progress.fileName)}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {progress.fileName}
                  </span>
                </div>
                
                {progress.status === 'completed' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : progress.status === 'error' ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                ) : (
                  <span className="text-sm text-gray-600">{progress.progress}%</span>
                )}
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress.status === 'completed'
                      ? 'bg-green-500'
                      : progress.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                ></div>
              </div>
              
              {progress.error && (
                <p className="text-xs text-red-600 mt-1">{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 업로드된 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">업로드된 파일 ({uploadedFiles.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getFileIcon(file.name)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {FileManager.formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFile(file.id)}
                    className="ml-2 p-1 text-red-600 hover:text-red-800"
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

export default FileUploadZone;