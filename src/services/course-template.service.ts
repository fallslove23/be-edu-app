import { supabase } from './supabase';
import type {
  CourseTemplate,
  TemplateCurriculum,
  CourseRound,
  CourseSession,
  CourseEnrollment,
  RoundStats,
  BSCourseSummary
} from '../types/course-template.types';
import { DEFAULT_COURSE_TEMPLATES } from '../types/course-template.types';

export class CourseTemplateService {
  
  // ===== 템플릿 관리 =====
  
  /**
   * 모든 과정 템플릿 조회 (BS Basic, BS Advanced)
   */
  static async getTemplates(): Promise<CourseTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('course_templates')
        .select(`
          *,
          category_data:categories!category_id (
            id,
            name,
            color,
            icon,
            parent_id,
            parent:categories!parent_id (
              name
            )
          )
        `)
        .eq('is_active', true)
        .order('category');

      if (error) {
        console.log('[CourseTemplateService] Supabase error, using default templates:', error);
        return DEFAULT_COURSE_TEMPLATES;
      }

      // category_data 구조 변환
      const templates = (data || []).map(template => ({
        ...template,
        category_data: template.category_data ? {
          id: template.category_data.id,
          name: template.category_data.name,
          color: template.category_data.color,
          icon: template.category_data.icon,
          parent_id: template.category_data.parent_id,
          parent_name: template.category_data.parent?.name
        } : undefined
      }));

