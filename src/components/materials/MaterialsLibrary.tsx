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
  PresentationChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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

const MaterialsLibrary: React.FC = () => {
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
    console.log('📚 MaterialsLibrary 컴포넌트가 렌더링되었습니다.');
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
      case 'document': return <DocumentTextIcon className="h-8 w-8 text-primary" />;
      case 'presentation': return <PresentationChartBarIcon className="h-8 w-8 text-accent" />;
      case 'video': return <VideoCameraIcon className="h-8 w-8 text-destructive" />;
      case 'audio': return <MicrophoneIcon className="h-8 w-8 text-secondary" />;
      case 'image': return <PhotoIcon className="h-8 w-8 text-success" />;
      default: return <DocumentIcon className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lecture': return 'bg-primary/10 text-primary border-primary/20';
      case 'reference': return 'bg-success/10 text-success border-success/20';
      case 'assignment': return 'bg-accent/10 text-accent border-accent/20';
      case 'exam': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'template': return 'bg-secondary/10 text-secondary border-secondary/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
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
    toast.success('즐겨찾기가 업데이트되었습니다.');
  };

  const handleBulkDownload = () => {
    if (selectedMaterials.size === 0) {
      toast.error('다운로드할 자료를 선택해주세요.');
      return;
    }
    toast.success(`${selectedMaterials.size}개 파일을 다운로드합니다.`);
  };

  const handleBulkDelete = () => {
    if (selectedMaterials.size === 0) {
      toast.error('삭제할 자료를 선택해주세요.');
      return;
    }
    if (window.confirm(`선택한 ${selectedMaterials.size}개 파일을 삭제하시겠습니까?`)) {
      setMaterials(prev => prev.filter(material => !selectedMaterials.has(material.id)));
      setSelectedMaterials(new Set());
      toast.success('선택한 자료가 삭제되었습니다.');
    }
  };

  if (loading) {
    console.log('⏳ MaterialsLibrary 로딩 중...');
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm">교육 자료를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  console.log('📚 MaterialsLibrary 메인 렌더링 시작', { 
    materials: materials.length, 
    folders: folders.length,
    filteredMaterials: filteredMaterials.length 
  });

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground mb-2">📚 교육 자료 라이브러리</h1>
            <p className="text-muted-foreground">
              강의 자료, 참고 문서, 과제 등을 체계적으로 관리합니다.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="btn-neutral p-2 rounded-lg"
            >
              {viewMode === 'grid' ? '목록' : '격자'}
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <CloudArrowUpIcon className="h-4 w-4" />
              <span>업로드</span>
            </button>
          </div>
        </div>
      </div>

      {/* 검색 */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="파일명, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 sm:w-64 border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="all">모든 카테고리</option>
            <option value="lecture">강의자료</option>
            <option value="reference">참고자료</option>
            <option value="assignment">과제</option>
            <option value="exam">시험</option>
            <option value="template">템플릿</option>
          </select>

          <select
            id="type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex-1 sm:w-64 border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="all">모든 타입</option>
            <option value="document">문서</option>
            <option value="presentation">프레젠테이션</option>
            <option value="video">동영상</option>
            <option value="audio">오디오</option>
            <option value="image">이미지</option>
          </select>

          <select
            id="sort-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 sm:w-64 border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="date">업로드순</option>
            <option value="name">이름순</option>
            <option value="size">크기순</option>
            <option value="downloads">다운로드순</option>
          </select>
        </div>
        
        {selectedMaterials.size > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedMaterials.size}개 항목 선택됨
              </span>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleBulkDownload}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  일괄 다운로드
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="text-sm text-destructive hover:text-destructive/80 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 폴더 목록 */}
      <div className="bg-card rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-card-foreground">폴더</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setCurrentFolderId(folder.id)}
                className="p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <FolderIcon className="h-8 w-8 text-accent" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-card-foreground truncate">
                      {folder.name}
                    </h4>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
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
      <div className="bg-card rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-card-foreground">
              교육 자료 ({filteredMaterials.length})
            </h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setSelectedMaterials(new Set(filteredMaterials.map(m => m.id)))}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                모두 선택
              </button>
              <span className="text-border">|</span>
              <button 
                onClick={() => setSelectedMaterials(new Set())}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
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
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
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
                        className="p-1 rounded hover:bg-muted transition-colors"
                      >
                        <StarIcon className={`h-4 w-4 ${
                          material.isFavorite 
                            ? 'text-accent fill-current' 
                            : 'text-muted-foreground'
                        }`} />
                      </button>
                      <input
                        type="checkbox"
                        checked={selectedMaterials.has(material.id)}
                        onChange={() => toggleMaterialSelection(material.id)}
                        className="rounded border-input text-primary focus:ring-ring"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-card-foreground mb-2 truncate" title={material.name}>
                    {material.name}
                  </h4>
                  
                  <div className="space-y-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(material.category)}`}>
                      {getCategoryLabel(material.category)}
                    </span>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
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
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                            #{tag}
                          </span>
                        ))}
                        {material.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{material.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-border flex justify-between">
                    <button className="text-sm text-primary hover:text-primary/80 flex items-center space-x-1 transition-colors">
                      <EyeIcon className="h-3 w-3" />
                      <span>미리보기</span>
                    </button>
                    <button className="text-sm text-muted-foreground hover:text-foreground flex items-center space-x-1 transition-colors">
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
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => toggleMaterialSelection(material.id)}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedMaterials.has(material.id)}
                      onChange={() => toggleMaterialSelection(material.id)}
                      className="rounded border-input text-primary focus:ring-ring"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="flex-shrink-0">
                      {getTypeIcon(material.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-card-foreground truncate">
                          {material.name}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(material.category)}`}>
                          {getCategoryLabel(material.category)}
                        </span>
                        {material.isFavorite && (
                          <StarIcon className="h-4 w-4 text-accent fill-current" />
                        )}
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{material.size}</span>
                        <span>{new Date(material.uploadDate).toLocaleDateString('ko-KR')}</span>
                        <span>{material.uploadedBy}</span>
                        <span>다운로드 {material.downloadCount}회</span>
                      </div>
                      
                      {material.description && (
                        <p className="mt-1 text-sm text-muted-foreground truncate">
                          {material.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-success transition-colors">
                        <CloudArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ShareIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {filteredMaterials.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <DocumentIcon className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">검색 결과가 없습니다</h3>
              <p>검색 조건에 맞는 자료가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl max-w-md w-full border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-medium text-card-foreground">파일 업로드</h3>
            </div>
            
            <div className="p-6">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  파일을 드래그하여 놓거나 클릭하여 선택하세요
                </p>
                <p className="text-sm text-muted-foreground">
                  최대 100MB, 모든 파일 형식 지원
                </p>
                <button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors">
                  파일 선택
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="btn-neutral px-4 py-2 text-sm font-medium rounded-lg"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  setShowUploadModal(false);
                  toast.success('파일이 업로드되었습니다.');
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              >
                업로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsLibrary;