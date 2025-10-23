import { supabase } from './supabase'
import { queryCache, withCache, queryBatcher } from '../utils/queryCache'

export type CourseStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type EnrollmentStatus = 'active' | 'completed' | 'dropped'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface Course {
  id: string
  name: string
  description?: string
  instructor_id?: string
  instructor_name?: string
  manager_id?: string
  manager_name?: string
  start_date: string
  end_date: string
  max_trainees: number
  current_trainees: number
  status: CourseStatus
  created_at: string
  updated_at: string
}

export interface CreateCourseData {
  name: string
  description?: string
  instructor_id?: string
  manager_id?: string
  start_date: string
  end_date: string
  max_trainees: number
}

export interface CourseEnrollment {
  id: string
  course_id: string
  course_name: string
  course_description?: string
  course_start_date?: string
  course_end_date?: string
  course_status?: CourseStatus
  trainee_id: string
  trainee_name: string
  trainee_email: string
  trainee_department?: string
  enrolled_at: string
  status: EnrollmentStatus
  completion_date?: string
  final_score?: number
  instructor_name?: string
  manager_name?: string
}

export interface CourseCurriculum {
  id: string
  course_id: string
  title: string
  description?: string
  duration_hours: number
  order_index: number
  is_mandatory: boolean
  created_at: string
}

export interface CourseSchedule {
  id: string
  course_id: string
  course_name: string
  curriculum_id?: string
  curriculum_title?: string
  title: string
  description?: string
  scheduled_date: string
  start_time: string
  end_time: string
  location?: string
  instructor_id?: string
  instructor_name?: string
  status: ScheduleStatus
  created_at: string
}

export interface CourseAttendance {
  id: string
  schedule_id: string
  trainee_id: string
  trainee_name: string
  status: AttendanceStatus
  notes?: string
  recorded_at: string
  recorded_by?: string
}

export interface CourseStats {
  total_courses: number
  active_courses: number
  total_enrollments: number
  total_schedules: number
  upcoming_schedules: number
  by_status: Record<CourseStatus, number>
}

// 상태 라벨
export const courseStatusLabels: { [key in CourseStatus]: string } = {
  draft: '준비중',
  active: '진행중',
  completed: '완료',
  cancelled: '취소'
}

export const enrollmentStatusLabels: { [key in EnrollmentStatus]: string } = {
  active: '수강중',
  completed: '수료',
  dropped: '중도포기'
}

export const attendanceStatusLabels: { [key in AttendanceStatus]: string } = {
  present: '출석',
  absent: '결석',
  late: '지각',
  excused: '정당한 사유'
}