      return templates.length > 0 ? templates : DEFAULT_COURSE_TEMPLATES;
    } catch (error) {
      console.error('[CourseTemplateService] Error fetching templates:', error);
      return DEFAULT_COURSE_TEMPLATES;
    }
  }

  /**
   * 템플릿 수정
   */
  static async updateTemplate(templateId: string, updates: Partial<CourseTemplate>): Promise<CourseTemplate> {
    try {
      // Filter only database-valid fields
      const validUpdates: Record<string, any> = {};
      const allowedFields = [
        'code', 'name', 'description', 'duration_weeks', 'category',
        'difficulty_level', 'tags', 'prerequisites', 'is_active', 'category_id'
      ];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          validUpdates[key] = (updates as any)[key];
        }
      });

      console.log('[CourseTemplateService] Updating template with valid fields:', validUpdates);

      const { data, error } = await supabase
        .from('course_templates')
        .update({
          ...validUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        console.error('[CourseTemplateService] Template update failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // 기본 템플릿에서 찾아서 업데이트된 내용으로 반환
        const defaultTemplate = DEFAULT_COURSE_TEMPLATES.find(t => t.id === templateId);
        if (defaultTemplate) {
          return { ...defaultTemplate, ...updates };
        }
        throw new Error('Template not found');
      }

      console.log('[CourseTemplateService] Template updated successfully:', data);
      return data;
    } catch (error: any) {
      console.error('[CourseTemplateService] Error updating template:', {
        message: error?.message || 'Unknown error',
        error: error
      });
      throw error;
    }
  }

  /**
   * 커리큘럼 수정
   */
  static async updateTemplateCurriculum(
    templateId: string, 
    curriculum: TemplateCurriculum[]
  ): Promise<CourseTemplate> {
    try {
      // 전체 시간 다시 계산
      const totalHours = curriculum.reduce((sum, curr) => sum + curr.duration_hours, 0);
      
      const updates = {
        curriculum,
        total_hours: totalHours,
        duration_days: curriculum.length
      };

      return await this.updateTemplate(templateId, updates);
    } catch (error) {
      console.error('[CourseTemplateService] Error updating curriculum:', error);
      throw error;
    }
  }

  /**
   * 새 템플릿 생성
   */
  static async createTemplate(templateData: Omit<CourseTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<CourseTemplate> {
    try {
      const newTemplate = {
        ...templateData,
        id: `custom-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('course_templates')
        .insert(newTemplate)
        .select()
        .single();

      if (error) {
        console.log('[CourseTemplateService] Template creation failed, using mock');
        // Mock 환경에서는 메모리에 임시 저장
        return newTemplate as CourseTemplate;
      }

      return data;
    } catch (error) {
      console.error('[CourseTemplateService] Error creating template:', error);
      throw error;
    }
  }

  /**
   * 특정 템플릿 조회
   */
  static async getTemplateById(templateId: string): Promise<CourseTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('course_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        console.log('[CourseTemplateService] Template not found in DB, using default');
        return DEFAULT_COURSE_TEMPLATES.find(t => t.id === templateId) || null;
      }

      return data;
    } catch (error) {
      console.error('[CourseTemplateService] Error fetching template:', error);
      return DEFAULT_COURSE_TEMPLATES.find(t => t.id === templateId) || null;
    }
  }

  // ===== 차수(Round) 관리 =====

  /**
   * 모든 과정 차수 조회
   */
  static async getRounds(filter?: {
    template_id?: string;
    status?: string;
    instructor_id?: string;
  }): Promise<CourseRound[]> {
    try {
      let query = supabase
        .from('course_rounds')
        .select(`
          *,
          instructor:users!instructor_id(id, name),
          template:course_templates(id, name, category)
        `)
        .order('round_number', { ascending: false });

      if (filter?.template_id) {
        query = query.eq('template_id', filter.template_id);
      }
      if (filter?.status) {
        query = query.eq('status', filter.status);
      }
      if (filter?.instructor_id) {
        query = query.eq('instructor_id', filter.instructor_id);
      }

      const { data, error } = await query;

      if (error) {
        console.log('[CourseTemplateService] Using mock round data:', error);
        return this.getMockRounds(filter);
      }

      return data || this.getMockRounds(filter);
    } catch (error) {
      console.error('[CourseTemplateService] Error fetching rounds:', error);
      return this.getMockRounds(filter);
    }
  }

  /**
   * 새로운 차수 생성
   */
  static async createRound(roundData: {
    template_id: string;
    instructor_id: string;
    start_date: string;
    max_trainees: number;
    location: string;
  }): Promise<CourseRound> {
    try {
      const template = await this.getTemplateById(roundData.template_id);
      if (!template) {
        throw new Error('Template not found');
      }

      // 다음 차수 번호 계산
      const { data: existingRounds } = await supabase
        .from('course_rounds')
        .select('round_number')
        .eq('template_id', roundData.template_id)
        .order('round_number', { ascending: false })
        .limit(1);

      const nextRoundNumber = (existingRounds?.[0]?.round_number || 0) + 1;

      // 종료일 계산 (시작일로부터 duration_days만큼)
      const startDate = new Date(roundData.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + template.duration_days - 1);

      const newRound = {
        template_id: roundData.template_id,
        round_number: nextRoundNumber,
        title: `${template.name} ${nextRoundNumber}차`,
        instructor_id: roundData.instructor_id,
        start_date: roundData.start_date,
        end_date: endDate.toISOString().split('T')[0],
        max_trainees: roundData.max_trainees,
        current_trainees: 0,
        location: roundData.location,
        status: 'planning' as const
      };

      const { data, error } = await supabase
        .from('course_rounds')
        .insert(newRound)
        .select()
        .single();

      if (error) throw error;

      // 세션들도 자동 생성
      await this.createSessionsForRound(data.id, template, roundData.start_date);

      return data;
    } catch (error) {
      console.error('[CourseTemplateService] Error creating round:', error);
      throw error;
    }
  }

  /**
   * 차수별 세션 자동 생성
   */
  private static async createSessionsForRound(
    roundId: string, 
    template: CourseTemplate, 
    startDate: string
  ): Promise<void> {
    try {
      const sessions = template.curriculum.map((curriculum, index) => {
        const sessionDate = new Date(startDate);
        sessionDate.setDate(sessionDate.getDate() + index);

        return {
          round_id: roundId,
          template_curriculum_id: curriculum.id,
          day_number: curriculum.day,
          session_date: sessionDate.toISOString().split('T')[0],
          start_time: '09:00',
          end_time: index === template.curriculum.length - 1 ? '17:00' : '18:00', // 마지막 날은 일찍 종료
          classroom: 'TBD',
          status: 'scheduled' as const
        };
      });

      const { error } = await supabase
        .from('course_sessions')
        .insert(sessions);

      if (error) {
        console.error('[CourseTemplateService] Error creating sessions:', error);
      }
    } catch (error) {
      console.error('[CourseTemplateService] Error in createSessionsForRound:', error);
    }
  }

  /**
   * 차수 수정
   */
  static async updateRound(
    roundId: string,
    updates: Partial<Omit<CourseRound, 'id' | 'created_at' | 'updated_at' | 'sessions' | 'template'>>
  ): Promise<CourseRound> {
    try {
      // updated_at 추가하기 전에 유효하지 않은 필드 제거
      const validUpdates: Record<string, any> = {};

      // 허용된 필드만 복사
      const allowedFields = [
        'template_id', 'round_number', 'title', 'course_name',
        'instructor_id', 'instructor_name', 'manager_id', 'manager_name',
        'start_date', 'end_date', 'max_trainees', 'current_trainees',
        'location', 'status', 'description'
      ];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          validUpdates[key] = (updates as any)[key];
        }
      });

      console.log('[CourseTemplateService] Updating round with:', validUpdates);

      const { data, error } = await supabase
        .from('course_rounds')
        .update({
          ...validUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', roundId)
        .select()
        .single();

      if (error) {
        console.error('[CourseTemplateService] Supabase error updating round:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('[CourseTemplateService] Round updated successfully:', data);
      return data;
    } catch (error: any) {
      console.error('[CourseTemplateService] Error updating round:', {
        message: error?.message || 'Unknown error',
        error: error
      });
      throw error;
    }
  }

  /**
   * 차수 삭제
   */
  static async deleteRound(roundId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('course_rounds')
        .delete()
        .eq('id', roundId);

      if (error) throw error;
    } catch (error) {
      console.error('[CourseTemplateService] Error deleting round:', error);
      throw error;
    }
  }

  /**
   * 날짜 기반 자동 상태 업데이트
   * - 시작일이 지난 recruiting 상태 → in_progress로 변경
   * - 종료일이 지난 in_progress 상태 → completed로 변경
   */
  static async autoUpdateRoundStatus(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // recruiting -> in_progress (시작일이 오늘이거나 지났을 때)
      const { data: startData, error: startError } = await supabase
        .from('course_rounds')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'recruiting')
        .lte('start_date', today)
        .select();

      if (startError) {
        // 테이블이 없거나 접근 권한이 없는 경우 조용히 처리
        if (startError.code === '42P01' || startError.code === 'PGRST116') {
          console.log('[CourseTemplateService] course_rounds table not found or no data, skipping auto-start');
        } else {
          console.warn('[CourseTemplateService] Error auto-starting rounds:', startError.message);
        }
      } else if (startData && startData.length > 0) {
        console.log(`[CourseTemplateService] Auto-started ${startData.length} rounds`);
      }

      // in_progress -> completed (종료일이 지났을 때)
      const { data: endData, error: endError } = await supabase
        .from('course_rounds')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'in_progress')
        .lt('end_date', today)
        .select();

      if (endError) {
        // 테이블이 없거나 접근 권한이 없는 경우 조용히 처리
        if (endError.code === '42P01' || endError.code === 'PGRST116') {
          console.log('[CourseTemplateService] course_rounds table not found or no data, skipping auto-complete');
        } else {
          console.warn('[CourseTemplateService] Error auto-completing rounds:', endError.message);
        }
      } else if (endData && endData.length > 0) {
        console.log(`[CourseTemplateService] Auto-completed ${endData.length} rounds`);
      }
    } catch (error) {
      console.warn('[CourseTemplateService] Error in autoUpdateRoundStatus:', error);
    }
  }

  // ===== 세션 관리 =====

  /**
   * 차수별 세션 조회
   */
  static async getSessionsByRound(roundId: string): Promise<CourseSession[]> {
    try {
      const { data, error } = await supabase
        .from('course_sessions')
        .select(`
          *,
          curriculum:course_templates!template_curriculum_id(*)
        `)
        .eq('round_id', roundId)
        .order('day_number');

      if (error) {
        console.log('[CourseTemplateService] Using mock session data:', error);
        return this.getMockSessions(roundId);
      }

      return data || this.getMockSessions(roundId);
    } catch (error) {
      console.error('[CourseTemplateService] Error fetching sessions:', error);
      return this.getMockSessions(roundId);
    }
  }

  /**
   * 세션 수정 (시간, 장소, 강사 변경)
   */
  static async updateSession(
    sessionId: string,
    updates: Partial<Pick<CourseSession, 'session_date' | 'start_time' | 'end_time' | 'classroom' | 'actual_instructor_id' | 'status' | 'notes'>>
  ): Promise<CourseSession> {
    try {
      const { data, error } = await supabase
        .from('course_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[CourseTemplateService] Error updating session:', error);
      throw error;
    }
  }

  // ===== 통계 및 대시보드 =====

  /**
   * BS 과정 전체 요약 정보
   */
  static async getBSCourseSummary(): Promise<BSCourseSummary[]> {
    try {
      const templates = await this.getTemplates();
      const summaries = await Promise.all(
        templates.map(async (template) => {
          // 진행 중인 차수
          const activeRounds = await this.getRounds({
            template_id: template.id,
            status: 'in_progress'
          });

          // 완료된 차수
          const completedRounds = await this.getRounds({
            template_id: template.id,
            status: 'completed'
          });

          // 전체 차수 (완료, 진행 중)
          const allRounds = await this.getRounds({
            template_id: template.id
          });

          // 진행 중인 차수의 총 교육생 수
          const totalTrainees = activeRounds.reduce((sum, round) => sum + round.current_trainees, 0);

          // 이번 달 세션 계산
          const now = new Date();
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          let thisMonthSessions = 0;
          for (const round of allRounds.filter(r => r.status === 'in_progress' || r.status === 'completed')) {
            const { data: sessions } = await supabase
              .from('course_sessions')
              .select('id')
              .eq('round_id', round.id)
              .gte('session_date', thisMonthStart.toISOString().split('T')[0])
              .lte('session_date', thisMonthEnd.toISOString().split('T')[0]);

            thisMonthSessions += sessions?.length || 0;
          }

          // 총 수료생 계산 (완료된 차수의 교육생 수 합계)
          const totalGraduates = completedRounds.reduce((sum, round) => sum + (round.current_trainees || 0), 0);

          // 평균 만족도 계산 (평가 데이터가 있다면)
          let avgSatisfaction = 0;
          const { data: evaluations } = await supabase
            .from('evaluation_results')
            .select('instructor_evaluation_score')
            .in('round_id', completedRounds.map(r => r.id))
            .not('instructor_evaluation_score', 'is', null);

          if (evaluations && evaluations.length > 0) {
            const sum = evaluations.reduce((acc, e) => acc + (e.instructor_evaluation_score || 0), 0);
            avgSatisfaction = Number((sum / evaluations.length).toFixed(1));
          } else {
            // 평가 데이터가 없으면 기본값
            avgSatisfaction = 0;
          }

          return {
            template_name: template.name,
            active_rounds: activeRounds.length,
            total_trainees: totalTrainees,
            this_month_sessions: thisMonthSessions,
            upcoming_sessions: [], // TODO: 실제 데이터
            completion_stats: {
              completed_rounds: completedRounds.length,
              total_graduates: totalGraduates,
              average_satisfaction: avgSatisfaction
            }
          };
        })
      );

      return summaries;
    } catch (error) {
      console.error('[CourseTemplateService] Error getting summary:', error);
      return this.getMockSummary();
    }
  }

  /**
   * 차수별 상세 통계
   */
  static async getRoundStats(roundId: string): Promise<RoundStats | null> {
    try {
      const [roundData, sessionsData] = await Promise.all([
        supabase.from('course_rounds').select('*').eq('id', roundId).single(),
        supabase.from('course_sessions').select('*').eq('round_id', roundId)
      ]);

      if (roundData.error || sessionsData.error) {
        return null;
      }

      const round = roundData.data;
      const sessions = sessionsData.data || [];
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const nextSession = sessions.find(s => s.status === 'scheduled');

      return {
        round_id: roundId,
        round_title: round.title,
        total_sessions: sessions.length,
        completed_sessions: completedSessions,
        total_trainees: round.max_trainees,
        active_trainees: round.current_trainees,
        completion_rate: sessions.length > 0 ? (completedSessions / sessions.length) * 100 : 0,
        average_attendance: 85, // TODO: 실제 출석률 계산
        next_session: nextSession ? {
          date: nextSession.session_date,
          time: nextSession.start_time,
          day_number: nextSession.day_number,
          title: `${nextSession.day_number}일차`
        } : undefined
      };
    } catch (error) {
      console.error('[CourseTemplateService] Error getting round stats:', error);
      return null;
    }
  }

  // ===== Mock 데이터 메서드들 =====

  private static getMockRounds(filter?: any): CourseRound[] {
    const mockRounds: CourseRound[] = [
      {
        id: 'round-001',
        template_id: 'bs-basic',
        round_number: 3,
        title: 'BS Basic 3차',
        instructor_id: 'instructor-001',
        instructor_name: '김영업 강사',
        start_date: '2025-01-13',
        end_date: '2025-01-15',
        max_trainees: 20,
        current_trainees: 18,
        location: '본사 교육센터',
        status: 'recruiting',
        sessions: [
          {
            id: 'session-001-01',
            round_id: 'round-001',
            template_curriculum_id: 'bs-basic-day1',
            day_number: 1,
            session_date: '2025-01-13',
            start_time: '09:00',
            end_time: '17:00',
            classroom: '본사 교육센터 A룸',
            status: 'scheduled',
            created_at: '2024-12-15T00:00:00Z',
            updated_at: '2024-12-15T00:00:00Z'
          },
          {
            id: 'session-001-02',
            round_id: 'round-001',
            template_curriculum_id: 'bs-basic-day2',
            day_number: 2,
            session_date: '2025-01-14',
            start_time: '09:00',
            end_time: '17:00',
            classroom: '본사 교육센터 A룸',
            status: 'scheduled',
            created_at: '2024-12-15T00:00:00Z',
            updated_at: '2024-12-15T00:00:00Z'
          },
          {
            id: 'session-001-03',
            round_id: 'round-001',
            template_curriculum_id: 'bs-basic-day3',
            day_number: 3,
            session_date: '2025-01-15',
            start_time: '09:00',
            end_time: '17:00',
            classroom: '본사 교육센터 A룸',
            status: 'scheduled',
            created_at: '2024-12-15T00:00:00Z',
            updated_at: '2024-12-15T00:00:00Z'
          }
        ],
        created_at: '2024-12-15T00:00:00Z',
        updated_at: '2024-12-15T00:00:00Z'
      },
      {
        id: 'round-002',
        template_id: 'bs-advanced',
        round_number: 2,
        title: 'BS Advanced 2차',
        instructor_id: 'instructor-002',
        instructor_name: '이전략 강사',
        start_date: '2025-01-20',
        end_date: '2025-01-24',
        max_trainees: 15,
        current_trainees: 12,
        location: '분당 교육장',
        status: 'in_progress',
        sessions: [
          {
            id: 'session-002-01',
            round_id: 'round-002',
            template_curriculum_id: 'bs-advanced-day1',
            day_number: 1,
            session_date: '2025-01-20',
            start_time: '09:00',
            end_time: '17:00',
            classroom: '분당 교육장 B룸',
            status: 'completed',
            attendance_count: 12,
            notes: '전략적 영업 기획 완료. 실습 참여도 높음.',
            created_at: '2024-12-10T00:00:00Z',
            updated_at: '2024-12-10T00:00:00Z'
          },
          {
            id: 'session-002-02',
            round_id: 'round-002',
            template_curriculum_id: 'bs-advanced-day2',
            day_number: 2,
            session_date: '2025-01-21',
            start_time: '09:00',
            end_time: '17:00',
            classroom: '분당 교육장 B룸',
            status: 'completed',
            attendance_count: 11,
            notes: '고급 협상 기법 실습. 1명 개인사정으로 불참.',
            created_at: '2024-12-10T00:00:00Z',
            updated_at: '2024-12-10T00:00:00Z'
          },
          {
            id: 'session-002-03',
            round_id: 'round-002',
            template_curriculum_id: 'bs-advanced-day3',
            day_number: 3,
            session_date: '2025-01-22',
            start_time: '09:00',
            end_time: '17:00',
            classroom: '분당 교육장 B룸',
            status: 'in_progress',
            attendance_count: 12,
            created_at: '2024-12-10T00:00:00Z',
            updated_at: '2024-12-10T00:00:00Z'
          },
          {
            id: 'session-002-04',
            round_id: 'round-002',
            template_curriculum_id: 'bs-advanced-day4',
            day_number: 4,
            session_date: '2025-01-23',
            start_time: '09:00',
            end_time: '17:00',
            classroom: '분당 교육장 B룸',
            status: 'scheduled',
            created_at: '2024-12-10T00:00:00Z',
            updated_at: '2024-12-10T00:00:00Z'
          },
          {
            id: 'session-002-05',
            round_id: 'round-002',
            template_curriculum_id: 'bs-advanced-day5',
            day_number: 5,
            session_date: '2025-01-24',
            start_time: '09:00',
            end_time: '17:00',
            classroom: '분당 교육장 B룸',
            status: 'scheduled',
            created_at: '2024-12-10T00:00:00Z',
            updated_at: '2024-12-10T00:00:00Z'
          }
        ],
        created_at: '2024-12-10T00:00:00Z',
        updated_at: '2024-12-10T00:00:00Z'
      },
      {
        id: 'round-003',
        template_id: 'bs-basic',
        round_number: 4,
        title: 'BS Basic 4차',
        instructor_id: 'instructor-001',
        instructor_name: '김영업 강사',
        start_date: '2025-02-03',
        end_date: '2025-02-05',
        max_trainees: 20,
        current_trainees: 0,
        location: '본사 교육센터',
        status: 'planning',
        sessions: [
          {
            id: 'session-003-01',
            round_id: 'round-003',
            template_curriculum_id: 'bs-basic-day1',
            day_number: 1,
            session_date: '2025-02-03',
            start_time: '09:00',
            end_time: '17:00',
            classroom: '본사 교육센터 A룸',
            status: 'scheduled',
            created_at: '2024-12-20T00:00:00Z',
            updated_at: '2024-12-20T00:00:00Z'
          },
          {
            id: 'session-003-02',
            round_id: 'round-003',
            template_curriculum_id: 'bs-basic-day2',
            day_number: 2,
            session_date: '2025-02-04',
            start_time: '09:00',
            end_time: '17:00',
            classroom: '본사 교육센터 A룸',
            status: 'scheduled',
            created_at: '2024-12-20T00:00:00Z',
            updated_at: '2024-12-20T00:00:00Z'
          },
          {
            id: 'session-003-03',
            round_id: 'round-003',
            template_curriculum_id: 'bs-basic-day3',
            day_number: 3,
            session_date: '2025-02-05',
            start_time: '09:00',
            end_time: '17:00',
            classroom: '본사 교육센터 A룸',
            status: 'scheduled',
            created_at: '2024-12-20T00:00:00Z',
            updated_at: '2024-12-20T00:00:00Z'
          }
        ],
        created_at: '2024-12-20T00:00:00Z',
        updated_at: '2024-12-20T00:00:00Z'
      }
    ];

    if (filter?.template_id) {
      return mockRounds.filter(r => r.template_id === filter.template_id);
    }
    if (filter?.status) {
      return mockRounds.filter(r => r.status === filter.status);
    }

    return mockRounds;
  }

  private static getMockSessions(roundId: string): CourseSession[] {
    return [
      {
        id: 'session-001',
        round_id: roundId,
        template_curriculum_id: 'bs-basic-day1',
        day_number: 1,
        session_date: '2025-01-13',
        start_time: '09:00',
        end_time: '18:00',
        classroom: '교육실 A',
        status: 'scheduled',
        created_at: '2024-12-15T00:00:00Z',
        updated_at: '2024-12-15T00:00:00Z'
      },
      {
        id: 'session-002',
        round_id: roundId,
        template_curriculum_id: 'bs-basic-day2',
        day_number: 2,
        session_date: '2025-01-14',
        start_time: '09:00',
        end_time: '18:00',
        classroom: '교육실 A',
        status: 'scheduled',
        created_at: '2024-12-15T00:00:00Z',
        updated_at: '2024-12-15T00:00:00Z'
      }
    ];
  }

  private static getMockSummary(): BSCourseSummary[] {
    return [
      {
        template_name: 'BS Basic',
        active_rounds: 2,
        total_trainees: 35,
        this_month_sessions: 8,
        upcoming_sessions: [],
        completion_stats: {
          completed_rounds: 12,
          total_graduates: 240,
          average_satisfaction: 4.7
        }
      },
      {
        template_name: 'BS Advanced',
        active_rounds: 1,
        total_trainees: 12,
        this_month_sessions: 3,
        upcoming_sessions: [],
        completion_stats: {
          completed_rounds: 5,
          total_graduates: 85,
          average_satisfaction: 4.9
        }
      }
    ];
  }

  // =============================================
  // 차수 수강생 관리 Functions
  // =============================================

  /**
   * 차수 수강생 목록 조회
   */
  static async getRoundEnrollments(roundId: string) {
    try {
      const { data, error } = await supabase
        .from('round_enrollments')
        .select(`
          *,
          trainee:users!trainee_id (
            id,
            name,
            email,
            department,
            employee_id
          )
        `)
        .eq('round_id', roundId)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('[CourseTemplateService] Supabase error fetching enrollments:', {
          message: error.message,
          code: error.code,
          details: error.details
        });

        // 테이블이 없는 경우 빈 배열 반환
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('[CourseTemplateService] round_enrollments table not found, returning empty array');
          return [];
        }

        throw error;
      }

      // 데이터 변환
      return (data || []).map((enrollment: any) => ({
        id: enrollment.id,
        round_id: enrollment.round_id,
        trainee_id: enrollment.trainee_id,
        trainee_name: enrollment.trainee?.name || 'Unknown',
        trainee_email: enrollment.trainee?.email || 'Unknown',
        trainee_department: enrollment.trainee?.department,
        trainee_employee_id: enrollment.trainee?.employee_id,
        enrolled_at: enrollment.enrolled_at,
        status: enrollment.status,
        completion_date: enrollment.completion_date,
        final_score: enrollment.final_score,
        notes: enrollment.notes,
        created_at: enrollment.created_at,
        updated_at: enrollment.updated_at
      }));
    } catch (error: any) {
      console.error('[CourseTemplateService] Error fetching round enrollments:', {
        message: error?.message,
        error
      });
      return [];
    }
  }

  /**
   * 차수에 수강생 추가
   */
  static async addRoundTrainees(roundId: string, traineeIds: string[]) {
    try {
      // 차수 정보 조회
      const allRounds = await this.getRounds({});
      const round = allRounds.find(r => r.id === roundId);
      if (!round) {
        throw new Error('차수를 찾을 수 없습니다.');
      }

      // 정원 확인
      const availableSpots = round.max_trainees - round.current_trainees;
      if (traineeIds.length > availableSpots) {
        throw new Error(`정원이 ${availableSpots}명 남았습니다. ${traineeIds.length - availableSpots}명 초과입니다.`);
      }

      // 이미 등록된 수강생 확인
      const existingEnrollments = await this.getRoundEnrollments(roundId);
      const existingTraineeIds = existingEnrollments.map(e => e.trainee_id);
      const duplicates = traineeIds.filter(id => existingTraineeIds.includes(id));

      if (duplicates.length > 0) {
        throw new Error('이미 등록된 수강생이 있습니다.');
      }

      // 수강생 등록
      const enrollments = traineeIds.map(traineeId => ({
        round_id: roundId,
        trainee_id: traineeId,
        status: 'active' as const,
        enrolled_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('round_enrollments')
        .insert(enrollments)
        .select();

      if (error) {
        console.error('[CourseTemplateService] Supabase error adding trainees:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('[CourseTemplateService] Error adding round trainees:', {
        message: error?.message,
        error
      });
      throw error;
    }
  }

  /**
   * 차수 수강생 등록 해제
   */
  static async removeRoundTrainee(enrollmentId: string) {
    try {
      const { error } = await supabase
        .from('round_enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('[CourseTemplateService] Error removing round trainee:', error);
      throw error;
    }
  }

  /**
   * 차수 수강생 상태 업데이트
   */
  static async updateRoundEnrollment(
    enrollmentId: string,
    updates: {
      status?: 'active' | 'completed' | 'dropped';
      completion_date?: string;
      final_score?: number;
      notes?: string;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('round_enrollments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('[CourseTemplateService] Error updating round enrollment:', error);
      throw error;
    }
  }
}

// 기본 export 추가
export const courseTemplateService = {
  getAll: () => CourseTemplateService.getTemplates(),
  getById: (id: string) => CourseTemplateService.getTemplateById(id),
  create: (data: any) => CourseTemplateService.createTemplate(data),
  update: (id: string, data: any) => CourseTemplateService.updateTemplate(id, data),
  delete: (id: string) => CourseTemplateService.deleteTemplate(id),
  getRounds: (filter?: any) => CourseTemplateService.getRounds(filter),
  getRoundEnrollments: (roundId: string) => CourseTemplateService.getRoundEnrollments(roundId),
};