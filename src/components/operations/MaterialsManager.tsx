import React, { useState, useEffect } from 'react';
import {
  DocumentIcon,
  FolderIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  StarIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  PresentationChartBarIcon
} from '@heroicons/react/24/outline';

interface Material {
  id: string;
  name: string;
  type: 'document' | 'presentation' | 'video' | 'audio' | 'image' | 'archive';
  size: string;
  uploadDate: string;
  uploadedBy: string;
  courseCode?: string;
  courseName?: string;
  sessionNumber?: number;
  category: 'lecture' | 'reference' | 'assignment' | 'exam' | 'template';
  tags: string[];
  description?: string;
  downloadCount: number;
  isFavorite: boolean;
  url?: string;
  thumbnailUrl?: string;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdDate: string;
  materialsCount: number;
  subFoldersCount: number;
}

const MaterialsManager: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'downloads'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    
    setTimeout(() => {
      const mockFolders: Folder[] = [
        {
          id: 'folder-1',
          name: 'BS 기초과정 1차',
          createdDate: '2025-01-15',
          materialsCount: 12,
          subFoldersCount: 3
        },
        {
          id: 'folder-2',
          name: 'BS 고급과정 2차',
          createdDate: '2025-01-20',
          materialsCount: 8,
          subFoldersCount: 2
        },
        {
          id: 'folder-3',
          name: '공통 자료',
          createdDate: '2025-01-10',
          materialsCount: 15,
          subFoldersCount: 1
        }
      ];

      const mockMaterials: Material[] = [
        {
          id: 'mat-1',
          name: 'BS 영업 기초 이론.pptx',
          type: 'presentation',
          size: '15.2 MB',
          uploadDate: '2025-01-25',
          uploadedBy: '김강사',
          courseCode: 'BS-2025-01',
          courseName: 'BS 신입 영업사원 기초과정 1차',
          sessionNumber: 1,
          category: 'lecture',
          tags: ['영업', '기초', '이론'],
          description: '영업의 기본 개념과 프로세스에 대한 강의 자료',
          downloadCount: 23,
          isFavorite: true
        },
        {
          id: 'mat-2',
          name: '고객 관계 관리 가이드.pdf',
          type: 'document',
          size: '2.8 MB',
          uploadDate: '2025-01-24',
          uploadedBy: '이강사',
          courseCode: 'BS-2025-02',
          courseName: 'BS 고급 영업 전략과정 2차',
          category: 'reference',
          tags: ['CRM', '고객관리', '가이드'],
          description: 'CRM 시스템 활용법과 고객 관계 관리 전략',
          downloadCount: 15,
          isFavorite: false
        },
        {
          id: 'mat-3',
          name: '영업 실습 시나리오.docx',
          type: 'document',
          size: '1.5 MB',
          uploadDate: '2025-01-23',
          uploadedBy: '박강사',
          courseCode: 'BS-2025-01',
          courseName: 'BS 신입 영업사원 기초과정 1차',
          sessionNumber: 5,
          category: 'assignment',
          tags: ['실습', '시나리오', '영업'],
          description: '영업 상황별 실습을 위한 시나리오 모음',
          downloadCount: 31,
          isFavorite: false
        },
        {
          id: 'mat-4',
          name: '제품 소개 동영상.mp4',
          type: 'video',
          size: '125.6 MB',
          uploadDate: '2025-01-22',
          uploadedBy: '최강사',
          category: 'reference',
          tags: ['제품', '소개', '동영상'],
          description: '신제품 소개 및 특징 설명 영상',
          downloadCount: 8,
          isFavorite: true
        },
        {
          id: 'mat-5',
          name: '평가 답안지 템플릿.xlsx',
          type: 'document',
          size: '456 KB',
          uploadDate: '2025-01-21',
          uploadedBy: '정강사',
          category: 'template',
          tags: ['평가', '템플릿', '답안지'],
          description: '이론 및 실습 평가용 답안지 템플릿',
          downloadCount: 12,
          isFavorite: false
        }
      ];

      setFolders(mockFolders);
      setMaterials(mockMaterials);
      setLoading(false);
    }, 800);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <DocumentTextIcon className="h-8 w-8 text-blue-600" />;
      case 'presentation': return <PresentationChartBarIcon className="h-8 w-8 text-orange-600" />;
      case 'video': return <VideoCameraIcon className="h-8 w-8 text-red-600" />;
      case 'audio': return <MicrophoneIcon className="h-8 w-8 text-purple-600" />;
      case 'image': return <PhotoIcon className="h-8 w-8 text-green-600" />;
      default: return <DocumentIcon className="h-8 w-8 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lecture': return 'bg-blue-100 text-blue-800';
      case 'reference': return 'bg-green-100 text-green-800';
      case 'assignment': return 'bg-orange-100 text-orange-800';
      case 'exam': return 'bg-red-100 text-red-800';
      case 'template': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'lecture': return '강의자료';
      case 'reference': return '참고자료';
      case 'assignment': return '과제';
      case 'exam': return '시험';
      case 'template': return '템플릿';
      default: return '기타';
    }
  };

  const filteredMaterials = materials
    .filter(material => {
      const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           material.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
      const matchesType = selectedType === 'all' || material.type === selectedType;
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'date': return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        case 'size': return parseFloat(b.size) - parseFloat(a.size);
        case 'downloads': return b.downloadCount - a.downloadCount;
        default: return 0;
      }
    });

  const toggleMaterialSelection = (materialId: string) => {
    const newSelected = new Set(selectedMaterials);
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId);
    } else {
      newSelected.add(materialId);
    }
    setSelectedMaterials(newSelected);
  };

  const toggleFavorite = (materialId: string) => {
    setMaterials(prev => 
      prev.map(material => 
        material.id === materialId 
          ? { ...material, isFavorite: !material.isFavorite }
          : material
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">교육 자료를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">📁 교육 자료 관리</h1>
            <p className="text-gray-600 dark:text-gray-300">
              강의 자료, 참고 문서, 과제 등을 체계적으로 관리합니다.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {viewMode === 'grid' ? '목록' : '격자'}
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <CloudArrowUpIcon className="h-4 w-4" />
              <span>업로드</span>
            </button>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="파일명, 태그로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 카테고리</option>
              <option value="lecture">강의자료</option>
              <option value="reference">참고자료</option>
              <option value="assignment">과제</option>
              <option value="exam">시험</option>
              <option value="template">템플릿</option>
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 타입</option>
              <option value="document">문서</option>
              <option value="presentation">프레젠테이션</option>
              <option value="video">동영상</option>
              <option value="audio">오디오</option>
              <option value="image">이미지</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">업로드순</option>
              <option value="name">이름순</option>
              <option value="size">크기순</option>
              <option value="downloads">다운로드순</option>
            </select>
          </div>
        </div>
        
        {selectedMaterials.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {selectedMaterials.size}개 항목 선택됨
              </span>
              <div className="flex items-center space-x-2">
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  일괄 다운로드
                </button>
                <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 폴더 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">폴더</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setCurrentFolderId(folder.id)}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <FolderIcon className="h-8 w-8 text-yellow-600" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {folder.name}
                    </h4>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <div>파일: {folder.materialsCount}개</div>
                  <div>하위폴더: {folder.subFoldersCount}개</div>
                  <div>{new Date(folder.createdDate).toLocaleDateString('ko-KR')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 자료 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              교육 자료 ({filteredMaterials.length})
            </h3>
            <div className="flex items-center space-x-2">
              <button className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                모두 선택
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                선택 해제
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    selectedMaterials.has(material.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => toggleMaterialSelection(material.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      {getTypeIcon(material.type)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(material.id);
                        }}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <StarIcon className={`h-4 w-4 ${
                          material.isFavorite 
                            ? 'text-yellow-500 fill-current' 
                            : 'text-gray-400'
                        }`} />
                      </button>
                      <input
                        type="checkbox"
                        checked={selectedMaterials.has(material.id)}
                        onChange={() => toggleMaterialSelection(material.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 truncate" title={material.name}>
                    {material.name}
                  </h4>
                  
                  <div className="space-y-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(material.category)}`}>
                      {getCategoryLabel(material.category)}
                    </span>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-3 w-3" />
                        <span>{new Date(material.uploadDate).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <UserIcon className="h-3 w-3" />
                        <span>{material.uploadedBy}</span>
                      </div>
                      <div>크기: {material.size}</div>
                      <div>다운로드: {material.downloadCount}회</div>
                    </div>

                    {material.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {material.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            #{tag}
                          </span>
                        ))}
                        {material.tags.length > 2 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{material.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between">
                    <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1">
                      <EyeIcon className="h-3 w-3" />
                      <span>미리보기</span>
                    </button>
                    <button className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center space-x-1">
                      <CloudArrowDownIcon className="h-3 w-3" />
                      <span>다운로드</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                    selectedMaterials.has(material.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => toggleMaterialSelection(material.id)}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedMaterials.has(material.id)}
                      onChange={() => toggleMaterialSelection(material.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="flex-shrink-0">
                      {getTypeIcon(material.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {material.name}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(material.category)}`}>
                          {getCategoryLabel(material.category)}
                        </span>
                        {material.isFavorite && (
                          <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{material.size}</span>
                        <span>{new Date(material.uploadDate).toLocaleDateString('ko-KR')}</span>
                        <span>{material.uploadedBy}</span>
                        <span>다운로드 {material.downloadCount}회</span>
                      </div>
                      
                      {material.description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 truncate">
                          {material.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                        <CloudArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <ShareIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {filteredMaterials.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              검색 조건에 맞는 자료가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">파일 업로드</h3>
            </div>
            
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  파일을 드래그하여 놓거나 클릭하여 선택하세요
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  최대 100MB, 모든 파일 형식 지원
                </p>
                <button className="mt-4 btn-primary">
                  파일 선택
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="btn-secondary"
              >
                취소
              </button>
              <button className="btn-primary">
                업로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsManager;