/**
 * 강사 사진 관리 서비스
 * - 사진 업로드 (리사이즈 포함)
 * - 사진 삭제
 * - URL 업데이트
 */

import { supabase } from './supabase';
import { instructorProfileService } from './instructor-profile.service';

/**
 * 이미지 파일 검증
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 파일 크기 제한 (5MB)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: '파일 크기는 5MB를 초과할 수 없습니다.' };
  }

  // 이미지 형식 검증
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'JPG, PNG, WebP 형식의 이미지만 업로드 가능합니다.' };
  }

  return { valid: true };
}

/**
 * 이미지 리사이즈 (400x400)
 */
async function resizeImage(file: File, maxWidth: number = 400, maxHeight: number = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 비율 유지하면서 리사이즈
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context를 생성할 수 없습니다.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('이미지 변환에 실패했습니다.'));
              return;
            }
            resolve(blob);
          },
          file.type,
          0.9 // 품질 90%
        );
      };

      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };

    reader.readAsDataURL(file);
  });
}

export const instructorPhotoService = {
  /**
   * 강사 사진 업로드
   * @param userId 강사 user ID
   * @param file 업로드할 이미지 파일
   * @returns Public URL
   */
  async uploadPhoto(userId: string, file: File): Promise<string> {
    console.log('📸 사진 업로드 시작:', { userId, fileName: file.name, fileSize: file.size });

    // 1. 파일 검증
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      // 2. 이미지 리사이즈
      console.log('🔄 이미지 리사이즈 중...');
      const resizedBlob = await resizeImage(file);

      // 3. 기존 사진 삭제 (있다면)
      await this.deletePhoto(userId);

      // 4. Supabase Storage에 업로드
      const fileName = `${userId}/profile.${file.type.split('/')[1]}`; // userId/profile.jpg
      console.log('⬆️ Supabase Storage 업로드:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('instructor-photos')
        .upload(fileName, resizedBlob, {
          contentType: file.type,
          upsert: true, // 기존 파일 덮어쓰기
        });

      if (uploadError) {
        console.error('❌ 업로드 실패:', uploadError);
        throw uploadError;
      }

      // 5. Public URL 획득
      const { data: urlData } = supabase.storage
        .from('instructor-photos')
        .getPublicUrl(fileName);

      const photoUrl = urlData.publicUrl;
      console.log('✅ Public URL 생성:', photoUrl);

      // 6. DB에 URL 저장
      await this.updateProfilePhoto(userId, photoUrl);

      console.log('✅ 사진 업로드 완료');
      return photoUrl;
    } catch (error) {
      console.error('❌ 사진 업로드 에러:', error);
      throw error;
    }
  },

  /**
   * DB에 사진 URL 업데이트
   */
  async updateProfilePhoto(userId: string, photoUrl: string): Promise<void> {
    console.log('💾 DB 업데이트:', { userId, photoUrl });

    await instructorProfileService.update(userId, {
      profile_photo_url: photoUrl,
    });
  },

  /**
   * 강사 사진 삭제
   * @param userId 강사 user ID
   */
  async deletePhoto(userId: string): Promise<void> {
    try {
      // 1. Storage에서 파일 목록 조회
      const { data: files, error: listError } = await supabase.storage
        .from('instructor-photos')
        .list(userId);

      if (listError) {
        console.warn('⚠️ 파일 목록 조회 실패:', listError);
        return;
      }

      if (!files || files.length === 0) {
        console.log('ℹ️ 삭제할 파일이 없습니다.');
        return;
      }

      // 2. 모든 파일 삭제
      const filePaths = files.map(file => `${userId}/${file.name}`);
      console.log('🗑️ 파일 삭제 중:', filePaths);

      const { error: deleteError } = await supabase.storage
        .from('instructor-photos')
        .remove(filePaths);

      if (deleteError) {
        console.error('❌ 파일 삭제 실패:', deleteError);
        throw deleteError;
      }

      // 3. DB에서 URL 제거
      await this.updateProfilePhoto(userId, '');

      console.log('✅ 사진 삭제 완료');
    } catch (error) {
      console.error('❌ 사진 삭제 에러:', error);
      throw error;
    }
  },

  /**
   * 사진 URL 가져오기
   * @param userId 강사 user ID
   * @returns 사진 URL 또는 null
   */
  async getPhotoUrl(userId: string): Promise<string | null> {
    try {
      const profile = await instructorProfileService.getByUserId(userId);
      return profile?.profile_photo_url || null;
    } catch (error) {
      console.error('❌ 사진 URL 조회 에러:', error);
      return null;
    }
  },
};