export class CourseService {
  // 과정 목록 조회 (캐시 최적화)
  static getCourses = withCache(
    async (filter: { status?: CourseStatus, instructor_id?: string, manager_id?: string } = {}) => {
    try {
      console.log('[CourseService] getCourses called with filter:', filter);
      
      let query = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter.status) {
        query = query.eq('status', filter.status)
      }
      if (filter.instructor_id) {
        query = query.eq('instructor_id', filter.instructor_id)
      }
      if (filter.manager_id) {
        query = query.eq('manager_id', filter.manager_id)
      }

      console.log('[CourseService] Executing Supabase query...');
      console.log('[CourseService] Supabase client check:', {
        hasSupabase: !!supabase,
        hasFrom: typeof supabase?.from === 'function'
      });

      const { data, error } = await query

      if (error) {
        console.error('[CourseService] Supabase error:', error)
        console.error('[CourseService] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        console.error('[CourseService] Full error object:', JSON.stringify(error, null, 2))
        console.log('[CourseService] Falling back to mock data');
        // Fallback to mock data
        return this.getMockCourses(filter)
      }

      // 강사/관리자 이름 가져오기
      if (!data || data.length === 0) {
        // Return mock data if no data found
        return this.getMockCourses(filter)
      }

      const instructorIds = [...new Set(data.map(course => course.instructor_id).filter(Boolean))]
      const managerIds = [...new Set(data.map(course => course.manager_id).filter(Boolean))]
      const allUserIds = [...instructorIds, ...managerIds]

      let userMap: Record<string, any> = {}
      if (allUserIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name')
          .in('id', allUserIds)

        userMap = users?.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {} as Record<string, any>) || {}
      }

      return data.map(course => ({
        ...course,
        instructor_name: course.instructor_id ? userMap[course.instructor_id]?.name || '' : '',
        manager_name: course.manager_id ? userMap[course.manager_id]?.name || '' : ''
      })) as Course[]
    } catch (error) {
      console.error('CourseService.getCourses error:', error)
      return CourseService.getMockCourses(filter)
    }
    },
    'courses',
    3 * 60 * 1000 // 3분 캐시
  );

  // 목업 데이터 제공
  private static getMockCourses(filter: { status?: CourseStatus, instructor_id?: string, manager_id?: string } = {}) {
    console.log('[CourseService] getMockCourses called with filter:', filter);
    const mockCourses: Course[] = [
      {
        id: '1',
        name: 'BS 영업 기초과정',
        description: '신입 영업사원을 위한 기본 영업 스킬 교육과정입니다.',
        instructor_id: 'instructor1',
        instructor_name: '김영업 강사',
        manager_id: 'manager1', 
        manager_name: '박관리 매니저',
        start_date: '2024-08-15',
        end_date: '2024-09-15',
        max_trainees: 20,
        current_trainees: 12,
        status: 'active' as CourseStatus,
        created_at: '2024-08-01T09:00:00Z',
        updated_at: '2024-08-01T09:00:00Z'
      },
      {
        id: '2',
        name: 'BS 고급 영업 전략',
        description: '고급 영업 기법과 전략적 사고를 배우는 과정입니다.',
        instructor_id: 'instructor2',
        instructor_name: '이전략 강사',
        manager_id: 'manager1',
        manager_name: '박관리 매니저', 
        start_date: '2024-09-01',
        end_date: '2024-10-01',
        max_trainees: 15,
        current_trainees: 15,
        status: 'active' as CourseStatus,
        created_at: '2024-07-15T10:30:00Z',
        updated_at: '2024-07-15T10:30:00Z'
      },
      {
        id: '3',
        name: 'BS 고객 관리 시스템',
        description: 'CRM 시스템 활용법과 고객 관리 전략을 학습합니다.',
        instructor_id: 'instructor3',
        instructor_name: '최시스템 강사',
        manager_id: 'manager2',
        manager_name: '정시스템 매니저',
        start_date: '2024-08-20',
        end_date: '2024-09-20', 
        max_trainees: 25,
        current_trainees: 8,
        status: 'active' as CourseStatus,
        created_at: '2024-07-20T14:00:00Z',
        updated_at: '2024-07-20T14:00:00Z'
      },
      {
        id: '4',
        name: '디지털 마케팅 기초',
        description: '온라인 마케팅과 SNS 활용 전략을 배웁니다.',
        instructor_id: 'instructor4',
        instructor_name: '한마케팅 강사',
        manager_id: 'manager2', 
        manager_name: '정시스템 매니저',
        start_date: '2024-09-10',
        end_date: '2024-10-10',
        max_trainees: 30,
        current_trainees: 0,
        status: 'draft' as CourseStatus,
        created_at: '2024-07-25T16:30:00Z',
        updated_at: '2024-07-25T16:30:00Z'
      },
      {
        id: '5', 
        name: 'BS 리더십 개발과정',
        description: '팀 리더를 위한 리더십과 커뮤니케이션 스킬을 개발합니다.',
        instructor_id: 'instructor5',
        instructor_name: '송리더 강사',
        manager_id: 'manager3',
        manager_name: '김리더 매니저',
        start_date: '2024-07-01',
        end_date: '2024-07-31',
        max_trainees: 18,
        current_trainees: 18,
        status: 'completed' as CourseStatus,
        created_at: '2024-06-01T11:00:00Z',
        updated_at: '2024-07-31T18:00:00Z'
      }
    ]

    // 필터 적용
    let filteredCourses = mockCourses
    if (filter.status) {
      filteredCourses = filteredCourses.filter(course => course.status === filter.status)
    }
    if (filter.instructor_id) {
      filteredCourses = filteredCourses.filter(course => course.instructor_id === filter.instructor_id)
    }
    if (filter.manager_id) {
      filteredCourses = filteredCourses.filter(course => course.manager_id === filter.manager_id)
    }

    return filteredCourses
  }

  // 특정 과정 조회 (캐시 최적화)
  static getCourseById = withCache(
    async (courseId: string) => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (error) throw error

    // 강사/관리자 이름 가져오기
    const userIds = [data.instructor_id, data.manager_id].filter(Boolean)
    let userMap: Record<string, any> = {}
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds)

      userMap = users?.reduce((acc, user) => {
        acc[user.id] = user
        return acc
      }, {} as Record<string, any>) || {}
    }

    return {
      ...data,
      instructor_name: data.instructor_id ? userMap[data.instructor_id]?.name || '' : '',
      manager_name: data.manager_id ? userMap[data.manager_id]?.name || '' : ''
    } as Course
    },
    'course-detail',
    5 * 60 * 1000 // 5분 캐시
  );

  // 과정 생성 (캐시 무효화)
  static async createCourse(courseData: CreateCourseData) {
    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single()

    if (error) throw error
    
    // 캐시 무효화
    queryCache.invalidate('courses');
    queryCache.invalidate('course-stats');
    
    return data as Course
  }

  // 과정 수정 (캐시 무효화)
  static async updateCourse(courseId: string, courseData: Partial<CreateCourseData>) {
    const { data, error } = await supabase
      .from('courses')
      .update({
        ...courseData,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select()
      .single()

    if (error) throw error
    
    // 캐시 무효화
    queryCache.invalidate('courses');
    queryCache.invalidate('course-detail');
    queryCache.invalidate('course-stats');
    
    return data as Course
  }

  // 과정 삭제
  static async deleteCourse(courseId: string) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) throw error
    return true
  }

  // 과정 등록 관리 (캐시 최적화)
  static getCourseEnrollments = withCache(
    async (params: { courseId?: string; traineeId?: string } = {}) => {
    const { courseId, traineeId } = params;
    let query = supabase
      .from('course_enrollments')
      .select('*')
      .order('enrolled_at', { ascending: false })

    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    if (traineeId) {
      query = query.eq('trainee_id', traineeId)
    }

    const { data, error } = await query

    if (error) throw error
    if (!data || data.length === 0) return []

    // 과정명과 교육생 정보 가져오기
    const courseIds = [...new Set(data.map(enrollment => enrollment.course_id))]
    const traineeIds = [...new Set(data.map(enrollment => enrollment.trainee_id))]

    const [coursesResult, traineesResult] = await Promise.all([
      supabase.from('courses').select('id, name').in('id', courseIds),
      supabase.from('users').select('id, name, email, department').in('id', traineeIds)
    ])

    const courseMap = coursesResult.data?.reduce((acc, course) => {
      acc[course.id] = course
      return acc
    }, {} as Record<string, any>) || {}

    const traineeMap = traineesResult.data?.reduce((acc, trainee) => {
      acc[trainee.id] = trainee
      return acc
    }, {} as Record<string, any>) || {}

    return data.map(enrollment => ({
      ...enrollment,
      course_name: courseMap[enrollment.course_id]?.name || '',
      trainee_name: traineeMap[enrollment.trainee_id]?.name || '',
      trainee_email: traineeMap[enrollment.trainee_id]?.email || '',
      trainee_department: traineeMap[enrollment.trainee_id]?.department || ''
    })) as CourseEnrollment[]
    },
    'course-enrollments',
    2 * 60 * 1000 // 2분 캐시
  );

  // 교육생 과정 등록
  static async enrollTrainee(courseId: string, traineeId: string) {
    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        course_id: courseId,
        trainee_id: traineeId,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 여러 교육생 일괄 배정
  static async assignTrainees(courseId: string, traineeIds: string[]) {
    const enrollments = traineeIds.map(traineeId => ({
      course_id: courseId,
      trainee_id: traineeId,
      status: 'active' as EnrollmentStatus
    }))

    const { data, error } = await supabase
      .from('course_enrollments')
      .insert(enrollments)
      .select()

    if (error) throw error
    return data
  }

  // 교육생 과정 등록 해제
  static async unenrollTrainee(enrollmentId: string) {
    const { error } = await supabase
      .from('course_enrollments')
      .delete()
      .eq('id', enrollmentId)

    if (error) throw error
    return true
  }

  // 교육생 해제 (별칭)
  static async removeTrainee(enrollmentId: string) {
    return this.unenrollTrainee(enrollmentId)
  }

  // 교육생의 과정 등록 목록 조회
  static async getTraineeEnrollments(traineeId: string) {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('trainee_id', traineeId)
      .order('enrolled_at', { ascending: false })

    if (error) throw error
    if (!data || data.length === 0) return []

    // 과정 정보 가져오기
    const courseIds = [...new Set(data.map(enrollment => enrollment.course_id))]
    const { data: courses } = await supabase
      .from('courses')
      .select('id, name, description, start_date, end_date, status, instructor_id, manager_id')
      .in('id', courseIds)

    const courseMap = courses?.reduce((acc, course) => {
      acc[course.id] = course
      return acc
    }, {} as Record<string, any>) || {}

    // 강사/관리자 이름 가져오기
    const instructorIds = [...new Set(courses?.map(c => c.instructor_id).filter(Boolean) || [])]
    const managerIds = [...new Set(courses?.map(c => c.manager_id).filter(Boolean) || [])]
    const allUserIds = [...instructorIds, ...managerIds]

    let userMap: Record<string, any> = {}
    if (allUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .in('id', allUserIds)

      userMap = users?.reduce((acc, user) => {
        acc[user.id] = user
        return acc
      }, {} as Record<string, any>) || {}
    }

    return data.map(enrollment => {
      const course = courseMap[enrollment.course_id]
      return {
        ...enrollment,
        course_name: course?.name || '',
        course_description: course?.description || '',
        course_start_date: course?.start_date || '',
        course_end_date: course?.end_date || '',
        course_status: course?.status || 'draft',
        instructor_name: course?.instructor_id ? userMap[course.instructor_id]?.name || '' : '',
        manager_name: course?.manager_id ? userMap[course.manager_id]?.name || '' : ''
      }
    }) as CourseEnrollment[]
  }

  // 교육생의 과정 통계
  static async getTraineeCourseStats(traineeId: string) {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('status')
      .eq('trainee_id', traineeId)

    if (error) throw error

    const stats = {
      enrolled: data?.length || 0,
      active: 0,
      completed: 0,
      dropped: 0
    }

    data?.forEach(enrollment => {
      stats[enrollment.status as EnrollmentStatus]++
    })

    return stats
  }

  // 과정 통계 (캐시 최적화)
  static getCourseStats = withCache(
    async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('status, created_at')

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      active: 0,
      draft: 0,
      completed: 0,
      cancelled: 0
    }

    data?.forEach(course => {
      if (course.status === 'active') {
        stats.active++
      }
      stats[course.status as CourseStatus]++
    })

    return stats
    },
    'course-stats',
    5 * 60 * 1000 // 5분 캐시
  );

  // 커리큘럼 관리
  static async getCourseCurriculum(courseId: string) {
    const { data, error } = await supabase
      .from('course_curriculum')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index')

    if (error) throw error
    return data as CourseCurriculum[]
  }

  static async createCurriculum(courseId: string, curriculumData: Omit<CourseCurriculum, 'id' | 'course_id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('course_curriculum')
      .insert({
        course_id: courseId,
        ...curriculumData
      })
      .select()
      .single()

    if (error) throw error
    return data as CourseCurriculum
  }

  static async updateCurriculum(curriculumId: string, curriculumData: Partial<Omit<CourseCurriculum, 'id' | 'course_id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('course_curriculum')
      .update(curriculumData)
      .eq('id', curriculumId)
      .select()
      .single()

    if (error) throw error
    return data as CourseCurriculum
  }

  static async deleteCurriculum(curriculumId: string) {
    const { error } = await supabase
      .from('course_curriculum')
      .delete()
      .eq('id', curriculumId)

    if (error) throw error
    return true
  }

  // 일정 관리
  static async getCourseSchedules(courseId?: string, date?: string) {
    let query = supabase
      .from('course_schedules')
      .select('*')
      .order('scheduled_date', { ascending: true })

    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    if (date) {
      query = query.eq('scheduled_date', date)
    }

    const { data, error } = await query

    if (error) throw error
    if (!data || data.length === 0) return []

    // 과정명, 커리큘럼, 강사 이름 가져오기
    const courseIds = [...new Set(data.map(schedule => schedule.course_id))]
    const curriculumIds = [...new Set(data.map(schedule => schedule.curriculum_id).filter(Boolean))]
    const instructorIds = [...new Set(data.map(schedule => schedule.instructor_id).filter(Boolean))]

    const [coursesResult, curriculumResult, instructorsResult] = await Promise.all([
      supabase.from('courses').select('id, name').in('id', courseIds),
      curriculumIds.length > 0 ? supabase.from('course_curriculum').select('id, title').in('id', curriculumIds) : Promise.resolve({ data: [] }),
      instructorIds.length > 0 ? supabase.from('users').select('id, name').in('id', instructorIds) : Promise.resolve({ data: [] })
    ])

    const courseMap = coursesResult.data?.reduce((acc, course) => {
      acc[course.id] = course
      return acc
    }, {} as Record<string, any>) || {}

    const curriculumMap = curriculumResult.data?.reduce((acc, curriculum) => {
      acc[curriculum.id] = curriculum
      return acc
    }, {} as Record<string, any>) || {}

    const instructorMap = instructorsResult.data?.reduce((acc, instructor) => {
      acc[instructor.id] = instructor
      return acc
    }, {} as Record<string, any>) || {}

    return data.map(schedule => ({
      ...schedule,
      course_name: courseMap[schedule.course_id]?.name || '',
      curriculum_title: schedule.curriculum_id ? curriculumMap[schedule.curriculum_id]?.title || '' : '',
      instructor_name: schedule.instructor_id ? instructorMap[schedule.instructor_id]?.name || '' : ''
    })) as CourseSchedule[]
  }

  static async createSchedule(scheduleData: Omit<CourseSchedule, 'id' | 'course_name' | 'curriculum_title' | 'instructor_name' | 'created_at'>) {
    const { data, error } = await supabase
      .from('course_schedules')
      .insert(scheduleData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateSchedule(scheduleId: string, scheduleData: Partial<Omit<CourseSchedule, 'id' | 'course_name' | 'curriculum_title' | 'instructor_name' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('course_schedules')
      .update(scheduleData)
      .eq('id', scheduleId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteSchedule(scheduleId: string) {
    const { error } = await supabase
      .from('course_schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) throw error
    return true
  }

  // 출석 관리
  static async getAttendanceBySchedule(scheduleId: string) {
    const { data, error } = await supabase
      .from('course_attendance')
      .select('*')
      .eq('schedule_id', scheduleId)

    if (error) throw error
    if (!data || data.length === 0) return []

    // 교육생 이름 가져오기
    const traineeIds = [...new Set(data.map(attendance => attendance.trainee_id))]
    const { data: trainees } = await supabase
      .from('users')
      .select('id, name')
      .in('id', traineeIds)

    const traineeMap = trainees?.reduce((acc, trainee) => {
      acc[trainee.id] = trainee
      return acc
    }, {} as Record<string, any>) || {}

    return data.map(attendance => ({
      ...attendance,
      trainee_name: traineeMap[attendance.trainee_id]?.name || ''
    })) as CourseAttendance[]
  }

  static async recordAttendance(scheduleId: string, traineeId: string, status: AttendanceStatus, notes?: string, recordedBy?: string) {
    const { data, error } = await supabase
      .from('course_attendance')
      .upsert({
        schedule_id: scheduleId,
        trainee_id: traineeId,
        status,
        notes,
        recorded_by: recordedBy,
        recorded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 출석 기록 조회 (스텁 구현)
  static async getAttendanceRecords(_courseId: string) {
    // TODO: 실제 출석 기록 조회 로직 구현
    return []
  }

  // 교육생별 과정 등록 조회 (스텁 구현)
  static async getCourseEnrollmentsByTrainee(traineeId: string) {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('trainee_id', traineeId)

    if (error) throw error
    return data || []
  }

  // 교육생 출석 통계 (스텁 구현)
  static async getTraineeAttendanceStats(_traineeId: string, _courseId: string) {
    // TODO: 실제 출석 통계 로직 구현
    return {
      total_sessions: 0,
      attended_sessions: 0,
      attendance_rate: 0
    }
  }
}