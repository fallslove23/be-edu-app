'use client';

import React from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PaperAirplaneIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function MaterialsDistribution() {
    const distributions = [
        { id: 1, title: 'BS 신입 영업사원 기초과정 1차 자료 배포', target: '수강생 전체 (45명)', date: '2025.01.25', status: 'completed' },
        { id: 2, title: '영업 실습 시나리오 가이드', target: '영업1팀 (12명)', date: '2025.01.24', status: 'completed' },
        { id: 3, title: '중간 평가 대비 요약집', target: '수강생 전체 (45명)', date: '2025.01.28', status: 'scheduled' },
    ];

    return (
        <PageContainer>
            <div className="bg-card border-b border-border p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-card-foreground">자료 배포 관리</h1>
                        <p className="text-muted-foreground mt-2">
                            교육생들에게 자료를 일괄 배포하고 현황을 관리합니다.
                        </p>
                    </div>
                    <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-full flex items-center gap-2 transition-colors shadow-sm">
                        <PaperAirplaneIcon className="h-5 w-5" />
                        새 배포 생성
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                    <h3 className="text-lg font-medium text-foreground">최근 배포 내역</h3>
                </div>
                <div className="divide-y divide-border">
                    {distributions.map((item) => (
                        <div key={item.id} className="p-6 hover:bg-muted/30 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-lg font-bold text-foreground">{item.title}</h4>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'completed'
                                                ? 'bg-success/10 text-success'
                                                : 'bg-warning/10 text-warning'
                                            }`}>
                                            {item.status === 'completed' ? '배포 완료' : '배포 예정'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <UserGroupIcon className="h-4 w-4" />
                                            {item.target}
                                        </div>
                                        <span>|</span>
                                        <span>{item.date}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                                        상세 보기
                                    </button>
                                </div>
                            </div>

                            {item.status === 'completed' && (
                                <div className="mt-4 flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="w-[95%] h-full bg-success rounded-full"></div>
                                        </div>
                                        <span>수신율 95%</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-success">
                                        <CheckCircleIcon className="h-4 w-4" />
                                        <span>전송 성공 43건</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </PageContainer>
    );
}
