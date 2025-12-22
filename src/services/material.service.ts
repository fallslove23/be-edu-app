/**
 * 자료 관리 서비스
 * Supabase Storage와 Database를 활용한 파일 관리
 */

import { supabase } from '@/services/supabase';
import type {
  Material,
  MaterialCategory,
  MaterialDistribution,
  MaterialFilter,
} from '@/types/material.types';
import { logger } from '@/utils/logger';

const STORAGE_BUCKET = 'materials';

export class MaterialService {
  /**
   * 파일 업로드
   */
  static async uploadFile(
    file: File,
    categoryId: string,
    userId: string,
    metadata?: {
      title?: string;
      description?: string;
      isPublic?: boolean;
      tags?: string[];
    }
  ): Promise<Material> {
    try {
      logger.info('파일 업로드 시작', {
        component: 'MaterialService',
        action: 'uploadFile',
        metadata: { fileName: file.name, fileSize: file.size },
      });

      // 파일명 생성 (중복 방지)
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${categoryId}/${fileName}`;

      // Supabase Storage에 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        logger.error('파일 업로드 실패', uploadError, {
          component: 'MaterialService',
          action: 'uploadFile',
        });
        throw uploadError;
      }

      // 공개 URL 가져오기
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      // 데이터베이스에 메타데이터 저장
      const { data: material, error: dbError } = await supabase
        .from('materials')
        .insert({
          title: metadata?.title || file.name,
          description: metadata?.description,
          category_id: categoryId,
          file_name: file.name,
          file_path: publicUrlData.publicUrl,
          file_size: file.size,
          file_type: this.getFileExtension(file.name),
          mime_type: file.type,
          uploaded_by: userId,
          is_public: metadata?.isPublic ?? true,
          tags: metadata?.tags || [],
          download_count: 0,
        })
        .select()
        .single();

      if (dbError) {
        // DB 저장 실패 시 업로드된 파일 삭제
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
        logger.error('자료 메타데이터 저장 실패', dbError, {
          component: 'MaterialService',
          action: 'uploadFile',
        });
        throw dbError;
      }

      logger.info('파일 업로드 성공', {
        component: 'MaterialService',
        action: 'uploadFile',
        metadata: { materialId: material.id },
      });

      return material;
    } catch (error) {
      logger.error('파일 업로드 중 오류', error as Error, {
        component: 'MaterialService',
        action: 'uploadFile',
      });
      throw error;
    }
  }

  /**
   * 자료 목록 조회
   */
  static async getMaterials(filter?: MaterialFilter): Promise<Material[]> {
    try {
      let query = supabase.from('materials').select('*').order('uploaded_at', { ascending: false });

      if (filter?.category_id) {
        query = query.eq('category_id', filter.category_id);
      }

      if (filter?.search) {
        query = query.or(
          `title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`
        );
      }

      if (filter?.file_type) {
        query = query.eq('file_type', filter.file_type);
      }

      if (filter?.uploaded_by) {
        query = query.eq('uploaded_by', filter.uploaded_by);
      }

      if (filter?.is_public !== undefined) {
        query = query.eq('is_public', filter.is_public);
      }

      if (filter?.from_date) {
        query = query.gte('uploaded_at', filter.from_date);
      }

      if (filter?.to_date) {
        query = query.lte('uploaded_at', filter.to_date);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('자료 목록 조회 실패', error as Error, {
        component: 'MaterialService',
        action: 'getMaterials',
      });
      throw error;
    }
  }

  /**
   * 자료 상세 조회
   */
  static async getMaterial(id: string): Promise<Material | null> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('자료 조회 실패', error as Error, {
        component: 'MaterialService',
        action: 'getMaterial',
      });
      throw error;
    }
  }

  /**
   * 자료 다운로드 카운트 증가
   */
  static async incrementDownloadCount(materialId: string, userId: string): Promise<void> {
    try {
      // 다운로드 카운트 증가
      const { error: updateError } = await supabase.rpc('increment_download_count', {
        material_id: materialId,
      });

      if (updateError && updateError.code !== 'PGRST116') {
        // PGRST116: function not found - 무시 (함수 없으면 수동 업데이트)
        const { error } = await supabase
          .from('materials')
          .update({ download_count: supabase.sql`download_count + 1` })
          .eq('id', materialId);

        if (error) throw error;
      }

      // 다운로드 기록 저장
      await supabase.from('material_downloads').insert({
        material_id: materialId,
        user_id: userId,
      });
    } catch (error) {
      logger.error('다운로드 카운트 증가 실패', error as Error, {
        component: 'MaterialService',
        action: 'incrementDownloadCount',
      });
      // 다운로드는 계속 진행
    }
  }

  /**
   * 자료 삭제
   */
  static async deleteMaterial(id: string): Promise<void> {
    try {
      // 먼저 자료 정보 조회
      const material = await this.getMaterial(id);
      if (!material) {
        throw new Error('자료를 찾을 수 없습니다.');
      }

      // Storage에서 파일 삭제
      const filePath = this.extractFilePathFromUrl(material.file_path);
      if (filePath) {
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      }

      // DB에서 삭제
      const { error } = await supabase.from('materials').delete().eq('id', id);

      if (error) throw error;

      logger.info('자료 삭제 완료', {
        component: 'MaterialService',
        action: 'deleteMaterial',
        metadata: { materialId: id },
      });
    } catch (error) {
      logger.error('자료 삭제 실패', error as Error, {
        component: 'MaterialService',
        action: 'deleteMaterial',
      });
      throw error;
    }
  }

  /**
   * 카테고리 목록 조회
   */
  static async getCategories(): Promise<MaterialCategory[]> {
    try {
      const { data, error } = await supabase
        .from('material_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('카테고리 목록 조회 실패', error as Error, {
        component: 'MaterialService',
        action: 'getCategories',
      });
      throw error;
    }
  }

  /**
   * 카테고리 생성
   */
  static async createCategory(
    category: Omit<MaterialCategory, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MaterialCategory> {
    try {
      const { data, error } = await supabase
        .from('material_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('카테고리 생성 실패', error as Error, {
        component: 'MaterialService',
        action: 'createCategory',
      });
      throw error;
    }
  }

  /**
   * 카테고리 수정
   */
  static async updateCategory(
    id: string,
    updates: Partial<MaterialCategory>
  ): Promise<MaterialCategory> {
    try {
      const { data, error } = await supabase
        .from('material_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('카테고리 수정 실패', error as Error, {
        component: 'MaterialService',
        action: 'updateCategory',
      });
      throw error;
    }
  }

  /**
   * 카테고리 삭제
   */
  static async deleteCategory(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('material_categories').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      logger.error('카테고리 삭제 실패', error as Error, {
        component: 'MaterialService',
        action: 'deleteCategory',
      });
      throw error;
    }
  }

  /**
   * 배포 생성
   */
  static async createDistribution(
    distribution: Omit<MaterialDistribution, 'id' | 'distributed_at' | 'successful_sends' | 'failed_sends'>
  ): Promise<MaterialDistribution> {
    try {
      const { data, error} = await supabase
        .from('material_distributions')
        .insert({
          ...distribution,
          successful_sends: 0,
          failed_sends: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('배포 생성 실패', error as Error, {
        component: 'MaterialService',
        action: 'createDistribution',
      });
      throw error;
    }
  }

  /**
   * 배포 목록 조회
   */
  static async getDistributions(): Promise<MaterialDistribution[]> {
    try {
      const { data, error } = await supabase
        .from('material_distributions')
        .select('*')
        .order('distributed_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('배포 목록 조회 실패', error as Error, {
        component: 'MaterialService',
        action: 'getDistributions',
      });
      throw error;
    }
  }

  /**
   * 파일 확장자 추출
   */
  private static getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * URL에서 파일 경로 추출
   */
  private static extractFilePathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf(STORAGE_BUCKET);
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      return null;
    } catch {
      return null;
    }
  }
}
