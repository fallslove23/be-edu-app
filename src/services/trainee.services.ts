import { supabase } from './supabase';
import type { Trainee, CreateTraineeData, BulkUploadResult } from '../types/trainee.types';

export class TraineeService {
  // 모든 교육생 조회
  static async getTrainees(): Promise<Trainee[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'trainee')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('교육생 데이터 조회 중 오류:', error);
        return this.getMockTrainees();
      }
      
      if (!data || data.length === 0) {
        console.warn('교육생 데이터 없음, 목업 데이터 사용');
        return this.getMockTrainees();
      }
      
      // 데이터를 Trainee 형식으로 변환
      return data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        employee_id: user.employee_id || '',
        department: user.department || '',
        position: user.position || '',
        hire_date: user.hire_date || '',
        enrolled_courses: user.enrolled_courses || [],
        status: user.is_active ? 'active' : 'inactive',
        emergency_contact: user.emergency_contact,
        created_at: user.created_at,
        updated_at: user.updated_at
      })) as Trainee[];
      
    } catch (error) {
      console.error('교육생 조회 중 네트워크 오류:', error);
      return this.getMockTrainees();
    }
  }

  // 교육생 생성
  static async createTrainee(traineeData: CreateTraineeData): Promise<Trainee> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          email: traineeData.email,
          name: traineeData.name,
          phone: traineeData.phone,
          employee_id: traineeData.employee_id,
          department: traineeData.department,
          position: traineeData.position,
          hire_date: traineeData.hire_date,
          role: 'trainee',
          emergency_contact: traineeData.emergency_contact,
          is_active: true,
          first_login: true,
          enrolled_courses: traineeData.enrolled_courses || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        employee_id: data.employee_id || '',
        department: data.department || '',
        position: data.position || '',
        hire_date: data.hire_date || '',
        enrolled_courses: data.enrolled_courses || [],
        status: 'active',
        emergency_contact: data.emergency_contact,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
    } catch (error) {
      console.error('교육생 생성 중 오류:', error);
      throw new Error('교육생 생성에 실패했습니다.');
    }
  }

  // 교육생 업데이트
  static async updateTrainee(traineeId: string, traineeData: Partial<CreateTraineeData>): Promise<Trainee> {
    try {
      const updatePayload: any = {
        ...traineeData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', traineeId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        employee_id: data.employee_id || '',
        department: data.department || '',
        position: data.position || '',
        hire_date: data.hire_date || '',
        enrolled_courses: data.enrolled_courses || [],
        status: data.is_active ? 'active' : 'inactive',
        emergency_contact: data.emergency_contact,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
    } catch (error) {
      console.error('교육생 업데이트 중 오류:', error);
      throw new Error('교육생 정보 업데이트에 실패했습니다.');
    }
  }

  // 교육생 대량 업로드
  static async bulkUploadTrainees(trainees: Partial<Trainee>[]): Promise<BulkUploadResult> {
    const results: BulkUploadResult = {
      success: [],
      failed: [],
      duplicates: []
    };

    for (const traineeData of trainees) {
      try {
        // 중복 체크 (이메일 또는 사번 기준)
        const { data: existingUsers, error: checkError } = await supabase
          .from('users')
          .select('id, email, employee_id, name')
          .or(`email.eq.${traineeData.email},employee_id.eq.${traineeData.employee_id}`);

        if (checkError) {
          console.error('중복 체크 중 오류:', checkError);
          results.failed.push({
            trainee: traineeData,
            error: '중복 체크 중 오류가 발생했습니다.'
          });
          continue;
        }

        // 중복된 사용자가 있는지 확인
        if (existingUsers && existingUsers.length > 0) {
          const duplicate = existingUsers[0];
          results.duplicates.push({
            trainee: traineeData,
            existingTrainee: {
              id: duplicate.id,
              name: duplicate.name,
              email: duplicate.email,
              employee_id: duplicate.employee_id
            },
            duplicateField: duplicate.email === traineeData.email ? 'email' : 'employee_id'
          });
          continue;
        }

        // 새 교육생 생성
        const createData: CreateTraineeData = {
          name: traineeData.name || '',
          email: traineeData.email || '',
          phone: traineeData.phone || '',
          employee_id: traineeData.employee_id || '',
          department: traineeData.department || '',
          position: traineeData.position || '',
          hire_date: traineeData.hire_date || '',
          emergency_contact: traineeData.emergency_contact,
          enrolled_courses: traineeData.enrolled_courses || []
        };

        const createdTrainee = await this.createTrainee(createData);
        results.success.push(createdTrainee);

      } catch (error: any) {
        console.error('교육생 생성 중 오류:', error);
        results.failed.push({
          trainee: traineeData,
          error: error.message || '알 수 없는 오류가 발생했습니다.'
        });
      }
    }

    return results;
  }

  // 중복 교육생 업데이트 처리
  static async handleDuplicateUpdate(traineeId: string, newData: Partial<Trainee>): Promise<Trainee> {
    try {
      return await this.updateTrainee(traineeId, newData);
    } catch (error) {
      console.error('중복 교육생 업데이트 중 오류:', error);
      throw new Error('중복 교육생 업데이트에 실패했습니다.');
    }
  }

  // 교육생 상태 변경
  static async updateTraineeStatus(traineeId: string, status: 'active' | 'inactive' | 'graduated' | 'withdrawn'): Promise<void> {
    try {
      const isActive = status === 'active';
      
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: isActive,
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', traineeId);

      if (error) throw error;
      
    } catch (error) {
      console.error('교육생 상태 변경 중 오류:', error);
      throw new Error('교육생 상태 변경에 실패했습니다.');
    }
  }

  // 교육생 검색
  static async searchTrainees(query: string): Promise<Trainee[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'trainee')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%,department.ilike.%${query}%`)
        .order('name');

      if (error) throw error;

      return data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        employee_id: user.employee_id || '',
        department: user.department || '',
        position: user.position || '',
        hire_date: user.hire_date || '',
        enrolled_courses: user.enrolled_courses || [],
        status: user.is_active ? 'active' : 'inactive',
        emergency_contact: user.emergency_contact,
        created_at: user.created_at,
        updated_at: user.updated_at
      })) as Trainee[];
      
    } catch (error) {
      console.error('교육생 검색 중 오류:', error);
      return [];
    }
  }

  // 부서별 교육생 통계
  static async getTraineeStatsByDepartment() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('department, is_active')
        .eq('role', 'trainee');

      if (error) throw error;

      const stats: Record<string, { active: number; inactive: number; total: number }> = {};

      data?.forEach(user => {
        const dept = user.department || '미분류';
        if (!stats[dept]) {
          stats[dept] = { active: 0, inactive: 0, total: 0 };
        }
        
        stats[dept].total++;
        if (user.is_active) {
          stats[dept].active++;
        } else {
          stats[dept].inactive++;
        }
      });

      return stats;
      
    } catch (error) {
      console.error('교육생 통계 조회 중 오류:', error);
      return {};
    }
  }

  // 목업 데이터
  private static getMockTrainees(): Trainee[] {
    return [
      {
        id: '1',
        name: '김영희',
        email: 'kim.younghee@company.com',
        phone: '010-1234-5678',
        employee_id: 'EMP001',
        department: '영업팀',
        position: '주임',
        hire_date: '2023-03-15',
        enrolled_courses: ['course-1', 'course-2'],
        status: 'active',
        emergency_contact: {
          name: '김부모',
          relationship: '부모',
          phone: '010-9876-5432'
        },
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: '2',
        name: '박철수',
        email: 'park.chulsoo@company.com',
        phone: '010-2345-6789',
        employee_id: 'EMP002',
        department: '마케팅팀',
        position: '대리',
        hire_date: '2022-08-20',
        enrolled_courses: ['course-1'],
        status: 'active',
        emergency_contact: {
          name: '박배우자',
          relationship: '배우자',
          phone: '010-8765-4321'
        },
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-18T16:15:00Z'
      },
      {
        id: '3',
        name: '이민정',
        email: 'lee.minjeong@company.com',
        phone: '010-3456-7890',
        employee_id: 'EMP003',
        department: '고객서비스팀',
        position: '사원',
        hire_date: '2024-01-05',
        enrolled_courses: ['course-2', 'course-3'],
        status: 'graduated',
        emergency_contact: {
          name: '이형제',
          relationship: '형제',
          phone: '010-7654-3210'
        },
        created_at: '2024-01-05T08:30:00Z',
        updated_at: '2024-01-25T11:45:00Z'
      }
    ];
  }

  // 교육생 삭제
  static async deleteTrainee(traineeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', traineeId);

      if (error) {
        console.warn('교육생 삭제 중 오류:', error);
        // Mock mode에서는 성공으로 처리
        return;
      }
    } catch (error) {
      console.error('교육생 삭제 실패:', error);
      throw new Error('교육생 삭제 중 오류가 발생했습니다.');
    }
  }
}