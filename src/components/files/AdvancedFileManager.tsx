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
  PencilIcon,
  ShareIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

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

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  files: string[]; // file IDs
  subfolders: string[]; // folder IDs
  createdAt: string;
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
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragOver 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">업로드 중...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              파일을 드래그하여 업로드하세요
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              또는 <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-500 hover:text-blue-600 underline"
              >
                여기를 클릭
              </button>하여 선택하세요
            </p>
          </div>
          <div className="text-xs text-gray-400">
            <p>최대 {maxFiles}개 파일, 파일당 {maxSize}MB</p>
            {acceptedTypes && (
              <p>지원 형식: {acceptedTypes.join(', ')}</p>
            )}
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
      <div className="text-center py-12">
        <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">업로드된 파일이 없습니다</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {files.map(file => (
          <div key={file.id} className="group relative">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
              {/* 썸네일 또는 아이콘 */}
              <div className="aspect-square p-4 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-t-lg">
                {file.thumbnail ? (
                  <img 
                    src={file.thumbnail} 
                    alt={file.name}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                ) : (
                  <FileIcon category={file.category} className="h-8 w-8 text-gray-400" />
                )}
              </div>
              
              {/* 파일 정보 */}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {localFileManager.formatFileSize(file.size)}
                </p>
              </div>
              
              {/* 액션 버튼들 */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <button
                    onClick={() => onFileView(file)}
                    className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    title="미리보기"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => localFileManager.downloadFile(file)}
                    className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                    title="다운로드"
                  >
                    <CloudArrowDownIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onFileDelete(file.id)}
                    className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                    title="삭제"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map(file => (
        <div key={file.id} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <FileIcon category={file.category} />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {localFileManager.formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onFileView(file)}
              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              title="미리보기"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => localFileManager.downloadFile(file)}
              className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
              title="다운로드"
            >
              <CloudArrowDownIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onFileDelete(file.id)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="삭제"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
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
          <img 
            src={file.content as string} 
            alt={file.name}
            className="max-w-full max-h-96 object-contain rounded"
          />
        );
      case 'video':
        return (
          <video 
            src={file.content as string} 
            controls
            className="max-w-full max-h-96 rounded"
          />
        );
      case 'audio':
        return (
          <audio 
            src={file.content as string} 
            controls
            className="w-full"
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <FileIcon category={file.category} className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">미리보기를 사용할 수 없습니다</p>
            <button
              onClick={() => localFileManager.downloadFile(file)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              다운로드
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {file.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6">
            {renderPreview()}
            
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">크기:</span> {localFileManager.formatFileSize(file.size)}
              </div>
              <div>
                <span className="font-medium">타입:</span> {file.type}
              </div>
              <div>
                <span className="font-medium">업로드일:</span> {new Date(file.uploadDate).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">수정일:</span> {new Date(file.lastModified).toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => localFileManager.downloadFile(file)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              다운로드
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              닫기
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
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">파일 관리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {storageUsage.fileCount}개 파일 • {storageUsage.formattedSize} 사용 중
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {viewMode === 'grid' ? '목록' : '격자'}
          </button>
        </div>
      </div>

      {/* 업로드 영역 */}
      <FileDropZone 
        onFilesUploaded={handleFilesUploaded}
        maxFiles={20}
        maxSize={100}
      />

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="파일 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
            />
          </div>
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
        >
          <option value="all">모든 파일</option>
          <option value="document">문서</option>
          <option value="image">이미지</option>
          <option value="video">비디오</option>
          <option value="audio">오디오</option>
          <option value="archive">압축파일</option>
          <option value="other">기타</option>
        </select>
      </div>

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
  );
};

export { AdvancedFileManager, FileDropZone, FileList };
export default AdvancedFileManager;