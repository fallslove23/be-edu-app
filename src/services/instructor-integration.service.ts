/**
 * =================================================
 * 강사-사용자 통합 서비스
 * =================================================
 * 설명: users 테이블의 role='instructor'와 instructors 테이블 자동 동기화
 * 작성일: 2025-01-24
 * =================================================
 */

import { supabase } from './supabase';
import { InstructorService } from './instructor.service';
import type { Instructor } from '../types/instructor.types';

export interface InstructorUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  specializations?: string[];
  years_of_experience: number;
  education_level?: string;
  is_active: boolean;
  has_instructor_profile: boolean; // instructors 테이블에 프로필 있는지
  profile_image_url?: string;
  bio?: string;
}

export class InstructorIntegrationService {
  /**
   * 통합 강사 목록 조회
   * users (role=instructor) + instructors 테이블 통합
   */
  static async getAllInstructors(activeOnly: boolean = false): Promise<InstructorUser[]> {
    try {
      console.log('[InstructorIntegration] Fetching all instructors (users + profiles)');

      // 1. users 테이블에서 role='instructor'인 사용자 조회
      let userQuery = supabase
        .from('users')
        .select('id, name, email, phone, department, position, role, status')
        .eq('role', 'instructor');

      if (activeOnly) {
        userQuery = userQuery.eq('status', 'active');
      }

      const { data: instructorUsers, error: userError } = await userQuery;

      if (userError) {
        console.error('[InstructorIntegration] Error fetching instructor users:', userError);
        throw userError;
      }

      if (!instructorUsers || instructorUsers.length === 0) {
        console.log('[InstructorIntegration] No instructor users found');
        return [];
      }

      // 2. instructors 테이블에서 프로필 정보 조회
      const { data: instructorProfiles, error: profileError } = await supabase
        .from('instructors')
        .select('*')
        .in('user_id', instructorUsers.map(u => u.id));

      if (profileError) {
        console.warn('[InstructorIntegration] Error fetching profiles, continuing without:', profileError);
      }

      // 3. 통합 데이터 생성
      const profileMap = new Map(
        (instructorProfiles || []).map(p => [p.user_id, p])
      );

      const integratedList: InstructorUser[] = instructorUsers.map(user => {
        const profile = profileMap.get(user.id);

        return {
          id: profile?.id || user.id, // 프로필 ID 우선, 없으면 user ID
          user_id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          department: user.department || profile?.department,
          position: user.position || '',
          specializations: profile?.specializations || [],
          years_of_experience: profile?.years_of_experience || 0,
          education_level: profile?.education_level,
          is_active: user.status === 'active',
          has_instructor_profile: !!profile,
          profile_image_url: profile?.profile_image_url,
          bio: profile?.bio
        };
      });

      console.log(`[InstructorIntegration] Found ${integratedList.length} instructors`);
      return integratedList;
    } catch (error: any) {
      console.error('[InstructorIntegration] Error:', error);
      throw error;
    }
  }

