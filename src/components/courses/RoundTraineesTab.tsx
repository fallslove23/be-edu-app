'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserMinusIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { CourseRound } from '@/types/course-template.types';
import type { User } from '@/services/user.services';
import { UserService } from '@/services/user.services';
import { CourseTemplateService } from '@/services/course-template.service';
import toast from 'react-hot-toast';

interface RoundTraineesTabProps {
  round: CourseRound;
  onUpdate: () => void;
}

// 차수 수강생 타입 정의
interface RoundEnrollment {
  id: string;
  round_id: string;
  trainee_id: string;
  trainee_name: string;
  trainee_email: string;
  enrolled_at: string;
  status: 'active' | 'completed' | 'dropped';
  final_score?: number;
}

export default function RoundTraineesTab({ round, onUpdate }: RoundTraineesTabProps) {
  const [enrolledTrainees, setEnrolledTrainees] = useState<RoundEnrollment[]>([]);
  const [availableTrainees, setAvailableTrainees] = useState<User[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainees, setSelectedTrainees] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEnrolledTrainees();
  }, [round.id]);

  const loadEnrolledTrainees = async () => {
    try {
      setIsLoading(true);
      const enrollments = await CourseTemplateService.getRoundEnrollments(round.id);
      setEnrolledTrainees(enrollments as any);
    } catch (error) {
      console.error('수강생 목록 로드 오류:', error);
      toast.error('수강생 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableTrainees = async () => {
    try {
      const trainees = await UserService.getUsersByRole('trainee');
      // 이미 등록된 수강생 제외
      const enrolledIds = enrolledTrainees.map((e) => e.trainee_id);
      const filtered = trainees.filter((t) => !enrolledIds.includes(t.id));
      setAvailableTrainees(filtered);
    } catch (error) {
      console.error('교육생 목록 로드 오류:', error);
      toast.error('교육생 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleOpenAddModal = async () => {
    await loadAvailableTrainees();
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedTrainees([]);
    setSearchTerm('');
  };

  const handleToggleTrainee = (traineeId: string) => {
    setSelectedTrainees((prev) =>
      prev.includes(traineeId)
        ? prev.filter((id) => id !== traineeId)
        : [...prev, traineeId]
    );
  };

  const handleAddTrainees = async () => {
    if (selectedTrainees.length === 0) {
      toast.error('등록할 교육생을 선택해주세요.');
      return;
    }

    try {
      await CourseTemplateService.addRoundTrainees(round.id, selectedTrainees);
      toast.success(`${selectedTrainees.length}명의 교육생이 등록되었습니다.`);
      handleCloseAddModal();
      await loadEnrolledTrainees();
      onUpdate();
    } catch (error: any) {
      console.error('교육생 등록 오류:', error);
      toast.error(error.message || '교육생 등록 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveTrainee = async (enrollmentId: string, traineeName: string) => {
    if (!confirm(`${traineeName}을(를) 등록 해제하시겠습니까?`)) {
      return;
    }

    try {
      await CourseTemplateService.removeRoundTrainee(enrollmentId);
      toast.success(`${traineeName}이(가) 등록 해제되었습니다.`);
      await loadEnrolledTrainees();
      onUpdate();
    } catch (error) {
      console.error('등록 해제 오류:', error);
      toast.error('등록 해제 중 오류가 발생했습니다.');
    }
  };

  const filteredTrainees = availableTrainees.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.employee_id && t.employee_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">수강생 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-lg border border-border p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">수강생 관리</h2>
            <p className="text-sm text-muted-foreground mt-1">
              현재 {round.current_trainees}명 / 최대 {round.max_trainees}명
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            disabled={round.current_trainees >= round.max_trainees}
            className="btn-primary btn-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            교육생 추가
          </button>
        </div>

        {/* 수강생 목록 */}
        {enrolledTrainees.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
            <p className="text-muted-foreground mb-4">등록된 수강생이 없습니다.</p>
            <button onClick={handleOpenAddModal} className="btn-primary btn-sm rounded-full">
              <PlusIcon className="w-4 h-4 mr-1" />
              첫 수강생 추가하기
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">이름</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">이메일</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">등록일</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">상태</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">최종 점수</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {enrolledTrainees.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground">{enrollment.trainee_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{enrollment.trainee_email}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(enrollment.enrolled_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          enrollment.status === 'active'
                            ? 'bg-green-500/10 text-green-700'
                            : enrollment.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {enrollment.status === 'active' ? '수강 중' : enrollment.status === 'completed' ? '완료' : '중단'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {enrollment.final_score ? `${enrollment.final_score}점` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveTrainee(enrollment.id, enrollment.trainee_name)}
                        className="text-destructive hover:text-destructive/80 transition-colors p-1"
                        title="등록 해제"
                      >
                        <UserMinusIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 교육생 추가 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">교육생 추가</h3>
              <button onClick={handleCloseAddModal} className="text-muted-foreground hover:text-foreground rounded-full">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* 검색 */}
            <div className="p-6 border-b border-border">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="이름, 이메일, 사번으로 검색..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedTrainees.length}명 선택됨 · 남은 정원: {round.max_trainees - round.current_trainees}명
              </p>
            </div>

            {/* 교육생 목록 */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredTrainees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">등록 가능한 교육생이 없습니다.</div>
              ) : (
                <div className="space-y-2">
                  {filteredTrainees.map((trainee) => (
                    <div
                      key={trainee.id}
                      onClick={() => handleToggleTrainee(trainee.id)}
                      className={`flex items-center justify-between p-4 rounded-full border cursor-pointer transition-colors ${
                        selectedTrainees.includes(trainee.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{trainee.name}</p>
                        <p className="text-sm text-muted-foreground">{trainee.email}</p>
                        {trainee.department && (
                          <p className="text-xs text-muted-foreground mt-1">{trainee.department}</p>
                        )}
                      </div>
                      {selectedTrainees.includes(trainee.id) && (
                        <CheckCircleIcon className="w-6 h-6 text-primary flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <button onClick={handleCloseAddModal} className="btn-slate btn-sm rounded-full">
                취소
              </button>
              <button
                onClick={handleAddTrainees}
                disabled={selectedTrainees.length === 0}
                className="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedTrainees.length > 0 ? `${selectedTrainees.length}명 추가` : '선택'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
