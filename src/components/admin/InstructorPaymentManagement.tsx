/**
 * 강사료 계산 및 관리 컴포넌트
 *
 * 기능:
 * - 과정별 강사 강의 시간 집계
 * - 강사료 자동 계산 (주강사 10,000원/시간, 보조강사 5,000원/시간)
 * - 이론/실기 시간 구분 표시
 * - 강사료 확정 및 지급 이력 관리
 */

import React, { useState, useEffect } from 'react';
import {
  instructorPaymentService,
  InstructorTeachingSummary,
  InstructorPaymentHistory
} from '../../services/instructor-payment.service';
import { useAuth } from '../../contexts/AuthContext';

interface CourseRound {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
}

const InstructorPaymentManagement: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseRound[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [summaries, setSummaries] = useState<InstructorTeachingSummary[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<InstructorPaymentHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedSummary, setSelectedSummary] = useState<InstructorTeachingSummary | null>(null);

  // 과정 목록 로드
  useEffect(() => {
    loadCourses();
  }, []);

  // 선택된 과정의 집계 및 이력 로드
  useEffect(() => {
    if (selectedCourse) {
      loadSummaries();
      loadPaymentHistory();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    // TODO: 실제 과정 목록 로드 로직 구현
    // 임시 데이터
    setCourses([
      {
        id: '1',
        title: '치과 BS 영업 기초과정 1차',
        start_date: '2025-01-15',
        end_date: '2025-02-15'
      }
    ]);
  };

  const loadSummaries = async () => {
    if (!selectedCourse) return;

    setLoading(true);
    try {
      const data = await instructorPaymentService.getInstructorSummaries(selectedCourse);
      setSummaries(data);
    } catch (error) {
      console.error('집계 로드 실패:', error);
      alert('강사 집계 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    if (!selectedCourse) return;

    try {
      const data = await instructorPaymentService.getPaymentHistory(undefined, selectedCourse);
      setPaymentHistory(data);
    } catch (error) {
      console.error('이력 로드 실패:', error);
    }
  };

  const handleUpdateSummaries = async () => {
    if (!selectedCourse) {
      alert('과정을 선택해주세요.');
      return;
    }

    if (!confirm('선택한 과정의 강사 집계를 업데이트하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      const count = await instructorPaymentService.updateInstructorSummaries(selectedCourse);
      alert(`${count}명의 강사 집계가 업데이트되었습니다.`);
      loadSummaries();
    } catch (error) {
      console.error('집계 업데이트 실패:', error);
      alert('집계 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeSummary = async (summaryId: string, isFinalized: boolean) => {
    if (!user?.id) return;

    const action = isFinalized ? '취소' : '확정';
    if (!confirm(`강사료를 ${action}하시겠습니까?`)) {
      return;
    }

    try {
      if (isFinalized) {
        await instructorPaymentService.unfinalizeSummary(summaryId);
      } else {
        await instructorPaymentService.finalizeSummary(summaryId, user.id);
      }
      alert(`강사료가 ${action}되었습니다.`);
      loadSummaries();
    } catch (error) {
      console.error('확정 처리 실패:', error);
      alert(`확정 처리에 실패했습니다.`);
    }
  };

  const handleCreatePayment = (summary: InstructorTeachingSummary) => {
    setSelectedSummary(summary);
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSummary || !user?.id) return;

    const formData = new FormData(e.currentTarget);

    try {
      await instructorPaymentService.createPaymentRecord({
        instructor_id: selectedSummary.instructor_id,
        course_round_id: selectedSummary.course_round_id,
        summary_id: selectedSummary.id,
        payment_amount: selectedSummary.total_payment,
        payment_date: formData.get('payment_date') as string,
        payment_method: formData.get('payment_method') as string,
        payment_status: 'completed',
        lecture_hours: selectedSummary.total_lecture_hours,
        practice_hours: selectedSummary.total_practice_hours,
        total_hours: selectedSummary.total_hours,
        hourly_rate: selectedSummary.hourly_rate,
        notes: formData.get('notes') as string,
        created_by: user.id
      });

      alert('지급 이력이 생성되었습니다.');
      setShowPaymentModal(false);
      setSelectedSummary(null);
      loadPaymentHistory();
    } catch (error) {
      console.error('지급 이력 생성 실패:', error);
      alert('지급 이력 생성에 실패했습니다.');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatHours = (hours: number): string => {
    return `${hours.toFixed(1)}시간`;
  };

  const getInstructorTypeLabel = (type: 'primary' | 'assistant'): string => {
    return type === 'primary' ? '주강사' : '보조강사';
  };

  const getPaymentStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return '대기';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-500/10 text-green-700';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">강사료 계산 및 관리</h2>

      {/* 과정 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          과정 선택
        </label>
        <div className="flex gap-2">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">과정을 선택하세요</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} ({course.start_date} ~ {course.end_date})
              </option>
            ))}
          </select>
          <button
            onClick={handleUpdateSummaries}
            disabled={!selectedCourse || loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            집계 업데이트
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-2 px-1 ${
              activeTab === 'summary'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            강사 집계
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-1 ${
              activeTab === 'history'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            지급 이력
          </button>
        </nav>
      </div>

      {/* 강사 집계 탭 */}
      {activeTab === 'summary' && (
        <div>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              집계 데이터가 없습니다. 과정을 선택하고 "집계 업데이트" 버튼을 클릭하세요.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      강사
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      구분
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이론 시간
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      실기 시간
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 시간
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      세션 수
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시간당 단가
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 강사료
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summaries.map((summary) => (
                    <tr key={summary.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {summary.instructor_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            summary.instructor_type === 'primary'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-500/10 text-green-700'
                          }`}
                        >
                          {getInstructorTypeLabel(summary.instructor_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatHours(summary.total_lecture_hours)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatHours(summary.total_practice_hours)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {formatHours(summary.total_hours)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {summary.session_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(summary.hourly_rate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">
                        {formatCurrency(summary.total_payment)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {summary.is_finalized ? (
                          <span className="px-2 py-1 bg-green-500/10 text-green-700 rounded-full text-xs font-medium">
                            확정
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            미확정
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() =>
                              handleFinalizeSummary(summary.id, summary.is_finalized)
                            }
                            className={`px-3 py-1 rounded-md text-white text-xs ${
                              summary.is_finalized
                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                : 'bg-green-500 hover:bg-green-600'
                            }`}
                          >
                            {summary.is_finalized ? '확정 취소' : '확정'}
                          </button>
                          {summary.is_finalized && (
                            <button
                              onClick={() => handleCreatePayment(summary)}
                              className="px-3 py-1 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 text-xs"
                            >
                              지급 등록
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 지급 이력 탭 */}
      {activeTab === 'history' && (
        <div>
          {paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">지급 이력이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지급일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      강사
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이론 시간
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      실기 시간
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 시간
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시간당 단가
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지급 금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지급 방법
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      비고
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.payment_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.instructor_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {payment.lecture_hours ? formatHours(payment.lecture_hours) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {payment.practice_hours ? formatHours(payment.practice_hours) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {payment.total_hours ? formatHours(payment.total_hours) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {payment.hourly_rate ? formatCurrency(payment.hourly_rate) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">
                        {formatCurrency(payment.payment_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.payment_method || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            payment.payment_status
                          )}`}
                        >
                          {getPaymentStatusLabel(payment.payment_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payment.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 지급 등록 모달 */}
      {showPaymentModal && selectedSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">강사료 지급 등록</h3>
            <form onSubmit={handleSubmitPayment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    지급일 *
                  </label>
                  <input
                    type="date"
                    name="payment_date"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    지급 방법
                  </label>
                  <select
                    name="payment_method"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    <option value="계좌이체">계좌이체</option>
                    <option value="현금">현금</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    지급 금액
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(selectedSummary.total_payment)}
                    disabled
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedSummary(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorPaymentManagement;
