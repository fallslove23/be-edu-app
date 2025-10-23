import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  EyeIcon,
  TagIcon,
  CalendarDaysIcon,
  UserIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { FileManager, FileInfo, FILE_CONFIGS } from '../../utils/fileManager';
import { useAuth } from '../../contexts/AuthContext';

interface FileListProps {
  category?: string;
  courseId?: string;
  showUploadedBy?: boolean;
  showActions?: boolean;
  onFileSelect?: (file: FileInfo) => void;
  onFileDelete?: (file: FileInfo) => void;
  refreshTrigger?: number;
}

const FileList: React.FC<FileListProps> = ({
  category,
  courseId,
  showUploadedBy = true,
  showActions = true,
  onFileSelect,
  onFileDelete,
  refreshTrigger
}) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'downloads'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const getFileIcon = (fileName: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8'
    };
    
    if (FILE_CONFIGS.ALLOWED_TYPES.documents.includes(extension)) {
      return <DocumentIcon className={`${sizeClasses[size]} text-blue-600`} />;
    }
    if (FILE_CONFIGS.ALLOWED_TYPES.images.includes(extension)) {
      return <PhotoIcon className={`${sizeClasses[size]} text-green-600`} />;
    }
    if (FILE_CONFIGS.ALLOWED_TYPES.videos.includes(extension)) {
      return <FilmIcon className={`${sizeClasses[size]} text-purple-600`} />;
    }
    if (FILE_CONFIGS.ALLOWED_TYPES.audio.includes(extension)) {
      return <MusicalNoteIcon className={`${sizeClasses[size]} text-yellow-600`} />;
    }
    if (FILE_CONFIGS.ALLOWED_TYPES.archives.includes(extension)) {
      return <ArchiveBoxIcon className={`${sizeClasses[size]} text-gray-600`} />;
    }
    
    return <DocumentIcon className={`${sizeClasses[size]} text-gray-600`} />;
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      const fileData = await FileManager.getFiles({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        courseId,
        searchTerm: searchTerm || undefined
      });
      setFiles(fileData);
    } catch (error) {
      console.error('파일 목록 로드 실패:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const sortFiles = (files: FileInfo[]) => {
    const sorted = [...files].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.uploadedAt);
          bValue = new Date(b.uploadedAt);
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'downloads':
          aValue = a.downloadCount;
          bValue = b.downloadCount;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  useEffect(() => {
    loadFiles();
  }, [selectedCategory, courseId, refreshTrigger]);

  useEffect(() => {
    const filtered = files.filter(file => {
      const matchesSearch = !searchTerm || 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
    
    setFilteredFiles(sortFiles(filtered));
  }, [files, searchTerm, sortBy, sortOrder]);

  const handleDownload = async (file: FileInfo) => {
    try {
      await FileManager.downloadFile(file.id);
      // 다운로드 수 업데이트를 위해 파일 목록 새로고침
      loadFiles();
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  const handleDelete = async (file: FileInfo) => {
    if (!user || (file.uploadedBy !== user.id && user.role !== 'admin')) {
      alert('파일을 삭제할 권한이 없습니다.');
      return;
    }

    if (confirm(`"${file.name}" 파일을 삭제하시겠습니까?`)) {
      try {
        await FileManager.deleteFile(file.id);
        onFileDelete?.(file);
        loadFiles(); // 목록 새로고침
      } catch (error) {
        console.error('파일 삭제 실패:', error);
        alert('파일 삭제에 실패했습니다.');
      }
    }
  };

  const handlePreview = async (file: FileInfo) => {
    try {
      const previewUrl = await FileManager.getPreviewUrl(file.id);
      if (previewUrl && file.type.startsWith('image/')) {
        // 이미지 미리보기를 위한 모달 또는 새 창
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>${file.name}</title></head>
              <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f3f4f6;">
                <img src="${previewUrl}" alt="${file.name}" style="max-width:100%; max-height:100vh; object-fit:contain;" />
              </body>
            </html>
          `);
        }
      } else {
        onFileSelect?.(file);
      }
    } catch (error) {
      console.error('파일 미리보기 실패:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
          {/* 검색 */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="파일명, 설명, 태그로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 필터 및 정렬 */}
          <div className="flex items-center space-x-3">
            {/* 카테고리 필터 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">모든 파일</option>
              <option value="course_material">강의 자료</option>
              <option value="assignment">과제</option>
              <option value="certificate">인증서</option>
              <option value="other">기타</option>
            </select>

            {/* 정렬 */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="date-desc">최신순</option>
              <option value="date-asc">오래된순</option>
              <option value="name-asc">이름순</option>
              <option value="size-desc">큰 파일순</option>
              <option value="downloads-desc">다운로드순</option>
            </select>

            {/* 보기 모드 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : ''
                }`}
              >
                목록
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : ''
                }`}
              >
                격자
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 파일 목록 */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <DocumentIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">파일이 없습니다.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {filteredFiles.map((file) => (
              <div key={file.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                    {getFileIcon(file.name)}
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {file.category === 'course_material' ? '강의자료' :
                           file.category === 'assignment' ? '과제' :
                           file.category === 'certificate' ? '인증서' : '기타'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>{FileManager.formatFileSize(file.size)}</span>
                        
                        <span className="flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 mr-1" />
                          {new Date(file.uploadedAt).toLocaleDateString('ko-KR')}
                        </span>
                        
                        {showUploadedBy && (
                          <span className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {file.uploadedBy}
                          </span>
                        )}
                        
                        <span className="flex items-center">
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          {file.downloadCount}
                        </span>
                      </div>
                      
                      {file.description && (
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {file.description}
                        </p>
                      )}
                      
                      {file.tags.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2">
                          <TagIcon className="h-4 w-4 text-gray-400" />
                          <div className="flex space-x-1">
                            {file.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {file.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{file.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  {showActions && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handlePreview(file)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="미리보기"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                        title="다운로드"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      
                      {(user?.id === file.uploadedBy || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDelete(file)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="삭제"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 격자 보기 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div key={file.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                {getFileIcon(file.name, 'lg')}
                
                {showActions && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1 text-gray-600 hover:text-green-600"
                      title="다운로드"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    
                    {(user?.id === file.uploadedBy || user?.role === 'admin') && (
                      <button
                        onClick={() => handleDelete(file)}
                        className="p-1 text-gray-600 hover:text-red-600"
                        title="삭제"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                {file.name}
              </h3>
              
              <div className="text-xs text-gray-600 space-y-1">
                <p>{FileManager.formatFileSize(file.size)}</p>
                <p>{new Date(file.uploadedAt).toLocaleDateString('ko-KR')}</p>
                <p>다운로드 {file.downloadCount}회</p>
              </div>
              
              {file.tags.length > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {file.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;