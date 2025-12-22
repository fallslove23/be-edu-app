'use client';

import React, { useState, useCallback, useRef } from 'react';
import { CloudArrowUpIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { MaterialService } from '@/services/material.service';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import type { MaterialCategory, MaterialUploadProgress } from '@/types/material.types';

interface MaterialUploadZoneProps {
  categories: MaterialCategory[];
  onUploadComplete?: () => void;
}

const MaterialUploadZone: React.FC<MaterialUploadZoneProps> = ({
  categories,
  onUploadComplete,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<MaterialUploadProgress[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    if (!selectedCategory) {
      toast.error('카테고리를 먼저 선택해주세요.');
      return;
    }

    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    // 초기 업로드 상태 설정
    const newUploads: MaterialUploadProgress[] = files.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // 파일별로 업로드 진행
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadIndex = uploads.length + i;

      try {
        // 업로드 시작
        setUploads((prev) =>
          prev.map((upload, idx) =>
            idx === uploadIndex ? { ...upload, status: 'uploading', progress: 0 } : upload
          )
        );

        // 실제 업로드
        await MaterialService.uploadFile(file, selectedCategory, user.id, {
          title: title || file.name,
          description,
          isPublic,
          tags,
        });

        // 업로드 완료
        setUploads((prev) =>
          prev.map((upload, idx) =>
            idx === uploadIndex ? { ...upload, status: 'completed', progress: 100 } : upload
          )
        );

        toast.success(`${file.name} 업로드 완료`);
      } catch (error) {
        console.error('파일 업로드 실패:', error);
        setUploads((prev) =>
          prev.map((upload, idx) =>
            idx === uploadIndex
              ? {
                  ...upload,
                  status: 'failed',
                  error: error instanceof Error ? error.message : '업로드 실패',
                }
              : upload
          )
        );
        toast.error(`${file.name} 업로드 실패`);
      }
    }

    // 업로드 완료 후 폼 초기화
    setTitle('');
    setDescription('');
    setTags([]);
    setTagInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // 완료 콜백 실행
    onUploadComplete?.();
  };

  const removeUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* 카테고리 선택 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          카테고리 선택 *
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
        >
          <option value="">카테고리를 선택하세요</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* 제목 및 설명 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="파일 제목 (비워두면 파일명 사용)"
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">공개 설정</label>
          <select
            value={isPublic ? 'public' : 'private'}
            onChange={(e) => setIsPublic(e.target.value === 'public')}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="public">공개</option>
            <option value="private">비공개</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="자료에 대한 설명을 입력하세요"
          rows={3}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">태그</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="태그 입력 후 Enter"
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            추가
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-foreground rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-destructive"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 드래그앤드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:bg-muted/50'
        }`}
      >
        <CloudArrowUpIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          파일을 드래그하여 놓거나 클릭하여 선택하세요
        </h3>
        <p className="text-muted-foreground mb-6">
          최대 100MB, 모든 파일 형식 지원
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 업로드 진행 상황 */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">업로드 진행 상황</h3>
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
            >
              <DocumentIcon className="w-8 h-8 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(upload.file.size)}
                </p>
                {upload.status === 'uploading' && (
                  <div className="mt-2 w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                {upload.status === 'failed' && (
                  <p className="text-xs text-destructive mt-1">{upload.error}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {upload.status === 'pending' && (
                  <span className="text-xs text-muted-foreground">대기 중</span>
                )}
                {upload.status === 'uploading' && (
                  <span className="text-xs text-primary">업로드 중...</span>
                )}
                {upload.status === 'completed' && (
                  <span className="text-xs text-success">완료</span>
                )}
                {upload.status === 'failed' && (
                  <span className="text-xs text-destructive">실패</span>
                )}
              </div>
              <button
                onClick={() => removeUpload(index)}
                className="p-1 hover:bg-muted rounded"
              >
                <XMarkIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialUploadZone;
