'use client';

/**
 * 커리큘럼 관리 컴포넌트
 * - 과정(Course Round) 생성 및 관리
 * - 시간표 그리드 편집
 * - 일정 추가/수정/삭제
 * - 과정 확정 및 잠금
 */

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ExcelJS from 'exceljs';
import { ResourceSelector } from './ResourceSelector';
import { PageContainer } from '../common/PageContainer';

// 한국 공휴일 (2025년 기준)
const KOREAN_HOLIDAYS_2025 = [
  '2025-01-01', // 신정
  '2025-01-28', '2025-01-29', '2025-01-30', // 설날 연휴
  '2025-03-01', // 삼일절
  '2025-05-05', // 어린이날
  '2025-05-06', // 부처님오신날
  '2025-06-06', // 현충일
  '2025-08-15', // 광복절
  '2025-09-06', '2025-09-07', '2025-09-08', // 추석 연휴
  '2025-10-03', // 개천절
  '2025-10-09', // 한글날
  '2025-12-25', // 크리스마스
];

// 날짜 유틸리티 함수
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 일요일(0) 또는 토요일(6)
};

const isHoliday = (date: Date): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  return KOREAN_HOLIDAYS_2025.includes(dateStr);
};

const getNextWorkingDay = (date: Date): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  while (isWeekend(nextDay) || isHoliday(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
};

const addWorkingDays = (startDate: Date, days: number): Date => {
  let currentDate = new Date(startDate);
  let addedDays = 0;

  while (addedDays < days) {
    currentDate = getNextWorkingDay(currentDate);
    addedDays++;
  }

  return currentDate;
};

// 타입 정의
interface CurriculumTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  total_hours: number | null;
  session_count: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_default: boolean;
  usage_count: number;
}

interface CurriculumTemplateSession {
  id: string;
  template_id: string;
  day_number: number;
  title: string;
  subject_id: string | null;
  duration_hours: number;
  default_start_time: string | null;
  default_end_time: string | null;
  session_type: 'lecture' | 'practice' | 'exam' | 'discussion';
  notes: string | null;
  created_at: string;
}

interface CourseRound {
  id: string;
  template_id: string;
  round_number: number;
  title: string;
  instructor_id: string | null;
  instructor_name: string;
  manager_id: string | null;
  manager_name: string | null;
  start_date: string;
  end_date: string;
  max_trainees: number;
  current_trainees: number;
  location: string;
  status: 'planning' | 'recruiting' | 'in_progress' | 'completed' | 'cancelled';
  description: string | null;
  is_locked?: boolean;
  created_at: string;
  updated_at: string;
}

interface CourseSession {
  id: string;
  round_id: string;
  day_number: number;
  title: string | null;
  subject_id: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  classroom: string;
  actual_instructor_id: string | null;
  instructor_name?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  attendance_count: number | null;
  notes: string | null;
}

interface Subject {
  id: string;
  name: string;
  category: string | null;
}

interface Instructor {
  id: string;
  name: string;
  email: string;
}

interface Classroom {
  id: string;
  name: string;
  code: string;
  capacity: number;
  location?: string;
}

interface Manager {
  id: string;
  name: string;
  email: string;
}

