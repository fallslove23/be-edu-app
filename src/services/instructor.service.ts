import { supabase } from './supabase';
import type {
  Instructor,
  Certification,
  TeachingSubject,
  CreateInstructorData,
  UpdateInstructorData,
  CreateCertificationData,
  CreateTeachingSubjectData,
  InstructorStats
} from '../types/instructor.types';

// 강사 서비스 클래스
export class InstructorService {
  // 모든 강사 목록 조회
  static async getInstructors(activeOnly: boolean = false): Promise<Instructor[]> {
    try {
      // 먼저 기본 강사 정보만 조회해보기
      let basicQuery = supabase
        .from('instructors')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeOnly) {
        basicQuery = basicQuery.eq('is_active', true);
      }

      const { data: basicData, error: basicError } = await basicQuery;
      
      if (basicError) {
        console.error('기본 강사 정보 조회 오류:', basicError);
        throw basicError;
      }

      if (!basicData || basicData.length === 0) {
        console.log('강사 데이터가 없습니다.');
        return [];
      }

      // users 테이블과 JOIN하여 추가 정보 가져오기
      let query = supabase
        .from('instructors')
        .select(`
          *,
          user:users!instructors_user_id_fkey(name, email, phone),
          certifications:instructor_certifications(*),
          teaching_subjects:instructor_teaching_subjects(*)
        `)
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('JOIN 쿼리 오류, 기본 데이터로 fallback:', error);
        // JOIN이 실패하면 기본 데이터로 fallback
        return basicData.map(instructor => ({
          ...instructor,
          name: '사용자 정보 없음',
          email: '이메일 없음',
          phone: '',
          certifications: [],
          teaching_subjects: []
        }));
      }
      
