/**
 * =================================================
 * 통합 과정 관리 서비스
 * =================================================
 * 설명: 과정 템플릿, 차수, 커리큘럼을 통합 관리
 * 작성일: 2025-01-20
 * =================================================
 */

import { supabase } from './supabase';
import { TemplateCurriculumService } from './template-curriculum.service';
import { RoundEnrollmentService } from './round-enrollment.service';
import { InstructorIntegrationService } from './instructor-integration.service';
import { CompletionCriteriaService } from './completion-criteria.service';
import { ResourceReservationService } from './resource-reservation.service';
import { StatisticsService } from './statistics.service';
import { AuditLogService } from './audit-log.service';
import type {
  CourseTemplate,
  CourseRound,
  CourseRoundFull,
  CurriculumItem,
  CurriculumItemFull,
  CreateCourseTemplateRequest,
  CreateCourseRoundRequest,
  UpdateCurriculumItemRequest,
  RoundStatistics
} from '../types/unified-course.types';

export class UnifiedCourseService {
  // =================================================
  // 1. 과정 템플릿 관리
  // =================================================

  /**
   * 템플릿 생성 (커리큘럼 포함)
   */
  static async createTemplate(request: CreateCourseTemplateRequest): Promise<CourseTemplate> {
    try {
      console.log('[UnifiedCourseService] Creating template:', request.name);

      // 1. 템플릿 기본 정보 저장
      const { data: template, error: templateError } = await supabase
        .from('course_templates')
        .insert({
          code: request.code,
          name: request.name,
          description: request.description,
          category: request.category,
          difficulty_level: request.difficulty_level,
          duration_days: request.duration_days,
          total_hours: request.total_hours,
          requirements: request.requirements,
          objectives: request.objectives,
          is_active: true
        })
        .select()
        .single();

      if (templateError) {
        console.error('[UnifiedCourseService] Error creating template:', templateError);
        throw templateError;
      }

      // 2. 템플릿 커리큘럼 저장
      if (request.curriculum && request.curriculum.length > 0) {
        await TemplateCurriculumService.createBatch(template.id, request.curriculum);
      }

      console.log('[UnifiedCourseService] Template created:', template.id);
      return template;
    } catch (error: any) {
      console.error('[UnifiedCourseService] Error:', error);
      throw error;
    }
  }

