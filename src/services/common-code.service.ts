/**
 * Common Code Service
 * 공통 코드 마스터 데이터 관리 서비스
 *
 * 부서, 직급, 관계 등 시스템 전반에서 사용되는 코드 값을 관리합니다.
 */

import { supabase } from './supabase';

// 공통 코드 그룹 타입
export interface CommonCodeGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 공통 코드 타입
export interface CommonCode {
  id: string;
  group_id: string;
  code: string;
  name: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
  extra_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 코드 그룹 생성 데이터
export interface CreateCodeGroupData {
  code: string;
  name: string;
  description?: string;
  is_system?: boolean;
  sort_order?: number;
}

// 코드 생성 데이터
export interface CreateCodeData {
  group_id: string;
  code: string;
  name: string;
  description?: string;
  is_system?: boolean;
  sort_order?: number;
  extra_data?: Record<string, any>;
}

// 코드 업데이트 데이터
export interface UpdateCodeData {
  name?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
  extra_data?: Record<string, any>;
}

// 캐시 저장소
interface CacheStore {
  groups: CommonCodeGroup[] | null;
  codesByGroup: Map<string, CommonCode[]>;
  lastFetch: number;
}

const cache: CacheStore = {
  groups: null,
  codesByGroup: new Map(),
  lastFetch: 0
};

// 캐시 유효 시간 (5분)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * 공통 코드 서비스 클래스
 */
export class CommonCodeService {
  /**
   * 캐시 무효화
   */
  private static clearCache(): void {
    cache.groups = null;
    cache.codesByGroup.clear();
    cache.lastFetch = 0;
  }

  /**
   * 캐시가 유효한지 확인
   */
  private static isCacheValid(): boolean {
    return Date.now() - cache.lastFetch < CACHE_TTL;
  }

