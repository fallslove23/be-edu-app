import { supabase } from './supabase'
import { queryCache, queryBatcher } from '../utils/queryCache'
import { CourseService, Course, CourseEnrollment, CourseStats } from './course.services'

/**
 * 향상된 과정 서비스 - 고성능 쿼리 최적화
 */
export class EnhancedCourseService extends CourseService {
  
  // 배치 사용자 조회 (N+1 문제 해결)
  static async getUsersBatch(userIds: string[]) {
    return queryBatcher.add(
      'users-batch',
      async (allUserIds: string[][]) => {
        const flatIds = [...new Set(allUserIds.flat())];
        
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, department')
          .in('id', flatIds);
          
        if (error) throw error;
        
        // 배치별로 결과 분리
        return allUserIds.map(ids => 
          data?.filter(user => ids.includes(user.id)) || []
        );
      },
      userIds
    );
  }

  // 향상된 과정 목록 조회 (조인 최적화)
  static async getCoursesOptimized(filter: { 
    status?: string, 
    instructor_id?: string, 
    manager_id?: string,
    limit?: number,
    offset?: number
  } = {}) {
    const cacheKey = `courses-optimized:${JSON.stringify(filter)}`;
    const cached = queryCache.get<Course[]>(cacheKey);
    if (cached) return cached;

    try {
      // 단일 쿼리로 모든 데이터 조회 (조인 사용)
      let query = supabase
        .from('courses')
        .select(`
          *,
          instructor:users!instructor_id(id, name),
          manager:users!manager_id(id, name),
          enrollments:course_enrollments(count)
        `)
        .order('created_at', { ascending: false });

      // 필터 적용
      if (filter.status) query = query.eq('status', filter.status);
      if (filter.instructor_id) query = query.eq('instructor_id', filter.instructor_id);
      if (filter.manager_id) query = query.eq('manager_id', filter.manager_id);
      if (filter.limit) query = query.limit(filter.limit);
      if (filter.offset) query = query.range(filter.offset, (filter.offset + (filter.limit || 20)) - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Enhanced course query error:', error);
        return this.getCourses(filter); // 폴백
      }

      const optimizedData = data?.map(course => ({
        ...course,
        instructor_name: course.instructor?.name || '',
        manager_name: course.manager?.name || '',
        current_trainees: course.enrollments?.[0]?.count || 0
      })) as Course[];

      // 캐시 저장 (1분)
      queryCache.set(cacheKey, optimizedData, {}, 60 * 1000);
      
      return optimizedData;
    } catch (error) {
      console.error('Enhanced course service error:', error);
      return this.getCourses(filter); // 폴백
    }
  }

