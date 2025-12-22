'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { CourseTemplateService } from '@/services/course-template.service';
import type { CourseRound } from '@/types/course-template.types';
import toast from 'react-hot-toast';
import RoundTraineesTab from '@/components/courses/RoundTraineesTab';
import RoundSessionsTab from '@/components/courses/RoundSessionsTab';
import RoundEditModal from '@/components/courses/RoundEditModal';

type TabType = 'overview' | 'trainees' | 'sessions' | 'exams';

export default function RoundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.id as string;

  const [round, setRound] = useState<CourseRound | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadRoundData();
  }, [roundId]);

  const loadRoundData = async () => {
    try {
      setIsLoading(true);
      const allRounds = await CourseTemplateService.getRounds({});
      const foundRound = allRounds.find(r => r.id === roundId);
      if (foundRound) {
        setRound(foundRound);
      } else {
        toast.error('차수를 찾을 수 없습니다.');
        router.push('/courses/management');
      }
    } catch (error) {
      console.error('차수 로드 오류:', error);
      toast.error('차수 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/courses/management');
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!round) return;

    if (!confirm(`"${round.title}" 차수를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await CourseTemplateService.deleteRound(round.id);
      toast.success('차수가 삭제되었습니다.');
      router.push('/courses/management');
    } catch (error) {
      console.error('차수 삭제 실패:', error);
      toast.error('차수 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleStatusChange = async (newStatus: 'in_progress' | 'completed') => {
    if (!round) return;

    try {
      await CourseTemplateService.updateRound(round.id, { status: newStatus });
      await loadRoundData();
      toast.success(
        newStatus === 'in_progress' ? '차수가 시작되었습니다.' : '차수가 완료되었습니다.'
      );
    } catch (error) {
      console.error('상태 변경 실패:', error);
      toast.error('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'recruiting':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'in_progress':
        return 'bg-green-500/10 text-green-700 border-green-300';
      case 'completed':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/50';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning':
        return '기획 중';
      case 'recruiting':
        return '모집 중';
      case 'in_progress':
        return '진행 중';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">차수 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">차수를 찾을 수 없습니다.</p>
          <button onClick={handleBack} className="btn-primary rounded-full">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 뒤로가기 + 제목 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              <span>목록으로</span>
            </button>

            {/* 액션 버튼들 */}
            <div className="flex items-center space-x-2">
              {round.status === 'recruiting' && (
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  className="btn-primary btn-sm flex items-center"
                >
                  <PlayIcon className="w-4 h-4 mr-1" />
                  시작
                </button>
              )}
              {round.status === 'in_progress' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="btn-primary btn-sm flex items-center"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  완료
                </button>
              )}
              <button onClick={handleEdit} className="btn-slate btn-sm flex items-center rounded-full">
                <PencilIcon className="w-4 h-4 mr-1" />
                편집
              </button>
              <button
                onClick={handleDelete}
                className="btn-outline border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground btn-sm flex items-center"
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                삭제
              </button>
            </div>
          </div>

          {/* 제목 + 상태 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{round.title}</h1>
              <p className="text-muted-foreground mt-1">
                {round.round_number}차 · {round.manager_name || '운영 담당자 미배정'}
              </p>
            </div>
            <span
              className={`px-4 py-2 text-sm font-medium rounded-full border ${getStatusColor(
                round.status
              )}`}
            >
              {getStatusLabel(round.status)}
            </span>
          </div>

          {/* 주요 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center space-x-3">
              <CalendarDaysIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">교육 기간</p>
                <p className="text-sm font-medium text-foreground">
                  {round.start_date} ~ {round.end_date}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">수강생</p>
                <p className="text-sm font-medium text-foreground">
                  {round.current_trainees}/{round.max_trainees}명
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPinIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">강의 장소</p>
                <p className="text-sm font-medium text-foreground">{round.location}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ClockIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">세션</p>
                <p className="text-sm font-medium text-foreground">
                  {round.sessions?.length || 0}개
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              📋 기본 정보
            </button>
            <button
              onClick={() => setActiveTab('trainees')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'trainees'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              👥 수강생 ({round.current_trainees})
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'sessions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              📅 세션 ({round.sessions?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'exams'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              📝 시험
            </button>
          </nav>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">기본 정보</h2>

            {round.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">설명</h3>
                <p className="text-foreground whitespace-pre-wrap">{round.description}</p>
              </div>
            )}

            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground">
                💡 강사는 세션(일정)별로 배정됩니다. 세션 탭에서 관리하세요.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'trainees' && (
          <RoundTraineesTab round={round} onUpdate={loadRoundData} />
        )}

        {activeTab === 'sessions' && (
          <RoundSessionsTab round={round} onUpdate={loadRoundData} />
        )}

        {activeTab === 'exams' && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">시험 관리</h2>
            <p className="text-muted-foreground">시험 관리 기능 구현 예정</p>
          </div>
        )}
      </div>

      {/* 편집 모달 */}
      {showEditModal && (
        <RoundEditModal
          round={round}
          onClose={() => setShowEditModal(false)}
          onUpdate={loadRoundData}
        />
      )}
    </div>
  );
}
