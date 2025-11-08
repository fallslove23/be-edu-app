/**
 * 리소스 관리 서비스
 * Phase 1: 카테고리 & 강의실 관리
 */

import { supabase } from './supabase';
import type {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
  CategoryFilter,
  Classroom,
  CreateClassroomData,
  UpdateClassroomData,
  ClassroomFilter,
  CategoryStats,
  ClassroomStats,
} from '../types/resource.types';

// ========================================
// 카테고리 서비스
// ========================================

export class CategoryService {
  /**
   * 카테고리 목록 조회
   */
  static async getCategories(filters?: CategoryFilter): Promise<Category[]> {
    console.log('[CategoryService] getCategories called with filters:', filters);

    let query = supabase
      .from('categories')
      .select(`
        *,
        parent:categories!parent_id(id, name, color, icon),
        children:categories!parent_id(id, name, color, icon, display_order)
      `)
      .order('display_order', { ascending: true });

    if (filters?.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', filters.parent_id);
      }
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[CategoryService] 카테고리 조회 실패:', error);
      throw new Error(`카테고리 조회 실패: ${error.message}`);
    }

    console.log('[CategoryService] ✅ 카테고리 조회 성공:', data?.length, '개');
    return data || [];
  }

  /**
   * 카테고리 상세 조회
   */
  static async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        parent:categories!parent_id(id, name, color, icon),
        children:categories!parent_id(id, name, color, icon, display_order)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[CategoryService] 카테고리 상세 조회 실패:', error);
      return null;
    }

    return data;
  }

  /**
   * 카테고리 생성
   */
  static async createCategory(data: CreateCategoryData): Promise<Category> {
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: data.name,
        parent_id: data.parent_id || null,
        description: data.description || null,
        color: data.color || '#3B82F6',
        icon: data.icon || 'FolderIcon',
        display_order: data.display_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[CategoryService] 카테고리 생성 실패:', error);
      throw new Error(`카테고리 생성 실패: ${error.message}`);
    }

    console.log('[CategoryService] ✅ 카테고리 생성 성공:', category.name);
    return category;
  }

  /**
   * 카테고리 수정
   */
  static async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    const { data: category, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[CategoryService] 카테고리 수정 실패:', error);
      throw new Error(`카테고리 수정 실패: ${error.message}`);
    }

    console.log('[CategoryService] ✅ 카테고리 수정 성공:', category.name);
    return category;
  }

  /**
   * 카테고리 삭제
   */
  static async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[CategoryService] 카테고리 삭제 실패:', error);
      throw new Error(`카테고리 삭제 실패: ${error.message}`);
    }

    console.log('[CategoryService] ✅ 카테고리 삭제 성공');
  }

  /**
   * 카테고리 통계
   */
  static async getCategoryStats(): Promise<CategoryStats> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, is_active, parent_id');

    if (error) {
      console.error('[CategoryService] 통계 조회 실패:', error);
      return {
        total_categories: 0,
        active_categories: 0,
        categories_by_parent: {},
      };
    }

    const stats: CategoryStats = {
      total_categories: data.length,
      active_categories: data.filter(c => c.is_active).length,
      categories_by_parent: {},
    };

    // 부모별 카테고리 수 계산
    data.forEach(category => {
      const parentKey = category.parent_id || 'root';
      stats.categories_by_parent[parentKey] = (stats.categories_by_parent[parentKey] || 0) + 1;
    });

    return stats;
  }
}

// ========================================
// 강의실 서비스
// ========================================

export class ClassroomService {
  /**
   * 강의실 목록 조회
   */
  static async getClassrooms(filters?: ClassroomFilter): Promise<Classroom[]> {
    console.log('[ClassroomService] getClassrooms called with filters:', filters);

    let query = supabase
      .from('classrooms')
      .select('*')
      .order('capacity', { ascending: false });

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.min_capacity) {
      query = query.gte('capacity', filters.min_capacity);
    }

    if (filters?.max_capacity) {
      query = query.lte('capacity', filters.max_capacity);
    }

    if (filters?.is_available !== undefined) {
      query = query.eq('is_available', filters.is_available);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ClassroomService] 강의실 조회 실패:', error);
      throw new Error(`강의실 조회 실패: ${error.message}`);
    }

    console.log('[ClassroomService] ✅ 강의실 조회 성공:', data?.length, '개');
    return data || [];
  }

  /**
   * 강의실 상세 조회
   */
  static async getClassroomById(id: string): Promise<Classroom | null> {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[ClassroomService] 강의실 상세 조회 실패:', error);
      return null;
    }

    return data;
  }

  /**
   * 강의실 생성
   */
  static async createClassroom(data: CreateClassroomData): Promise<Classroom> {
    const { data: classroom, error } = await supabase
      .from('classrooms')
      .insert({
        name: data.name,
        code: data.code || null,
        location: data.location,
        building: data.building || null,
        floor: data.floor || null,
        capacity: data.capacity,
        facilities: data.facilities || [],
        equipment: data.equipment || [],
        description: data.description || null,
        photo_url: data.photo_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[ClassroomService] 강의실 생성 실패:', error);
      throw new Error(`강의실 생성 실패: ${error.message}`);
    }

    console.log('[ClassroomService] ✅ 강의실 생성 성공:', classroom.name);
    return classroom;
  }

  /**
   * 강의실 수정
   */
  static async updateClassroom(id: string, data: UpdateClassroomData): Promise<Classroom> {
    const { data: classroom, error } = await supabase
      .from('classrooms')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ClassroomService] 강의실 수정 실패:', error);
      throw new Error(`강의실 수정 실패: ${error.message}`);
    }

    console.log('[ClassroomService] ✅ 강의실 수정 성공:', classroom.name);
    return classroom;
  }

  /**
   * 강의실 삭제
   */
  static async deleteClassroom(id: string): Promise<void> {
    const { error } = await supabase
      .from('classrooms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[ClassroomService] 강의실 삭제 실패:', error);
      throw new Error(`강의실 삭제 실패: ${error.message}`);
    }

    console.log('[ClassroomService] ✅ 강의실 삭제 성공');
  }

  /**
   * 강의실 통계
   */
  static async getClassroomStats(): Promise<ClassroomStats> {
    const { data, error } = await supabase
      .from('classrooms')
      .select('id, capacity, is_available, location');

    if (error) {
      console.error('[ClassroomService] 통계 조회 실패:', error);
      return {
        total_classrooms: 0,
        available_classrooms: 0,
        total_capacity: 0,
        average_capacity: 0,
        classrooms_by_location: {},
      };
    }

    const stats: ClassroomStats = {
      total_classrooms: data.length,
      available_classrooms: data.filter(c => c.is_available).length,
      total_capacity: data.reduce((sum, c) => sum + c.capacity, 0),
      average_capacity: data.length > 0 ? Math.round(data.reduce((sum, c) => sum + c.capacity, 0) / data.length) : 0,
      classrooms_by_location: {},
    };

    // 위치별 강의실 수 계산
    data.forEach(classroom => {
      const location = classroom.location || 'Unknown';
      stats.classrooms_by_location[location] = (stats.classrooms_by_location[location] || 0) + 1;
    });

    return stats;
  }
}
