'use client';

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
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { MaterialService } from '@/services/material.service';
import type { Material, MaterialCategory } from '@/types/material.types';
import { logger } from '@/utils/logger';
import FilePreviewModal from './FilePreviewModal';

const MaterialsLibrary: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'downloads'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      logger.info('자료 라이브러리 데이터 로드 시작', {
        component: 'MaterialsLibrary',
        action: 'loadData',
      });

      const [materialsData, categoriesData] = await Promise.all([
        MaterialService.getMaterials(),
        MaterialService.getCategories(),
      ]);

      setMaterials(materialsData);
      setCategories(categoriesData);

      logger.info('자료 라이브러리 데이터 로드 완료', {
        component: 'MaterialsLibrary',
        action: 'loadData',
        metadata: {
          materialsCount: materialsData.length,
          categoriesCount: categoriesData.length,
        },
      });
    } catch (error) {
      logger.error('자료 라이브러리 데이터 로드 실패', error as Error, {
        component: 'MaterialsLibrary',
        action: 'loadData',
      });
      toast.error('자료 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeFromExtension = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    // 문서
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext || '')) return 'document';
    // 프레젠테이션
    if (['ppt', 'pptx', 'key', 'odp'].includes(ext || '')) return 'presentation';
    // 스프레드시트
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext || '')) return 'document';
    // 이미지
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext || '')) return 'image';
    // 비디오
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext || '')) return 'video';
    // 오디오
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext || '')) return 'audio';

    return 'document';
  };

  const getTypeIcon = (fileName: string) => {
    const type = getFileTypeFromExtension(fileName);
    switch (type) {
      case 'document': return <DocumentTextIcon className="h-8 w-8 text-primary" />;
      case 'presentation': return <PresentationChartBarIcon className="h-8 w-8 text-accent" />;
      case 'video': return <VideoCameraIcon className="h-8 w-8 text-destructive" />;
      case 'audio': return <MicrophoneIcon className="h-8 w-8 text-secondary" />;
      case 'image': return <PhotoIcon className="h-8 w-8 text-success" />;
      default: return <DocumentIcon className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category?.color) {
      return `border-[${category.color}]/20`;
    }
    return 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '미분류';
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || '📁';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const filteredMaterials = materials
    .filter(material => {
      const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (material.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (material.tags && material.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesCategory = selectedCategory === 'all' || material.category_id === selectedCategory;
      const matchesType = selectedType === 'all' || getFileTypeFromExtension(material.file_name) === selectedType;
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.title.localeCompare(b.title);
        case 'date': return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
        case 'size': return b.file_size - a.file_size;
        case 'downloads': return b.download_count - a.download_count;
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

  const handleDownload = async (material: Material) => {
    try {
      logger.info('자료 다운로드 시작', {
        component: 'MaterialsLibrary',
        action: 'handleDownload',
        metadata: { materialId: material.id, fileName: material.file_name },
      });

      // 다운로드 카운트 증가
      await MaterialService.incrementDownloadCount(material.id, 'current-user-id'); // TODO: 실제 user ID 사용

      // 파일 다운로드
      const link = document.createElement('a');
      link.href = material.file_path;
      link.download = material.file_name;
      link.click();

      toast.success('다운로드가 시작되었습니다.');

      // 목록 새로고침
      loadData();
    } catch (error) {
      logger.error('자료 다운로드 실패', error as Error, {
        component: 'MaterialsLibrary',
        action: 'handleDownload',
      });
      toast.error('다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedMaterials.size === 0) {
      toast.error('다운로드할 자료를 선택해주세요.');
      return;
    }

    try {
      for (const materialId of selectedMaterials) {
        const material = materials.find(m => m.id === materialId);
        if (material) {
          await handleDownload(material);
        }
      }
    } catch (error) {
      logger.error('일괄 다운로드 실패', error as Error, {
        component: 'MaterialsLibrary',
        action: 'handleBulkDownload',
      });
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('이 자료를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await MaterialService.deleteMaterial(materialId);
      toast.success('자료가 삭제되었습니다.');
      loadData();
    } catch (error) {
      logger.error('자료 삭제 실패', error as Error, {
        component: 'MaterialsLibrary',
        action: 'handleDelete',
      });
      toast.error('자료 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMaterials.size === 0) {
      toast.error('삭제할 자료를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedMaterials.size}개 파일을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      for (const materialId of selectedMaterials) {
        await MaterialService.deleteMaterial(materialId);
      }
      setSelectedMaterials(new Set());
      toast.success('선택한 자료가 삭제되었습니다.');
      loadData();
    } catch (error) {
      logger.error('일괄 삭제 실패', error as Error, {
        component: 'MaterialsLibrary',
        action: 'handleBulkDelete',
      });
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleViewPreview = (material: Material) => {
    setSelectedMaterial(material);
    setShowPreviewModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-lg animate-spin"></div>
          <p className="text-muted-foreground text-sm">교육 자료를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <PageHeader
        title="📚 교육 자료 라이브러리"
        description="강의 자료, 참고 문서, 과제 등을 체계적으로 관리합니다."
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="btn-secondary"
          >
            {viewMode === 'grid' ? '목록 보기' : '격자 보기'}
          </button>
          <button
            onClick={() => window.location.href = '/materials-upload'}
            className="btn-primary flex items-center gap-2"
          >
            <CloudArrowUpIcon className="h-4 w-4" />
            <span>자료 업로드</span>
          </button>
        </div>
      </PageHeader>

      {/* 검색 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="파일명, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="all">모든 카테고리</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            <FunnelIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full appearance-none border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="all">모든 타입</option>
              <option value="document">문서</option>
              <option value="presentation">프레젠테이션</option>
              <option value="video">동영상</option>
              <option value="audio">오디오</option>
              <option value="image">이미지</option>
            </select>
            <DocumentIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full appearance-none border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="date">업로드순</option>
              <option value="name">이름순</option>
              <option value="size">크기순</option>
              <option value="downloads">다운로드순</option>
            </select>
            <ClockIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
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

      {/* 자료 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
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
                  className={`border rounded-2xl p-4 transition-all cursor-pointer group bg-white dark:bg-gray-800 ${selectedMaterials.has(material.id)
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-md'
                    }`}
                  onClick={() => toggleMaterialSelection(material.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      {getTypeIcon(material.file_name)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.has(material.id)}
                        onChange={() => toggleMaterialSelection(material.id)}
                        className="rounded border-input text-primary focus:ring-ring"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 truncate" title={material.title}>
                    {material.title}
                  </h4>

                  <div className="space-y-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(material.category_id)}`}>
                      {getCategoryIcon(material.category_id)} {getCategoryLabel(material.category_id)}
                    </span>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-3 w-3" />
                        <span>{new Date(material.uploaded_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <div>크기: {formatFileSize(material.file_size)}</div>
                      <div>다운로드: {material.download_count}회</div>
                    </div>

                    {material.tags && material.tags.length > 0 && (
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

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewPreview(material);
                      }}
                      className="text-sm text-primary hover:text-primary/80 flex items-center space-x-1 transition-colors rounded-xl px-2 py-1 hover:bg-primary/10"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>미리보기</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(material);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center space-x-1 transition-colors rounded-xl px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <CloudArrowDownIcon className="h-4 w-4" />
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
                  className={`border rounded-2xl p-4 transition-colors cursor-pointer ${selectedMaterials.has(material.id)
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
                      {getTypeIcon(material.file_name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-card-foreground truncate">
                          {material.title}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(material.category_id)}`}>
                          {getCategoryIcon(material.category_id)} {getCategoryLabel(material.category_id)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(material.file_size)}</span>
                        <span>{new Date(material.uploaded_at).toLocaleDateString('ko-KR')}</span>
                        <span>다운로드 {material.download_count}회</span>
                      </div>

                      {material.description && (
                        <p className="mt-1 text-sm text-muted-foreground truncate">
                          {material.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPreview(material);
                        }}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(material);
                        }}
                        className="p-2 text-muted-foreground hover:text-success transition-colors rounded-full"
                      >
                        <CloudArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(material.id);
                        }}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full"
                      >
                        <TrashIcon className="h-4 w-4" />
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

      {/* 파일 미리보기 모달 */}
      {showPreviewModal && selectedMaterial && (
        <FilePreviewModal
          material={selectedMaterial}
          onClose={() => setShowPreviewModal(false)}
          onDownload={() => handleDownload(selectedMaterial)}
        />
      )}
    </div>
  );
};

export default MaterialsLibrary;