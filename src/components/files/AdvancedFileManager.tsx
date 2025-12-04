'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  TrashIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';

// 파일 타입 정의
interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string | ArrayBuffer; // Base64 또는 binary data
  uploadDate: string;
  lastModified: string;
  category: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  tags: string[];
  description?: string;
  thumbnail?: string;
}

// 로컬 스토리지 파일 관리자
export const localFileManager = {
  // 파일 저장 (Base64로 인코딩)
  saveFile: async (file: File, metadata?: Partial<FileItem>): Promise<FileItem> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const fileItem: FileItem = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          content: reader.result as string,
          uploadDate: new Date().toISOString(),
          lastModified: new Date(file.lastModified).toISOString(),
          category: localFileManager.categorizeFile(file.type),
          tags: [],
          ...metadata
        };

        // 썸네일 생성 (이미지인 경우)
        if (fileItem.category === 'image') {
          localFileManager.generateThumbnail(file).then(thumbnail => {
            fileItem.thumbnail = thumbnail;
            localFileManager.saveToStorage(fileItem);
            resolve(fileItem);
          });
        } else {
          localFileManager.saveToStorage(fileItem);
          resolve(fileItem);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },

  // 스토리지에 저장
  saveToStorage: (fileItem: FileItem) => {
    const existingFiles = localFileManager.getAllFiles();
    existingFiles.push(fileItem);
    localStorage.setItem('bs_files', JSON.stringify(existingFiles));
  },

  // 모든 파일 조회
  getAllFiles: (): FileItem[] => {
    if (typeof window === 'undefined') return [];
    const files = localStorage.getItem('bs_files');
    return files ? JSON.parse(files) : [];
  },

  // 파일 조회
  getFile: (id: string): FileItem | null => {
    const files = localFileManager.getAllFiles();
    return files.find(file => file.id === id) || null;
  },

  // 파일 삭제
  deleteFile: (id: string): boolean => {
    const files = localFileManager.getAllFiles();
    const filteredFiles = files.filter(file => file.id !== id);
    localStorage.setItem('bs_files', JSON.stringify(filteredFiles));
    return true;
  },

  // 파일 카테고리 분류
  categorizeFile: (mimeType: string): FileItem['category'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
    return 'other';
  },

  // 썸네일 생성
  generateThumbnail: (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const MAX_SIZE = 150;
        let { width, height } = img;

        if (width > height && width > MAX_SIZE) {
          height = (height * MAX_SIZE) / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = (width * MAX_SIZE) / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.src = URL.createObjectURL(file);
    });
  },

  // 파일 다운로드
  downloadFile: (fileItem: FileItem) => {
    const link = document.createElement('a');
    link.href = fileItem.content as string;
    link.download = fileItem.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // 스토리지 사용량 확인
  getStorageUsage: () => {
    const files = localFileManager.getAllFiles();
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const fileCount = files.length;

    return {
      totalSize,
      fileCount,
      formattedSize: localFileManager.formatFileSize(totalSize)
    };
  },

  // 파일 크기 포맷팅
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// 파일 아이콘 컴포넌트
const FileIcon: React.FC<{ category: FileItem['category']; className?: string }> = ({ category, className = 'h-6 w-6' }) => {
  const iconMap = {
    document: DocumentIcon,
    image: PhotoIcon,
    video: VideoCameraIcon,
    audio: MusicalNoteIcon,
    archive: ArchiveBoxIcon,
    other: DocumentIcon
  };

  const Icon = iconMap[category];
  return <Icon className={className} />;
};

// 드래그 앤 드롭 업로드 컴포넌트
const FileDropZone: React.FC<{
  onFilesUploaded: (files: FileItem[]) => void;
  maxFiles?: number;
  maxSize?: number; // MB
  acceptedTypes?: string[];
}> = ({ onFilesUploaded, maxFiles = 10, maxSize = 50, acceptedTypes }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await processFiles(files);
    }
  }, []);

  const processFiles = async (files: File[]) => {
    setUploading(true);

    // 파일 검증
    const validFiles = files.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`${file.name}은 너무 큽니다. (최대 ${maxSize}MB)`);
        return false;
      }

      if (acceptedTypes && !acceptedTypes.some(type => file.type.includes(type))) {
        alert(`${file.name}은 지원하지 않는 파일 형식입니다.`);
        return false;
      }

      return true;
    }).slice(0, maxFiles);

    try {
      const uploadedFiles = await Promise.all(
        validFiles.map(file => localFileManager.saveFile(file))
      );

      onFilesUploaded(uploadedFiles);
    } catch (error) {
      console.error('File upload failed:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${isDragOver
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept={acceptedTypes?.join(',')}
      />

      {uploading ? (
        <div className="space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">업로드 중...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CloudArrowUpIcon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              파일을 드래그하여 업로드하세요
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              또는 클릭하여 파일을 선택하세요
            </p>
          </div>
          <div className="text-xs text-muted-foreground pt-2">
            <span className="px-2 py-1 bg-muted rounded-full">최대 {maxFiles}개 파일</span>
            <span className="px-2 py-1 bg-muted rounded-full ml-2">파일당 {maxSize}MB</span>
          </div>
        </div>
      )}
    </div>
  );
};

// 파일 리스트 컴포넌트
const FileList: React.FC<{
  files: FileItem[];
  onFileDelete: (id: string) => void;
  onFileView: (file: FileItem) => void;
  viewMode: 'grid' | 'list';
}> = ({ files, onFileDelete, onFileView, viewMode }) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/10 rounded-2xl border border-dashed border-border">
        <DocumentIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground">업로드된 파일이 없습니다</h3>
        <p className="text-muted-foreground mt-1">새로운 파일을 업로드하여 관리해보세요.</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {files.map(file => (
          <div key={file.id} className="group relative bg-card rounded-2xl border border-border hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden">
            {/* 썸네일 또는 아이콘 */}
            <div className="aspect-square p-6 flex items-center justify-center bg-muted/30 group-hover:bg-muted/50 transition-colors relative">
              {file.thumbnail ? (
                <img
                  src={file.thumbnail}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileIcon category={file.category} className="h-16 w-16 text-muted-foreground/50 group-hover:scale-110 transition-transform duration-300" />
              )}

              {/* 오버레이 액션 버튼 */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                <button
                  onClick={() => onFileView(file)}
                  className="p-2 bg-white/90 text-gray-900 rounded-full hover:bg-white hover:scale-110 transition-all shadow-lg"
                  title="미리보기"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => localFileManager.downloadFile(file)}
                  className="p-2 bg-white/90 text-blue-600 rounded-full hover:bg-white hover:scale-110 transition-all shadow-lg"
                  title="다운로드"
                >
                  <CloudArrowDownIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onFileDelete(file.id)}
                  className="p-2 bg-white/90 text-red-600 rounded-full hover:bg-white hover:scale-110 transition-all shadow-lg"
                  title="삭제"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 파일 정보 */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-card-foreground truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {localFileManager.formatFileSize(file.size)}
                  </p>
                </div>
                <FileIcon category={file.category} className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="divide-y divide-border">
        {files.map(file => (
          <div key={file.id} className="flex items-center p-4 hover:bg-muted/30 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mr-4">
              <FileIcon category={file.category} className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{localFileManager.formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onFileView(file)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="미리보기"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => localFileManager.downloadFile(file)}
                className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="다운로드"
              >
                <CloudArrowDownIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onFileDelete(file.id)}
                className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="삭제"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 파일 미리보기 모달
const FilePreviewModal: React.FC<{
  file: FileItem | null;
  onClose: () => void;
}> = ({ file, onClose }) => {
  if (!file) return null;

  const renderPreview = () => {
    switch (file.category) {
      case 'image':
        return (
          <div className="flex items-center justify-center bg-black/5 rounded-lg overflow-hidden min-h-[300px]">
            <img
              src={file.content as string}
              alt={file.name}
              className="max-w-full max-h-[60vh] object-contain"
            />
          </div>
        );
      case 'video':
        return (
          <video
            src={file.content as string}
            controls
            className="w-full rounded-lg max-h-[60vh]"
          />
        );
      case 'audio':
        return (
          <div className="p-8 bg-muted/30 rounded-lg flex flex-col items-center justify-center">
            <MusicalNoteIcon className="h-16 w-16 text-primary mb-4" />
            <audio
              src={file.content as string}
              controls
              className="w-full"
            />
          </div>
        );
      default:
        return (
          <div className="text-center py-16 bg-muted/10 rounded-lg">
            <FileIcon category={file.category} className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">이 파일 형식은 미리보기를 지원하지 않습니다</p>
            <button
              onClick={() => localFileManager.downloadFile(file)}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
            >
              다운로드하여 보기
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-card shadow-2xl rounded-2xl border border-border">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileIcon category={file.category} className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-card-foreground">
                  {file.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {localFileManager.formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 bg-muted/5">
            {renderPreview()}
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t border-border bg-card">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            >
              닫기
            </button>
            <button
              onClick={() => localFileManager.downloadFile(file)}
              className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <CloudArrowDownIcon className="h-4 w-4" />
              다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 메인 파일 관리자 컴포넌트
const AdvancedFileManager: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [storageUsage, setStorageUsage] = useState({ totalSize: 0, fileCount: 0, formattedSize: '0 Bytes' });

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [files, searchTerm, categoryFilter]);

  const loadFiles = () => {
    const loadedFiles = localFileManager.getAllFiles();
    setFiles(loadedFiles);
    setStorageUsage(localFileManager.getStorageUsage());
  };

  const filterFiles = () => {
    let filtered = files;

    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(file => file.category === categoryFilter);
    }

    setFilteredFiles(filtered);
  };

  const handleFilesUploaded = (newFiles: FileItem[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setStorageUsage(localFileManager.getStorageUsage());
  };

  const handleFileDelete = (id: string) => {
    if (confirm('이 파일을 삭제하시겠습니까?')) {
      localFileManager.deleteFile(id);
      loadFiles();
    }
  };

  const handleFileView = (file: FileItem) => {
    setSelectedFile(file);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-card border-b border-border p-6 -mx-6 -mt-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">파일 관리</h1>
              <p className="text-muted-foreground mt-1">
                시스템 내 모든 파일을 통합 관리합니다.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-xl">
              <div className="text-right px-2">
                <p className="text-xs text-muted-foreground">저장 공간</p>
                <p className="text-sm font-bold text-foreground">{storageUsage.formattedSize}</p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-right px-2">
                <p className="text-xs text-muted-foreground">파일 수</p>
                <p className="text-sm font-bold text-foreground">{storageUsage.fileCount}개</p>
              </div>
            </div>
          </div>
        </div>

        {/* 컨트롤 바 */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="파일명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer"
            >
              <option value="all">모든 파일</option>
              <option value="document">문서</option>
              <option value="image">이미지</option>
              <option value="video">비디오</option>
              <option value="audio">오디오</option>
              <option value="archive">압축파일</option>
              <option value="other">기타</option>
            </select>

            <div className="flex bg-card border border-border rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                  }`}
                title="격자 보기"
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                  }`}
                title="목록 보기"
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 업로드 영역 */}
        <FileDropZone
          onFilesUploaded={handleFilesUploaded}
          maxFiles={20}
          maxSize={100}
        />

        {/* 파일 리스트 */}
        <FileList
          files={filteredFiles}
          onFileDelete={handleFileDelete}
          onFileView={handleFileView}
          viewMode={viewMode}
        />

        {/* 파일 미리보기 모달 */}
        <FilePreviewModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      </div>
    </PageContainer>
  );
};

export { AdvancedFileManager, FileDropZone, FileList };
export default AdvancedFileManager;