      // users 테이블의 정보를 instructors 레벨로 플래튼
      return (data || []).map(instructor => ({
        ...instructor,
        name: instructor.user?.name || '이름 없음',
        email: instructor.user?.email || '이메일 없음',
        phone: instructor.user?.phone || ''
      }));
      
    } catch (error) {
      console.error('강사 목록 조회 중 예외 발생:', error);
      throw error;
    }
  }

  // 특정 강사 조회
  static async getInstructorById(id: string): Promise<Instructor | null> {
    const { data, error } = await supabase
      .from('instructors')
      .select(`
        *,
        user:users(name, email, phone),
        certifications:instructor_certifications(*),
        teaching_subjects:instructor_teaching_subjects(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    // users 테이블의 정보를 instructors 레벨로 플래튼
    return {
      ...data,
      name: data.user?.name || '',
      email: data.user?.email || '',
      phone: data.user?.phone || ''
    };
  }

  // 사용자 ID로 강사 조회
  static async getInstructorByUserId(userId: string): Promise<Instructor | null> {
    const { data, error } = await supabase
      .from('instructors')
      .select(`
        *,
        user:users(name, email, phone),
        certifications:instructor_certifications(*),
        teaching_subjects:instructor_teaching_subjects(*)
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    // users 테이블의 정보를 instructors 레벨로 플래튼
    return {
      ...data,
      name: data.user?.name || '',
      email: data.user?.email || '',
      phone: data.user?.phone || ''
    };
  }

  // 강사 생성
  static async createInstructor(instructorData: CreateInstructorData): Promise<Instructor> {
    // email, name, phone은 users 테이블에 있으므로 제외
    const { name, email, phone, ...instructorOnlyData } = instructorData as any;
    
    const { data, error } = await supabase
      .from('instructors')
      .insert({
        ...instructorOnlyData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        user:users(name, email, phone),
        certifications:instructor_certifications(*),
        teaching_subjects:instructor_teaching_subjects(*)
      `)
      .single();

    if (error) throw error;
    
    // users 테이블의 정보를 instructors 레벨로 플래튼
    return {
      ...data,
      name: data.user?.name || '',
      email: data.user?.email || '',
      phone: data.user?.phone || ''
    };
  }

  // 강사 정보 업데이트
  static async updateInstructor(id: string, updateData: UpdateInstructorData): Promise<Instructor> {
    // email, name, phone은 users 테이블에 있으므로 제외
    const { name, email, phone, ...instructorOnlyData } = updateData as any;
    
    const { data, error } = await supabase
      .from('instructors')
      .update({
        ...instructorOnlyData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        user:users(name, email, phone),
        certifications:instructor_certifications(*),
        teaching_subjects:instructor_teaching_subjects(*)
      `)
      .single();

    if (error) throw error;
    
    // users 테이블의 정보를 instructors 레벨로 플래튼
    return {
      ...data,
      name: data.user?.name || '',
      email: data.user?.email || '',
      phone: data.user?.phone || ''
    };
  }

  // 강사 삭제 (비활성화)
  static async deleteInstructor(id: string): Promise<void> {
    const { error } = await supabase
      .from('instructors')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  // 프로필 이미지 업로드
  static async uploadProfileImage(instructorId: string, imageFile: File): Promise<string> {
    const fileName = `${instructorId}_${Date.now()}_${imageFile.name}`;
    const filePath = `instructors/profiles/${fileName}`;

    // Supabase Storage에 이미지 업로드
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // 강사 프로필에 이미지 URL 업데이트
    await this.updateInstructor(instructorId, { 
      profile_image_url: publicUrl 
    });

    return publicUrl;
  }

  // 자격증 추가
  static async addCertification(instructorId: string, certificationData: CreateCertificationData): Promise<Certification> {
    const { data, error } = await supabase
      .from('instructor_certifications')
      .insert({
        instructor_id: instructorId,
        ...certificationData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 자격증 삭제
  static async removeCertification(certificationId: string): Promise<void> {
    const { error } = await supabase
      .from('instructor_certifications')
      .delete()
      .eq('id', certificationId);

    if (error) throw error;
  }

  // 담당 과목 추가
  static async addTeachingSubject(instructorId: string, subjectData: CreateTeachingSubjectData): Promise<TeachingSubject> {
    const { data, error } = await supabase
      .from('instructor_teaching_subjects')
      .insert({
        instructor_id: instructorId,
        ...subjectData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 담당 과목 삭제
  static async removeTeachingSubject(subjectId: string): Promise<void> {
    const { error } = await supabase
      .from('instructor_teaching_subjects')
      .delete()
      .eq('id', subjectId);

    if (error) throw error;
  }

  // 강사 통계 조회
  static async getInstructorStats(): Promise<InstructorStats> {
    const instructors = await this.getInstructors();
    
    const stats: InstructorStats = {
      total_instructors: instructors.length,
      active_instructors: instructors.filter(i => i.is_active).length,
      total_courses_taught: 0, // 실제로는 courses 테이블과 조인해서 계산
      average_experience: 0,
      specializations_distribution: {}
    };

    if (instructors.length > 0) {
      // 평균 경력 계산
      const totalExperience = instructors.reduce((sum, instructor) => sum + instructor.years_of_experience, 0);
      stats.average_experience = Math.round(totalExperience / instructors.length * 10) / 10;

      // 전문 분야 분포 계산
      instructors.forEach(instructor => {
        if (instructor.specializations) {
          instructor.specializations.forEach(spec => {
            stats.specializations_distribution[spec] = (stats.specializations_distribution[spec] || 0) + 1;
          });
        }
      });
    }

    return stats;
  }

  // 강사별 담당 과정 수 조회
  static async getInstructorCourseCount(instructorId: string): Promise<number> {
    const { count, error } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', instructorId);

    if (error) throw error;
    return count || 0;
  }

  // 전문 분야 목록 조회 (중복 제거)
  static async getSpecializationsList(): Promise<string[]> {
    const { data, error } = await supabase
      .from('instructors')
      .select('specializations');

    if (error) throw error;

    const allSpecializations = data?.flatMap(item => item.specializations || []) || [];
    return [...new Set(allSpecializations)].sort();
  }
}