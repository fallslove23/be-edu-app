/**
 * 과목 관리 서비스
 * - 과목 CRUD
 * - 강사-과목 매핑 관리
 */

import { supabase } from './supabase';
import type {
  Subject,
  SubjectCreate,
  SubjectUpdate,
  InstructorSubject,
  InstructorSubjectCreate,
} from '../types/integrated-schedule.types';

export const subjectService = {
  /**
   * 모든 과목 조회
   */
  async getAll(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * 과목 ID로 조회
   */
  async getById(id: string): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 과목 생성
   */
  async create(subject: SubjectCreate): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .insert([subject])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 과목 수정
   */
  async update(id: string, subject: SubjectUpdate): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .update(subject)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 과목 삭제 (소프트 삭제)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('subjects')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * 과목 검색
   */
  async search(query: string): Promise<Subject[]> {
    const { data, error} = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * 카테고리별 과목 조회
   */
  async getByCategory(category: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

export const instructorSubjectService = {
  /**
   * 강사의 과목 조회
   */
  async getByInstructor(instructorId: string): Promise<(InstructorSubject & { subject: Subject })[]> {
    const { data, error } = await supabase
      .from('instructor_subjects')
      .select('*, subject:subjects(*)')
      .eq('instructor_id', instructorId);

    if (error) throw error;
    return data || [];
  },

  /**
   * 과목의 강사 조회
   */
  async getBySubject(subjectId: string): Promise<InstructorSubject[]> {
    const { data, error } = await supabase
      .from('instructor_subjects')
      .select('*')
      .eq('subject_id', subjectId);

    if (error) throw error;
    return data || [];
  },

  /**
   * 강사-과목 매핑 추가
   */
  async assign(mapping: InstructorSubjectCreate): Promise<InstructorSubject> {
    const { data, error } = await supabase
      .from('instructor_subjects')
      .insert([{
        ...mapping,
        proficiency_level: mapping.proficiency_level || 'intermediate'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 강사-과목 매핑 삭제
   */
  async unassign(instructorId: string, subjectId: string): Promise<void> {
    const { error } = await supabase
      .from('instructor_subjects')
      .delete()
      .eq('instructor_id', instructorId)
      .eq('subject_id', subjectId);

    if (error) throw error;
  },

  /**
   * 숙련도 업데이트
   */
  async updateProficiency(
    instructorId: string,
    subjectId: string,
    proficiencyLevel: 'beginner' | 'intermediate' | 'expert'
  ): Promise<InstructorSubject> {
    const { data, error } = await supabase
      .from('instructor_subjects')
      .update({ proficiency_level: proficiencyLevel })
      .eq('instructor_id', instructorId)
      .eq('subject_id', subjectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 강사의 모든 과목 제거
   */
  async removeAllByInstructor(instructorId: string): Promise<void> {
    const { error } = await supabase
      .from('instructor_subjects')
      .delete()
      .eq('instructor_id', instructorId);

    if (error) throw error;
  },

  /**
   * 과목의 모든 강사 제거
   */
  async removeAllBySubject(subjectId: string): Promise<void> {
    const { error } = await supabase
      .from('instructor_subjects')
      .delete()
      .eq('subject_id', subjectId);

    if (error) throw error;
  },
};