  /**
   * 특정 강사 조회 (통합)
   */
  static async getInstructorById(userId: string): Promise<InstructorUser | null> {
    try {
      // 1. users 테이블에서 조회
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email, phone, department, position, role, status')
        .eq('id', userId)
        .eq('role', 'instructor')
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') return null;
        throw userError;
      }

      // 2. instructors 프로필 조회
      const { data: profile } = await supabase
        .from('instructors')
        .select('*')
        .eq('user_id', userId)
        .single();

      return {
        id: profile?.id || user.id,
        user_id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        department: user.department || profile?.department,
        position: user.position || '',
        specializations: profile?.specializations || [],
        years_of_experience: profile?.years_of_experience || 0,
        education_level: profile?.education_level,
        is_active: user.status === 'active',
        has_instructor_profile: !!profile,
        profile_image_url: profile?.profile_image_url,
        bio: profile?.bio
      };
    } catch (error: any) {
      console.error('[InstructorIntegration] Error:', error);
      throw error;
    }
  }

  /**
   * 강사 프로필 생성/업데이트
   * users 테이블의 사용자에 대해 instructors 프로필 추가
   */
  static async ensureInstructorProfile(
    userId: string,
    profileData?: {
      specializations?: string[];
      years_of_experience?: number;
      education_level?: string;
      bio?: string;
      profile_image_url?: string;
    }
  ): Promise<Instructor> {
    try {
      console.log('[InstructorIntegration] Ensuring instructor profile for user:', userId);

      // 1. 기존 프로필 확인
      const { data: existing } = await supabase
        .from('instructors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // 프로필이 이미 있으면 업데이트
        if (profileData) {
          return await InstructorService.updateInstructor(existing.id, profileData);
        }
        return existing;
      }

      // 2. 프로필이 없으면 생성
      const { data: newProfile, error } = await supabase
        .from('instructors')
        .insert({
          user_id: userId,
          specializations: profileData?.specializations || [],
          years_of_experience: profileData?.years_of_experience || 0,
          education_level: profileData?.education_level,
          bio: profileData?.bio,
          profile_image_url: profileData?.profile_image_url,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          user:users(name, email, phone)
        `)
        .single();

      if (error) throw error;

      console.log('[InstructorIntegration] Created new instructor profile');
      return {
        ...newProfile,
        name: newProfile.user?.name || '',
        email: newProfile.user?.email || '',
        phone: newProfile.user?.phone || ''
      };
    } catch (error: any) {
      console.error('[InstructorIntegration] Error:', error);
      throw error;
    }
  }

  /**
   * 사용자를 강사로 지정
   * users.role을 instructor로 변경하고 instructor 프로필 생성
   */
  static async promoteToInstructor(
    userId: string,
    profileData?: {
      specializations?: string[];
      years_of_experience?: number;
      education_level?: string;
      bio?: string;
    }
  ): Promise<InstructorUser> {
    try {
      console.log('[InstructorIntegration] Promoting user to instructor:', userId);

      // 1. users 테이블의 role을 instructor로 변경
      const { data: user, error: updateError } = await supabase
        .from('users')
        .update({ role: 'instructor' })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 2. instructors 프로필 생성
      await this.ensureInstructorProfile(userId, profileData);

      // 3. 통합 데이터 반환
      const instructor = await this.getInstructorById(userId);
      if (!instructor) {
        throw new Error('Failed to retrieve instructor after promotion');
      }

      console.log('[InstructorIntegration] User promoted successfully');
      return instructor;
    } catch (error: any) {
      console.error('[InstructorIntegration] Error:', error);
      throw error;
    }
  }

  /**
   * 강사 역할 제거
   * users.role을 변경하고 instructor 프로필 비활성화
   */
  static async removeInstructorRole(userId: string): Promise<void> {
    try {
      console.log('[InstructorIntegration] Removing instructor role:', userId);

      // 1. users 테이블의 role 변경 (예: user로)
      await supabase
        .from('users')
        .update({ role: 'user' })
        .eq('id', userId);

      // 2. instructors 프로필 비활성화
      await supabase
        .from('instructors')
        .update({ is_active: false })
        .eq('user_id', userId);

      console.log('[InstructorIntegration] Instructor role removed');
    } catch (error: any) {
      console.error('[InstructorIntegration] Error:', error);
      throw error;
    }
  }

  /**
   * 과정 차수에 할당 가능한 강사 목록
   * 활성화된 강사만 반환
   */
  static async getAvailableInstructors(): Promise<InstructorUser[]> {
    return this.getAllInstructors(true);
  }

  /**
   * 강사 검색 (이름, 이메일, 전문분야)
   */
  static async searchInstructors(query: string): Promise<InstructorUser[]> {
    const allInstructors = await this.getAllInstructors(true);

    const lowerQuery = query.toLowerCase();

    return allInstructors.filter(instructor =>
      instructor.name.toLowerCase().includes(lowerQuery) ||
      instructor.email.toLowerCase().includes(lowerQuery) ||
      (instructor.specializations || []).some(spec =>
        spec.toLowerCase().includes(lowerQuery)
      )
    );
  }
}