export default function CurriculumManager() {
  const { user } = useAuth();
  const [courseRounds, setCourseRounds] = useState<CourseRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<CourseRound | null>(null);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CourseSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 템플릿 관련 상태
  const [templates, setTemplates] = useState<CurriculumTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CurriculumTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
  });

  // 폼 상태
  const [roundForm, setRoundForm] = useState({
    template_id: '',
    round_number: 1,
    title: '',
    instructor_id: '',
    instructor_name: '',
    manager_id: user?.id || '',
    manager_name: user?.name || '',
    start_date: '',
    end_date: '',
    max_trainees: 20,
    location: '',
    description: '',
    status: 'planning',
  });

  const [sessionForm, setSessionForm] = useState({
    day_number: 1,
    title: '',
    session_date: '',
    start_time: '09:00',
    end_time: '17:00',
    classroom: '',
    classroom_id: '',
    actual_instructor_id: '',
    subject_id: '',
  });

  // 드래그 앤 드롭 상태
  const [draggedSession, setDraggedSession] = useState<CourseSession | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 충돌 감지 상태
  const [conflicts, setConflicts] = useState<{
    classroom: any[];
    instructor: any[];
  }>({ classroom: [], instructor: [] });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRound) {
      loadSessions(selectedRound.id);
    }
  }, [selectedRound]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 과정 목록 로드
      const { data: roundsData, error: roundsError } = await supabase
        .from('course_rounds')
        .select('*')
        .order('start_date', { ascending: false });

      if (roundsError) throw roundsError;
      setCourseRounds(roundsData || []);

      // 과목 로드
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // 강사 로드
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'instructor');

      if (instructorsError) throw instructorsError;
      setInstructors(instructorsData || []);

      // 운영자 로드 (course_manager 역할)
      const { data: managersData, error: managersError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'course_manager');

      if (managersError) throw managersError;
      setManagers(managersData || []);

      // 강의실 로드
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classrooms')
        .select('id, name, code, capacity, location')
        .eq('is_available', true);

      if (classroomsError) throw classroomsError;
      setClassrooms(classroomsData || []);

      // 템플릿 로드
      const { data: templatesData, error: templatesError } = await supabase
        .from('curriculum_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('usage_count', { ascending: false });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      setError(error.message || '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async (roundId: string) => {
    try {
      const { data, error } = await supabase
        .from('course_sessions')
        .select(`
          *,
          instructor:users!actual_instructor_id(name)
        `)
        .eq('round_id', roundId)
        .order('day_number');

      if (error) throw error;

      const sessionsWithInstructor = data?.map(session => ({
        ...session,
        instructor_name: session.instructor?.name || '',
      })) || [];

      setSessions(sessionsWithInstructor);
    } catch (error: any) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleCreateRound = async () => {
    try {
      setError(null);

      if (isEditMode && editingRoundId) {
        // 편집 모드: 기존 과정 업데이트
        const { data, error } = await supabase
          .from('course_rounds')
          .update(roundForm)
          .eq('id', editingRoundId)
          .select()
          .single();

        if (error) throw error;

        alert('과정이 수정되었습니다.');
        setSelectedRound(data);
      } else {
        // 생성 모드: 새 과정 생성
        const { data, error } = await supabase
          .from('course_rounds')
          .insert([{
            template_id: '00000000-0000-0000-0000-000000000000', // 임시 템플릿 ID
            round_number: 1,
            ...roundForm,
          }])
          .select()
          .single();

        if (error) throw error;

        alert('과정이 생성되었습니다.');
        setSelectedRound(data);
      }

      // 모달 닫기 및 폼 초기화
      setShowCreateModal(false);
      setIsEditMode(false);
      setEditingRoundId(null);
      setRoundForm({
        template_id: '',
        round_number: 1,
        title: '',
        instructor_id: '',
        instructor_name: '',
        manager_id: user?.id || '',
        manager_name: user?.name || '',
        start_date: '',
        end_date: '',
        max_trainees: 20,
        location: '',
        description: '',
        status: 'planning',
      });
      await loadData();
    } catch (error: any) {
      console.error('Failed to save round:', error);
      setError(error.message || '과정 저장 실패');
    }
  };

  const handleAddSession = async () => {
    if (!selectedRound) return;

    try {
      setError(null);

      // 충돌 감지
      const detectedConflicts = await checkConflicts({
        session_date: sessionForm.session_date,
        start_time: sessionForm.start_time,
        end_time: sessionForm.end_time,
        classroom: sessionForm.classroom,
        actual_instructor_id: sessionForm.actual_instructor_id || null,
      });

      // 충돌이 있을 경우 경고 메시지 표시
      if (detectedConflicts.classroom.length > 0 || detectedConflicts.instructor.length > 0) {
        let warningMessage = '⚠️ 일정 충돌이 감지되었습니다:\n\n';

        if (detectedConflicts.classroom.length > 0) {
          warningMessage += '📍 강의실 충돌:\n';
          detectedConflicts.classroom.forEach(c => {
            warningMessage += `  - ${c.course} (${c.time}, ${c.classroom})\n`;
          });
          warningMessage += '\n';
        }

        if (detectedConflicts.instructor.length > 0) {
          warningMessage += '👨‍🏫 강사 충돌:\n';
          detectedConflicts.instructor.forEach(c => {
            warningMessage += `  - ${c.course} (${c.time})\n`;
          });
          warningMessage += '\n';
        }

        warningMessage += '그래도 일정을 추가하시겠습니까?';

        if (!confirm(warningMessage)) {
          return;
        }
      }

      const { error } = await supabase
        .from('course_sessions')
        .insert([{
          round_id: selectedRound.id,
          day_number: sessionForm.day_number,
          title: sessionForm.title,
          subject_id: sessionForm.subject_id || null,
          session_date: sessionForm.session_date,
          start_time: sessionForm.start_time,
          end_time: sessionForm.end_time,
          classroom: sessionForm.classroom,
          classroom_id: sessionForm.classroom_id || null,
          actual_instructor_id: sessionForm.actual_instructor_id || null,
          status: 'scheduled',
        }]);

      if (error) throw error;

      alert('일정이 추가되었습니다.');
      setShowSessionModal(false);
      setSessionForm({
        day_number: sessions.length + 1,
        title: '',
        session_date: '',
        start_time: '09:00',
        end_time: '17:00',
        classroom: '',
        classroom_id: '',
        actual_instructor_id: '',
        subject_id: '',
      });
      await loadSessions(selectedRound.id);
    } catch (error: any) {
      console.error('Failed to add session:', error);
      setError(error.message || '일정 추가 실패');
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedSession) return;

    try {
      setError(null);

      // 충돌 감지
      const detectedConflicts = await checkConflicts({
        session_date: sessionForm.session_date,
        start_time: sessionForm.start_time,
        end_time: sessionForm.end_time,
        classroom: sessionForm.classroom,
        actual_instructor_id: sessionForm.actual_instructor_id || null,
        id: selectedSession.id,
      });

      // 충돌이 있을 경우 경고 메시지 표시
      if (detectedConflicts.classroom.length > 0 || detectedConflicts.instructor.length > 0) {
        let warningMessage = '⚠️ 일정 충돌이 감지되었습니다:\n\n';

        if (detectedConflicts.classroom.length > 0) {
          warningMessage += '📍 강의실 충돌:\n';
          detectedConflicts.classroom.forEach(c => {
            warningMessage += `  - ${c.course} (${c.time}, ${c.classroom})\n`;
          });
          warningMessage += '\n';
        }

        if (detectedConflicts.instructor.length > 0) {
          warningMessage += '👨‍🏫 강사 충돌:\n';
          detectedConflicts.instructor.forEach(c => {
            warningMessage += `  - ${c.course} (${c.time})\n`;
          });
          warningMessage += '\n';
        }

        warningMessage += '그래도 일정을 수정하시겠습니까?';

        if (!confirm(warningMessage)) {
          return;
        }
      }

      const { error } = await supabase
        .from('course_sessions')
        .update({
          day_number: sessionForm.day_number,
          title: sessionForm.title,
          subject_id: sessionForm.subject_id || null,
          session_date: sessionForm.session_date,
          start_time: sessionForm.start_time,
          end_time: sessionForm.end_time,
          classroom: sessionForm.classroom,
          classroom_id: sessionForm.classroom_id || null,
          actual_instructor_id: sessionForm.actual_instructor_id || null,
        })
        .eq('id', selectedSession.id);

      if (error) throw error;

      alert('일정이 수정되었습니다.');
      setShowEditModal(false);
      setSelectedSession(null);
      if (selectedRound) {
        await loadSessions(selectedRound.id);
      }
    } catch (error: any) {
      console.error('Failed to update session:', error);
      setError(error.message || '일정 수정 실패');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('course_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      alert('일정이 삭제되었습니다.');
      if (selectedRound) {
        await loadSessions(selectedRound.id);
      }
    } catch (error: any) {
      console.error('Failed to delete session:', error);
      setError(error.message || '일정 삭제 실패');
    }
  };

  const openEditSessionModal = (session: CourseSession) => {
    setSelectedSession(session);

    // classroom_id 찾기
    const classroom = classrooms.find(c => c.name === session.classroom);

    setSessionForm({
      day_number: session.day_number,
      title: session.title || '',
      session_date: session.session_date,
      start_time: session.start_time,
      end_time: session.end_time,
      classroom: session.classroom,
      classroom_id: classroom?.id || '',
      actual_instructor_id: session.actual_instructor_id || '',
      subject_id: session.subject_id || '',
    });
    setShowEditModal(true);
  };

  const handleToggleLock = async (roundId: string, lock: boolean) => {
    const message = lock
      ? '과정을 확정하시겠습니까? 확정 후에는 일정을 수정할 수 없습니다.'
      : '잠금을 해제하시겠습니까?';

    if (!confirm(message)) return;

    try {
      setError(null);

      const { data, error } = await supabase
        .from('course_rounds')
        .update({
          is_locked: lock,
          status: lock ? 'recruiting' : 'planning'
        })
        .eq('id', roundId)
        .select()
        .single();

      if (error) throw error;

      alert(lock ? '과정이 확정되었습니다.' : '잠금이 해제되었습니다.');
      await loadData();
      setSelectedRound(data);
    } catch (error: any) {
      console.error('Failed to toggle lock:', error);
      setError(error.message || '잠금 상태 변경 실패');
    }
  };

  const handleDuplicateRound = async (roundId: string) => {
    if (!confirm('이 과정을 복제하시겠습니까?')) return;

    try {
      setError(null);

      // 원본 과정 정보 가져오기
      const { data: originalRound, error: fetchError } = await supabase
        .from('course_rounds')
        .select('*')
        .eq('id', roundId)
        .single();

      if (fetchError) throw fetchError;

      // 새 과정 생성 (제목에 "복사본" 추가)
      const { data: newRound, error: createError } = await supabase
        .from('course_rounds')
        .insert([{
          template_id: originalRound.template_id,
          round_number: originalRound.round_number + 1,
          title: `${originalRound.title} (복사본)`,
          instructor_id: originalRound.instructor_id,
          instructor_name: originalRound.instructor_name,
          manager_id: originalRound.manager_id,
          manager_name: originalRound.manager_name,
          start_date: originalRound.start_date,
          end_date: originalRound.end_date,
          max_trainees: originalRound.max_trainees,
          current_trainees: 0,
          location: originalRound.location,
          status: 'planning',
          description: originalRound.description,
          is_locked: false,
        }])
        .select()
        .single();

      if (createError) throw createError;

      // 원본 일정 가져오기
      const { data: originalSessions, error: sessionsError } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('round_id', roundId)
        .order('day_number');

      if (sessionsError) throw sessionsError;

      // 일정 복제
      if (originalSessions && originalSessions.length > 0) {
        const newSessions = originalSessions.map(session => ({
          round_id: newRound.id,
          day_number: session.day_number,
          title: session.title,
          session_date: session.session_date,
          start_time: session.start_time,
          end_time: session.end_time,
          classroom: session.classroom,
          actual_instructor_id: session.actual_instructor_id,
          status: 'scheduled',
          notes: session.notes,
        }));

        const { error: insertError } = await supabase
          .from('course_sessions')
          .insert(newSessions);

        if (insertError) throw insertError;
      }

      alert('과정이 복제되었습니다.');
      await loadData();
      setSelectedRound(newRound);
    } catch (error: any) {
      console.error('Failed to duplicate round:', error);
      setError(error.message || '과정 복제 실패');
    }
  };

  // 과정 삭제 핸들러
  const handleDeleteRound = async (roundId: string, title: string) => {
    if (!confirm(`"${title}" 과정을 삭제하시겠습니까?\n연관된 모든 일정도 함께 삭제됩니다.`)) return;

    try {
      setError(null);

      // 먼저 연관된 세션들 삭제
      const { error: sessionsError } = await supabase
        .from('course_sessions')
        .delete()
        .eq('round_id', roundId);

      if (sessionsError) throw sessionsError;

      // 과정 삭제
      const { error: roundError } = await supabase
        .from('course_rounds')
        .delete()
        .eq('id', roundId);

      if (roundError) throw roundError;

      alert('과정이 삭제되었습니다.');

      // 선택된 과정이 삭제된 과정이면 초기화
      if (selectedRound?.id === roundId) {
        setSelectedRound(null);
        setSessions([]);
      }

      await loadData();
    } catch (error: any) {
      console.error('Failed to delete round:', error);
      setError(error.message || '과정 삭제 실패');
      alert('과정 삭제에 실패했습니다: ' + error.message);
    }
  };

  // 과정 편집 핸들러
  const handleEditRound = (round: CourseRound) => {
    // 편집 폼에 현재 값 설정
    setRoundForm({
      template_id: round.template_id || '',
      round_number: round.round_number,
      title: round.title,
      instructor_id: round.instructor_id || '',
      instructor_name: round.instructor_name || '',
      manager_id: round.manager_id || '',
      manager_name: round.manager_name || '',
      start_date: round.start_date,
      end_date: round.end_date,
      max_trainees: round.max_trainees,
      location: round.location,
      description: round.description || '',
      status: round.status,
    });

    // 편집 모드 설정
    setIsEditMode(true);
    setEditingRoundId(round.id);
    setShowCreateModal(true);
  };

  // 엑셀 내보내기 함수
  const handleExportToExcel = async () => {
    if (!selectedRound || sessions.length === 0) {
      alert('내보낼 일정이 없습니다.');
      return;
    }

    try {
      // 엑셀 데이터 준비
      const excelData = sessions.map((session, index) => ({
        '차시': session.day_number,
        '제목': session.title || '',
        '날짜': new Date(session.session_date).toLocaleDateString('ko-KR'),
        '시작시간': session.start_time,
        '종료시간': session.end_time,
        '강의실': session.classroom,
        '강사': session.instructor_name || '',
        '상태': session.status === 'scheduled' ? '예정' :
          session.status === 'in_progress' ? '진행중' :
            session.status === 'completed' ? '완료' :
              session.status === 'cancelled' ? '취소' : '재조정',
        '비고': session.notes || ''
      }));

      // 워크북 생성
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('시간표');

      // 컬럼 설정
      worksheet.columns = [
        { header: '날짜', key: '날짜', width: 15 },
        { header: '요일', key: '요일', width: 10 },
        { header: '과목', key: '과목', width: 30 },
        { header: '시작시간', key: '시작시간', width: 12 },
        { header: '종료시간', key: '종료시간', width: 12 },
        { header: '강의실', key: '강의실', width: 15 },
        { header: '강사', key: '강사', width: 15 },
        { header: '상태', key: '상태', width: 12 },
        { header: '비고', key: '비고', width: 30 },
      ];

      // 데이터 추가
      excelData.forEach(row => {
        worksheet.addRow(row);
      });

      // 파일명 생성
      const fileName = `${selectedRound.title}_시간표_${new Date().toISOString().split('T')[0]}.xlsx`;

      // 파일 다운로드
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      alert('엑셀 파일이 다운로드되었습니다.');
    } catch (error: any) {
      console.error('Failed to export to Excel:', error);
      setError('엑셀 내보내기 실패');
    }
  };

  // 엑셀 가져오기 함수
  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedRound) {
      alert('과정을 먼저 선택해주세요.');
      return;
    }

    if (selectedRound.is_locked) {
      alert('확정된 과정은 일정을 수정할 수 없습니다.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);

      // 파일 읽기
      const data = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);

      const worksheet = workbook.worksheets[0];
      const jsonData: any[] = [];

      // 첫 번째 행(헤더)을 제외하고 데이터 읽기
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // 헤더 스킵

        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = worksheet.getRow(1).getCell(colNumber).value as string;
          rowData[header] = cell.value;
        });
        jsonData.push(rowData);
      });

      if (jsonData.length === 0) {
        alert('엑셀 파일에 데이터가 없습니다.');
        return;
      }

      const confirmMessage = `엑셀 파일에서 ${jsonData.length}개의 일정을 가져오시겠습니까?\n\n` +
        `※ 기존 일정은 모두 삭제됩니다.`;

      if (!confirm(confirmMessage)) {
        event.target.value = '';
        return;
      }

      // 기존 일정 삭제
      const { error: deleteError } = await supabase
        .from('course_sessions')
        .delete()
        .eq('round_id', selectedRound.id);

      if (deleteError) throw deleteError;

      // 새 일정 추가
      const newSessions = jsonData.map((row, index) => {
        // 날짜 파싱
        let sessionDate: string;
        const dateStr = row['날짜'] || row['date'] || row['Date'];

        if (typeof dateStr === 'string') {
          // "2025. 1. 15." 형식 처리
          const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
          if (match) {
            const [, year, month, day] = match;
            sessionDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else {
            sessionDate = new Date().toISOString().split('T')[0];
          }
        } else if (typeof dateStr === 'number') {
          // 엑셀 날짜 시리얼 번호 처리
          const excelDate = new Date((dateStr - 25569) * 86400 * 1000);
          sessionDate = excelDate.toISOString().split('T')[0];
        } else {
          sessionDate = new Date().toISOString().split('T')[0];
        }

        return {
          round_id: selectedRound.id,
          day_number: row['차시'] || row['day'] || (index + 1),
          title: row['제목'] || row['title'] || `${index + 1}차시`,
          session_date: sessionDate,
          start_time: row['시작시간'] || row['start_time'] || '09:00',
          end_time: row['종료시간'] || row['end_time'] || '18:00',
          classroom: row['강의실'] || row['classroom'] || '',
          actual_instructor_id: null,
          status: 'scheduled' as const,
          notes: row['비고'] || row['notes'] || null
        };
      });

      const { error: insertError } = await supabase
        .from('course_sessions')
        .insert(newSessions);

      if (insertError) throw insertError;

      alert(`${newSessions.length}개의 일정이 추가되었습니다.`);
      await loadData();
      event.target.value = '';
    } catch (error: any) {
      console.error('Failed to import from Excel:', error);
      setError(error.message || '엑셀 가져오기 실패');
      event.target.value = '';
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, session: CourseSession) => {
    if (selectedRound?.is_locked) {
      e.preventDefault();
      return;
    }
    setDraggedSession(session);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetSession: CourseSession, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedSession || !selectedRound || selectedRound.is_locked) {
      setDraggedSession(null);
      return;
    }

    if (draggedSession.id === targetSession.id) {
      setDraggedSession(null);
      return;
    }

    try {
      setError(null);

      // 세션 순서 재정렬
      const reorderedSessions = [...sessions];
      const draggedIndex = reorderedSessions.findIndex(s => s.id === draggedSession.id);

      if (draggedIndex === -1) return;

      // 배열에서 드래그된 항목 제거
      const [removed] = reorderedSessions.splice(draggedIndex, 1);

      // 타겟 위치에 삽입
      reorderedSessions.splice(targetIndex, 0, removed);

      // day_number 재할당
      const updates = reorderedSessions.map((session, index) => ({
        id: session.id,
        day_number: index + 1
      }));

      // 데이터베이스 업데이트
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('course_sessions')
          .update({ day_number: update.day_number })
          .eq('id', update.id);

        if (updateError) throw updateError;
      }

      // UI 업데이트
      await loadSessions(selectedRound.id);
      setDraggedSession(null);
    } catch (error: any) {
      console.error('Failed to reorder sessions:', error);
      setError(error.message || '순서 변경 실패');
      setDraggedSession(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedSession(null);
    setDragOverIndex(null);
  };

  // 충돌 감지 함수
  const checkConflicts = async (session: {
    session_date: string;
    start_time: string;
    end_time: string;
    classroom?: string;
    actual_instructor_id?: string | null;
    id?: string;
  }) => {
    const conflicts = {
      classroom: [] as any[],
      instructor: [] as any[]
    };

    try {
      // 모든 과정의 세션 가져오기
      const { data: allSessions, error } = await supabase
        .from('course_sessions')
        .select(`
          *,
          course_rounds!inner(title, status)
        `)
        .eq('session_date', session.session_date)
        .neq('id', session.id || '');

      if (error) throw error;
      if (!allSessions || allSessions.length === 0) return conflicts;

      // 시간 중복 체크 함수
      const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string) => {
        return (start1 < end2 && end1 > start2);
      };

      // 강의실 충돌 체크
      if (session.classroom) {
        const classroomConflicts = allSessions.filter(s =>
          s.classroom === session.classroom &&
          isTimeOverlap(session.start_time, session.end_time, s.start_time, s.end_time) &&
          s.course_rounds.status !== 'cancelled'
        );

        conflicts.classroom = classroomConflicts.map(s => ({
          session: s,
          course: s.course_rounds.title,
          time: `${s.start_time} - ${s.end_time}`,
          classroom: s.classroom
        }));
      }

      // 강사 충돌 체크
      if (session.actual_instructor_id) {
        const instructorConflicts = allSessions.filter(s =>
          s.actual_instructor_id === session.actual_instructor_id &&
          isTimeOverlap(session.start_time, session.end_time, s.start_time, s.end_time) &&
          s.course_rounds.status !== 'cancelled'
        );

        conflicts.instructor = instructorConflicts.map(s => ({
          session: s,
          course: s.course_rounds.title,
          time: `${s.start_time} - ${s.end_time}`,
          instructor: s.instructor_name
        }));
      }

      return conflicts;
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      return conflicts;
    }
  };

  // 날짜 자동 재계산 함수
  const handleRecalculateDates = async (roundId: string) => {
    try {
      setError(null);

      // 현재 일정 가져오기
      const { data: currentSessions, error: fetchError } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('round_id', roundId)
        .order('day_number');

      if (fetchError) throw fetchError;
      if (!currentSessions || currentSessions.length === 0) {
        alert('재계산할 일정이 없습니다.');
        return;
      }

      // 첫 번째 세션의 날짜를 기준으로 재계산
      const firstSessionDate = new Date(currentSessions[0].session_date);

      const confirmMessage = `일정을 자동으로 재계산하시겠습니까?\n\n` +
        `기준일: ${firstSessionDate.toLocaleDateString('ko-KR')}\n` +
        `총 ${currentSessions.length}개의 일정이 주말과 공휴일을 제외하고 재계산됩니다.\n\n` +
        `※ 이 작업은 되돌릴 수 없습니다.`;

      if (!confirm(confirmMessage)) return;

      // 각 세션의 날짜를 재계산
      const updatedSessions = currentSessions.map((session, index) => {
        let newDate: Date;

        if (index === 0) {
          // 첫 번째 세션은 그대로 유지
          newDate = firstSessionDate;
        } else {
          // 이전 세션 날짜 기준으로 다음 근무일 계산
          const prevDate = index === 0
            ? firstSessionDate
            : new Date(currentSessions[index - 1].session_date);
          newDate = getNextWorkingDay(prevDate);
        }

        return {
          ...session,
          session_date: newDate.toISOString().split('T')[0]
        };
      });

      // 일괄 업데이트
      for (const session of updatedSessions) {
        const { error: updateError } = await supabase
          .from('course_sessions')
          .update({
            session_date: session.session_date
          })
          .eq('id', session.id);

        if (updateError) throw updateError;
      }

      // 과정의 종료일 업데이트
      const lastDate = updatedSessions[updatedSessions.length - 1].session_date;
      const { error: updateRoundError } = await supabase
        .from('course_rounds')
        .update({
          end_date: lastDate
        })
        .eq('id', roundId);

      if (updateRoundError) throw updateRoundError;

      alert('일정이 재계산되었습니다.');
      await loadData();
    } catch (error: any) {
      console.error('Failed to recalculate dates:', error);
      setError(error.message || '날짜 재계산 실패');
    }
  };

  // 템플릿으로 저장
  const handleSaveAsTemplate = async () => {
    if (!selectedRound || sessions.length === 0) {
      alert('저장할 과정과 일정이 필요합니다.');
      return;
    }

    try {
      setError(null);

      // 템플릿 메타데이터 생성
      const totalHours = sessions.reduce((sum, session) => {
        const start = new Date(`2000-01-01T${session.start_time}`);
        const end = new Date(`2000-01-01T${session.end_time}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      const { data: template, error: templateError } = await supabase
        .from('curriculum_templates')
        .insert([{
          name: templateForm.name,
          description: templateForm.description,
          category: templateForm.category,
          total_hours: totalHours,
          session_count: sessions.length,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (templateError) throw templateError;

      // 템플릿 세션 생성
      const templateSessions = sessions.map(session => ({
        template_id: template.id,
        day_number: session.day_number,
        title: session.title,
        subject_id: session.subject_id,
        duration_hours: (() => {
          const start = new Date(`2000-01-01T${session.start_time}`);
          const end = new Date(`2000-01-01T${session.end_time}`);
          return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        })(),
        default_start_time: session.start_time,
        default_end_time: session.end_time,
        session_type: 'lecture',
        notes: session.notes,
      }));

      const { error: sessionsError } = await supabase
        .from('curriculum_template_sessions')
        .insert(templateSessions);

      if (sessionsError) throw sessionsError;

      alert('템플릿이 저장되었습니다.');
      setShowSaveTemplateModal(false);
      setTemplateForm({ name: '', description: '', category: '' });
      await loadData();
    } catch (error: any) {
      console.error('Failed to save template:', error);
      setError(error.message || '템플릿 저장 실패');
    }
  };

  // 템플릿에서 불러오기
  const handleLoadFromTemplate = async (templateId: string) => {
    if (!selectedRound) {
      alert('과정을 먼저 선택해주세요.');
      return;
    }

    if (sessions.length > 0 && !confirm('현재 일정을 모두 삭제하고 템플릿을 불러오시겠습니까?')) {
      return;
    }

    try {
      setError(null);

      // 기존 세션 삭제
      if (sessions.length > 0) {
        const { error: deleteError } = await supabase
          .from('course_sessions')
          .delete()
          .eq('round_id', selectedRound.id);

        if (deleteError) throw deleteError;
      }

      // 템플릿 세션 가져오기
      const { data: templateSessions, error: fetchError } = await supabase
        .from('curriculum_template_sessions')
        .select('*')
        .eq('template_id', templateId)
        .order('day_number');

      if (fetchError) throw fetchError;

      if (!templateSessions || templateSessions.length === 0) {
        alert('템플릿에 저장된 일정이 없습니다.');
        return;
      }

      // 시작 날짜부터 일정 생성
      const startDate = new Date(selectedRound.start_date);
      let currentDate = new Date(startDate);

      const newSessions = [];
      for (const template of templateSessions) {
        // 주말과 휴일 건너뛰기
        while (isWeekend(currentDate) || isHoliday(currentDate)) {
          currentDate.setDate(currentDate.getDate() + 1);
        }

        newSessions.push({
          round_id: selectedRound.id,
          day_number: template.day_number,
          title: template.title,
          subject_id: template.subject_id,
          session_date: currentDate.toISOString().split('T')[0],
          start_time: template.default_start_time || '09:00',
          end_time: template.default_end_time || '18:00',
          status: 'scheduled',
          notes: template.notes,
        });

        // 다음 날로 이동
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const { error: insertError } = await supabase
        .from('course_sessions')
        .insert(newSessions);

      if (insertError) throw insertError;

      // 템플릿 사용 횟수 증가
      const { data: currentTemplate } = await supabase
        .from('curriculum_templates')
        .select('usage_count')
        .eq('id', templateId)
        .single();

      if (currentTemplate) {
        const { error: updateError } = await supabase
          .from('curriculum_templates')
          .update({ usage_count: (currentTemplate.usage_count || 0) + 1 })
          .eq('id', templateId);

        if (updateError) console.warn('Failed to update usage count:', updateError);
      }

      // 과정 종료일 업데이트
      const lastDate = newSessions[newSessions.length - 1].session_date;
      const { error: updateRoundError } = await supabase
        .from('course_rounds')
        .update({ end_date: lastDate })
        .eq('id', selectedRound.id);

      if (updateRoundError) throw updateRoundError;

      alert(`템플릿에서 ${newSessions.length}개의 일정을 불러왔습니다.`);
      setShowTemplateModal(false);
      await loadData();
      await loadSessions(selectedRound.id);
    } catch (error: any) {
      console.error('Failed to load from template:', error);
      setError(error.message || '템플릿 불러오기 실패');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card rounded-[2rem] p-8 shadow-sm border border-border">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <CalendarIcon className="w-8 h-8 text-primary" />
              </div>
              커리큘럼 관리
            </h1>
            <p className="text-muted-foreground mt-2 ml-[4.5rem]">
              교육 과정의 전체 일정을 계획하고 관리합니다.
            </p>
          </div>
          <button
            onClick={() => {
              setIsEditMode(false);
              setEditingRoundId(null);
              setRoundForm({
                template_id: '',
                round_number: 1,
                title: '',
                instructor_id: '',
                instructor_name: '',
                manager_id: user?.id || '',
                manager_name: user?.name || '',
                start_date: '',
                end_date: '',
                max_trainees: 20,
                location: '',
                description: '',
                status: 'planning',
              });
              setShowCreateModal(true);
            }}
            className="mt-4 sm:mt-0 btn-primary px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>새 과정 만들기</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl flex items-center text-red-600 dark:text-red-400">
            <XMarkIcon className="w-5 h-5 mr-2" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* 왼쪽: 과정 목록 */}
          <div className="col-span-12 lg:col-span-3 bg-card rounded-[2rem] shadow-sm border border-border p-4 lg:p-6 h-[300px] lg:h-[calc(100vh-12rem)] sticky top-6 flex flex-col">
            <h2 className="text-lg font-bold text-foreground mb-4 lg:mb-6 flex items-center gap-2 px-2">
              <DocumentArrowDownIcon className="w-5 h-5 text-muted-foreground" />
              과정 목록
            </h2>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {courseRounds.map((round) => (
                <div
                  key={round.id}
                  className={`relative w-full text-left px-4 lg:px-5 py-3 lg:py-4 rounded-2xl transition-all border group ${selectedRound?.id === round.id
                    ? 'bg-primary/5 border-primary/20 shadow-sm'
                    : 'bg-background border-border hover:border-primary/30 hover:bg-muted/50'
                    }`}
                >
                  <div
                    onClick={() => setSelectedRound(round)}
                    className="cursor-pointer pr-8"
                  >
                    <div className={`font-bold text-sm ${selectedRound?.id === round.id ? 'text-primary' : 'text-foreground'}`}>{round.title}</div>
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {new Date(round.start_date).toLocaleDateString('ko-KR')}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-medium border ${round.status === 'completed'
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                          : round.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                          }`}
                      >
                        {round.status === 'planning'
                          ? '계획'
                          : round.status === 'recruiting'
                            ? '모집'
                            : round.status === 'in_progress'
                              ? '진행중'
                              : round.status === 'completed'
                                ? '완료'
                                : '취소'}
                      </span>
                      {round.is_locked && <LockClosedIcon className="w-3 h-3 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* 편집/삭제 버튼 */}
                  <div className="absolute right-2 lg:right-3 top-2 lg:top-3 flex flex-col gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRound(round);
                      }}
                      className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-primary border border-transparent hover:border-border transition-all shadow-sm"
                      title="편집"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRound(round.id, round.title);
                      }}
                      className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-destructive border border-transparent hover:border-border transition-all shadow-sm disabled:opacity-30"
                      title="삭제"
                      disabled={round.is_locked}
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 시간표 그리드 */}
          <div className="col-span-12 lg:col-span-9">
            {selectedRound ? (
              <div className="bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-12rem)]">
                {/* 과정 정보 헤더 */}
                <div className="p-8 border-b border-border bg-muted/30">
                  <div className="flex flex-col xl:flex-row justify-between items-start gap-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-3">
                        {selectedRound.title}
                      </h2>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-xl border border-border shadow-sm">
                          <CalendarIcon className="w-4 h-4 text-primary" />
                          {new Date(selectedRound.start_date).toLocaleDateString('ko-KR')} ~{' '}
                          {new Date(selectedRound.end_date).toLocaleDateString('ko-KR')}
                        </div>
                        <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-xl border border-border shadow-sm">
                          <UserIcon className="w-4 h-4 text-purple-500" />
                          강사: <span className="font-bold text-foreground">{selectedRound.instructor_name}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-xl border border-border shadow-sm">
                          <MapPinIcon className="w-4 h-4 text-red-500" />
                          {selectedRound.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
                      {!selectedRound.is_locked && (
                        <>
                          <button
                            onClick={() => setShowSessionModal(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                          >
                            <PlusIcon className="w-4 h-4" />
                            일정 추가
                          </button>
                          <button
                            onClick={() => handleToggleLock(selectedRound.id, true)}
                            className="bg-background hover:bg-muted text-foreground border border-border px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
                            title="과정 확정 및 잠금"
                          >
                            <LockClosedIcon className="w-4 h-4 text-muted-foreground" />
                            확정
                          </button>
                        </>
                      )}
                      {selectedRound.is_locked && (
                        <button
                          onClick={() => handleToggleLock(selectedRound.id, false)}
                          className="bg-background hover:bg-muted text-foreground border border-border px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
                          title="잠금 해제"
                        >
                          <LockOpenIcon className="w-4 h-4 text-muted-foreground" />
                          잠금 해제
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicateRound(selectedRound.id)}
                        className="bg-background hover:bg-muted text-foreground border border-border px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
                        title="과정 복제"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4 text-muted-foreground" />
                        복제
                      </button>
                      {!selectedRound.is_locked && sessions.length > 0 && (
                        <button
                          onClick={() => handleRecalculateDates(selectedRound.id)}
                          className="bg-background hover:bg-muted text-foreground border border-border px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
                          title="날짜 자동 재계산 (주말/공휴일 건너뛰기)"
                        >
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          날짜 재계산
                        </button>
                      )}
                      {sessions.length > 0 && (
                        <button
                          onClick={handleExportToExcel}
                          className="bg-background hover:bg-muted text-foreground border border-border px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
                          title="엑셀로 내보내기"
                        >
                          <DocumentArrowDownIcon className="w-4 h-4 text-muted-foreground" />
                          엑셀 내보내기
                        </button>
                      )}
                      {!selectedRound.is_locked && (
                        <>
                          <label className="bg-background hover:bg-muted text-foreground border border-border px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer" title="엑셀에서 가져오기">
                            <DocumentArrowUpIcon className="w-4 h-4 text-muted-foreground" />
                            엑셀 가져오기
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              onChange={handleImportFromExcel}
                              className="hidden"
                            />
                          </label>
                          <button
                            onClick={() => setShowTemplateModal(true)}
                            className="bg-background hover:bg-muted text-foreground border border-border px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
                            title="템플릿에서 불러오기"
                          >
                            <DocumentArrowDownIcon className="w-4 h-4 text-muted-foreground" />
                            템플릿 불러오기
                          </button>
                        </>
                      )}
                      {sessions.length > 0 && !selectedRound.is_locked && (
                        <button
                          onClick={() => setShowSaveTemplateModal(true)}
                          className="bg-background hover:bg-muted text-foreground border border-border px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
                          title="현재 시간표를 템플릿으로 저장"
                        >
                          <DocumentArrowUpIcon className="w-4 h-4 text-muted-foreground" />
                          템플릿 저장
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 시간표 그리드 */}
                <div className="p-6 bg-muted/10 flex-1 overflow-y-auto custom-scrollbar">
                  {sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background rounded-[2rem] border border-dashed border-border h-full">
                      <CalendarIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
                      <p className="text-lg font-bold text-foreground">아직 일정이 없습니다.</p>
                      <p className="text-sm mt-2">'일정 추가' 버튼을 눌러 시간표를 작성하세요.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessions.map((session, index) => (
                        <div
                          key={session.id}
                          draggable={!selectedRound.is_locked}
                          onDragStart={(e) => handleDragStart(e, session)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, session, index)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center justify-between p-6 border rounded-2xl transition-all group ${!selectedRound.is_locked ? 'cursor-move hover:shadow-md' : ''
                            } ${draggedSession?.id === session.id ? 'opacity-50 ring-2 ring-primary/50' : ''
                            } ${dragOverIndex === index ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'bg-card border-border hover:border-primary/30'
                            }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-6">
                              <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-2xl font-bold border border-primary/20 shadow-sm">
                                <span className="text-[10px] uppercase tracking-wider opacity-70">Day</span>
                                <span className="text-2xl">{session.day_number}</span>
                              </div>
                              <div>
                                <div className="font-bold text-lg text-foreground flex items-center gap-2">
                                  {session.title || '제목 없음'}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                                  <span className="flex items-center bg-muted px-2.5 py-1 rounded-lg text-xs font-medium">
                                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                    {new Date(session.session_date).toLocaleDateString('ko-KR')}
                                  </span>
                                  <span className="flex items-center bg-muted px-2.5 py-1 rounded-lg text-xs font-medium">
                                    <ClockIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                    {session.start_time} ~ {session.end_time}
                                  </span>
                                  <span className="flex items-center bg-muted px-2.5 py-1 rounded-lg text-xs font-medium">
                                    <MapPinIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                    {session.classroom}
                                  </span>
                                  {session.instructor_name && (
                                    <span className="flex items-center bg-muted px-2.5 py-1 rounded-lg text-xs font-medium">
                                      <UserIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                      {session.instructor_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!selectedRound.is_locked && (
                              <>
                                <button
                                  onClick={() => openEditSessionModal(session)}
                                  className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                  title="수정"
                                >
                                  <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSession(session.id)}
                                  className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                  title="삭제"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            {selectedRound.is_locked && (
                              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-xl">
                                <LockClosedIcon className="w-4 h-4" />
                                확정됨
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-[2rem] shadow-sm border border-border p-12 text-center h-full flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  과정을 선택하세요
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  왼쪽 목록에서 과정을 선택하거나 상단의 '새 과정 만들기' 버튼을 눌러 새로운 과정을 시작해보세요.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 과정 생성/편집 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEditMode ? '과정 편집' : '새 과정 만들기'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setIsEditMode(false);
                    setEditingRoundId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    과정명 *
                  </label>
                  <input
                    type="text"
                    value={roundForm.title}
                    onChange={(e) => setRoundForm({ ...roundForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="예: 2025년 1기 BS 영업 과정"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      시작일 *
                    </label>
                    <input
                      type="date"
                      value={roundForm.start_date}
                      onChange={(e) => setRoundForm({ ...roundForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      종료일 *
                    </label>
                    <input
                      type="date"
                      value={roundForm.end_date}
                      onChange={(e) => setRoundForm({ ...roundForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    운영 담당자 *
                  </label>
                  <select
                    value={roundForm.manager_id}
                    onChange={(e) => {
                      const manager = managers.find((m) => m.id === e.target.value);
                      setRoundForm({
                        ...roundForm,
                        manager_id: e.target.value,
                        manager_name: manager?.name || '',
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">선택</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      장소 *
                    </label>
                    <select
                      value={roundForm.location}
                      onChange={(e) => setRoundForm({ ...roundForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">강의실을 선택하세요</option>
                      {classrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.name}>
                          {classroom.name} (위치: {classroom.location || '미지정'}, 수용: {classroom.capacity}명)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      입과 인원
                    </label>
                    <input
                      type="number"
                      value={roundForm.max_trainees}
                      onChange={(e) =>
                        setRoundForm({ ...roundForm, max_trainees: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    설명
                  </label>
                  <textarea
                    value={roundForm.description}
                    onChange={(e) => setRoundForm({ ...roundForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="과정에 대한 설명을 입력하세요"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setIsEditMode(false);
                    setEditingRoundId(null);
                  }}
                  className="px-4 py-2 text-foreground hover:bg-muted rounded-full"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateRound}
                  disabled={!roundForm.title || !roundForm.start_date || !roundForm.end_date}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditMode ? '수정' : '생성'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 일정 추가 모달 */}
        {showSessionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">일정 추가</h2>
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      일차
                    </label>
                    <input
                      type="number"
                      value={sessionForm.day_number}
                      onChange={(e) =>
                        setSessionForm({ ...sessionForm, day_number: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      날짜 *
                    </label>
                    <input
                      type="date"
                      value={sessionForm.session_date}
                      onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    제목
                  </label>
                  <input
                    type="text"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="예: BS 영업 기초"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      시작 시간 *
                    </label>
                    <select
                      value={sessionForm.start_time}
                      onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="09:00">오전 09:00</option>
                      <option value="09:30">오전 09:30</option>
                      <option value="10:00">오전 10:00</option>
                      <option value="10:30">오전 10:30</option>
                      <option value="11:00">오전 11:00</option>
                      <option value="11:30">오전 11:30</option>
                      <option value="12:00">오후 12:00</option>
                      <option value="12:30">오후 12:30</option>
                      <option value="13:00">오후 01:00</option>
                      <option value="13:30">오후 01:30</option>
                      <option value="14:00">오후 02:00</option>
                      <option value="14:30">오후 02:30</option>
                      <option value="15:00">오후 03:00</option>
                      <option value="15:30">오후 03:30</option>
                      <option value="16:00">오후 04:00</option>
                      <option value="16:30">오후 04:30</option>
                      <option value="17:00">오후 05:00</option>
                      <option value="17:30">오후 05:30</option>
                      <option value="18:00">오후 06:00</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      종료 시간 *
                    </label>
                    <select
                      value={sessionForm.end_time}
                      onChange={(e) => setSessionForm({ ...sessionForm, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="09:00">오전 09:00</option>
                      <option value="09:30">오전 09:30</option>
                      <option value="10:00">오전 10:00</option>
                      <option value="10:30">오전 10:30</option>
                      <option value="11:00">오전 11:00</option>
                      <option value="11:30">오전 11:30</option>
                      <option value="12:00">오후 12:00</option>
                      <option value="12:30">오후 12:30</option>
                      <option value="13:00">오후 01:00</option>
                      <option value="13:30">오후 01:30</option>
                      <option value="14:00">오후 02:00</option>
                      <option value="14:30">오후 02:30</option>
                      <option value="15:00">오후 03:00</option>
                      <option value="15:30">오후 03:30</option>
                      <option value="16:00">오후 04:00</option>
                      <option value="16:30">오후 04:30</option>
                      <option value="17:00">오후 05:00</option>
                      <option value="17:30">오후 05:30</option>
                      <option value="18:00">오후 06:00</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    과목 (선택)
                  </label>
                  <select
                    value={sessionForm.subject_id}
                    onChange={(e) => setSessionForm({ ...sessionForm, subject_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">선택</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ResourceSelector 통합 */}
                {/* ResourceSelector 통합 */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4">자원 선택</h3>
                  <ResourceSelector
                    sessionDate={sessionForm.session_date}
                    startTime={sessionForm.start_time}
                    endTime={sessionForm.end_time}
                    subjectId={sessionForm.subject_id}
                    selectedInstructorId={sessionForm.actual_instructor_id}
                    selectedClassroomId={sessionForm.classroom_id}
                    onInstructorChange={(instructorId) =>
                      setSessionForm({ ...sessionForm, actual_instructor_id: instructorId })
                    }
                    onClassroomChange={(classroomId) => {
                      const classroom = classrooms.find(c => c.id === classroomId);
                      setSessionForm({
                        ...sessionForm,
                        classroom_id: classroomId,
                        classroom: classroom?.name || ''
                      });
                    }}
                    excludeSessionId={undefined}
                    showRecommendations={true}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 text-foreground hover:bg-muted rounded-full"
                >
                  취소
                </button>
                <button
                  onClick={handleAddSession}
                  disabled={
                    !sessionForm.session_date || !sessionForm.start_time || !sessionForm.end_time || !sessionForm.classroom_id
                  }
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 일정 수정 모달 */}
        {showEditModal && selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">일정 수정</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedSession(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      일차
                    </label>
                    <input
                      type="number"
                      value={sessionForm.day_number}
                      onChange={(e) =>
                        setSessionForm({ ...sessionForm, day_number: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      날짜 *
                    </label>
                    <input
                      type="date"
                      value={sessionForm.session_date}
                      onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    제목
                  </label>
                  <input
                    type="text"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="예: BS 영업 기초"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      시작 시간 *
                    </label>
                    <select
                      value={sessionForm.start_time}
                      onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="09:00">오전 09:00</option>
                      <option value="09:30">오전 09:30</option>
                      <option value="10:00">오전 10:00</option>
                      <option value="10:30">오전 10:30</option>
                      <option value="11:00">오전 11:00</option>
                      <option value="11:30">오전 11:30</option>
                      <option value="12:00">오후 12:00</option>
                      <option value="12:30">오후 12:30</option>
                      <option value="13:00">오후 01:00</option>
                      <option value="13:30">오후 01:30</option>
                      <option value="14:00">오후 02:00</option>
                      <option value="14:30">오후 02:30</option>
                      <option value="15:00">오후 03:00</option>
                      <option value="15:30">오후 03:30</option>
                      <option value="16:00">오후 04:00</option>
                      <option value="16:30">오후 04:30</option>
                      <option value="17:00">오후 05:00</option>
                      <option value="17:30">오후 05:30</option>
                      <option value="18:00">오후 06:00</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      종료 시간 *
                    </label>
                    <select
                      value={sessionForm.end_time}
                      onChange={(e) => setSessionForm({ ...sessionForm, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="09:00">오전 09:00</option>
                      <option value="09:30">오전 09:30</option>
                      <option value="10:00">오전 10:00</option>
                      <option value="10:30">오전 10:30</option>
                      <option value="11:00">오전 11:00</option>
                      <option value="11:30">오전 11:30</option>
                      <option value="12:00">오후 12:00</option>
                      <option value="12:30">오후 12:30</option>
                      <option value="13:00">오후 01:00</option>
                      <option value="13:30">오후 01:30</option>
                      <option value="14:00">오후 02:00</option>
                      <option value="14:30">오후 02:30</option>
                      <option value="15:00">오후 03:00</option>
                      <option value="15:30">오후 03:30</option>
                      <option value="16:00">오후 04:00</option>
                      <option value="16:30">오후 04:30</option>
                      <option value="17:00">오후 05:00</option>
                      <option value="17:30">오후 05:30</option>
                      <option value="18:00">오후 06:00</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    과목 (선택)
                  </label>
                  <select
                    value={sessionForm.subject_id}
                    onChange={(e) => setSessionForm({ ...sessionForm, subject_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">선택</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ResourceSelector 통합 */}
                {/* ResourceSelector 통합 */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4">자원 선택</h3>
                  <ResourceSelector
                    sessionDate={sessionForm.session_date}
                    startTime={sessionForm.start_time}
                    endTime={sessionForm.end_time}
                    subjectId={sessionForm.subject_id}
                    selectedInstructorId={sessionForm.actual_instructor_id}
                    selectedClassroomId={sessionForm.classroom_id}
                    onInstructorChange={(instructorId) =>
                      setSessionForm({ ...sessionForm, actual_instructor_id: instructorId })
                    }
                    onClassroomChange={(classroomId) => {
                      const classroom = classrooms.find(c => c.id === classroomId);
                      setSessionForm({
                        ...sessionForm,
                        classroom_id: classroomId,
                        classroom: classroom?.name || ''
                      });
                    }}
                    excludeSessionId={selectedSession?.id}
                    showRecommendations={true}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedSession(null);
                  }}
                  className="px-4 py-2 text-foreground hover:bg-muted rounded-full"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateSession}
                  disabled={
                    !sessionForm.session_date || !sessionForm.start_time || !sessionForm.end_time || !sessionForm.classroom
                  }
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 템플릿 저장 모달 */}
        {showSaveTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">템플릿으로 저장</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    템플릿 이름 *
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="예: 기본 BS 영업 과정"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    카테고리
                  </label>
                  <input
                    type="text"
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="예: BS 영업"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    설명
                  </label>
                  <textarea
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="템플릿에 대한 설명을 입력하세요"
                  />
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    현재 {sessions.length}개의 일정이 템플릿으로 저장됩니다.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowSaveTemplateModal(false);
                    setTemplateForm({ name: '', description: '', category: '' });
                  }}
                  className="px-4 py-2 text-foreground hover:bg-muted rounded-full"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveAsTemplate}
                  disabled={!templateForm.name}
                  className="px-4 py-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 템플릿 불러오기 모달 */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">템플릿 선택</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  저장된 템플릿이 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer"
                      onClick={() => handleLoadFromTemplate(template.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {template.name}
                            </h3>
                            {template.is_default && (
                              <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 rounded">
                                기본
                              </span>
                            )}
                            {template.category && (
                              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                {template.category}
                              </span>
                            )}
                          </div>
                          {template.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {template.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>📚 {template.session_count}차시</span>
                            {template.total_hours && (
                              <span>⏱️ {template.total_hours.toFixed(1)}시간</span>
                            )}
                            <span>🔄 {template.usage_count}회 사용</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadFromTemplate(template.id);
                          }}
                          className="ml-4 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 text-sm"
                        >
                          불러오기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-foreground hover:bg-muted rounded-full"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
