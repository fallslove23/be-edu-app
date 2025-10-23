import { supabase } from './supabase';
import type {
  CourseTemplate,
  TemplateCurriculum,
  CourseRound,
  CourseSession,
  CourseEnrollment,
  RoundStats,
  BSCourseSummary,
  DEFAULT_COURSE_TEMPLATES
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
        .select('*')
        .eq('is_active', true)
        .order('category');

      if (error) {
        console.log('[CourseTemplateService] Supabase error, using default templates:', error);
        return DEFAULT_COURSE_TEMPLATES;
      }

      return data || DEFAULT_COURSE_TEMPLATES;
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
      const { data, error } = await supabase
        .from('course_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        console.log('[CourseTemplateService] Template update failed, using default');
        // 기본 템플릿에서 찾아서 업데이트된 내용으로 반환
        const defaultTemplate = DEFAULT_COURSE_TEMPLATES.find(t => t.id === templateId);
        if (defaultTemplate) {
          return { ...defaultTemplate, ...updates };
        }
        throw new Error('Template not found');
      }

      return data;
    } catch (error) {
      console.error('[CourseTemplateService] Error updating template:', error);
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
    updates: Partial<Pick<CourseRound, 'instructor_id' | 'start_date' | 'end_date' | 'max_trainees' | 'location' | 'status'>>
  ): Promise<CourseRound> {
    try {
      const { data, error } = await supabase
        .from('course_rounds')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', roundId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[CourseTemplateService] Error updating round:', error);
      throw error;
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
          const rounds = await this.getRounds({ 
            template_id: template.id, 
            status: 'in_progress' 
          });
          
          const totalTrainees = rounds.reduce((sum, round) => sum + round.current_trainees, 0);
          
          return {
            template_name: template.name,
            active_rounds: rounds.length,
            total_trainees: totalTrainees,
            this_month_sessions: 5, // TODO: 실제 계산
            upcoming_sessions: [], // TODO: 실제 데이터
            completion_stats: {
              completed_rounds: 8, // TODO: 실제 계산
              total_graduates: 156, // TODO: 실제 계산
              average_satisfaction: 4.8
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
}