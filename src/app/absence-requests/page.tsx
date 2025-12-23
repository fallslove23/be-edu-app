'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

type AbsenceType = 'vacation' | 'sick_leave' | 'business_trip' | 'training' | 'personal' | 'other';
type AbsenceStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface AbsenceRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_role: 'trainee' | 'instructor';
  start_date: string;
  end_date: string;
  absence_type: AbsenceType;
  reason: string;
  contact_info?: string;
  status: AbsenceStatus;
  approved_at?: string;
  approved_by?: string;
  approver_name?: string;
  approval_comments?: string;
  created_at: string;
  updated_at: string;
}

interface AbsenceFormData {
  start_date: string;
  end_date: string;
  absence_type: AbsenceType;
  reason: string;
  contact_info: string;
}

interface AbsenceStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  by_type: Record<AbsenceType, number>;
}

export default function AbsenceRequestsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [statistics, setStatistics] = useState<AbsenceStatistics | null>(null);

  // 필터
  const [filterStatus, setFilterStatus] = useState<'all' | AbsenceStatus>('all');
  const [filterType, setFilterType] = useState<'all' | AbsenceType>('all');

  // 신청 폼
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AbsenceFormData>({
    start_date: '',
    end_date: '',
    absence_type: 'personal',
    reason: '',
    contact_info: '',
  });

  // 승인/거부 모달
  const [selectedRequest, setSelectedRequest] = useState<AbsenceRequest | null>(null);
  const [approvalComments, setApprovalComments] = useState('');

  const isAdmin = user?.role === 'app_admin' || user?.role === 'course_manager' || user?.role === 'instructor';

  useEffect(() => {
    if (user) {
      loadRequests();
      loadStatistics();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      // TODO: 실제 API 호출
      // const data = isAdmin
      //   ? await absenceRequestService.getAll()
      //   : await absenceRequestService.getByUserId(user.id);
      setRequests([]);
    } catch (error) {
      console.error('결석 신청 조회 실패:', error);
      toast.error('결석 신청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      // TODO: 실제 API 호출
      // const data = await absenceRequestService.getStatistics();
      setStatistics(null);
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  };

  const handleSubmitRequest = async () => {
    if (!formData.start_date || !formData.end_date || !formData.reason || !user) {
      toast.error('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error('종료 날짜는 시작 날짜 이후여야 합니다.');
      return;
    }

    try {
      // TODO: 실제 API 호출
      // await absenceRequestService.create({
      //   user_id: user.id,
      //   ...formData,
      // });

      // 로컬 상태 업데이트
      const newRequest: AbsenceRequest = {
        id: Math.random().toString(),
        user_id: user.id,
        user_name: user.name || user.email,
        user_role: user.role === 'trainee' ? 'trainee' : 'instructor',
        ...formData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setRequests([newRequest, ...requests]);
      setShowForm(false);
      setFormData({
        start_date: '',
        end_date: '',
        absence_type: 'personal',
        reason: '',
        contact_info: '',
      });
      toast.success('결석 신청이 제출되었습니다.');
      await loadStatistics();
    } catch (error) {
      console.error('결석 신청 실패:', error);
      toast.error('결석 신청 중 오류가 발생했습니다.');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !user) return;

    try {
      // TODO: 실제 API 호출
      // await absenceRequestService.approve(selectedRequest.id, {
      //   approved_by: user.id,
      //   approval_comments: approvalComments,
      // });

      setRequests(
        requests.map((r) =>
          r.id === selectedRequest.id
            ? {
                ...r,
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: user.id,
                approver_name: user.name || user.email,
                approval_comments: approvalComments,
              }
            : r
        )
      );

      toast.success('결석 신청이 승인되었습니다.');
      setSelectedRequest(null);
      setApprovalComments('');
      await loadStatistics();
    } catch (error) {
      console.error('승인 실패:', error);
      toast.error('승인 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !user) return;

    if (!approvalComments) {
      toast.error('거부 사유를 입력해주세요.');
      return;
    }

    try {
      // TODO: 실제 API 호출
      // await absenceRequestService.reject(selectedRequest.id, {
      //   approved_by: user.id,
      //   approval_comments: approvalComments,
      // });

      setRequests(
        requests.map((r) =>
          r.id === selectedRequest.id
            ? {
                ...r,
                status: 'rejected',
                approved_at: new Date().toISOString(),
                approved_by: user.id,
                approver_name: user.name || user.email,
                approval_comments: approvalComments,
              }
            : r
        )
      );

      toast.success('결석 신청이 거부되었습니다.');
      setSelectedRequest(null);
      setApprovalComments('');
      await loadStatistics();
    } catch (error) {
      console.error('거부 실패:', error);
      toast.error('거부 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!confirm('결석 신청을 취소하시겠습니까?')) return;

    try {
      // TODO: 실제 API 호출
      // await absenceRequestService.cancel(requestId);

      setRequests(
        requests.map((r) =>
          r.id === requestId ? { ...r, status: 'cancelled', updated_at: new Date().toISOString() } : r
        )
      );

      toast.success('결석 신청이 취소되었습니다.');
      await loadStatistics();
    } catch (error) {
      console.error('취소 실패:', error);
      toast.error('취소 중 오류가 발생했습니다.');
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (filterStatus !== 'all' && request.status !== filterStatus) return false;
    if (filterType !== 'all' && request.absence_type !== filterType) return false;
    return true;
  });

  const getTypeLabel = (type: AbsenceType) => {
    const labels: Record<AbsenceType, string> = {
      vacation: '휴가',
      sick_leave: '병가',
      business_trip: '출장',
      training: '교육',
      personal: '개인 사유',
      other: '기타',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: AbsenceStatus) => {
    const labels: Record<AbsenceStatus, string> = {
      pending: '대기중',
      approved: '승인됨',
      rejected: '거부됨',
      cancelled: '취소됨',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: AbsenceStatus) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
      case 'approved':
        return 'text-success bg-success/10 border-success/20';
      case 'rejected':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'cancelled':
        return 'text-muted-foreground bg-muted/30 border-border';
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <PageContainer>
      <PageHeader title="📋 결석 신청 관리" description="결석 신청을 제출하고 관리합니다.">
        {!isAdmin && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            결석 신청
          </button>
        )}
      </PageHeader>

      {/* 통계 카드 */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">전체 신청</p>
                <p className="text-2xl font-bold text-foreground">{statistics.total}건</p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-yellow-500/20 p-4 bg-yellow-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">대기중</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.pending}건</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-success/20 p-4 bg-success/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">승인됨</p>
                <p className="text-2xl font-bold text-success">{statistics.approved}건</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-success" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-destructive/20 p-4 bg-destructive/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">거부됨</p>
                <p className="text-2xl font-bold text-destructive">{statistics.rejected}건</p>
              </div>
              <XCircleIcon className="h-8 w-8 text-destructive" />
            </div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="appearance-none border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="all">모든 상태</option>
            <option value="pending">대기중</option>
            <option value="approved">승인됨</option>
            <option value="rejected">거부됨</option>
            <option value="cancelled">취소됨</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="appearance-none border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="all">모든 유형</option>
            <option value="vacation">휴가</option>
            <option value="sick_leave">병가</option>
            <option value="business_trip">출장</option>
            <option value="training">교육</option>
            <option value="personal">개인 사유</option>
            <option value="other">기타</option>
          </select>
        </div>
      </div>

      {/* 신청 목록 */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <DocumentTextIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {requests.length === 0 ? '결석 신청이 없습니다' : '필터 조건에 맞는 신청이 없습니다'}
          </h3>
          <p className="text-muted-foreground">
            {!isAdmin && requests.length === 0 && '결석 신청을 제출해보세요.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request.id} className="bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-foreground">{getTypeLabel(request.absence_type)}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                    {isAdmin && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {request.user_role === 'trainee' ? '교육생' : '강사'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {isAdmin && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                        {request.user_name}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDaysIcon className="h-4 w-4" />
                      {new Date(request.start_date).toLocaleDateString('ko-KR')} ~{' '}
                      {new Date(request.end_date).toLocaleDateString('ko-KR')}
                      <span className="text-primary font-medium">
                        ({calculateDays(request.start_date, request.end_date)}일)
                      </span>
                    </div>

                    <div className="text-foreground">
                      <p className="font-medium">사유</p>
                      <p className="text-muted-foreground mt-1">{request.reason}</p>
                    </div>

                    {request.contact_info && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">연락처:</span> {request.contact_info}
                      </div>
                    )}

                    {request.approval_comments && (
                      <div className={`mt-3 p-3 rounded-lg border ${
                        request.status === 'approved'
                          ? 'bg-success/10 border-success/20'
                          : 'bg-destructive/10 border-destructive/20'
                      }`}>
                        <p className={`text-sm font-medium mb-1 ${
                          request.status === 'approved' ? 'text-success' : 'text-destructive'
                        }`}>
                          {request.status === 'approved' ? '승인' : '거부'} 의견
                        </p>
                        <p className="text-sm text-muted-foreground">{request.approval_comments}</p>
                        {request.approver_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            처리자: {request.approver_name} •{' '}
                            {request.approved_at && new Date(request.approved_at).toLocaleString('ko-KR')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {isAdmin && request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setApprovalComments('');
                        }}
                        className="px-4 py-2 rounded-lg bg-success text-white hover:bg-success/90 transition-all text-sm"
                      >
                        승인/거부
                      </button>
                    </>
                  )}

                  {!isAdmin && request.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(request.id)}
                      className="px-4 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-all text-sm"
                    >
                      취소
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 결석 신청 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-foreground mb-4">결석 신청</h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">시작 날짜 *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">종료 날짜 *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">결석 유형 *</label>
                <select
                  value={formData.absence_type}
                  onChange={(e) => setFormData({ ...formData, absence_type: e.target.value as AbsenceType })}
                  className="w-full appearance-none border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="personal">개인 사유</option>
                  <option value="sick_leave">병가</option>
                  <option value="vacation">휴가</option>
                  <option value="business_trip">출장</option>
                  <option value="training">교육</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">사유 *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={4}
                  placeholder="결석 사유를 상세히 입력해주세요"
                  className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">연락처 (선택)</label>
                <input
                  type="text"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  placeholder="비상 연락처"
                  className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-border bg-background text-foreground hover:bg-muted/50 transition-all"
              >
                취소
              </button>
              <button onClick={handleSubmitRequest} className="flex-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all">
                제출
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 승인/거부 모달 */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-foreground mb-4">결석 신청 처리</h3>

            <div className="bg-muted/30 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-foreground mb-2">
                {selectedRequest.user_name} - {getTypeLabel(selectedRequest.absence_type)}
              </h4>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedRequest.start_date).toLocaleDateString('ko-KR')} ~{' '}
                {new Date(selectedRequest.end_date).toLocaleDateString('ko-KR')} (
                {calculateDays(selectedRequest.start_date, selectedRequest.end_date)}일)
              </p>
              <p className="text-sm text-foreground mt-2">{selectedRequest.reason}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">승인/거부 의견</label>
              <textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={4}
                placeholder="의견을 입력해주세요 (거부 시 필수)"
                className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setApprovalComments('');
                }}
                className="flex-1 px-4 py-2 rounded-xl border border-border bg-background text-foreground hover:bg-muted/50 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-all"
              >
                거부
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2 rounded-xl bg-success text-white hover:bg-success/90 transition-all"
              >
                승인
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
