// 파일 관리 유틸리티 - 600명 규모 최적화
export interface FileInfo {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  category: 'course_material' | 'assignment' | 'profile' | 'certificate' | 'other';
  uploadedBy: string;
  uploadedAt: string;
  courseName?: string;
  courseId?: string;
  url?: string;
  thumbnail?: string;
  description?: string;
  isPublic: boolean;
  downloadCount: number;
  tags: string[];
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// 파일 타입별 설정
export const FILE_CONFIGS = {
  // 허용된 파일 타입
  ALLOWED_TYPES: {
    documents: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    videos: ['.mp4', '.webm', '.ogg', '.avi', '.mov'],
    audio: ['.mp3', '.wav', '.ogg', '.m4a'],
    archives: ['.zip', '.rar', '.7z', '.tar', '.gz']
  },
  
  // 파일 크기 제한 (MB)
  MAX_SIZES: {
    documents: 10,
    images: 5,
    videos: 100,
    audio: 50,
    archives: 50,
    default: 10
  },
  
  // 사용자별 총 용량 제한 (MB)
  USER_QUOTA: {
    admin: 1000,
    manager: 500,
    instructor: 300,
    trainee: 100
  }
};

export class FileManager {
  private static readonly STORAGE_KEY = 'bs_file_storage';
  private static readonly METADATA_KEY = 'bs_file_metadata';

  // 파일 유효성 검사
  static validateFile(file: File, category: string): { valid: boolean; error?: string } {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const fileSizeMB = file.size / (1024 * 1024);
    
    // 파일 확장자 검사
    const allowedTypes = Object.values(FILE_CONFIGS.ALLOWED_TYPES).flat();
    if (!allowedTypes.includes(extension)) {
      return {
        valid: false,
        error: `허용되지 않은 파일 형식입니다. (${extension})`
      };
    }
    
    // 파일 크기 검사
    const categoryKey = this.getCategoryKey(extension);
    const maxSize = FILE_CONFIGS.MAX_SIZES[categoryKey] || FILE_CONFIGS.MAX_SIZES.default;
    
    if (fileSizeMB > maxSize) {
      return {
        valid: false,
        error: `파일 크기가 너무 큽니다. (최대 ${maxSize}MB)`
      };
    }
    
    return { valid: true };
  }

  // 사용자 용량 체크
  static async checkUserQuota(userId: string, userRole: string, additionalSize: number): Promise<{ allowed: boolean; currentUsage: number; quota: number }> {
    const currentUsage = await this.getUserStorageUsage(userId);
    const quota = FILE_CONFIGS.USER_QUOTA[userRole as keyof typeof FILE_CONFIGS.USER_QUOTA] || FILE_CONFIGS.USER_QUOTA.trainee;
    const quotaInBytes = quota * 1024 * 1024;
    
    return {
      allowed: (currentUsage + additionalSize) <= quotaInBytes,
      currentUsage: currentUsage / (1024 * 1024), // MB 단위로 변환
      quota
    };
  }

