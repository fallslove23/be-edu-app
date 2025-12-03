'use client';

import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  AcademicCapIcon,
  EyeIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import TraineeDashboard from '../trainee/TraineeDashboard';
import InstructorDashboard from '../instructor/InstructorDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

interface RolePreviewSelectorProps {
  onClose?: () => void;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

const RolePreviewSelector: React.FC<RolePreviewSelectorProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [previewRole, setPreviewRole] = useState<'trainee' | 'instructor' | null>(null);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [trainees, setTrainees] = useState<UserOption[]>([]);
  const [instructors, setInstructors] = useState<UserOption[]>([]);
  const [showTraineeSelector, setShowTraineeSelector] = useState(false);
  const [showInstructorSelector, setShowInstructorSelector] = useState(false);
  const [loadingTrainees, setLoadingTrainees] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  // 관리자가 아니면 이 컴포넌트를 보여주지 않음
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return null;
  }

  // 교육생 목록 로드
  useEffect(() => {
    if (showTraineeSelector && trainees.length === 0) {
      loadTrainees();
    }
  }, [showTraineeSelector]);

  // 강사 목록 로드
  useEffect(() => {
    if (showInstructorSelector && instructors.length === 0) {
      loadInstructors();
    }
  }, [showInstructorSelector]);

  const loadTrainees = async () => {
    setLoadingTrainees(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'trainee')
        .eq('is_active', true)
        .order('name')
        .limit(20);

      if (error) throw error;

      setTrainees(data || []);
    } catch (error) {
      console.error('교육생 목록 로드 실패:', error);
    } finally {
      setLoadingTrainees(false);
    }
  };

  const loadInstructors = async () => {
    setLoadingInstructors(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'instructor')
        .eq('is_active', true)
        .order('name')
        .limit(20);

      if (error) throw error;

      setInstructors(data || []);
    } catch (error) {
      console.error('강사 목록 로드 실패:', error);
    } finally {
      setLoadingInstructors(false);
    }
  };

  const handleTraineeSelect = (traineeId: string) => {
    setSelectedTraineeId(traineeId);
    setShowTraineeSelector(false);
    setPreviewRole('trainee');
  };

  const handleInstructorSelect = (instructorId: string) => {
    setSelectedInstructorId(instructorId);
    setShowInstructorSelector(false);
    setPreviewRole('instructor');
  };

  const roles = [
    {
      id: 'trainee' as const,
      name: '교육생 대시보드',
      icon: UserIcon,
      color: 'indigo',
      description: '교육생이 보는 화면'
    },
    {
      id: 'instructor' as const,
      name: '강사 대시보드',
      icon: AcademicCapIcon,
      color: 'emerald',
      description: '강사가 보는 화면'
    }
  ];

  // 교육생 선택 모달
  if (showTraineeSelector) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-border">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4">
            <h3 className="text-lg font-semibold">교육생 선택</h3>
            <p className="text-xs text-white/80 mt-1">미리보기할 교육생을 선택하세요</p>
          </div>

          {/* 교육생 목록 */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {loadingTrainees ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <p className="text-sm">교육생 목록을 불러오는 중...</p>
              </div>
            ) : trainees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">등록된 교육생이 없습니다.</p>
                <p className="text-xs mt-2">샘플 데이터를 생성하려면 아래 스크립트를 실행하세요:</p>
                <code className="text-xs bg-secondary px-2 py-1 rounded mt-2 block">
                  npx tsx scripts/seed-sample-trainee.ts
                </code>
              </div>
            ) : (
              <div className="space-y-2">
                {trainees.map((trainee) => (
                  <button
                    key={trainee.id}
                    onClick={() => handleTraineeSelect(trainee.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left border border-border hover:border-indigo-300 dark:hover:border-indigo-700"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-card-foreground">{trainee.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{trainee.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="border-t border-border p-4">
            <button
              onClick={() => setShowTraineeSelector(false)}
              className="w-full px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 교육생 대시보드 미리보기
  if (previewRole === 'trainee' && selectedTraineeId) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen p-2 sm:p-4">
          <div className="max-w-7xl mx-auto">
            {/* 미리보기 헤더 */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-3 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between sticky top-0 z-10 shadow-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <div>
                  <span className="font-semibold text-sm sm:text-base">교육생 대시보드 미리보기</span>
                  <p className="text-xs text-white/80 hidden sm:block">관리자 모드에서 교육생 화면 확인</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewRole(null);
                  setSelectedTraineeId(null);
                }}
                className="px-3 sm:px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                닫기
              </button>
            </div>

            {/* 교육생 대시보드 */}
            <div className="bg-background rounded-b-xl sm:rounded-b-2xl shadow-2xl">
              <TraineeDashboard traineeId={selectedTraineeId} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 강사 선택 모달
  if (showInstructorSelector) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-border">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4">
            <h3 className="text-lg font-semibold">강사 선택</h3>
            <p className="text-xs text-white/80 mt-1">미리보기할 강사를 선택하세요</p>
          </div>

          {/* 강사 목록 */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {loadingInstructors ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                <p className="text-sm">강사 목록을 불러오는 중...</p>
              </div>
            ) : instructors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AcademicCapIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">등록된 강사가 없습니다.</p>
                <p className="text-xs mt-2">샘플 데이터를 생성하려면 아래 스크립트를 실행하세요:</p>
                <code className="text-xs bg-secondary px-2 py-1 rounded mt-2 block">
                  npx tsx scripts/seed-sample-instructor.ts
                </code>
              </div>
            ) : (
              <div className="space-y-2">
                {instructors.map((instructor) => (
                  <button
                    key={instructor.id}
                    onClick={() => handleInstructorSelect(instructor.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left border border-border hover:border-emerald-300 dark:hover:border-emerald-700"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <AcademicCapIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-card-foreground">{instructor.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{instructor.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="border-t border-border p-4">
            <button
              onClick={() => setShowInstructorSelector(false)}
              className="w-full px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 강사 대시보드 미리보기
  if (previewRole === 'instructor' && selectedInstructorId) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen p-2 sm:p-4">
          <div className="max-w-7xl mx-auto">
            {/* 미리보기 헤더 */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-6 py-3 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between sticky top-0 z-10 shadow-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <div>
                  <span className="font-semibold text-sm sm:text-base">강사 대시보드 미리보기</span>
                  <p className="text-xs text-white/80 hidden sm:block">관리자 모드에서 강사 화면 확인</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewRole(null);
                  setSelectedInstructorId(null);
                }}
                className="px-3 sm:px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                닫기
              </button>
            </div>

            {/* 강사 대시보드 */}
            <div className="bg-background rounded-b-xl sm:rounded-b-2xl shadow-2xl">
              <InstructorDashboard instructorId={selectedInstructorId} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 역할 선택 버튼
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">미리보기:</span>
      {roles.map((role) => {
        const Icon = role.icon;
        const colorClasses = {
          indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800',
          emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800'
        };

        return (
          <button
            key={role.id}
            onClick={() => {
              if (role.id === 'trainee') {
                setShowTraineeSelector(true);
              } else if (role.id === 'instructor') {
                setShowInstructorSelector(true);
              } else {
                setPreviewRole(role.id);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-200 text-xs font-medium ${colorClasses[role.color as keyof typeof colorClasses]}`}
            title={role.description}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{role.name}</span>
            <ChevronDownIcon className="h-3 w-3" />
          </button>
        );
      })}
    </div>
  );
};

export default RolePreviewSelector;