  /**
   * 모든 코드 그룹 조회
   */
  static async getCodeGroups(activeOnly: boolean = true): Promise<CommonCodeGroup[]> {
    try {
      // 캐시 체크
      if (this.isCacheValid() && cache.groups) {
        console.log('[CommonCodeService] 캐시에서 코드 그룹 반환');
        return activeOnly ? cache.groups.filter(g => g.is_active) : cache.groups;
      }

      console.log('[CommonCodeService] 코드 그룹 조회 시작');

      let query = supabase
        .from('common_code_groups')
        .select('*')
        .order('sort_order');

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[CommonCodeService] 코드 그룹 조회 오류:', error);
        throw error;
      }

      // 캐시 업데이트
      if (!activeOnly) {
        cache.groups = data as CommonCodeGroup[];
        cache.lastFetch = Date.now();
      }

      console.log('[CommonCodeService] 코드 그룹 조회 완료:', data?.length);
      return data as CommonCodeGroup[];
    } catch (error) {
      console.error('[CommonCodeService] 코드 그룹 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 그룹의 코드 목록 조회
   */
  static async getCodesByGroup(
    groupCode: string,
    activeOnly: boolean = true
  ): Promise<CommonCode[]> {
    try {
      // 캐시 체크
      const cacheKey = `${groupCode}_${activeOnly}`;
      if (this.isCacheValid() && cache.codesByGroup.has(cacheKey)) {
        console.log('[CommonCodeService] 캐시에서 코드 목록 반환:', groupCode);
        return cache.codesByGroup.get(cacheKey)!;
      }

      console.log('[CommonCodeService] 코드 목록 조회 시작:', groupCode);

      // 먼저 그룹 ID 조회
      const { data: group, error: groupError } = await supabase
        .from('common_code_groups')
        .select('id')
        .eq('code', groupCode)
        .single();

      if (groupError || !group) {
        console.error('[CommonCodeService] 코드 그룹 찾기 실패:', groupError);
        throw new Error(`코드 그룹을 찾을 수 없습니다: ${groupCode}`);
      }

      // 코드 목록 조회
      let query = supabase
        .from('common_codes')
        .select('*')
        .eq('group_id', group.id)
        .order('sort_order');

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[CommonCodeService] 코드 목록 조회 오류:', error);
        throw error;
      }

      // 캐시 업데이트
      cache.codesByGroup.set(cacheKey, data as CommonCode[]);
      cache.lastFetch = Date.now();

      console.log('[CommonCodeService] 코드 목록 조회 완료:', data?.length);
      return data as CommonCode[];
    } catch (error) {
      console.error('[CommonCodeService] 코드 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 코드 그룹 생성
   */
  static async createCodeGroup(data: CreateCodeGroupData): Promise<CommonCodeGroup> {
    try {
      console.log('[CommonCodeService] 코드 그룹 생성 시작:', data);

      const { data: newGroup, error } = await supabase
        .from('common_code_groups')
        .insert({
          code: data.code,
          name: data.name,
          description: data.description,
          is_system: data.is_system || false,
          sort_order: data.sort_order || 0
        })
        .select()
        .single();

      if (error) {
        console.error('[CommonCodeService] 코드 그룹 생성 오류:', error);
        throw error;
      }

      // 캐시 무효화
      this.clearCache();

      console.log('[CommonCodeService] 코드 그룹 생성 완료:', newGroup);
      return newGroup as CommonCodeGroup;
    } catch (error) {
      console.error('[CommonCodeService] 코드 그룹 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 코드 생성
   */
  static async createCode(data: CreateCodeData): Promise<CommonCode> {
    try {
      console.log('[CommonCodeService] 코드 생성 시작:', data);

      const { data: newCode, error } = await supabase
        .from('common_codes')
        .insert({
          group_id: data.group_id,
          code: data.code,
          name: data.name,
          description: data.description,
          is_system: data.is_system || false,
          sort_order: data.sort_order || 0,
          extra_data: data.extra_data
        })
        .select()
        .single();

      if (error) {
        console.error('[CommonCodeService] 코드 생성 오류:', error);
        throw error;
      }

      // 캐시 무효화
      this.clearCache();

      console.log('[CommonCodeService] 코드 생성 완료:', newCode);
      return newCode as CommonCode;
    } catch (error) {
      console.error('[CommonCodeService] 코드 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 코드 업데이트
   */
  static async updateCode(codeId: string, data: UpdateCodeData): Promise<CommonCode> {
    try {
      console.log('[CommonCodeService] 코드 업데이트 시작:', { codeId, data });

      // 시스템 코드인지 확인
      const { data: existingCode, error: fetchError } = await supabase
        .from('common_codes')
        .select('is_system')
        .eq('id', codeId)
        .single();

      if (fetchError || !existingCode) {
        throw new Error('코드를 찾을 수 없습니다.');
      }

      // 시스템 코드는 is_active 변경 불가
      if (existingCode.is_system && data.is_active === false) {
        throw new Error('시스템 코드는 비활성화할 수 없습니다.');
      }

      const { data: updatedCode, error } = await supabase
        .from('common_codes')
        .update({
          name: data.name,
          description: data.description,
          is_active: data.is_active,
          sort_order: data.sort_order,
          extra_data: data.extra_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', codeId)
        .select()
        .single();

      if (error) {
        console.error('[CommonCodeService] 코드 업데이트 오류:', error);
        throw error;
      }

      // 캐시 무효화
      this.clearCache();

      console.log('[CommonCodeService] 코드 업데이트 완료:', updatedCode);
      return updatedCode as CommonCode;
    } catch (error) {
      console.error('[CommonCodeService] 코드 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 코드 삭제 (소프트 삭제)
   */
  static async deleteCode(codeId: string): Promise<void> {
    try {
      console.log('[CommonCodeService] 코드 삭제 시작:', codeId);

      // 시스템 코드인지 확인
      const { data: code, error: fetchError } = await supabase
        .from('common_codes')
        .select('is_system')
        .eq('id', codeId)
        .single();

      if (fetchError || !code) {
        throw new Error('코드를 찾을 수 없습니다.');
      }

      if (code.is_system) {
        throw new Error('시스템 코드는 삭제할 수 없습니다.');
      }

      // 소프트 삭제 (is_active = false)
      const { error } = await supabase
        .from('common_codes')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', codeId);

      if (error) {
        console.error('[CommonCodeService] 코드 삭제 오류:', error);
        throw error;
      }

      // 캐시 무효화
      this.clearCache();

      console.log('[CommonCodeService] 코드 삭제 완료');
    } catch (error) {
      console.error('[CommonCodeService] 코드 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 코드 그룹 삭제 (소프트 삭제)
   */
  static async deleteCodeGroup(groupId: string): Promise<void> {
    try {
      console.log('[CommonCodeService] 코드 그룹 삭제 시작:', groupId);

      // 시스템 그룹인지 확인
      const { data: group, error: fetchError } = await supabase
        .from('common_code_groups')
        .select('is_system')
        .eq('id', groupId)
        .single();

      if (fetchError || !group) {
        throw new Error('코드 그룹을 찾을 수 없습니다.');
      }

      if (group.is_system) {
        throw new Error('시스템 코드 그룹은 삭제할 수 없습니다.');
      }

      // 소프트 삭제 (is_active = false)
      const { error } = await supabase
        .from('common_code_groups')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId);

      if (error) {
        console.error('[CommonCodeService] 코드 그룹 삭제 오류:', error);
        throw error;
      }

      // 캐시 무효화
      this.clearCache();

      console.log('[CommonCodeService] 코드 그룹 삭제 완료');
    } catch (error) {
      console.error('[CommonCodeService] 코드 그룹 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 편의 메서드: 부서 목록 조회
   */
  static async getDepartments(): Promise<CommonCode[]> {
    return this.getCodesByGroup('DEPARTMENT');
  }

  /**
   * 편의 메서드: 직급 목록 조회
   */
  static async getPositions(): Promise<CommonCode[]> {
    return this.getCodesByGroup('POSITION');
  }

  /**
   * 편의 메서드: 관계 목록 조회
   */
  static async getRelationships(): Promise<CommonCode[]> {
    return this.getCodesByGroup('RELATIONSHIP');
  }

  /**
   * 편의 메서드: 강의실 유형 목록 조회
   */
  static async getClassroomTypes(): Promise<CommonCode[]> {
    return this.getCodesByGroup('CLASSROOM_TYPE');
  }

  /**
   * 편의 메서드: 과목 카테고리 목록 조회
   */
  static async getSubjectCategories(): Promise<CommonCode[]> {
    return this.getCodesByGroup('SUBJECT_CATEGORY');
  }
}

// 싱글톤 인스턴스 내보내기
export const commonCodeService = CommonCodeService;
