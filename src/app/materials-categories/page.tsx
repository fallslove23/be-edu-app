'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { FolderIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MaterialService } from '@/services/material.service';
import CategoryModal from '@/components/materials/CategoryModal';
import type { MaterialCategory } from '@/types/material.types';
import toast from 'react-hot-toast';

export default function MaterialsCategoriesPage() {
    const [categories, setCategories] = useState<MaterialCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | null>(null);
    const [materialCounts, setMaterialCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await MaterialService.getCategories();
            setCategories(data);

            // 각 카테고리별 자료 개수 조회
            const counts: Record<string, number> = {};
            for (const category of data) {
                const materials = await MaterialService.getMaterials({ category_id: category.id });
                counts[category.id] = materials.length;
            }
            setMaterialCounts(counts);
        } catch (error) {
            console.error('카테고리 로드 실패:', error);
            toast.error('카테고리를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedCategory(null);
        setShowModal(true);
    };

    const handleEdit = (category: MaterialCategory) => {
        setSelectedCategory(category);
        setShowModal(true);
    };

    const handleDelete = async (category: MaterialCategory) => {
        const count = materialCounts[category.id] || 0;

        if (count > 0) {
            if (!confirm(`"${category.name}" 카테고리에 ${count}개의 자료가 있습니다.\n정말 삭제하시겠습니까?`)) {
                return;
            }
        } else {
            if (!confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?`)) {
                return;
            }
        }

        try {
            await MaterialService.deleteCategory(category.id);
            toast.success('카테고리가 삭제되었습니다.');
            loadCategories();
        } catch (error) {
            console.error('카테고리 삭제 실패:', error);
            toast.error('카테고리 삭제 중 오류가 발생했습니다.');
        }
    };

    if (loading) {
        return (
            <PageContainer>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="bg-card border-b border-border p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-card-foreground">자료 분류 관리</h1>
                        <p className="text-muted-foreground mt-2">
                            교육 자료의 카테고리를 체계적으로 관리합니다.
                        </p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-full flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <PlusIcon className="h-5 w-5" />
                        새 카테고리
                    </button>
                </div>
            </div>

            {categories.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <FolderIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        카테고리가 없습니다
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        새 카테고리를 생성하여 자료를 체계적으로 관리하세요.
                    </p>
                    <button
                        onClick={handleCreate}
                        className="btn-primary"
                    >
                        <PlusIcon className="w-5 h-5 mr-2 inline" />
                        카테고리 생성
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div
                                    className="p-3 rounded-xl"
                                    style={{ backgroundColor: `${category.color || '#3B82F6'}20` }}
                                >
                                    <span className="text-3xl">{category.icon || '📁'}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-colors"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-full transition-colors"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                {category.name}
                            </h3>
                            <p className="text-muted-foreground mb-4 h-10">
                                {category.description || '설명이 없습니다'}
                            </p>
                            <div className="flex items-center justify-between text-sm">
                                <span className="px-3 py-1 bg-muted rounded-full text-muted-foreground font-medium">
                                    자료 {materialCounts[category.id] || 0}개
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {new Date(category.updated_at).toLocaleDateString('ko-KR')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 카테고리 생성/수정 모달 */}
            {showModal && (
                <CategoryModal
                    category={selectedCategory}
                    onClose={() => setShowModal(false)}
                    onSuccess={loadCategories}
                />
            )}
        </PageContainer>
    );
}
