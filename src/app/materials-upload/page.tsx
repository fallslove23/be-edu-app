'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { useRouter } from 'next/navigation';
import { MaterialService } from '@/services/material.service';
import MaterialUploadZone from '@/components/materials/MaterialUploadZone';
import type { MaterialCategory } from '@/types/material.types';
import toast from 'react-hot-toast';

export default function MaterialsUploadPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<MaterialCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await MaterialService.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('카테고리 로드 실패:', error);
            toast.error('카테고리를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = () => {
        toast.success('모든 파일 업로드가 완료되었습니다.');
        // 자료 라이브러리 페이지로 이동하거나 페이지 갱신
        setTimeout(() => {
            router.push('/materials-library');
        }, 1500);
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
                <h1 className="text-3xl font-bold text-card-foreground">자료 업로드</h1>
                <p className="text-muted-foreground mt-2">
                    새로운 교육 자료를 업로드하고 관리합니다.
                </p>
            </div>

            <div className="bg-card rounded-lg border border-border p-8">
                <MaterialUploadZone
                    categories={categories}
                    onUploadComplete={handleUploadComplete}
                />

                <div className="mt-8 pt-8 border-t border-border">
                    <h3 className="text-lg font-medium text-foreground mb-4">업로드 가이드</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>저작권에 위배되지 않는 자료만 업로드해주세요.</li>
                        <li>파일 명은 내용을 쉽게 파악할 수 있도록 작성해주세요.</li>
                        <li>대용량 파일은 업로드 시간이 소요될 수 있습니다.</li>
                        <li>업로드한 자료는 선택한 카테고리에 자동으로 분류됩니다.</li>
                    </ul>
                </div>
            </div>
        </PageContainer>
    );
}
