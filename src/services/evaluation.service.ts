/**
 * 종합 평가 시스템 서비스
 * - 평가 템플릿, 구성 요소, 세부 항목 관리
 * - 강사 평가 입력 및 조회
 * - 최종 성적 계산 및 집계
 */

import { supabase } from './supabase';
import type {
  EvaluationTemplate,
  EvaluationTemplateCreate,
  EvaluationTemplateUpdate,
  EvaluationTemplateWithComponents,
  EvaluationComponent,
  EvaluationComponentCreate,
  EvaluationComponentUpdate,
  EvaluationSubItem,
  EvaluationSubItemCreate,
  EvaluationSubItemUpdate,
  InstructorEvaluation,
  InstructorEvaluationCreate,
  InstructorEvaluationUpdate,
  InstructorEvaluationWithComponent,
  ComprehensiveGrade,
  ComprehensiveGradeCreate,
  ComprehensiveGradeUpdate,
  ComprehensiveGradeWithTrainee,
  EvaluationHistory,
  EvaluationHistoryCreate,
  EvaluationStatistics,
  ComponentScore,
} from '../types/evaluation.types';

// ========================================
// 1. 평가 템플릿 관리
// ========================================

export const evaluationTemplateService = {
  /**
   * 모든 평가 템플릿 조회
   */
  async getAll(): Promise<EvaluationTemplate[]> {
    const { data, error } = await supabase
      .from('evaluation_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * 특정 과정 템플릿의 평가 템플릿 조회
   */
  async getByCourseTemplateId(courseTemplateId: string): Promise<EvaluationTemplate[]> {
    const { data, error } = await supabase
      .from('evaluation_templates')
      .select('*')
      .eq('course_template_id', courseTemplateId)
      .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * ID로 평가 템플릿 조회
   */
  async getById(id: string): Promise<EvaluationTemplate | null> {
    const { data, error } = await supabase
      .from('evaluation_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 구성 요소와 세부 항목을 포함한 전체 템플릿 조회
   */
  async getWithComponents(id: string): Promise<EvaluationTemplateWithComponents | null> {
    const { data: template, error: templateError } = await supabase
      .from('evaluation_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError) throw templateError;
    if (!template) return null;

    const { data: components, error: componentsError } = await supabase
      .from('evaluation_components')
      .select('*')
      .eq('template_id', id)
      .order('order_index', { ascending: true });

    if (componentsError) throw componentsError;

    const componentsWithSubItems = await Promise.all(
      (components || []).map(async (component) => {
        const { data: subItems, error: subItemsError } = await supabase
          .from('evaluation_sub_items')
          .select('*')
          .eq('component_id', component.id)
          .order('order_index', { ascending: true });

        if (subItemsError) throw subItemsError;

        return {
          ...component,
          sub_items: subItems || [],
        };
      })
    );

    return {
      ...template,
      components: componentsWithSubItems,
    };
  },

  /**
   * 평가 템플릿 생성
   */
  async create(data: EvaluationTemplateCreate): Promise<EvaluationTemplate> {
    const { data: created, error } = await supabase
      .from('evaluation_templates')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created;
  },

  /**
   * 평가 템플릿 수정
   */
  async update(id: string, data: EvaluationTemplateUpdate): Promise<EvaluationTemplate> {
    const { data: updated, error } = await supabase
      .from('evaluation_templates')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * 평가 템플릿 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('evaluation_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ========================================
// 2. 평가 구성 요소 관리
// ========================================

export const evaluationComponentService = {
  /**
   * 템플릿의 모든 구성 요소 조회
   */
  async getByTemplateId(templateId: string): Promise<EvaluationComponent[]> {
    const { data, error } = await supabase
      .from('evaluation_components')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * ID로 구성 요소 조회
   */
  async getById(id: string): Promise<EvaluationComponent | null> {
    const { data, error } = await supabase
      .from('evaluation_components')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 구성 요소 생성
   */
  async create(data: EvaluationComponentCreate): Promise<EvaluationComponent> {
    const { data: created, error } = await supabase
      .from('evaluation_components')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created;
  },

  /**
   * 구성 요소 수정
   */
  async update(id: string, data: EvaluationComponentUpdate): Promise<EvaluationComponent> {
    const { data: updated, error } = await supabase
      .from('evaluation_components')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * 구성 요소 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('evaluation_components')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ========================================
// 3. 세부 평가 항목 관리
// ========================================

export const evaluationSubItemService = {
  /**
   * 구성 요소의 모든 세부 항목 조회
   */
  async getByComponentId(componentId: string): Promise<EvaluationSubItem[]> {
    const { data, error } = await supabase
      .from('evaluation_sub_items')
      .select('*')
      .eq('component_id', componentId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * ID로 세부 항목 조회
   */
  async getById(id: string): Promise<EvaluationSubItem | null> {
    const { data, error } = await supabase
      .from('evaluation_sub_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 세부 항목 생성
   */
  async create(data: EvaluationSubItemCreate): Promise<EvaluationSubItem> {
    const { data: created, error } = await supabase
      .from('evaluation_sub_items')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created;
  },

  /**
   * 세부 항목 수정
   */
  async update(id: string, data: EvaluationSubItemUpdate): Promise<EvaluationSubItem> {
    const { data: updated, error } = await supabase
      .from('evaluation_sub_items')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * 세부 항목 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('evaluation_sub_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * 여러 세부 항목 일괄 생성
   */
  async createBulk(items: EvaluationSubItemCreate[]): Promise<EvaluationSubItem[]> {
    const { data, error } = await supabase
      .from('evaluation_sub_items')
      .insert(items)
      .select();

    if (error) throw error;
    return data || [];
  },
};

// ========================================
// 4. 강사 평가 관리
// ========================================

export const instructorEvaluationService = {
  /**
   * 특정 과정 회차의 모든 강사 평가 조회
   */
  async getByCourseRoundId(courseRoundId: string): Promise<InstructorEvaluation[]> {
    const { data, error } = await supabase
      .from('instructor_evaluations')
      .select('*')
      .eq('course_round_id', courseRoundId)
      .order('evaluated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * 특정 학생의 강사 평가 조회
   */
  async getByTraineeId(courseRoundId: string, traineeId: string): Promise<InstructorEvaluation[]> {
    const { data, error } = await supabase
      .from('instructor_evaluations')
      .select('*')
      .eq('course_round_id', courseRoundId)
      .eq('trainee_id', traineeId)
      .order('evaluated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * 구성 요소 정보를 포함한 강사 평가 조회
   */
  async getWithComponent(
    courseRoundId: string,
    traineeId: string
  ): Promise<InstructorEvaluationWithComponent[]> {
    const { data, error } = await supabase
      .from('instructor_evaluations')
      .select('*, evaluation_components(*)')
      .eq('course_round_id', courseRoundId)
      .eq('trainee_id', traineeId);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      component: item.evaluation_components,
      evaluation_components: undefined,
    }));
  },

  /**
   * 강사 평가 생성/수정 (UPSERT)
   */
  async upsert(data: InstructorEvaluationCreate): Promise<InstructorEvaluation> {
    const { data: result, error } = await supabase
      .from('instructor_evaluations')
      .upsert(data, {
        onConflict: 'course_round_id,trainee_id,component_id,instructor_id',
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  /**
   * 강사 평가 수정
   */
  async update(id: string, data: InstructorEvaluationUpdate): Promise<InstructorEvaluation> {
    const { data: updated, error } = await supabase
      .from('instructor_evaluations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * 강사 평가 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('instructor_evaluations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ========================================
// 5. 최종 종합 성적 관리
// ========================================

export const comprehensiveGradeService = {
  /**
   * 특정 과정 회차의 모든 종합 성적 조회
   */
  async getByCourseRoundId(courseRoundId: string): Promise<ComprehensiveGrade[]> {
    const { data, error } = await supabase
      .from('comprehensive_grades')
      .select('*')
      .eq('course_round_id', courseRoundId)
      .order('rank', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * 학생 정보를 포함한 종합 성적 조회
   */
  async getWithTrainees(courseRoundId: string): Promise<ComprehensiveGradeWithTrainee[]> {
    const { data, error } = await supabase
      .from('comprehensive_grades')
      .select(
        `
        *,
        trainee:users!trainee_id(id, name, email)
      `
      )
      .eq('course_round_id', courseRoundId)
      .order('rank', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      trainee: item.trainee,
    }));
  },

  /**
   * 특정 학생의 종합 성적 조회
   */
  async getByTraineeId(courseRoundId: string, traineeId: string): Promise<ComprehensiveGrade | null> {
    const { data, error } = await supabase
      .from('comprehensive_grades')
      .select('*')
      .eq('course_round_id', courseRoundId)
      .eq('trainee_id', traineeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  /**
   * 종합 성적 계산 및 저장
   */
  async calculate(courseRoundId: string, traineeId: string, templateId: string): Promise<ComprehensiveGrade> {
    // 1. 평가 템플릿 조회
    const template = await evaluationTemplateService.getWithComponents(templateId);
    if (!template) throw new Error('평가 템플릿을 찾을 수 없습니다.');

    // 2. 각 구성 요소별 점수 계산
    const componentScores: ComponentScore[] = await Promise.all(
      template.components.map(async (component) => {
        let rawScore = 0;
        let breakdown: Record<string, any> = {};

        if (component.evaluation_type === 'instructor_manual') {
          // 강사 평가 집계
          const instructorEvals = await instructorEvaluationService.getByTraineeId(
            courseRoundId,
            traineeId
          );

          const componentEvals = instructorEvals.filter((e) => e.component_id === component.id);

          if (componentEvals.length > 0) {
            // 가중 평균 계산
            const totalWeight = componentEvals.reduce((sum, e) => sum + e.weight_percentage, 0);
            const weightedSum = componentEvals.reduce((sum, e) => {
              const normalizedScore = (e.total_score / e.max_possible_score) * 100;
              return sum + normalizedScore * e.weight_percentage;
            }, 0);

            rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

            breakdown = componentEvals.reduce((acc, e) => {
              acc[e.instructor_name] = {
                score: e.total_score,
                max: e.max_possible_score,
                normalized: (e.total_score / e.max_possible_score) * 100,
                weight: e.weight_percentage,
              };
              return acc;
            }, {} as Record<string, any>);
          }
        } else if (component.evaluation_type === 'exam_auto') {
          // TODO: 시험 점수 집계 (기존 exam_attempts 테이블 참조)
          // 임시로 0점 처리
          rawScore = 0;
          breakdown = { note: '시험 점수 집계 미구현' };
        } else if (component.evaluation_type === 'activity_auto') {
          // TODO: 활동 점수 집계
          // 임시로 0점 처리
          rawScore = 0;
          breakdown = { note: '활동 점수 집계 미구현' };
        }

        const weightedScore = (rawScore * component.weight_percentage) / 100;

        return {
          component_id: component.id,
          name: component.name,
          code: component.code,
          weight: component.weight_percentage,
          raw_score: rawScore,
          weighted_score: weightedScore,
          breakdown,
        };
      })
    );

    // 3. 최종 점수 계산
    const totalWeightedScore = componentScores.reduce((sum, c) => sum + c.weighted_score, 0);
    const isPassed = totalWeightedScore >= template.passing_total_score;

    // 4. 종합 성적 저장
    const gradeData: ComprehensiveGradeCreate = {
      course_round_id: courseRoundId,
      trainee_id: traineeId,
      template_id: templateId,
      component_scores: componentScores,
      total_score: totalWeightedScore,
      total_weighted_score: totalWeightedScore,
      passing_score: template.passing_total_score,
      is_passed: isPassed,
      calculation_method: 'auto',
    };

    return await this.upsert(gradeData);
  },

  /**
   * 종합 성적 생성/수정 (UPSERT)
   */
  async upsert(data: ComprehensiveGradeCreate): Promise<ComprehensiveGrade> {
    // 기존 성적 조회 (히스토리 기록용)
    const existing = await this.getByTraineeId(data.course_round_id, data.trainee_id);

    const { data: result, error } = await supabase
      .from('comprehensive_grades')
      .upsert(data, {
        onConflict: 'course_round_id,trainee_id',
      })
      .select()
      .single();

    if (error) throw error;

    // 히스토리 기록 (점수가 변경된 경우)
    if (existing && existing.total_score !== data.total_score) {
      await evaluationHistoryService.create({
        grade_id: result.id,
        old_score: existing.total_score,
        new_score: data.total_score,
        old_passed: existing.is_passed,
        new_passed: data.is_passed,
        change_reason: data.override_reason || '자동 재계산',
      });
    }

    return result;
  },

  /**
   * 종합 성적 수정
   */
  async update(id: string, data: ComprehensiveGradeUpdate): Promise<ComprehensiveGrade> {
    const { data: updated, error } = await supabase
      .from('comprehensive_grades')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * 등수 업데이트
   */
  async updateRanks(courseRoundId: string): Promise<void> {
    const grades = await this.getByCourseRoundId(courseRoundId);

    // 점수순으로 정렬
    const sorted = grades.sort((a, b) => b.total_score - a.total_score);

    // 등수 업데이트
    await Promise.all(
      sorted.map((grade, index) =>
        this.update(grade.id, {
          rank: index + 1,
          total_trainees: sorted.length,
        })
      )
    );
  },

  /**
   * 평가 통계 조회
   */
  async getStatistics(courseRoundId: string): Promise<EvaluationStatistics> {
    const grades = await this.getByCourseRoundId(courseRoundId);

    const totalTrainees = grades.length;
    const evaluatedCount = grades.filter((g) => g.calculated_at).length;
    const pendingCount = totalTrainees - evaluatedCount;
    const passedCount = grades.filter((g) => g.is_passed).length;
    const failedCount = grades.filter((g) => !g.is_passed).length;

    const scores = grades.map((g) => g.total_score);
    const averageScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    return {
      course_round_id: courseRoundId,
      total_trainees: totalTrainees,
      evaluated_count: evaluatedCount,
      pending_count: pendingCount,
      passed_count: passedCount,
      failed_count: failedCount,
      average_score: averageScore,
      highest_score: highestScore,
      lowest_score: lowestScore,
    };
  },
};

// ========================================
// 6. 평가 히스토리 관리
// ========================================

export const evaluationHistoryService = {
  /**
   * 특정 성적의 히스토리 조회
   */
  async getByGradeId(gradeId: string): Promise<EvaluationHistory[]> {
    const { data, error } = await supabase
      .from('evaluation_history')
      .select('*')
      .eq('grade_id', gradeId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * 히스토리 생성
   */
  async create(data: EvaluationHistoryCreate): Promise<EvaluationHistory> {
    const { data: created, error } = await supabase
      .from('evaluation_history')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created;
  },
};
