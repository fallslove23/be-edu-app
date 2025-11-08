/**
 * 리소스 관리 타입 정의
 * Phase 1: 카테고리 & 강의실 관리
 */

// ========================================
// 카테고리 타입
// ========================================

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

  // 관계 데이터
  parent?: Category;
  children?: Category[];
}

export interface CreateCategoryData {
  name: string;
  parent_id?: string | null;
  description?: string;
  color?: string;
  icon?: string;
  display_order?: number;
}

export interface UpdateCategoryData {
  name?: string;
  parent_id?: string | null;
  description?: string;
  color?: string;
  icon?: string;
  display_order?: number;
  is_active?: boolean;
}

// ========================================
// 강의실 타입
// ========================================

export interface Classroom {
  id: string;
  name: string;
  code: string | null;
  location: string;
  building: string | null;
  floor: number | null;
  capacity: number;
  facilities: string[];
  equipment: string[];
  description: string | null;
  is_available: boolean;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateClassroomData {
  name: string;
  code?: string;
  location: string;
  building?: string;
  floor?: number;
  capacity: number;
  facilities?: string[];
  equipment?: string[];
  description?: string;
  photo_url?: string;
}

export interface UpdateClassroomData {
  name?: string;
  code?: string;
  location?: string;
  building?: string;
  floor?: number;
  capacity?: number;
  facilities?: string[];
  equipment?: string[];
  description?: string;
  is_available?: boolean;
  photo_url?: string;
}

// ========================================
// 필터 타입
// ========================================

export interface CategoryFilter {
  parent_id?: string | null;
  is_active?: boolean;
  search?: string;
}

export interface ClassroomFilter {
  location?: string;
  min_capacity?: number;
  max_capacity?: number;
  is_available?: boolean;
  search?: string;
}

// ========================================
// 통계 타입
// ========================================

export interface CategoryStats {
  total_categories: number;
  active_categories: number;
  categories_by_parent: Record<string, number>;
}

export interface ClassroomStats {
  total_classrooms: number;
  available_classrooms: number;
  total_capacity: number;
  average_capacity: number;
  classrooms_by_location: Record<string, number>;
}

// ========================================
// UI 상수
// ========================================

export const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
] as const;

export const CATEGORY_ICONS = [
  'FolderIcon',
  'ChartBarIcon',
  'AcademicCapIcon',
  'StarIcon',
  'BookOpenIcon',
  'RocketLaunchIcon',
  'ComputerDesktopIcon',
  'BuildingOfficeIcon',
] as const;

export const COMMON_FACILITIES = [
  '빔프로젝터',
  '화이트보드',
  '음향장비',
  '무선마이크',
  'TV 모니터',
  '에어컨',
  '원형 테이블',
  '개별 책상',
] as const;

export const COMMON_EQUIPMENT = [
  '노트북',
  '마이크',
  '레이저포인터',
  '녹화장비',
  '태블릿',
  'VR 기기',
] as const;
