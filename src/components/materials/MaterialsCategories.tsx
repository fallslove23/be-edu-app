'use client';

import React from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { FolderIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function MaterialsCategories() {
    const categories = [
        { id: 1, name: '강의자료', count: 45, description: '수업 진행에 필요한 강의안 및 교재' },
        { id: 2, name: '참고자료', count: 28, description: '심화 학습을 위한 추가 자료' },
        { id: 3, name: '과제', count: 12, description: '실습 및 과제 제출 양식' },
        { id: 4, name: '시험', count: 8, description: '중간/기말 평가 및 퀴즈 자료' },
        { id: 5, name: '템플릿', count: 15, description: '각종 보고서 및 문서 양식' },
    ];

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
                    <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-full flex items-center gap-2 transition-colors shadow-sm">
                        <PlusIcon className="h-5 w-5" />
                        새 카테고리
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                    <div key={category.id} className="bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <FolderIcon className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-colors">
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-full transition-colors">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">{category.name}</h3>
                        <p className="text-muted-foreground mb-4 h-10">{category.description}</p>
                        <div className="flex items-center justify-between text-sm">
                            <span className="px-3 py-1 bg-muted rounded-full text-muted-foreground font-medium">
                                자료 {category.count}개
                            </span>
                            <span className="text-muted-foreground">
                                최근 수정: 2025.01.25
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
}