  /**
   * 템플릿 수정 (커리큘럼 포함)
   */
  static async updateTemplate(
    templateId: string,
    updates: Partial<CreateCourseTemplateRequest>
  ): Promise<CourseTemplate> {
    try {
      console.log('[UnifiedCourseService] Updating template:', templateId);

      // 1. 템플릿 기본 정보 업데이트
      const templateUpdates: Record<string, any> = {};
      const allowedFields = [
        'code', 'name', 'description', 'category', 'difficulty_level',
        'duration_days', 'total_hours', 'requirements', 'objectives', 'is_active'
      ];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          templateUpdates[key] = (updates as any)[key];
        }
      });

      const { data: template, error: templateError } = await supabase
        .from('course_templates')
        .update({
          ...templateUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single();

      if (templateError) {
        console.error('[UnifiedCourseService] Error updating template:', templateError);
        throw templateError;
      }

      // 2. 커리큘럼 재생성 (제공된 경우)
      if (updates.curriculum) {
        await TemplateCurriculumService.deleteByTemplateId(templateId);
        await TemplateCurriculumService.createBatch(templateId, updates.curriculum);
      }

      console.log('[UnifiedCourseService] Template updated:', template.id);
      return template;
    } catch (error: any) {
      console.error('[UnifiedCourseService] Error:', error);
      throw error;
    }
  }

  /**
   * 템플릿 조회 (커리큘럼 포함)
   */
  static async getTemplate(templateId: string): Promise<{
    template: CourseTemplate;
    curriculum: any[];
  }> {
    try {
      const { data: template, error } = await supabase
        .from('course_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      const curriculum = await TemplateCurriculumService.getByTemplateId(templateId);

      return { template, curriculum };
    } catch (error: any) {
      console.error('[UnifiedCourseService] Error:', error);
      throw error;
    }
  }

  // =================================================
  // 2. 과정 차수 관리
  // =================================================

  /**
   * 차수 생성 (자동으로 curriculum_items 생성됨 - 트리거)
   */
  static async createRound(request: CreateCourseRoundRequest): Promise<CourseRound> {
    try {
      console.log('[UnifiedCourseService] Creating round for template:', request.template_id);

      // 1. 템플릿 정보 조회
      const { data: template, error: templateError } = await supabase
        .from('course_templates')
        .select('name, code, duration_days')
        .eq('id', request.template_id)
        .single();

      if (templateError) throw templateError;

      // 2. 차수 번호 자동 생성 (제공되지 않은 경우)
      let roundNumber = request.round_number;
      if (!roundNumber) {
        const { data: existingRounds } = await supabase
          .from('course_rounds')
          .select('round_number')
          .eq('template_id', request.template_id)
          .order('round_number', { ascending: false })
          .limit(1);

        roundNumber = (existingRounds?.[0]?.round_number || 0) + 1;
      }

      // 3. 종료일 자동 계산 (제공되지 않은 경우)
      let endDate = request.end_date;
      if (!endDate && template.duration_days) {
        const startDate = new Date(request.start_date);
        const calculatedEndDate = new Date(startDate);
        calculatedEndDate.setDate(startDate.getDate() + template.duration_days - 1);
        endDate = calculatedEndDate.toISOString().split('T')[0];
      }

      // 4. 강사 정보 조회 (통합 서비스 사용)
      const instructor = await InstructorIntegrationService.getInstructorById(request.instructor_id);

      // 5. 차수 생성
      const { data: round, error: roundError } = await supabase
        .from('course_rounds')
        .insert({
          template_id: request.template_id,
          round_number: roundNumber,
          round_name: `${template.name} ${roundNumber}차`,
          round_code: `${template.code}-${new Date().getFullYear()}-${String(roundNumber).padStart(2, '0')}`,
          course_name: template.name,
          instructor_id: request.instructor_id,
          instructor_name: instructor?.name || '강사 미지정',
          manager_id: request.manager_id,
          start_date: request.start_date,
          end_date: endDate || request.start_date,
          location: request.location,
          max_trainees: request.max_trainees,
          current_trainees: 0,
          status: 'planning',
          description: request.description
        })
        .select()
        .single();

      if (roundError) {
        console.error('[UnifiedCourseService] Error creating round:', roundError);
        throw roundError;
      }

      console.log('[UnifiedCourseService] Round created:', round.id);
      console.log('[UnifiedCourseService] curriculum_items will be auto-generated by trigger');

      return round;
    } catch (error: any) {
      console.error('[UnifiedCourseService] Error:', error);
      throw error;
    }
  }

  /**
   * 차수 전체 정보 조회 (뷰 사용)
   */
  static async getRoundFull(roundId: string): Promise<CourseRoundFull> {
    try {
      const { data, error } = await supabase
        .from('course_rounds_full')
        .select('*')
        .eq('id', roundId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('[UnifiedCourseService] Error:', error);
      throw error;
    }
  }

  /**
   * 차수 목록 조회
   */
  static async getRounds(filters?: {
    template_id?: string;
    status?: string;
    instructor_id?: string;
  }): Promise<CourseRoundFull[]> {
    try {
      let query = supabase
        .from('course_rounds_full')
        .select('*');

      if (filters?.template_id) {
        query = query.eq('template_id', filters.template_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.instructor_id) {
        query = query.eq('instructor_id', filters.instructor_id);
      }

      const { data, error } = await query.order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[UnifiedCourseService] Error:', error);
      throw error;
    }
  }

  // =================================================
  // 3. 커리큘럼 항목 관리
  // =================================================

  /**
   * 차수의 커리큘럼 항목 조회 (전체 정보 포함)
   */
  static async getCurriculumItems(roundId: string): Promise<CurriculumItemFull[]> {
    try {
      const { data, error } = await supabase
        .from('curriculum_items_full')
        .select('*')
        .eq('round_id', roundId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[UnifiedCourseService] Error:', error);
      throw error;
    }
  }

  /**
   * 커리큘럼 항목 수정
   */
  static async updateCurriculumItem(
    itemId: string,
    updates: UpdateCurriculumItemRequest
  ): Promise<CurriculumItem> {
    try {
      console.log('[UnifiedCourseService] Updating curriculum item:', itemId);

      const { data, error } = await supabase
        .from('curriculum_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      console.log('[UnifiedCourseService] Curriculum item updated');
      return data;
    } catch (error: any) {
      console.error('[UnifiedCourseService] Error:', error);
      throw error;
    }
  }

  /**
   * 커리큘럼 항목 승인
   */
  static async approveCurriculumItem(
    itemId: string,
    approvedBy: string
  ): Promise<CurriculumItem> {
    return this.updateCurriculumItem(itemId, {
      status: 'confirmed',
      // approved_at and approved_by would need to be added to UpdateCurriculumItemRequest
    } as any);
  }

  // =================================================
  // 4. 강사 관리 (통합)
  // =================================================

  /**
   * 과정 차수에 할당 가능한 강사 목록 조회
   * users 테이블의 role='instructor' + instructors 프로필 통합
   */
  static async getAvailableInstructors() {
    return InstructorIntegrationService.getAvailableInstructors();
  }

  /**
   * 강사 검색
   */
  static async searchInstructors(query: string) {
    return InstructorIntegrationService.searchInstructors(query);
  }

  // =================================================
  // 5. 통계 및 리포트
  // =================================================

  /**
   * 차수 통계 조회 (출석률 포함)
   */
  static async getRoundStatistics(roundId: string): Promise<RoundStatistics> {
    try {
      const [round, curriculumItems, enrollmentStats, attendanceRate] = await Promise.all([
        this.getRoundFull(roundId),
        this.getCurriculumItems(roundId),
        RoundEnrollmentService.getEnrollmentStats(roundId),
        CompletionCriteriaService.calculateRoundAttendanceRate(roundId)
      ]);

      const completedSessions = curriculumItems.filter(c => c.status === 'completed').length;

      // 평균 최종 점수 계산
      const { data: enrollments } = await supabase
        .from('round_enrollments')
        .select('final_score')
        .eq('round_id', roundId)
        .not('final_score', 'is', null);

      let averageFinalScore: number | undefined;
      if (enrollments && enrollments.length > 0) {
        const totalScore = enrollments.reduce((sum, e) => sum + (e.final_score || 0), 0);
        averageFinalScore = Math.round(totalScore / enrollments.length);
      }

      // 합격률 계산 (completed / total)
      const passRate = enrollmentStats.total > 0
        ? Math.round((enrollmentStats.completed / enrollmentStats.total) * 100)
        : undefined;

      return {
        round_id: roundId,
        round_name: round.round_name,
        total_enrolled: enrollmentStats.total,
        total_completed: enrollmentStats.completed,
        total_dropped: enrollmentStats.dropped,
        completion_rate: enrollmentStats.total > 0
          ? (enrollmentStats.completed / enrollmentStats.total) * 100
          : 0,
        total_sessions: curriculumItems.length,
        completed_sessions: completedSessions,
        session_completion_rate: curriculumItems.length > 0
          ? (completedSessions / curriculumItems.length) * 100
          : 0,
        average_attendance_rate: attendanceRate, // ✅ 출석률 계산됨
        total_absences: 0, // TODO: 세부 결석 수 계산
        average_final_score: averageFinalScore,
        pass_rate: passRate
      };
    } catch (error: any) {
      console.error('[UnifiedCourseService] Error:', error);
      throw error;
    }
  }

  /**
   * 차수 수료 조건 검증 및 수료 처리
   */
  static async processCompletion(
    roundId: string,
    requirements?: Partial<{
      min_attendance_rate: number;
      min_final_score: number;
      required_assignments: number;
      allow_late_as_present: boolean;
    }>
  ) {
    return CompletionCriteriaService.batchCompleteTrainees(roundId, requirements as any);
  }

  /**
   * 교육생 개별 수료 가능 여부 확인
   */
  static async checkTraineeCompletion(traineeId: string, roundId: string) {
    return CompletionCriteriaService.checkCompletionEligibility(traineeId, roundId);
  }

  // =================================================
  // 6. 자원 예약 관리
  // =================================================

  /**
   * 커리큘럼 항목에 강의실 할당 (충돌 검증 포함)
   */
  static async assignClassroom(
    curriculumItemId: string,
    classroomId: string
  ): Promise<{ success: boolean; message: string }> {
    return ResourceReservationService.assignClassroom(curriculumItemId, classroomId);
  }

  /**
   * 강의실 할당 해제
   */
  static async unassignClassroom(curriculumItemId: string): Promise<void> {
    return ResourceReservationService.unassignClassroom(curriculumItemId);
  }

  /**
   * 특정 시간대 사용 가능한 강의실 조회
   */
  static async getAvailableClassrooms(
    date: string,
    startTime: string,
    endTime: string,
    minCapacity?: number
  ) {
    return ResourceReservationService.getAvailableClassrooms(
      date,
      startTime,
      endTime,
      minCapacity
    );
  }

  /**
   * 강의실 예약 충돌 검증
   */
  static async checkClassroomConflict(
    classroomId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeCurriculumItemId?: string
  ) {
    return ResourceReservationService.checkClassroomConflict(
      classroomId,
      date,
      startTime,
      endTime,
      excludeCurriculumItemId
    );
  }

  /**
   * 강의실 사용 현황 조회
   */
  static async getClassroomSchedule(
    classroomId: string,
    startDate: string,
    endDate: string
  ) {
    return ResourceReservationService.getClassroomSchedule(
      classroomId,
      startDate,
      endDate
    );
  }

  /**
   * 차수의 모든 커리큘럼에 강의실 일괄 할당
   */
  static async bulkAssignClassroom(roundId: string, defaultClassroomId: string) {
    return ResourceReservationService.bulkAssignClassroom(roundId, defaultClassroomId);
  }

  // =================================================
  // 7. 통계 및 분석
  // =================================================

  /**
   * Materialized View 통계 갱신
   */
  static async refreshStatistics(): Promise<void> {
    return StatisticsService.refreshStatistics();
  }

  /**
   * 차수 통계 조회 (고성능 - Materialized View 사용)
   */
  static async getRoundStatisticsFromView(roundId?: string) {
    return StatisticsService.getRoundStatistics(roundId);
  }

  /**
   * 교육생 통계 조회 (고성능 - Materialized View 사용)
   */
  static async getTraineeStatisticsFromView(traineeId?: string) {
    return StatisticsService.getTraineeStatistics(traineeId);
  }

  /**
   * 대시보드 요약 통계
   */
  static async getDashboardSummary() {
    return StatisticsService.getDashboardSummary();
  }

  /**
   * 월별 등록 추이
   */
  static async getMonthlyEnrollmentTrend(months?: number) {
    return StatisticsService.getMonthlyEnrollmentTrend(months);
  }

  // =================================================
  // 8. 감사 로그
  // =================================================

  /**
   * 특정 레코드의 변경 이력 조회
   */
  static async getRecordHistory(tableName: string, recordId: string, limit?: number) {
    return AuditLogService.getRecordHistory(tableName, recordId, limit);
  }

  /**
   * 최근 감사 로그 조회
   */
  static async getRecentAuditLogs(hours?: number, limit?: number) {
    return AuditLogService.getRecentLogs(hours, limit);
  }

  /**
   * 감사 로그 통계
   */
  static async getAuditLogStatistics(days?: number) {
    return AuditLogService.getLogStatistics(days);
  }
}
