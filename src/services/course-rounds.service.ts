/**
 * 과정 차수 관리 서비스
 */

import { supabase } from './supabase';

export interface CourseTemplate {
  id: string;
  name: string;
  code: string;
  category_id?: string;
  description?: string;
  duration_days?: number;
  created_at: string;
  updated_at: string;
}

export interface CourseRound {
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
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseRoundWithTemplate extends CourseRound {
  template?: CourseTemplate;
}

export interface CreateCourseRoundData {
  template_id: string;
  round_number: number;
  title: string;
  instructor_id: string | null;
  instructor_name: string;
  manager_id?: string | null;
  manager_name?: string | null;
  start_date: string;
  end_date: string;
  max_trainees: number;
  location: string;
  status?: 'planning' | 'recruiting' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
}

export interface UpdateCourseRoundData {
  title?: string;
  instructor_id?: string | null;
  instructor_name?: string;
  manager_id?: string | null;
  manager_name?: string | null;
  start_date?: string;
  end_date?: string;
  max_trainees?: number;
  current_trainees?: number;
  location?: string;
  status?: 'planning' | 'recruiting' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
}

export class CourseRoundsService {
  /**
   * 모든 과정 차수 조회
   */
  static async getAll(): Promise<CourseRoundWithTemplate[]> {
    const { data, error } = await supabase
      .from('course_rounds')
      .select(`
        *,
        template:course_templates(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('과정 차수 조회 실패:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * ID로 과정 차수 조회
   */
  static async getById(id: string): Promise<CourseRoundWithTemplate | null> {
    const { data, error } = await supabase
      .from('course_rounds')
      .select(`
        *,
        template:course_templates(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('과정 차수 조회 실패:', error);
      return null;
    }

    return data;
  }

  /**
   * 과정 차수 생성
   */
  static async create(data: CreateCourseRoundData): Promise<CourseRound> {
    const { data: newRound, error } = await supabase
      .from('course_rounds')
      .insert({
        ...data,
        current_trainees: 0,
        status: data.status || 'planning'
      })
      .select()
      .single();

    if (error) {
      console.error('과정 차수 생성 실패:', error);
      throw error;
    }

    return newRound;
  }

  /**
   * 과정 차수 수정
   */
  static async update(id: string, data: UpdateCourseRoundData): Promise<CourseRound> {
    const { data: updatedRound, error } = await supabase
      .from('course_rounds')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('과정 차수 수정 실패:', error);
      throw error;
    }

    return updatedRound;
  }

  /**
   * 과정 차수 삭제
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('course_rounds')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('과정 차수 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿별 차수 목록 조회
   */
  static async getByTemplate(templateId: string): Promise<CourseRoundWithTemplate[]> {
    const { data, error } = await supabase
      .from('course_rounds')
      .select(`
        *,
        template:course_templates(*)
      `)
      .eq('template_id', templateId)
      .order('round_number', { ascending: false });

    if (error) {
      console.error('템플릿별 차수 조회 실패:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 모든 과정 템플릿 조회
   */
  static async getAllTemplates(): Promise<CourseTemplate[]> {
    const { data, error } = await supabase
      .from('course_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('과정 템플릿 조회 실패:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 다음 차수 번호 가져오기
   */
  static async getNextRoundNumber(templateId: string): Promise<number> {
    const { data, error } = await supabase
      .from('course_rounds')
      .select('round_number')
      .eq('template_id', templateId)
      .order('round_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('차수 번호 조회 실패:', error);
      return 1;
    }

    if (!data || data.length === 0) {
      return 1;
    }

    return (data[0].round_number || 0) + 1;
  }
}
