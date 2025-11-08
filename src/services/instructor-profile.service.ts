/**
 * 강사 프로필 서비스
 * - 강사 프로필 CRUD
 * - 강사 검색 및 필터링
 * - 강사 통계 조회
 */

import { supabase } from './supabase';
import type {
  InstructorProfile,
  InstructorProfileCreate,
  InstructorProfileUpdate,
} from '../types/integrated-schedule.types';

export const instructorProfileService = {
  /**
   * 모든 강사 프로필 조회
   */
  async getAll(): Promise<InstructorProfile[]> {
    const { data, error } = await supabase
      .from('instructor_profiles')
      .select(`
        *,
        users!instructor_profiles_user_id_fkey(name, email)
      `)
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * 특정 강사 프로필 조회 (user_id 기준)
   */
  async getByUserId(userId: string): Promise<InstructorProfile | null> {
    const { data, error } = await supabase
      .from('instructor_profiles')
      .select(`
        *,
        users!instructor_profiles_user_id_fkey(name, email)
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  /**
   * 강사 프로필 ID로 조회
   */
  async getById(id: string): Promise<InstructorProfile | null> {
    const { data, error } = await supabase
      .from('instructor_profiles')
      .select(`
        *,
        users!instructor_profiles_user_id_fkey(name, email)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  /**
   * 강사 프로필 생성
   */
  async create(profile: InstructorProfileCreate): Promise<InstructorProfile> {
    const { data, error } = await supabase
      .from('instructor_profiles')
      .insert([profile])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 강사 프로필 수정
   */
  async update(userId: string, updates: InstructorProfileUpdate): Promise<InstructorProfile> {
    const { data, error } = await supabase
      .from('instructor_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 강사 프로필 삭제 (비활성화)
   */
  async deactivate(userId: string): Promise<void> {
    const { error } = await supabase
      .from('instructor_profiles')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * 강사 프로필 활성화
   */
  async activate(userId: string): Promise<void> {
    const { error } = await supabase
      .from('instructor_profiles')
      .update({ is_active: true })
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * 전문 분야로 강사 검색
   */
  async searchBySpecialization(specialization: string): Promise<InstructorProfile[]> {
    const { data, error } = await supabase
      .from('instructor_profiles')
      .select(`
        *,
        users!instructor_profiles_user_id_fkey(name, email)
      `)
      .contains('specializations', [specialization])
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * 계약 유형으로 강사 검색
   */
  async searchByContractType(contractType: 'full-time' | 'part-time' | 'freelance'): Promise<InstructorProfile[]> {
    const { data, error } = await supabase
      .from('instructor_profiles')
      .select(`
        *,
        users!instructor_profiles_user_id_fkey(name, email)
      `)
      .eq('contract_type', contractType)
      .eq('is_active', true)
      .order('rating', { ascending: false});

    if (error) throw error;
    return data || [];
  },

  /**
   * 평점 높은 강사 조회
   */
  async getTopRated(limit: number = 10): Promise<InstructorProfile[]> {
    const { data, error } = await supabase
      .from('instructor_profiles')
      .select(`
        *,
        users!instructor_profiles_user_id_fkey(name, email)
      `)
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * 강사 세션 수 증가
   */
  async incrementSessionCount(userId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_instructor_sessions', {
      p_user_id: userId,
    });

    // RPC 함수가 없으면 직접 업데이트
    if (error) {
      const profile = await this.getByUserId(userId);
      if (profile) {
        await this.update(userId, {
          total_sessions: profile.total_sessions + 1,
        });
      }
    }
  },

  /**
   * 강사 평점 업데이트
   */
  async updateRating(userId: string, newRating: number): Promise<void> {
    const profile = await this.getByUserId(userId);
    if (!profile) throw new Error('Instructor profile not found');

    // 평점 평균 계산 (기존 평점 + 새 평점) / 2
    const updatedRating = (profile.rating * profile.total_sessions + newRating) / (profile.total_sessions + 1);

    await this.update(userId, {
      rating: Math.round(updatedRating * 100) / 100, // 소수점 2자리
    });
  },

  /**
   * 강사 통계 조회
   */
  async getStatistics(): Promise<{
    total_instructors: number;
    active_instructors: number;
    average_rating: number;
    total_sessions: number;
    by_contract_type: Record<string, number>;
  }> {
    const { data: profiles, error } = await supabase
      .from('instructor_profiles')
      .select('*');

    if (error) throw error;

    const activeProfiles = profiles.filter(p => p.is_active);

    const byContractType = profiles.reduce((acc, profile) => {
      if (profile.contract_type) {
        acc[profile.contract_type] = (acc[profile.contract_type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total_instructors: profiles.length,
      active_instructors: activeProfiles.length,
      average_rating: activeProfiles.reduce((sum, p) => sum + p.rating, 0) / (activeProfiles.length || 1),
      total_sessions: profiles.reduce((sum, p) => sum + p.total_sessions, 0),
      by_contract_type: byContractType,
    };
  },
};
