import { supabase } from './supabase';

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  description: string | null;
  color: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CategoryWithParent extends Category {
  parent_name?: string;
  children?: CategoryWithParent[];
}

export class CategoryService {
  /**
   * 모든 활성 카테고리 조회 (계층 구조 포함)
   */
  static async getCategories(): Promise<CategoryWithParent[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          parent:categories!parent_id (
            name
          )
        `)
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('[CategoryService] Error fetching categories:', error);
        return [];
      }

      // 계층 구조로 변환
      const categories = (data || []).map(cat => ({
        ...cat,
        parent_name: cat.parent?.name,
        children: []
      }));

      // 부모-자식 관계 구성
      const parentCategories: CategoryWithParent[] = [];
      const childCategories: Map<string, CategoryWithParent[]> = new Map();

      categories.forEach(cat => {
        if (!cat.parent_id) {
          parentCategories.push(cat);
        } else {
          if (!childCategories.has(cat.parent_id)) {
            childCategories.set(cat.parent_id, []);
          }
          childCategories.get(cat.parent_id)!.push(cat);
        }
      });

      // 자식 카테고리 연결
      parentCategories.forEach(parent => {
        parent.children = childCategories.get(parent.id) || [];
      });

      return parentCategories;
    } catch (error) {
      console.error('[CategoryService] Error:', error);
      return [];
    }
  }

  /**
   * 카테고리 ID로 조회
   */
  static async getCategoryById(id: string): Promise<CategoryWithParent | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          parent:categories!parent_id (
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('[CategoryService] Error fetching category:', error);
        return null;
      }

      return {
        ...data,
        parent_name: data.parent?.name
      };
    } catch (error) {
      console.error('[CategoryService] Error:', error);
      return null;
    }
  }

  /**
   * 카테고리 생성
   */
  static async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error) {
        console.error('[CategoryService] Error creating category:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[CategoryService] Error:', error);
      return null;
    }
  }

  /**
   * 카테고리 수정
   */
  static async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[CategoryService] Error updating category:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[CategoryService] Error:', error);
      return null;
    }
  }

  /**
   * 카테고리 삭제 (소프트 삭제)
   */
  static async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('[CategoryService] Error deleting category:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[CategoryService] Error:', error);
      return false;
    }
  }

  /**
   * 카테고리 목록을 플랫한 선택 옵션으로 변환
   * (드롭다운에서 사용)
   */
  static flattenCategoriesForSelect(categories: CategoryWithParent[]): Array<{
    value: string;
    label: string;
    color: string;
    icon: string;
    indent: number;
  }> {
    const options: Array<{
      value: string;
      label: string;
      color: string;
      icon: string;
      indent: number;
    }> = [];

    categories.forEach(parent => {
      // 부모 카테고리 추가
      options.push({
        value: parent.id,
        label: parent.name,
        color: parent.color,
        icon: parent.icon,
        indent: 0
      });

      // 자식 카테고리 추가
      if (parent.children && parent.children.length > 0) {
        parent.children.forEach(child => {
          options.push({
            value: child.id,
            label: child.name,
            color: child.color,
            icon: child.icon,
            indent: 1
          });
        });
      }
    });

    return options;
  }
}
