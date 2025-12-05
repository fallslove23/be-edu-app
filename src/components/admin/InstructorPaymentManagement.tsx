'use client';

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
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';
import { Badge } from '../common/Badge';
import { Calculator, Calendar, CheckCircle, Clock, DollarSign, FileText, History, Search, User, X } from 'lucide-react';

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

  // Removed getPaymentStatusColor - now using Badge component

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="강사료 계산 및 관리"
          description="과정별 강사료 집계 및 지급 이력을 관리합니다."
          badge="Payment Management"
        />

        {/* 과정 선택 및 액션 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                과정 선택
              </label>
              <div className="relative">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">과정을 선택하세요</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.start_date} ~ {course.end_date})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500 dark:text-gray-400">
                  <Search className="w-5 h-5" />
                </div>
              </div>
            </div>
            <button
              onClick={handleUpdateSummaries}
              disabled={!selectedCourse || loading}
              className="btn-primary py-3 px-6 rounded-xl flex items-center justify-center whitespace-nowrap"
            >
              <Calculator className="w-5 h-5 mr-2" />
              집계 업데이트
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-100 dark:border-gray-700">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
              >
                <div className="flex items-center justify-center">
                  <FileText className="w-5 h-5 mr-2" />
                  강사 집계
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'history'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
              >
                <div className="flex items-center justify-center">
                  <History className="w-5 h-5 mr-2" />
                  지급 이력
                </div>
              </button>
            </nav>
          </div>

          {/* 강사 집계 탭 */}
          {activeTab === 'summary' && (
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
                  <p className="mt-4 text-gray-500 dark:text-gray-400">데이터를 불러오는 중입니다...</p>
                </div>
              ) : summaries.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <Calculator className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="font-medium">집계 데이터가 없습니다.</p>
                  <p className="text-sm mt-1">과정을 선택하고 "집계 업데이트" 버튼을 클릭하세요.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          강사
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          구분
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          이론 시간
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          실기 시간
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          총 시간
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          세션 수
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          시간당 단가
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          총 강사료
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {summaries.map((summary) => (
                        <tr key={summary.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2 text-gray-400" />
                              {summary.instructor_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${summary.instructor_type === 'primary'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                }`}
                            >
                              {getInstructorTypeLabel(summary.instructor_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300 font-mono">
                            {formatHours(summary.total_lecture_hours)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300 font-mono">
                            {formatHours(summary.total_practice_hours)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900 dark:text-white font-mono">
                            {formatHours(summary.total_hours)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300 font-mono">
                            {summary.session_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300 font-mono">
                            {formatCurrency(summary.hourly_rate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600 dark:text-blue-400 font-mono">
                            {formatCurrency(summary.total_payment)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {summary.is_finalized ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                확정
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                <Clock className="w-3 h-3 mr-1" />
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
                                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${summary.is_finalized
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                                  }`}
                              >
                                {summary.is_finalized ? '확정 취소' : '확정'}
                              </button>
                              {summary.is_finalized && (
                                <button
                                  onClick={() => handleCreatePayment(summary)}
                                  className="py-1.5 px-3 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
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
            <div className="p-6">
              {paymentHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <History className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="font-medium">지급 이력이 없습니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          지급일
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          강사
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          이론 시간
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          실기 시간
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          총 시간
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          시간당 단가
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          지급 금액
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          지급 방법
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          비고
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              {payment.payment_date}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold">
                            {payment.instructor_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300 font-mono">
                            {payment.lecture_hours ? formatHours(payment.lecture_hours) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300 font-mono">
                            {payment.practice_hours ? formatHours(payment.practice_hours) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white font-mono">
                            {payment.total_hours ? formatHours(payment.total_hours) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300 font-mono">
                            {payment.hourly_rate ? formatCurrency(payment.hourly_rate) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600 dark:text-blue-400 font-mono">
                            {formatCurrency(payment.payment_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {payment.payment_method || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Badge status={payment.payment_status} size="sm">
                              {getPaymentStatusLabel(payment.payment_status)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">강사료 지급 등록</h3>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedSummary(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmitPayment} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      지급일 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="payment_date"
                        required
                        className="w-full p-3 pl-10 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                      />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      지급 방법
                    </label>
                    <div className="relative">
                      <select
                        name="payment_method"
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none font-medium"
                      >
                        <option value="">선택하세요</option>
                        <option value="계좌이체">계좌이체</option>
                        <option value="현금">현금</option>
                        <option value="기타">기타</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500 dark:text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      지급 금액
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatCurrency(selectedSummary.total_payment)}
                        disabled
                        className="w-full p-3 pl-10 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-bold"
                      />
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">비고</label>
                    <textarea
                      name="notes"
                      rows={3}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      placeholder="메모를 입력하세요..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaymentModal(false);
                        setSelectedSummary(null);
                      }}
                      className="flex-1 btn-outline py-3"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-primary py-3"
                    >
                      등록하기
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default InstructorPaymentManagement;
