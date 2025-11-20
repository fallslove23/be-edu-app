/**
 * =================================================
 * 템플릿 커리큘럼 서비스
 * =================================================
 * 설명: 과정 템플릿의 표준 커리큘럼 관리
 * 작성일: 2025-01-20
 * =================================================
 */

import { supabase } from './supabase';
import type {
  TemplateCurriculum,
  CreateTemplateCurriculumRequest
} from '../types/unified-course.types';

export class TemplateCurriculumService {
  /**
   * 템플릿의 전체 커리큘럼 조회
   */
  static async getByTemplateId(templateId: string): Promise<TemplateCurriculum[]> {
    try {
      console.log('[TemplateCurriculumService] Fetching curriculum for template:', templateId);

      const { data, error } = await supabase
        .from('template_curriculum')
        .select('*')
        .eq('template_id', templateId)
        .order('day', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) {
        console.error('[TemplateCurriculumService] Error fetching curriculum:', error);
        throw error;
      }

      console.log(`[TemplateCurriculumService] Found ${data?.length || 0} curriculum items`);
      return data || [];
    } catch (error: any) {
      console.error('[TemplateCurriculumService] Error:', error);
      throw error;
    }
  }

  /**
   * 템플릿 커리큘럼 항목 생성
   */
  static async create(
    templateId: string,
    curriculumItem: CreateTemplateCurriculumRequest
  ): Promise<TemplateCurriculum> {
    try {
      console.log('[TemplateCurriculumService] Creating curriculum item:', curriculumItem);

      const { data, error } = await supabase
        .from('template_curriculum')
        .insert({
          template_id: templateId,
          day: curriculumItem.day,
          order_index: curriculumItem.order_index,
          subject: curriculumItem.subject,
          subject_type: curriculumItem.subject_type,
          description: curriculumItem.description,
          duration_hours: curriculumItem.duration_hours,
          recommended_start_time: curriculumItem.recommended_start_time,
          learning_objectives: curriculumItem.learning_objectives,
          topics: curriculumItem.topics
        })
        .select()
        .single();

      if (error) {
        console.error('[TemplateCurriculumService] Error creating curriculum:', error);
        throw error;
      }

      console.log('[TemplateCurriculumService] Curriculum item created:', data);
      return data;
    } catch (error: any) {
      console.error('[TemplateCurriculumService] Error:', error);
      throw error;
    }
  }

  /**
   * 템플릿 커리큘럼 일괄 생성
   */
  static async createBatch(
    templateId: string,
    curriculumItems: CreateTemplateCurriculumRequest[]
  ): Promise<TemplateCurriculum[]> {
    try {
      console.log(`[TemplateCurriculumService] Creating ${curriculumItems.length} curriculum items`);

      const itemsToInsert = curriculumItems.map(item => ({
        template_id: templateId,
        day: item.day,
        order_index: item.order_index,
        subject: item.subject,
        subject_type: item.subject_type,
        description: item.description,
        duration_hours: item.duration_hours,
        recommended_start_time: item.recommended_start_time,
        learning_objectives: item.learning_objectives,
        topics: item.topics
      }));

      const { data, error } = await supabase
        .from('template_curriculum')
        .insert(itemsToInsert)
        .select();

      if (error) {
        console.error('[TemplateCurriculumService] Error creating batch:', error);
        throw error;
      }

      console.log(`[TemplateCurriculumService] Created ${data?.length || 0} curriculum items`);
      return data || [];
    } catch (error: any) {
      console.error('[TemplateCurriculumService] Error:', error);
      throw error;
    }
  }

  /**
   * 템플릿 커리큘럼 항목 수정
   */
  static async update(
    curriculumId: string,
    updates: Partial<TemplateCurriculum>
  ): Promise<TemplateCurriculum> {
    try {
      console.log('[TemplateCurriculumService] Updating curriculum:', curriculumId);

      const { data, error } = await supabase
        .from('template_curriculum')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', curriculumId)
        .select()
        .single();

      if (error) {
        console.error('[TemplateCurriculumService] Error updating curriculum:', error);
        throw error;
      }

      console.log('[TemplateCurriculumService] Curriculum updated:', data);
      return data;
    } catch (error: any) {
      console.error('[TemplateCurriculumService] Error:', error);
      throw error;
    }
  }

  /**
   * 템플릿 커리큘럼 항목 삭제
   */
  static async delete(curriculumId: string): Promise<void> {
    try {
      console.log('[TemplateCurriculumService] Deleting curriculum:', curriculumId);

      const { error } = await supabase
        .from('template_curriculum')
        .delete()
        .eq('id', curriculumId);

      if (error) {
        console.error('[TemplateCurriculumService] Error deleting curriculum:', error);
        throw error;
      }

      console.log('[TemplateCurriculumService] Curriculum deleted');
    } catch (error: any) {
      console.error('[TemplateCurriculumService] Error:', error);
      throw error;
    }
  }

  /**
   * 템플릿의 전체 커리큘럼 삭제 (템플릿 수정 시 재생성용)
   */
  static async deleteByTemplateId(templateId: string): Promise<void> {
    try {
      console.log('[TemplateCurriculumService] Deleting all curriculum for template:', templateId);

      const { error } = await supabase
        .from('template_curriculum')
        .delete()
        .eq('template_id', templateId);

      if (error) {
        console.error('[TemplateCurriculumService] Error deleting curriculum:', error);
        throw error;
      }

      console.log('[TemplateCurriculumService] All curriculum deleted');
    } catch (error: any) {
      console.error('[TemplateCurriculumService] Error:', error);
      throw error;
    }
  }

  /**
   * 템플릿 커리큘럼 통계
   */
  static async getStatistics(templateId: string): Promise<{
    totalItems: number;
    totalDays: number;
    totalHours: number;
    subjectTypes: Record<string, number>;
  }> {
    try {
      const curriculum = await this.getByTemplateId(templateId);

      const totalDays = Math.max(...curriculum.map(c => c.day), 0);
      const totalHours = curriculum.reduce((sum, c) => sum + c.duration_hours, 0);

      const subjectTypes: Record<string, number> = {};
      curriculum.forEach(c => {
        subjectTypes[c.subject_type] = (subjectTypes[c.subject_type] || 0) + 1;
      });

      return {
        totalItems: curriculum.length,
        totalDays,
        totalHours,
        subjectTypes
      };
    } catch (error: any) {
      console.error('[TemplateCurriculumService] Error getting statistics:', error);
      throw error;
    }
  }
}
