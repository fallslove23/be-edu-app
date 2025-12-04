'use client';

import React from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

export default function MaterialsUploadPage() {
    return (
        <PageContainer>
            <div className="bg-card border-b border-border p-6 mb-6">
                <h1 className="text-3xl font-bold text-card-foreground">자료 업로드</h1>
                <p className="text-muted-foreground mt-2">
                    새로운 교육 자료를 업로드하고 관리합니다.
                </p>
            </div>

            <div className="bg-card rounded-lg border border-border p-8">
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                    <CloudArrowUpIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        파일을 드래그하여 놓거나 클릭하여 선택하세요
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        최대 100MB, 문서, 이미지, 동영상 등 모든 파일 형식 지원
                    </p>
                    <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-full font-medium transition-colors shadow-sm">
                        파일 선택하기
                    </button>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-medium text-foreground mb-4">업로드 가이드</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>저작권에 위배되지 않는 자료만 업로드해주세요.</li>
                        <li>파일 명은 내용을 쉽게 파악할 수 있도록 작성해주세요.</li>
                        <li>대용량 파일은 업로드 시간이 소요될 수 있습니다.</li>
                    </ul>
                </div>
            </div>
        </PageContainer>
    );
}
