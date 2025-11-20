import { supabase } from './supabase'
import { queryCache, withCache } from '../utils/queryCache'
import { User, UserRole, UserStatus } from '../types/auth.types'

// Re-export types for convenience
export type { User, UserRole, UserStatus } from '../types/auth.types'

export interface CreateUserData {
  email: string
  name: string
  phone?: string
  role: UserRole
  department?: string
  employee_id?: string
  position?: string
  hire_date?: string
  status?: UserStatus
}

export interface UpdateUserData {
  name?: string
  phone?: string
  department?: string
  employee_id?: string
  position?: string
  hire_date?: string
  status?: UserStatus
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
        position: '선임강사',
        phone: '010-1234-5678',
        employee_id: 'INST001',
        hire_date: '2024-01-01',
        status: 'active',
        created_at: '2024-01-01T09:00:00Z',
        updated_at: '2024-01-01T09:00:00Z'
      },
      {
        id: 'instructor2',
        email: 'instructor2@company.com',
        name: '이전략 강사',
        role: 'instructor' as UserRole,
        department: '교육팀',
        position: '강사',
        phone: '010-2345-6789',
        employee_id: 'INST002',
        hire_date: '2024-01-02',
        status: 'active',
        created_at: '2024-01-02T09:00:00Z',
        updated_at: '2024-01-02T09:00:00Z'
      },
      {
        id: 'manager1',
        email: 'manager1@company.com',
        name: '박관리 매니저',
        role: 'manager' as UserRole,
        department: '인사팀',
        position: '팀장',
        phone: '010-3456-7890',
        employee_id: 'MGR001',
        hire_date: '2024-01-03',
        status: 'active',
        created_at: '2024-01-03T09:00:00Z',
        updated_at: '2024-01-03T09:00:00Z'
      },
      {
        id: 'manager2',
        email: 'manager2@company.com',
        name: '정시스템 매니저',
        role: 'manager' as UserRole,
        department: 'IT팀',
        position: '팀장',
        phone: '010-4567-8901',
        employee_id: 'MGR002',
        hire_date: '2024-01-04',
        status: 'active',
        created_at: '2024-01-04T09:00:00Z',
        updated_at: '2024-01-04T09:00:00Z'
      }
    ]
  }

  // 특정 사용자 조회
  static async getUserById(userId: string) {
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
        department: 'IT팀',
        position: '개발자',
        phone: '010-0000-0000',
        employee_id: 'DEV001',
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active',
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
          status: 'active' as UserStatus,
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
      admin: 0,
      manager: 0,
      operator: 0,
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

  // 사용자 정보 업데이트 (이름, 전화번호, 부서, 사번, 직책, 입사일, 상태)
  static async updateUser(userId: string, updateData: UpdateUserData) {
    try {
      // 허용된 필드 목록
      const allowedFields = [
        'name',
        'phone',
        'department',
        'employee_id',
        'position',
        'hire_date',
        'status'
      ];

      // 필드 화이트리스트 검증
      const validUpdates: Record<string, any> = {};

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key as keyof UpdateUserData] !== undefined) {
          validUpdates[key] = updateData[key as keyof UpdateUserData];
        }
      });

      // updated_at 자동 추가
      validUpdates.updated_at = new Date().toISOString();

      console.log('[UserService] 사용자 업데이트 요청:', {
        userId,
        updateFields: Object.keys(validUpdates)
      });

      const { data, error } = await supabase
        .from('users')
        .update(validUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[UserService] Supabase 사용자 업데이트 오류:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('[UserService] 사용자 업데이트 성공:', data);

      // 캐시 무효화
      queryCache.clear();

      return data as User;
    } catch (error: any) {
      console.error('[UserService] 사용자 업데이트 실패:', {
        message: error?.message || 'Unknown error',
        error: error
      });
      throw error;
    }
  }

  // 사용자 상태 업데이트 (활성/비활성)
  static async updateUserStatus(userId: string, status: UserStatus) {
    const { data, error } = await supabase
      .from('users')
      .update({
        status: status,
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
          phone: userData.phone,
          role: userData.role,
          department: userData.department,
          employee_id: userData.employee_id,
          position: userData.position,
          hire_date: userData.hire_date,
          status: userData.status || 'active',
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

    // 패스워드 리셋 성공
    return true
  }

  // 사용자 삭제
  static async deleteUser(userId: string) {
    console.log('[UserService] 사용자 삭제 시작:', userId);

    try {
      // 삭제할 테이블들과 컬럼 매핑
      const tablesToDelete = [
        // 직접 삭제할 테이블들
        { table: 'assessment_attempts', columns: ['user_id', 'graded_by'] },
        { table: 'attendance_records', columns: ['trainee_id'] },
        { table: 'bs_activities', columns: ['trainee_id', 'instructor_id'] },
        { table: 'comprehensive_grades', columns: ['trainee_id'] },
        { table: 'course_attendance', columns: ['trainee_id', 'recorded_by'] },
        { table: 'course_enrollments', columns: ['trainee_id'] },
        { table: 'evaluation_history', columns: ['changed_by'] },
        { table: 'exam_attempts', columns: ['trainee_id', 'graded_by'] },
        { table: 'exam_submissions', columns: ['trainee_id', 'graded_by'] },
        { table: 'instructor_availability', columns: ['instructor_id'] },
        { table: 'instructor_evaluations', columns: ['instructor_id', 'trainee_id'] },
        { table: 'instructor_payment_history', columns: ['instructor_id', 'created_by'] },
        { table: 'instructor_profiles', columns: ['user_id'] },
        { table: 'instructor_subjects', columns: ['instructor_id'] },
        { table: 'instructor_teaching_summary', columns: ['instructor_id', 'finalized_by'] },
        { table: 'instructors', columns: ['user_id'] },
        { table: 'learning_progress', columns: ['user_id'] },
        { table: 'learning_stats', columns: ['user_id'] },
        { table: 'notices', columns: ['author_id'] },
        { table: 'notification_preferences', columns: ['user_id'] },
        { table: 'notifications', columns: ['user_id'] },
        { table: 'password_change_logs', columns: ['user_id', 'changed_by'] },
        { table: 'personal_events', columns: ['user_id'] },
        { table: 'round_enrollments', columns: ['trainee_id'] },
        { table: 'trainees', columns: ['user_id'] },
        { table: 'user_import_logs', columns: ['imported_by'] },
        { table: 'video_reviews', columns: ['user_id'] },
      ];

      // NULL로 업데이트할 테이블들 (삭제하면 안 되는 데이터)
      const tablesToUpdate = [
        { table: 'categories', columns: ['created_by'] },
        { table: 'class_divisions', columns: ['instructor_id', 'teaching_assistant_id'] },
        { table: 'classrooms', columns: ['created_by'] },
        { table: 'course_rounds', columns: ['instructor_id', 'manager_id'] },
        { table: 'course_schedules', columns: ['instructor_id'] },
        { table: 'course_sessions', columns: ['actual_instructor_id', 'assistant_instructor_id', 'payment_confirmed_by', 'primary_instructor_id'] },
        { table: 'courses', columns: ['instructor_id', 'manager_id', 'trainer_id'] },
        { table: 'curriculum_templates', columns: ['created_by'] },
        { table: 'evaluation_templates', columns: ['created_by'] },
        { table: 'exams', columns: ['created_by'] },
        { table: 'question_banks', columns: ['created_by'] },
        { table: 'questions', columns: ['created_by'] },
        { table: 'schedule_conflicts', columns: ['resolved_by'] },
        { table: 'schedules', columns: ['instructor_id'] },
      ];

      // 1. NULL 업데이트 먼저 (외래 키 제약 조건 해제) - 병렬 처리
      console.log('[UserService] NULL 업데이트 시작');

      const updatePromises = [];

      // courses 테이블의 모든 외래 키를 NULL로 설정
      updatePromises.push(
        supabase
          .from('courses')
          .update({
            instructor_id: null,
            manager_id: null,
            trainer_id: null
          })
          .or(`instructor_id.eq.${userId},manager_id.eq.${userId},trainer_id.eq.${userId}`)
          .then(({ error }) => {
            if (error && error.code !== 'PGRST116') {
              console.warn('[UserService] courses NULL 업데이트 중 오류:', error);
            }
          })
      );

      // 나머지 테이블들도 병렬로 처리
      for (const { table, columns } of tablesToUpdate) {
        if (table === 'courses') continue; // 이미 처리했음

        for (const column of columns) {
          const updateData: Record<string, null> = {};
          updateData[column] = null;

          updatePromises.push(
            supabase
              .from(table)
              .update(updateData)
              .eq(column, userId)
              .then(({ error }) => {
                if (error && error.code !== 'PGRST116') {
                  console.warn(`[UserService] ${table}.${column} NULL 업데이트 중 오류:`, error);
                }
              })
          );
        }
      }

      await Promise.all(updatePromises);
      console.log('[UserService] NULL 업데이트 완료');

      // 2. 관련 데이터 삭제 - 병렬 처리
      console.log('[UserService] 관련 데이터 삭제 시작');

      const deletePromises = [];

      for (const { table, columns } of tablesToDelete) {
        for (const column of columns) {
          deletePromises.push(
            supabase
              .from(table)
              .delete()
              .eq(column, userId)
              .then(({ error }) => {
                if (error && error.code !== 'PGRST116') {
                  console.warn(`[UserService] ${table}.${column} 삭제 중 오류:`, error);
                }
              })
          );
        }
      }

      await Promise.all(deletePromises);
      console.log('[UserService] 관련 데이터 삭제 완료');

      // 3. 최종: 사용자 삭제
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('[UserService] 사용자 삭제 실패:', error);
        throw error;
      }

      console.log('[UserService] 사용자 삭제 성공');

      // 캐시 무효화 (브라우저 환경에서만)
      try {
        queryCache.clear();
      } catch (e) {
        // Node.js 환경에서는 localStorage가 없으므로 무시
      }

      return true;
    } catch (error: any) {
      console.error('[UserService] 사용자 삭제 중 오류 발생:', error);
      throw error;
    }
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