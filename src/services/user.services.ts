import { supabase } from './supabase'
import { queryCache, withCache } from '../utils/queryCache'

export type UserRole = 'app_admin' | 'course_manager' | 'instructor' | 'trainee'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  first_login: boolean
  department?: string
  employee_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  email: string
  name: string
  phone?: string
  role: UserRole
  department?: string
  employee_id?: string
  initial_password: string
}

export interface UpdateUserData {
  name?: string
  phone?: string
  department?: string
  employee_id?: string
}

export class UserService {
  // 모든 사용자 조회 (캐시 최적화)
  static getUsers = withCache(
    async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('🔧 개발 모드: UserService.getUsers error:', error)
        return this.getMockUsers()
      }
      
      if (!data || data.length === 0) {
        console.warn('🔧 개발 모드: 사용자 데이터 없음, 목업 데이터 사용')
        return UserService.getMockUsers()
      }
      
      return data as User[]
    } catch (error) {
      console.warn('🔧 개발 모드: UserService.getUsers 네트워크 오류, 목업 데이터 사용:', error)
      return UserService.getMockUsers()
    }
    },
    'users',
    2 * 60 * 1000 // 2분 캐시
  );

  // 역할별 사용자 조회 (캐시 최적화)
  static getUsersByRole = withCache(
    async (role: UserRole) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .order('name', { ascending: true })

      if (error) {
        console.error('UserService.getUsersByRole error:', error)
        return UserService.getMockUsers().filter(user => user.role === role)
      }
      
      if (!data || data.length === 0) {
        return UserService.getMockUsers().filter(user => user.role === role)
      }
      
      return data as User[]
    } catch (error) {
      console.error('UserService.getUsersByRole error:', error)
      return UserService.getMockUsers().filter(user => user.role === role)
    }
    },
    'users-by-role',
    3 * 60 * 1000 // 3분 캐시
  );

  // 목업 사용자 데이터
  private static getMockUsers(): User[] {
    return [
      {
        id: 'instructor1',
        email: 'instructor1@company.com',
        name: '김영업 강사',
        role: 'instructor' as UserRole,
        department: '교육팀',
        phone: '010-1234-5678',
        is_active: true,
        first_login: false,
        created_at: '2024-01-01T09:00:00Z',
        updated_at: '2024-01-01T09:00:00Z'
      },
      {
        id: 'instructor2', 
        email: 'instructor2@company.com',
        name: '이전략 강사',
        role: 'instructor' as UserRole,
        department: '교육팀',
        phone: '010-2345-6789',
        is_active: true,
        first_login: false,
        created_at: '2024-01-02T09:00:00Z',
        updated_at: '2024-01-02T09:00:00Z'
      },
      {
        id: 'manager1',
        email: 'manager1@company.com', 
        name: '박관리 매니저',
        role: 'manager' as UserRole,
        department: '인사팀',
        phone: '010-3456-7890',
        is_active: true,
        first_login: false,
        created_at: '2024-01-03T09:00:00Z',
        updated_at: '2024-01-03T09:00:00Z'
      },
      {
        id: 'manager2',
        email: 'manager2@company.com',
        name: '정시스템 매니저', 
        role: 'manager' as UserRole,
        department: 'IT팀',
        phone: '010-4567-8901',
        is_active: true,
        first_login: false,
        created_at: '2024-01-04T09:00:00Z',
        updated_at: '2024-01-04T09:00:00Z'
      }
    ]
  }

  // 특정 사용자 조회
  static async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)

      if (error) {
        console.warn('🔧 개발 모드: getUserById 오류, 기본 사용자 반환:', error);
        // 개발 모드에서는 기본 사용자 반환
        return {
          id: userId,
          email: 'dev@example.com',
          name: '개발자',
          role: 'admin' as UserRole,
          first_login: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as User;
      }
    } catch (error) {
      console.warn('🔧 개발 모드: getUserById 네트워크 오류, 기본 사용자 반환:', error);
      return {
        id: userId,
        email: 'dev@example.com',
        name: '개발자',
        role: 'admin' as UserRole,
        first_login: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User;
    }
    
    // 데이터가 없는 경우 사용자 생성 시도
    if (!data || data.length === 0) {
      console.warn(`사용자 ID ${userId}를 찾을 수 없음. Auth 정보 확인 중...`);
      
      // Auth에서 사용자 정보 가져오기
      const { data: authUser } = await supabase.auth.getUser();
      
      if (authUser.user && authUser.user.id === userId) {
        // users 테이블에 사용자 생성
        const newUserData = {
          id: authUser.user.id,
          email: authUser.user.email || '',
          name: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'Unknown',
          role: 'trainee' as UserRole,
          first_login: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        
        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUserData)
          .select()
          .single();
          
        if (createError) {
          console.error('사용자 생성 오류:', createError);
          throw new Error('사용자 정보를 생성할 수 없습니다: ' + createError.message);
        }
        
        return createdUser as User;
      }
      
      throw new Error('사용자를 찾을 수 없습니다');
    }
    
    if (data.length > 1) {
      console.warn(`사용자 ID ${userId}에 대해 여러 행이 발견됨:`, data.length);
    }
    
    return data[0] as User;
  }

  // 역할별 사용자 수 조회
  static async getUserStats() {
    const { data, error } = await supabase
      .from('users')
      .select('role')

    if (error) throw error

    const stats = {
      app_admin: 0,
      course_manager: 0,
      instructor: 0,
      trainee: 0,
      total: 0
    }

    data?.forEach(user => {
      stats[user.role as UserRole]++
      stats.total++
    })

    return stats
  }

  // 사용자 역할 업데이트
  static async updateUserRole(userId: string, newRole: UserRole) {
    // 기존 역할 확인
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    // 역할 업데이트
    const { data, error } = await supabase
      .from('users')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error;

    // instructor 역할로 변경되었고, 이전 역할이 instructor가 아닌 경우
    if (newRole === 'instructor' && currentUser.role !== 'instructor') {
      console.log(`사용자 ${userId}를 instructor 역할로 변경 - 강사 정보 자동 생성 시도`);
      
      try {
        // 이미 강사 정보가 있는지 확인
        const { data: existingInstructor, error: checkError } = await supabase
          .from('instructors')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('강사 정보 확인 중 오류:', checkError);
          throw checkError;
        }

        // 강사 정보가 없는 경우에만 생성
        if (!existingInstructor) {
          
          const { data: insertedInstructor, error: instructorError } = await supabase
            .from('instructors')
            .insert({
              user_id: userId,
              bio: '강사 소개를 입력해주세요.',
              specializations: [],
              years_of_experience: 0,
              education_background: '학력 정보를 입력해주세요.',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (instructorError) {
            console.error('강사 정보 자동 생성 실패:', instructorError);
            
            // 테이블이 존재하지 않는 경우 안내
            if (instructorError.message?.includes('relation "instructors" does not exist')) {
              throw new Error('강사 테이블이 존재하지 않습니다. 관리자에게 문의하여 데이터베이스 스키마를 생성해주세요.');
            }
            
            // 권한 문제인 경우 안내
            if (instructorError.message?.includes('permission denied') || instructorError.message?.includes('권한')) {
              throw new Error('강사 정보 생성 권한이 없습니다. 관리자에게 문의해주세요.');
            }
            
            throw instructorError;
          } else {
          }
        } else {
        }
      } catch (autoCreateError) {
        // 자동 생성 실패해도 역할 변경은 유지
        console.error('강사 정보 자동 생성 중 오류:', autoCreateError);
        // 사용자에게 알림 (선택사항 - 너무 많은 알림이 나올 수 있어 주석 처리)
        // throw new Error(`사용자 역할은 변경되었지만 강사 정보 생성에 실패했습니다: ${autoCreateError.message}`);
      }
    }

    return data as User
  }

  // 사용자 정보 업데이트 (이름, 전화번호, 부서, 사번)
  static async updateUser(userId: string, updateData: UpdateUserData) {
    
    // 필수 필드만 포함하여 업데이트 (phone, department, employee_id는 조건부)
    const updatePayload: any = {
      name: updateData.name,
      updated_at: new Date().toISOString()
    };
    
    // phone 컬럼이 있는 경우에만 추가
    if (updateData.phone !== undefined) {
      updatePayload.phone = updateData.phone;
    }
    
    // department 컬럼이 있는 경우에만 추가  
    if (updateData.department !== undefined) {
      updatePayload.department = updateData.department;
    }
    
    // employee_id 컬럼이 있는 경우에만 추가
    if (updateData.employee_id !== undefined) {
      updatePayload.employee_id = updateData.employee_id;
    }
    
    
    const { data, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('사용자 정보 업데이트 실패:', error);
      
      // phone 컬럼 관련 오류인 경우 phone 없이 재시도
      if (error.message && error.message.includes('phone')) {
        const { phone, ...updatePayloadWithoutPhone } = updatePayload;
        
        const { data: retryData, error: retryError } = await supabase
          .from('users')
          .update(updatePayloadWithoutPhone)
          .eq('id', userId)
          .select()
          .single();
          
        if (retryError) {
          console.error('phone 없이 재시도도 실패:', retryError);
          throw retryError;
        }
        
        return retryData as User;
      }
      
      throw error;
    }
    
    return data as User
  }

  // 사용자 상태 업데이트 (활성/비활성)
  static async updateUserStatus(userId: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as User
  }

  // 단일 사용자 생성 (데이터베이스 함수 사용)
  static async createUser(userData: CreateUserData) {
    let newUser: User;

    try {
      // 데이터베이스 함수를 통한 사용자 생성
      const { data, error } = await supabase.rpc('create_user_by_admin', {
        user_name: userData.name,
        user_email: userData.email,
        user_phone: userData.phone || null,
        user_role: userData.role
      });

      if (error) throw error;

      // 생성된 사용자 정보 반환
      const { data: fetchedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) throw fetchError;
      newUser = fetchedUser;
    } catch (error) {
      // 함수가 없는 경우 직접 users 테이블에 삽입
      const { data, error: insertError } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          email: userData.email,
          name: userData.name,
          role: userData.role,
          department: userData.department,
          employee_id: userData.employee_id,
          first_login: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;
      newUser = data;
    }

    // instructor 역할인 경우 자동으로 강사 정보 생성
    if (userData.role === 'instructor') {
      console.log(`새 사용자 ${newUser.id}가 instructor 역할 - 강사 정보 자동 생성 시도`);
      
      try {
        const { data: insertedInstructor, error: instructorError } = await supabase
          .from('instructors')
          .insert({
            user_id: newUser.id,
            bio: '강사 소개를 입력해주세요.',
            specializations: [],
            years_of_experience: 0,
            education_background: '학력 정보를 입력해주세요.',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (instructorError) {
          console.error('강사 정보 자동 생성 실패:', instructorError);
          
          // 테이블이 존재하지 않는 경우 안내
          if (instructorError.message?.includes('relation "instructors" does not exist')) {
            throw new Error('강사 테이블이 존재하지 않습니다. 관리자에게 문의하여 데이터베이스 스키마를 생성해주세요.');
          }
          
          // 권한 문제인 경우 안내
          if (instructorError.message?.includes('permission denied') || instructorError.message?.includes('권한')) {
            throw new Error('강사 정보 생성 권한이 없습니다. 관리자에게 문의해주세요.');
          }
          
          throw instructorError;
        } else {
        }
      } catch (autoCreateError) {
        // 자동 생성 실패해도 사용자 생성은 유지
        console.error('강사 정보 자동 생성 중 오류:', autoCreateError);
        // 사용자에게 알림 (선택사항)
        console.warn(`사용자는 생성되었지만 강사 정보 생성에 실패했습니다: ${autoCreateError instanceof Error ? autoCreateError.message : String(autoCreateError)}`);
      }
    }

    return newUser;
  }

  // 엑셀 데이터로 일괄 사용자 생성
  static async createBulkUsers(users: CreateUserData[]) {
    const results = {
      success: [] as User[],
      failed: [] as { user: CreateUserData; error: string }[]
    }

    for (const user of users) {
      try {
        const created = await this.createUser(user)
        results.success.push(created)
      } catch (error: any) {
        results.failed.push({
          user,
          error: error.message || '알 수 없는 오류'
        })
      }
    }

    return results
  }

  // 비밀번호 초기화
  static async resetPassword(userId: string, newPassword: string) {
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (error) throw error

    // first_login을 true로 설정
    await supabase
      .from('users')
      .update({ 
        first_login: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    return true
  }

  // 사용자 검색
  static async searchUsers(query: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%`)
      .order('name')

    if (error) throw error
    return data as User[]
  }

  // 기존 instructor 역할 사용자들을 위한 강사 정보 자동 생성 (마이그레이션)
  static async migrateInstructorsToInstructorTable() {
    try {
      
      // instructor 역할을 가진 모든 사용자 조회
      const { data: instructorUsers, error: fetchError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'instructor');


      if (fetchError) {
        console.error('강사 사용자 조회 실패:', fetchError);
        throw fetchError;
      }

      if (!instructorUsers || instructorUsers.length === 0) {
        return { success: 0, failed: 0 };
      }


      let successCount = 0;
      let failedCount = 0;
      const results = [];

      for (const user of instructorUsers) {
        try {
          
          // 이미 강사 정보가 있는지 확인
          const { data: existingInstructor, error: checkError } = await supabase
            .from('instructors')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error(`강사 ${user.name} 정보 확인 중 오류:`, checkError);
            throw checkError;
          }

          // 강사 정보가 없는 경우에만 생성
          if (!existingInstructor) {
            
            const { data: insertedInstructor, error: insertError } = await supabase
              .from('instructors')
              .insert({
                user_id: user.id,
                bio: `${user.name} 강사입니다. 프로필을 업데이트해주세요.`,
                specializations: [],
                years_of_experience: 0,
                education_background: '학력 정보를 입력해주세요.',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (insertError) {
              console.error(`강사 ${user.name} 정보 생성 실패:`, insertError);
              
              let errorMessage = insertError.message;
              
              // 테이블이 존재하지 않는 경우
              if (insertError.message?.includes('relation "instructors" does not exist')) {
                errorMessage = '강사 테이블이 존재하지 않습니다. 데이터베이스 스키마 생성 필요';
              }
              
              // 권한 문제인 경우
              if (insertError.message?.includes('permission denied') || insertError.message?.includes('권한')) {
                errorMessage = '권한이 없습니다. 관리자 권한 필요';
              }
              
              results.push({ name: user.name, status: 'failed', error: errorMessage });
              failedCount++;
            } else {
              results.push({ name: user.name, status: 'success' });
              successCount++;
            }
          } else {
            results.push({ name: user.name, status: 'already_exists' });
          }
        } catch (error) {
          console.error(`강사 ${user.name} 처리 중 오류:`, error);
          results.push({ name: user.name, status: 'failed', error: error instanceof Error ? error.message : String(error) });
          failedCount++;
        }
      }

      return { success: successCount, failed: failedCount, details: results };
    } catch (error) {
      console.error('강사 마이그레이션 중 오류:', error);
      throw error;
    }
  }
}