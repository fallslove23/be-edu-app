'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PaperAirplaneIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { MaterialService } from '@/services/material.service';
import type { MaterialDistribution } from '@/types/material.types';
import DistributionModal from '@/components/materials/DistributionModal';
import toast from 'react-hot-toast';

export default function MaterialsDistributionPage() {
    const [distributions, setDistributions] = useState<MaterialDistribution[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadDistributions();
    }, []);

    const loadDistributions = async () => {
        try {
            setLoading(true);
            const data = await MaterialService.getDistributions();
            setDistributions(data);
        } catch (error) {
            console.error('배포 목록 로드 실패:', error);
            toast.error('배포 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-success/10 text-success';
            case 'in_progress':
                return 'bg-primary/10 text-primary';
            case 'scheduled':
                return 'bg-warning/10 text-warning';
            case 'failed':
                return 'bg-destructive/10 text-destructive';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed':
                return '배포 완료';
            case 'in_progress':
                return '배포 중';
            case 'scheduled':
                return '배포 예정';
            case 'failed':
                return '배포 실패';
            default:
                return status;
        }
    };

    const getTargetLabel = (dist: MaterialDistribution) => {
        switch (dist.target_type) {
            case 'all':
                return '전체 교육생';
            case 'course':
                return '과정별';
            case 'round':
                return '차수별';
            case 'group':
                return '그룹별';
            case 'individual':
                return '개별 선택';
            default:
                return dist.target_type;
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
                        <h1 className="text-3xl font-bold text-card-foreground">자료 배포 관리</h1>
                        <p className="text-muted-foreground mt-2">
                            교육생들에게 자료를 일괄 배포하고 현황을 관리합니다.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-full flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <PaperAirplaneIcon className="h-5 w-5" />
                        새 배포 생성
                    </button>
                </div>
            </div>

            {distributions.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <PaperAirplaneIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        배포 내역이 없습니다
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        새 배포를 생성하여 교육생들에게 자료를 전달하세요.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary"
                    >
                        <PaperAirplaneIcon className="w-5 h-5 mr-2 inline" />
                        새 배포 생성
                    </button>
                </div>
            ) : (
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
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <UserGroupIcon className="h-4 w-4" />
                                                {getTargetLabel(item)} ({item.total_recipients}명)
                                            </div>
                                            <span>|</span>
                                            <span>{new Date(item.distributed_at).toLocaleDateString('ko-KR')}</span>
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
                                                <div
                                                    className="h-full bg-success rounded-full"
                                                    style={{
                                                        width: `${(item.successful_sends / item.total_recipients) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <span>수신율 {Math.round((item.successful_sends / item.total_recipients) * 100)}%</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-success">
                                            <CheckCircleIcon className="h-4 w-4" />
                                            <span>전송 성공 {item.successful_sends}건</span>
                                        </div>
                                        {item.failed_sends > 0 && (
                                            <div className="flex items-center gap-1 text-destructive">
                                                <span>실패 {item.failed_sends}건</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 배포 생성 모달 */}
            {showCreateModal && (
                <DistributionModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={loadDistributions}
                />
            )}
        </PageContainer>
    );
}