  // 대시보드용 통계 (집계 쿼리 최적화)
  static async getDashboardStats() {
    const cacheKey = 'dashboard-stats';
    const cached = queryCache.get<any>(cacheKey);
    if (cached) return cached;

    try {
      // 병렬 실행으로 성능 향상
      const [coursesResult, enrollmentsResult, schedulesResult] = await Promise.all([
        supabase
          .from('courses')
          .select('status, created_at')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        
        supabase
          .from('course_enrollments')
          .select('status, enrolled_at')
          .gte('enrolled_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        
        supabase
          .from('course_schedules')
          .select('status, scheduled_date')
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
      ]);

      const stats = {
        courses: {
          total: coursesResult.data?.length || 0,
          active: coursesResult.data?.filter(c => c.status === 'active').length || 0,
          completed: coursesResult.data?.filter(c => c.status === 'completed').length || 0
        },
        enrollments: {
          thisWeek: enrollmentsResult.data?.length || 0,
          active: enrollmentsResult.data?.filter(e => e.status === 'active').length || 0
        },
        schedules: {
          upcoming: schedulesResult.data?.filter(s => s.status === 'scheduled').length || 0
        }
      };

      queryCache.set(cacheKey, stats, {}, 5 * 60 * 1000); // 5분 캐시
      return stats;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return {
        courses: { total: 0, active: 0, completed: 0 },
        enrollments: { thisWeek: 0, active: 0 },
        schedules: { upcoming: 0 }
      };
    }
  }

  // 교육생별 과정 현황 (집계 최적화)
  static async getTraineeCourseSummary(traineeId: string) {
    const cacheKey = `trainee-summary:${traineeId}`;
    const cached = queryCache.get<any>(cacheKey);
    if (cached) return cached;

    try {
      // 단일 쿼리로 모든 통계 조회
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          status,
          enrolled_at,
          completion_date,
          course:courses(
            name,
            start_date,
            end_date,
            status
          )
        `)
        .eq('trainee_id', traineeId);

      if (error) throw error;

      const summary = {
        totalCourses: data?.length || 0,
        activeCourses: data?.filter(e => e.status === 'active').length || 0,
        completedCourses: data?.filter(e => e.status === 'completed').length || 0,
        upcomingCourses: data?.filter(e => 
          e.course?.start_date && new Date(e.course.start_date) > new Date()
        ).length || 0,
        completionRate: data?.length ? 
          (data.filter(e => e.status === 'completed').length / data.length) * 100 : 0
      };

      queryCache.set(cacheKey, summary, {}, 2 * 60 * 1000); // 2분 캐시
      return summary;
    } catch (error) {
      console.error('Trainee course summary error:', error);
      return {
        totalCourses: 0,
        activeCourses: 0,
        completedCourses: 0,
        upcomingCourses: 0,
        completionRate: 0
      };
    }
  }

  // 실시간 검색 (디바운싱 + 캐시)
  static async searchCourses(searchTerm: string, filters: any = {}) {
    if (!searchTerm.trim()) return [];

    const cacheKey = `search:${searchTerm}:${JSON.stringify(filters)}`;
    const cached = queryCache.get<Course[]>(cacheKey);
    if (cached) return cached;

    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          instructor:users!instructor_id(name),
          manager:users!manager_id(name)
        `)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      const results = data?.map(course => ({
        ...course,
        instructor_name: course.instructor?.name || '',
        manager_name: course.manager?.name || ''
      })) as Course[];

      // 짧은 캐시 (30초)
      queryCache.set(cacheKey, results, {}, 30 * 1000);
      
      return results;
    } catch (error) {
      console.error('Course search error:', error);
      return [];
    }
  }

  // 백그라운드 데이터 사전 로딩
  static async preloadDashboardData() {
    const promises = [
      this.getCoursesOptimized({ limit: 10 }),
      this.getDashboardStats(),
      queryCache.prefetch('recent-enrollments', 
        () => this.getCourseEnrollments(),
        {},
        'high'
      )
    ];

    try {
      await Promise.allSettled(promises);
      console.log('✅ 대시보드 데이터 사전 로딩 완료');
    } catch (error) {
      console.warn('⚠️ 사전 로딩 일부 실패:', error);
    }
  }

  // 캐시 워밍업 (앱 시작 시 호출)
  static async warmupCache() {
    const criticalQueries = [
      () => this.getCoursesOptimized({ status: 'active', limit: 10 }),
      () => this.getDashboardStats(),
      () => this.getCourseStats()
    ];

    for (const query of criticalQueries) {
      try {
        await query();
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 간격
      } catch (error) {
        console.warn('캐시 워밍업 실패:', error);
      }
    }
  }

  // 성능 모니터링
  static getPerformanceMetrics() {
    return {
      cache: queryCache.getStats(),
      queries: {
        totalQueries: this.queryCount || 0,
        cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
      }
    };
  }

  private static queryCount = 0;
  private static cacheHits = 0;
  private static cacheMisses = 0;
}

// 성능 모니터링을 위한 데코레이터
function monitored(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    EnhancedCourseService.queryCount++;
    
    try {
      const result = await originalMethod.apply(this, args);
      const duration = performance.now() - start;
      
      if (duration < 50) EnhancedCourseService.cacheHits++;
      else EnhancedCourseService.cacheMisses++;
      
      return result;
    } catch (error) {
      console.error(`Query failed (${propertyKey}):`, error);
      throw error;
    }
  };
  
  return descriptor;
}