  // 파일 업로드 (브라우저 저장소 사용)
  static async uploadFile(
    file: File, 
    metadata: Partial<FileInfo>, 
    onProgress?: (progress: number) => void
  ): Promise<FileInfo> {
    return new Promise((resolve, reject) => {
      const fileId = this.generateFileId();
      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      };
      
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          
          const fileInfo: FileInfo = {
            id: fileId,
            name: this.sanitizeFileName(file.name),
            originalName: file.name,
            size: file.size,
            type: file.type,
            category: metadata.category || 'other',
            uploadedBy: metadata.uploadedBy || 'unknown',
            uploadedAt: new Date().toISOString(),
            courseName: metadata.courseName,
            courseId: metadata.courseId,
            description: metadata.description,
            isPublic: metadata.isPublic || false,
            downloadCount: 0,
            tags: metadata.tags || [],
            url: `file://${fileId}` // 로컬 참조
          };
          
          // 썸네일 생성 (이미지인 경우)
          if (file.type.startsWith('image/')) {
            fileInfo.thumbnail = await this.generateThumbnail(base64Data, 200);
          }
          
          // 파일 데이터 저장
          await this.saveFileData(fileId, base64Data);
          
          // 메타데이터 저장
          await this.saveFileMetadata(fileInfo);
          
          onProgress?.(100);
          resolve(fileInfo);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('파일 읽기 실패'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  // 여러 파일 일괄 업로드
  static async uploadMultipleFiles(
    files: File[],
    metadata: Partial<FileInfo>,
    onProgress?: (fileId: string, progress: number) => void,
    onFileComplete?: (fileInfo: FileInfo) => void
  ): Promise<FileInfo[]> {
    const results: FileInfo[] = [];
    
    for (const file of files) {
      try {
        const fileInfo = await this.uploadFile(
          file,
          metadata,
          (progress) => onProgress?.(file.name, progress)
        );
        results.push(fileInfo);
        onFileComplete?.(fileInfo);
      } catch (error) {
        console.error(`파일 업로드 실패: ${file.name}`, error);
      }
    }
    
    return results;
  }

  // 파일 목록 조회
  static async getFiles(filter: {
    category?: string;
    courseId?: string;
    uploadedBy?: string;
    isPublic?: boolean;
    tags?: string[];
    searchTerm?: string;
  } = {}): Promise<FileInfo[]> {
    const allFiles = await this.getAllFileMetadata();
    
    return allFiles.filter(file => {
      if (filter.category && file.category !== filter.category) return false;
      if (filter.courseId && file.courseId !== filter.courseId) return false;
      if (filter.uploadedBy && file.uploadedBy !== filter.uploadedBy) return false;
      if (filter.isPublic !== undefined && file.isPublic !== filter.isPublic) return false;
      if (filter.tags && !filter.tags.some(tag => file.tags.includes(tag))) return false;
      if (filter.searchTerm && !file.name.toLowerCase().includes(filter.searchTerm.toLowerCase())) return false;
      
      return true;
    });
  }

  // 파일 다운로드
  static async downloadFile(fileId: string): Promise<void> {
    const fileInfo = await this.getFileMetadata(fileId);
    if (!fileInfo) {
      throw new Error('파일을 찾을 수 없습니다');
    }
    
    const fileData = await this.getFileData(fileId);
    if (!fileData) {
      throw new Error('파일 데이터를 불러올 수 없습니다');
    }
    
    // 다운로드 카운트 증가
    fileInfo.downloadCount++;
    await this.saveFileMetadata(fileInfo);
    
    // 파일 다운로드
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileInfo.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 파일 삭제
  static async deleteFile(fileId: string): Promise<void> {
    await this.removeFileData(fileId);
    await this.removeFileMetadata(fileId);
  }

  // 파일 미리보기 URL 생성
  static async getPreviewUrl(fileId: string): Promise<string | null> {
    const fileData = await this.getFileData(fileId);
    return fileData;
  }

  // 사용자별 저장 용량 사용량 조회
  static async getUserStorageUsage(userId: string): Promise<number> {
    const userFiles = await this.getFiles({ uploadedBy: userId });
    return userFiles.reduce((total, file) => total + file.size, 0);
  }

  // 저장 공간 정리
  static async cleanupStorage(): Promise<{ removedFiles: number; freedSpace: number }> {
    const allFiles = await this.getAllFileMetadata();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    let removedFiles = 0;
    let freedSpace = 0;
    
    for (const file of allFiles) {
      const uploadDate = new Date(file.uploadedAt);
      
      // 30일 이상 된 임시 파일 삭제
      if (uploadDate < thirtyDaysAgo && file.category === 'other' && file.downloadCount === 0) {
        await this.deleteFile(file.id);
        removedFiles++;
        freedSpace += file.size;
      }
    }
    
    return { removedFiles, freedSpace };
  }

  // 프라이빗 메서드들
  private static generateFileId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private static getCategoryKey(extension: string): keyof typeof FILE_CONFIGS.MAX_SIZES {
    for (const [category, extensions] of Object.entries(FILE_CONFIGS.ALLOWED_TYPES)) {
      if (extensions.includes(extension)) {
        return category as keyof typeof FILE_CONFIGS.MAX_SIZES;
      }
    }
    return 'default';
  }

  private static async generateThumbnail(base64Data: string, maxSize: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = base64Data;
    });
  }

  private static async saveFileData(fileId: string, data: string): Promise<void> {
    try {
      localStorage.setItem(`${this.STORAGE_KEY}_${fileId}`, data);
    } catch (error) {
      throw new Error('저장 공간이 부족합니다. 불필요한 파일을 삭제해주세요.');
    }
  }

  private static async getFileData(fileId: string): Promise<string | null> {
    return localStorage.getItem(`${this.STORAGE_KEY}_${fileId}`);
  }

  private static async removeFileData(fileId: string): Promise<void> {
    localStorage.removeItem(`${this.STORAGE_KEY}_${fileId}`);
  }

  private static async saveFileMetadata(fileInfo: FileInfo): Promise<void> {
    const allMetadata = await this.getAllFileMetadata();
    const index = allMetadata.findIndex(f => f.id === fileInfo.id);
    
    if (index >= 0) {
      allMetadata[index] = fileInfo;
    } else {
      allMetadata.push(fileInfo);
    }
    
    localStorage.setItem(this.METADATA_KEY, JSON.stringify(allMetadata));
  }

  private static async getFileMetadata(fileId: string): Promise<FileInfo | null> {
    const allMetadata = await this.getAllFileMetadata();
    return allMetadata.find(f => f.id === fileId) || null;
  }

  private static async getAllFileMetadata(): Promise<FileInfo[]> {
    const stored = localStorage.getItem(this.METADATA_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private static async removeFileMetadata(fileId: string): Promise<void> {
    const allMetadata = await this.getAllFileMetadata();
    const filtered = allMetadata.filter(f => f.id !== fileId);
    localStorage.setItem(this.METADATA_KEY, JSON.stringify(filtered));
  }

  // 파일 형식별 아이콘 반환
  static getFileIcon(fileName: string): string {
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();
    
    if (FILE_CONFIGS.ALLOWED_TYPES.documents.includes(extension)) {
      if (['.pdf'].includes(extension)) return '📄';
      if (['.doc', '.docx'].includes(extension)) return '📝';
      if (['.ppt', '.pptx'].includes(extension)) return '📊';
      if (['.xls', '.xlsx'].includes(extension)) return '📈';
      return '📄';
    }
    
    if (FILE_CONFIGS.ALLOWED_TYPES.images.includes(extension)) return '🖼️';
    if (FILE_CONFIGS.ALLOWED_TYPES.videos.includes(extension)) return '🎥';
    if (FILE_CONFIGS.ALLOWED_TYPES.audio.includes(extension)) return '🎵';
    if (FILE_CONFIGS.ALLOWED_TYPES.archives.includes(extension)) return '🗜️';
    
    return '📁';
  }

  // 파일 크기를 읽기 쉬운 형태로 변환
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}