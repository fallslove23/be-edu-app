/**
 * 드롭다운 옵션 관리 서비스
 *
 * 관리자가 웹 UI에서 드롭다운 옵션을 CRUD 할 수 있도록 지원
 */

import { supabase } from './supabase';

export interface DropdownCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  is_system: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DropdownOption {
  id: string;
  category_id: string;
  value: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  is_default: boolean;
  is_system: boolean;
  is_active: boolean;
  display_order: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface DropdownOptionHistory {
  id: string;
  option_id: string;
  category_id: string;
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  changed_by?: string;
  changed_at: string;
  reason?: string;
}

export interface CreateDropdownOptionData {
  category_id: string;
  value: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  is_default?: boolean;
  display_order?: number;
  metadata?: Record<string, any>;
}

export interface UpdateDropdownOptionData {
  label?: string;
  description?: string;
  icon?: string;
  color?: string;
  is_default?: boolean;
  is_active?: boolean;
  display_order?: number;
  metadata?: Record<string, any>;
}

export class DropdownOptionsService {
  // ========================================
  // 카테고리 관리
  // ========================================

  /**
   * 모든 카테고리 조회
   */
  static async getAllCategories(): Promise<DropdownCategory[]> {
    const { data, error } = await supabase
      .from('dropdown_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('카테고리 조회 실패:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 활성화된 카테고리만 조회
   */
  static async getActiveCategories(): Promise<DropdownCategory[]> {
    const { data, error } = await supabase
      .from('dropdown_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('활성 카테고리 조회 실패:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 코드로 카테고리 조회
   */
  static async getCategoryByCode(code: string): Promise<DropdownCategory | null> {
    const { data, error } = await supabase
      .from('dropdown_categories')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      console.error('카테고리 조회 실패:', error);
      return null;
    }

    return data;
  }

  // ========================================
  // 옵션 관리
  // ========================================

  /**
   * 카테고리별 옵션 조회
   */
  static async getOptionsByCategory(categoryCode: string): Promise<DropdownOption[]> {
    const { data, error } = await supabase
      .from('dropdown_options')
      .select(`
        *,
        category:dropdown_categories(code, name)
      `)
      .eq('dropdown_categories.code', categoryCode)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('옵션 조회 실패:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 카테고리별 활성화된 옵션만 조회
   */
  static async getActiveOptionsByCategory(categoryCode: string): Promise<DropdownOption[]> {
    // 1. 카테고리 ID 조회
    const category = await this.getCategoryByCode(categoryCode);
    if (!category) {
      console.warn(`카테고리를 찾을 수 없습니다: ${categoryCode}`);
      return [];
    }

    // 2. 활성화된 옵션만 조회
    const { data, error } = await supabase
      .from('dropdown_options')
      .select('*')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('활성 옵션 조회 실패:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 모든 옵션 조회 (카테고리 정보 포함)
   */
  static async getAllOptions(): Promise<DropdownOption[]> {
    const { data, error } = await supabase
      .from('dropdown_options')
      .select(`
        *,
        category:dropdown_categories(code, name, icon)
      `)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('전체 옵션 조회 실패:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 옵션 생성
   */
  static async createOption(
    data: CreateDropdownOptionData,
    userId?: string
  ): Promise<DropdownOption> {
    const { data: newOption, error } = await supabase
      .from('dropdown_options')
      .insert({
        ...data,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error('옵션 생성 실패:', error);
      throw error;
    }

    return newOption;
  }

  /**
   * 옵션 수정
   */
  static async updateOption(
    optionId: string,
    data: UpdateDropdownOptionData,
    userId?: string
  ): Promise<DropdownOption> {
    const { data: updatedOption, error } = await supabase
      .from('dropdown_options')
      .update({
        ...data,
        updated_by: userId
      })
      .eq('id', optionId)
      .select()
      .single();

    if (error) {
      console.error('옵션 수정 실패:', error);
      throw error;
    }

    return updatedOption;
  }

  /**
   * 옵션 삭제 (시스템 옵션은 삭제 불가)
   */
  static async deleteOption(optionId: string): Promise<void> {
    // 1. 시스템 옵션인지 확인
    const { data: option } = await supabase
      .from('dropdown_options')
      .select('is_system')
      .eq('id', optionId)
      .single();

    if (option?.is_system) {
      throw new Error('시스템 옵션은 삭제할 수 없습니다.');
    }

    // 2. 삭제
    const { error } = await supabase
      .from('dropdown_options')
      .delete()
      .eq('id', optionId);

    if (error) {
      console.error('옵션 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 옵션 활성화/비활성화
   */
  static async toggleOptionActive(
    optionId: string,
    isActive: boolean,
    userId?: string
  ): Promise<DropdownOption> {
    return this.updateOption(optionId, { is_active: isActive }, userId);
  }

  /**
   * 옵션 순서 변경 (드래그 앤 드롭)
   */
  static async reorderOptions(
    categoryId: string,
    orderedIds: string[]
  ): Promise<void> {
    // 각 옵션의 display_order 업데이트
    const updates = orderedIds.map((id, index) => ({
      id,
      display_order: index
    }));

    for (const update of updates) {
      await supabase
        .from('dropdown_options')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }
  }

  // ========================================
  // 변경 이력 조회
  // ========================================

  /**
   * 옵션별 변경 이력 조회
   */
  static async getOptionHistory(optionId: string): Promise<DropdownOptionHistory[]> {
    const { data, error } = await supabase
      .from('dropdown_option_history')
      .select(`
        *,
        changed_by_user:users(name, email)
      `)
      .eq('option_id', optionId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('이력 조회 실패:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 카테고리별 최근 변경 이력 조회
   */
  static async getCategoryHistory(
    categoryId: string,
    limit: number = 50
  ): Promise<DropdownOptionHistory[]> {
    const { data, error } = await supabase
      .from('dropdown_option_history')
      .select(`
        *,
        changed_by_user:users(name, email),
        option:dropdown_options(value, label)
      `)
      .eq('category_id', categoryId)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('카테고리 이력 조회 실패:', error);
      throw error;
    }

    return data || [];
  }

  // ========================================
  // 유틸리티 함수
  // ========================================

  /**
   * 카테고리 코드로 옵션 맵 생성 (빠른 조회용)
   */
  static async getOptionsMap(): Promise<Record<string, DropdownOption[]>> {
    const categories = await this.getActiveCategories();
    const optionsMap: Record<string, DropdownOption[]> = {};

    for (const category of categories) {
      const options = await this.getActiveOptionsByCategory(category.code);
      optionsMap[category.code] = options;
    }

    return optionsMap;
  }

  /**
   * value로 label 찾기
   */
  static async getLabel(categoryCode: string, value: string): Promise<string> {
    const options = await this.getActiveOptionsByCategory(categoryCode);
    const option = options.find(opt => opt.value === value);
    return option?.label || value;
  }

  /**
   * 옵션 검색
   */
  static async searchOptions(searchTerm: string): Promise<DropdownOption[]> {
    const { data, error } = await supabase
      .from('dropdown_options')
      .select(`
        *,
        category:dropdown_categories(code, name)
      `)
      .or(`label.ilike.%${searchTerm}%,value.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(50);

    if (error) {
      console.error('옵션 검색 실패:', error);
      throw error;
    }

    return data || [];
  }
}
