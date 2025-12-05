'use client';

import React from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

export default function MaterialsUpload() {
    return (
        <PageContainer>
            <PageHeader
                title="자료 업로드"
                description="새로운 교육 자료를 업로드하고 관리합니다."
            />

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer group">
                    <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4 group-hover:text-primary transition-colors" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        파일을 드래그하여 놓거나 클릭하여 선택하세요
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        최대 100MB, 문서, 이미지, 동영상 등 모든 파일 형식 지원
                    </p>
                    <button className="btn-primary px-8 py-3 text-base">
                        파일 선택하기
                    </button>
                </div>

                <div className="mt-8 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">업로드 가이드</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                        <li>저작권에 위배되지 않는 자료만 업로드해주세요.</li>
                        <li>파일 명은 내용을 쉽게 파악할 수 있도록 작성해주세요.</li>
                        <li>대용량 파일은 업로드 시간이 소요될 수 있습니다.</li>
                    </ul>
                </div>
            </div>
        </PageContainer>
    );
}
