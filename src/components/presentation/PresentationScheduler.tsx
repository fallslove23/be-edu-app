import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import type { 
  PresentationSchedule, 
  BSActivityEntry,
  ScheduleStatus,
  PresentationDay
} from '../../types/activity-journal.types';

interface PresentationSchedulerProps {
  courseCode?: string;
  round?: number;
  onScheduleUpdate?: (schedule: PresentationSchedule) => void;
}

const PresentationScheduler: React.FC<PresentationSchedulerProps> = ({
  courseCode,
  round,
  onScheduleUpdate
}) => {
  const { user } = useAuth();
  const isOperator = ['admin', 'manager', 'operator'].includes(user?.role || '');
  const isInstructor = user?.role === 'instructor';

  const [schedules, setSchedules] = useState<PresentationSchedule[]>([]);
  const [availableEntries, setAvailableEntries] = useState<BSActivityEntry[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<PresentationSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'manage'>('list');
  const [presentationDay, setPresentationDay] = useState<PresentationDay | null>(null);

  // 발표 스케줄링 폼 상태
  const [formData, setFormData] = useState({
    presentationDate: '',
    deadline: '',
    maxPresenters: 8,
    timePerPresentation: 15, // 분
    startTime: '09:00',
    endTime: '17:00',
    location: '본사 강의실 A',
    notes: ''
  });

  // 샘플 데이터 생성
  useEffect(() => {
    const generateSampleData = () => {
      const sampleEntries: BSActivityEntry[] = [
        {
          id: 'entry-1',
          courseCode: 'BS-2025-01',
          courseName: 'BS 신입 영업사원 기초과정',
          round: 1,
          studentId: 'student-1',
          studentName: '김교육',
          title: '고객 상담 및 제품 소개 실습',
          workSite: '서울 강남지점',
          workDate: '2025-01-25',
          workContent: '기존 고객 3명과 신규 고객 2명에게 제품 소개를 진행했습니다.',
          learningPoints: '고객별로 다른 접근 방식이 필요하다는 것을 배웠습니다.',
          challenges: '신규 고객 중 한 분이 경쟁사 제품과 비교를 요청했는데, 경쟁사에 대한 지식이 부족했습니다.',
          solutions: '경쟁사 제품 분석 자료를 미리 준비하고, 우리 제품만의 차별화 포인트를 명확히 정리했습니다.',
          insights: '고객의 말을 끝까지 듣고 니즈를 정확히 파악한 후 설명하는 것이 효과적입니다.',
          improvementAreas: '경쟁사 분석 능력 향상, 고객 질문에 대한 즉석 대응 능력 개선',
          nextActions: '경쟁사 제품 스터디, 고객 유형별 접근 전략 수립',
          createdAt: '2025-01-25T18:30:00Z',
          updatedAt: '2025-01-25T18:30:00Z',
          submittedAt: '2025-01-25T18:30:00Z',
          status: 'submitted',
          isSelected: false,
          attachments: [],
          scoreReflected: false,
          submissionDeadline: '2025-01-26T23:59:59Z',
          isLateSubmission: false
        },
        {
          id: 'entry-2',
          courseCode: 'BS-2025-01',
          courseName: 'BS 신입 영업사원 기초과정',
          round: 1,
          studentId: 'student-2',
          studentName: '이학습',
          title: '신규 고객 개발 및 영업 프로세스 실습',
          workSite: '부산 해운대지점',
          workDate: '2025-01-25',
          workContent: '신규 고객 발굴을 위한 콜드콜링과 방문 영업을 실시했습니다.',
          learningPoints: '체계적인 영업 프로세스의 중요성을 깨달았습니다.',
          challenges: '초기 거부감을 극복하는 것이 가장 어려웠습니다.',
          solutions: '고객의 입장에서 생각하고, 도움이 되는 정보를 먼저 제공했습니다.',
          insights: '진정성 있는 접근이 신뢰 형성에 가장 중요합니다.',
          improvementAreas: '거부감 극복 스킬, 초기 라포 형성 능력',
          nextActions: '영업 스크립트 개선, 고객 니즈 분석 스킬 향상',
          createdAt: '2025-01-25T19:15:00Z',
          updatedAt: '2025-01-25T19:15:00Z',
          submittedAt: '2025-01-25T19:15:00Z',
          status: 'submitted',
          isSelected: false,
          attachments: [],
          scoreReflected: false,
          submissionDeadline: '2025-01-26T23:59:59Z',
          isLateSubmission: false
        },
        {
          id: 'entry-3',
          courseCode: 'BS-2025-01',
          courseName: 'BS 신입 영업사원 기초과정',
          round: 1,
          studentId: 'student-3',
          studentName: '박성장',
          title: '고객 관계 관리 및 사후 서비스',
          workSite: '대구 중구지점',
          workDate: '2025-01-26',
          workContent: '기존 고객들의 만족도 조사와 추가 니즈 파악을 진행했습니다.',
          learningPoints: '지속적인 관계 관리가 재구매로 이어지는 것을 확인했습니다.',
          challenges: '고객의 숨겨진 니즈를 파악하는 것이 어려웠습니다.',
          solutions: '개방형 질문을 통해 고객이 자연스럽게 이야기하도록 유도했습니다.',
          insights: '고객과의 장기적 관계가 단순한 거래보다 훨씬 가치 있습니다.',
          improvementAreas: '고객 심리 이해, 효과적인 질문 기법',
          nextActions: '고객 관계 관리 시스템 활용, 정기적인 고객 접촉 계획 수립',
          createdAt: '2025-01-26T16:45:00Z',
          updatedAt: '2025-01-26T16:45:00Z',
          submittedAt: '2025-01-26T16:45:00Z',
          status: 'submitted',
          isSelected: false,
          attachments: [],
          scoreReflected: false,
          submissionDeadline: '2025-01-27T23:59:59Z',
          isLateSubmission: false
        }
      ];

      const sampleSchedules: PresentationSchedule[] = [
        {
          id: 'schedule-1',
          courseCode: 'BS-2025-01',
          round: 1,
          presentationDate: '2025-01-30',
          deadline: '2025-01-28T23:59:59Z',
          selectedStudents: [
            {
              studentId: 'student-1',
              studentName: '김교육',
              activityId: 'entry-1',
              presentationOrder: 1,
              timeSlot: '09:00-09:15',
              isPresented: false
            },
            {
              studentId: 'student-2',
              studentName: '이학습',
              activityId: 'entry-2',
              presentationOrder: 2,
              timeSlot: '09:15-09:30',
              isPresented: false
            }
          ],
          status: 'scheduled',
          maxPresenters: 8,
          timePerPresentation: 15,
          startTime: '09:00',
          endTime: '17:00',
          location: '본사 강의실 A',
          createdAt: '2025-01-27T10:00:00Z',
          updatedAt: '2025-01-27T10:00:00Z'
        }
      ];

      const samplePresentationDay: PresentationDay = {
        id: 'day-1',
        scheduleId: 'schedule-1',
        actualDate: '2025-01-30',
        status: 'scheduled',
        currentPresenter: null,
        completedPresentations: [],
        startedAt: null,
        endedAt: null,
        notes: ''
      };

      return { entries: sampleEntries, schedules: sampleSchedules, presentationDay: samplePresentationDay };
    };

    setLoading(true);
    setTimeout(() => {
      const { entries, schedules, presentationDay: dayData } = generateSampleData();
      setAvailableEntries(entries);
      setSchedules(schedules);
      setPresentationDay(dayData);
      setLoading(false);
    }, 800);
  }, []);

  // 자동 선발 알고리즘
  const autoSelectPresenters = useCallback((maxCount: number = formData.maxPresenters) => {
    // 제출된 활동일지 중에서 자동 선발
    const eligibleEntries = availableEntries.filter(entry => 
      entry.status === 'submitted' && 
      (!courseCode || entry.courseCode === courseCode) &&
      (!round || entry.round === round)
    );

    // 선발 기준: 제출 시간, 내용 길이, 학습 성과 등을 종합 평가
    const scoredEntries = eligibleEntries.map(entry => {
      let score = 0;
      
      // 제출 시간 (빠를수록 높은 점수)
      const submissionTime = new Date(entry.submittedAt || '').getTime();
      const deadlineTime = new Date(entry.submissionDeadline).getTime();
      const timeScore = ((deadlineTime - submissionTime) / (1000 * 60 * 60)) * 0.1; // 시간당 0.1점
      score += Math.min(timeScore, 10); // 최대 10점
      
      // 내용 품질 (길이 기반 간단 평가)
      const contentLength = (entry.workContent?.length || 0) + 
                           (entry.learningPoints?.length || 0) + 
                           (entry.insights?.length || 0);
      score += Math.min(contentLength / 100, 10); // 최대 10점
      
      // 성찰 깊이 (challenges, solutions, nextActions 작성 여부)
      if (entry.challenges && entry.challenges.length > 50) score += 5;
      if (entry.solutions && entry.solutions.length > 50) score += 5;
      if (entry.nextActions && entry.nextActions.length > 30) score += 5;
      
      return { ...entry, score };
    });

    // 점수순으로 정렬하여 상위 선발
    scoredEntries.sort((a, b) => b.score - a.score);
    
    return scoredEntries.slice(0, maxCount).map((entry, index) => ({
      studentId: entry.studentId,
      studentName: entry.studentName,
      activityId: entry.id,
      presentationOrder: index + 1,
      timeSlot: generateTimeSlot(index, formData.startTime, formData.timePerPresentation),
      isPresented: false
    }));
  }, [availableEntries, courseCode, round, formData.maxPresenters, formData.startTime, formData.timePerPresentation]);

  // 시간 슬롯 생성
  const generateTimeSlot = (index: number, startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes + (index * duration);
    const endMinutes = startMinutes + duration;
    
    const formatTime = (totalMinutes: number) => {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };
    
    return `${formatTime(startMinutes)}-${formatTime(endMinutes)}`;
  };

  // 스케줄 생성
  const handleCreateSchedule = async () => {
    const selectedStudents = autoSelectPresenters();
    
    const newSchedule: PresentationSchedule = {
      id: `schedule-${Date.now()}`,
      courseCode: courseCode || 'BS-2025-01',
      round: round || 1,
      presentationDate: formData.presentationDate,
      deadline: formData.deadline,
      selectedStudents,
      status: 'scheduled',
      maxPresenters: formData.maxPresenters,
      timePerPresentation: formData.timePerPresentation,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSchedules(prev => [...prev, newSchedule]);
    
    // 선발된 학생들의 활동일지 상태 업데이트
    setAvailableEntries(prev => prev.map(entry => {
      const isSelected = selectedStudents.some(student => student.activityId === entry.id);
      return isSelected 
        ? { ...entry, status: 'ready_for_presentation' as const, isSelected: true }
        : entry;
    }));

    if (onScheduleUpdate) {
      onScheduleUpdate(newSchedule);
    }

    setCurrentView('list');
    
    // 성공 알림
    alert(`발표 스케줄이 생성되었습니다. ${selectedStudents.length}명의 발표자가 선발되었습니다.`);
  };

  // 발표 진행 관리
  const handlePresentationControl = (action: 'start' | 'pause' | 'next' | 'complete', scheduleId: string) => {
    if (!presentationDay) return;

    switch (action) {
      case 'start':
        setPresentationDay(prev => prev ? {
          ...prev,
          status: 'in_progress',
          startedAt: new Date().toISOString(),
          currentPresenter: schedules.find(s => s.id === scheduleId)?.selectedStudents[0] || null
        } : null);
        break;
      
      case 'next':
        // 다음 발표자로 이동
        const schedule = schedules.find(s => s.id === scheduleId);
        if (schedule && presentationDay.currentPresenter) {
          const currentIndex = schedule.selectedStudents.findIndex(
            s => s.studentId === presentationDay.currentPresenter?.studentId
          );
          const nextPresenter = schedule.selectedStudents[currentIndex + 1] || null;
          
          setPresentationDay(prev => prev ? {
            ...prev,
            currentPresenter: nextPresenter,
            completedPresentations: [
              ...prev.completedPresentations,
              {
                studentId: presentationDay.currentPresenter!.studentId,
                studentName: presentationDay.currentPresenter!.studentName,
                activityId: presentationDay.currentPresenter!.activityId,
                completedAt: new Date().toISOString(),
                attended: true
              }
            ]
          } : null);
        }
        break;
      
      case 'complete':
        setPresentationDay(prev => prev ? {
          ...prev,
          status: 'completed',
          endedAt: new Date().toISOString(),
          currentPresenter: null
        } : null);
        break;
    }
  };

  const getStatusColor = (status: ScheduleStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: ScheduleStatus) => {
    switch (status) {
      case 'draft': return '임시저장';
      case 'scheduled': return '예정됨';
      case 'in_progress': return '진행중';
      case 'completed': return '완료됨';
      case 'cancelled': return '취소됨';
      default: return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">발표 일정을 불러오는 중...</span>
      </div>
    );
  }

  // 스케줄 생성 폼
  if (currentView === 'create') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">📅 발표 스케줄 생성</h2>
            <button
              onClick={() => setCurrentView('list')}
              className="text-gray-600 hover:text-gray-900"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                발표일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.presentationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, presentationDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선발 마감일시 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 발표자 수
              </label>
              <input
                type="number"
                value={formData.maxPresenters}
                onChange={(e) => setFormData(prev => ({ ...prev, maxPresenters: Number(e.target.value) }))}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                발표시간 (분)
              </label>
              <select
                value={formData.timePerPresentation}
                onChange={(e) => setFormData(prev => ({ ...prev, timePerPresentation: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10분</option>
                <option value={15}>15분</option>
                <option value={20}>20분</option>
                <option value={30}>30분</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 시간
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료 시간
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                발표 장소
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="예: 본사 강의실 A"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비고사항
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="발표 관련 특이사항이나 안내사항을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* 자동 선발 미리보기 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              자동 선발 미리보기 (상위 {formData.maxPresenters}명)
            </h3>
            <div className="space-y-2">
              {autoSelectPresenters().map((student, index) => (
                <div key={student.studentId} className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">
                    {index + 1}. {student.studentName} - {student.timeSlot}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setCurrentView('list')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleCreateSchedule}
              disabled={!formData.presentationDate || !formData.deadline}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              스케줄 생성
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 발표 진행 관리 뷰
  if (currentView === 'manage' && selectedSchedule && presentationDay) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">🎤 발표 진행 관리</h2>
            <button
              onClick={() => setCurrentView('list')}
              className="text-gray-600 hover:text-gray-900"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          {/* 발표일 정보 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">
                  {selectedSchedule.courseCode} - {selectedSchedule.round}차
                </h3>
                <p className="text-sm text-blue-700">
                  📅 {new Date(selectedSchedule.presentationDate).toLocaleDateString('ko-KR')} 
                  📍 {selectedSchedule.location}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(presentationDay.status)}`}>
                {getStatusLabel(presentationDay.status)}
              </span>
            </div>
          </div>

          {/* 진행 컨트롤 */}
          {isOperator && (
            <div className="flex items-center space-x-3 mb-6">
              {presentationDay.status === 'scheduled' && (
                <button
                  onClick={() => handlePresentationControl('start', selectedSchedule.id)}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>발표 시작</span>
                </button>
              )}
              
              {presentationDay.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => handlePresentationControl('next', selectedSchedule.id)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>다음 발표자</span>
                  </button>
                  <button
                    onClick={() => handlePresentationControl('complete', selectedSchedule.id)}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    <StopIcon className="h-4 w-4" />
                    <span>발표 종료</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* 현재 발표자 */}
          {presentationDay.currentPresenter && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-yellow-900 mb-2">🎯 현재 발표자</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-yellow-800">
                    {presentationDay.currentPresenter.studentName}
                  </p>
                  <p className="text-sm text-yellow-700">
                    순서: {presentationDay.currentPresenter.presentationOrder}번 | 
                    시간: {presentationDay.currentPresenter.timeSlot}
                  </p>
                </div>
                <MegaphoneIcon className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          )}

          {/* 발표자 목록 */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">발표자 순서</h3>
            {selectedSchedule.selectedStudents.map((student) => {
              const isCompleted = presentationDay.completedPresentations.some(
                p => p.studentId === student.studentId
              );
              const isCurrent = presentationDay.currentPresenter?.studentId === student.studentId;
              
              return (
                <div
                  key={student.studentId}
                  className={`p-4 border rounded-lg ${
                    isCurrent 
                      ? 'border-yellow-300 bg-yellow-50' 
                      : isCompleted 
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {student.presentationOrder}. {student.studentName}
                        </span>
                        {isCompleted && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                        {isCurrent && <MegaphoneIcon className="h-5 w-5 text-yellow-600" />}
                      </div>
                      <p className="text-sm text-gray-600">
                        시간: {student.timeSlot}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isInstructor && !isCompleted && isCurrent && (
                        <button
                          onClick={() => {/* 실시간 피드백 */}}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          실시간 피드백
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 메인 스케줄 목록 뷰
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📅 발표 일정 관리</h1>
            <p className="text-gray-600">
              {isOperator && '라운드별 발표 일정을 생성하고 관리하세요.'}
              {isInstructor && '발표 일정을 확인하고 진행 상황을 모니터링하세요.'}
            </p>
          </div>
          
          {isOperator && (
            <button
              onClick={() => setCurrentView('create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>발표 일정 생성</span>
            </button>
          )}
        </div>
      </div>

      {/* 스케줄 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            발표 일정 목록 ({schedules.length})
          </h3>
        </div>

        {schedules.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">발표 일정이 없습니다</h3>
            <p className="text-gray-600 mb-4">새로운 발표 일정을 생성해보세요.</p>
            {isOperator && (
              <button
                onClick={() => setCurrentView('create')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                첫 발표 일정 생성하기
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {schedule.courseCode} - {schedule.round}차
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(schedule.status)}`}>
                        {getStatusLabel(schedule.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-2" />
                        발표일: {new Date(schedule.presentationDate).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        발표자: {schedule.selectedStudents.length}명
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      📍 {schedule.location}
                    </div>

                    {/* 발표자 미리보기 */}
                    <div className="flex flex-wrap gap-2">
                      {schedule.selectedStudents.slice(0, 5).map((student) => (
                        <span
                          key={student.studentId}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          {student.presentationOrder}. {student.studentName}
                        </span>
                      ))}
                      {schedule.selectedStudents.length > 5 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          +{schedule.selectedStudents.length - 5}명 더
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setCurrentView('manage');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                      title="진행 관리"
                    >
                      <PlayIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => {/* 상세보기 */}}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                      title="상세보기"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    {isOperator && (
                      <button
                        onClick={() => {/* 편집 */}}
                        className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg"
                        title="편집"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentationScheduler;