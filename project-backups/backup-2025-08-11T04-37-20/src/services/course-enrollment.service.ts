import { supabase } from './supabase';
import { CourseService } from './course.services';
import { UserService } from './user.services';
import {
  AvailableTrainee,
  EnrollmentRequest,
  EnrollmentResult,
  FailedEnrollment,
  WaitingListEntry,
  EnrollmentHistory,
  CourseEnrollmentSummary,
  TraineeSearchFilter,
  TraineeSearchResult,
  EnrollmentConflict,
  EnrollmentApproval,
  EnrollmentStatistics
} from '../types/course-enrollment.types';
import { CourseEnrollment } from '../types/course.types';

export class CourseEnrollmentService {
  // 교육생 검색
  static async searchAvailableTrainees(filter: TraineeSearchFilter = {}): Promise<TraineeSearchResult> {
    try {
      const {
        search_term = '',
        department,
        join_date_from,
        join_date_to,
        has_active_courses,
        has_completed_courses,
        min_average_score,
        max_current_enrollments,
        exclude_enrolled_in_course,
        sort_by = 'name',
        sort_order = 'asc',
        page = 1,
        limit = 20
      } = filter;

      // 기본 사용자 쿼리
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'trainee')
        .range((page - 1) * limit, page * limit - 1);

      // 검색어 필터
      if (search_term) {
        query = query.or(`name.ilike.%${search_term}%,email.ilike.%${search_term}%,employee_id.ilike.%${search_term}%`);
      }

      // 부서 필터
      if (department) {
        query = query.eq('department', department);
      }

      // 입사일 필터
      if (join_date_from) {
        query = query.gte('created_at', join_date_from);
      }
      if (join_date_to) {
        query = query.lte('created_at', join_date_to);
      }

      // 정렬
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      const { data: users, error, count } = await query;

      if (error) throw error;

      // 각 교육생의 추가 정보 조회
      const trainees: AvailableTrainee[] = [];
      
      for (const user of users || []) {
        const enrollments = await CourseService.getTraineeEnrollments(user.id);
        const activeEnrollments = enrollments.filter(e => e.status === 'active');
        const completedEnrollments = enrollments.filter(e => e.status === 'completed');
        
        // 평균 점수 계산
        const scoresWithValues = enrollments.filter(e => e.final_score != null);
        const averageScore = scoresWithValues.length > 0
          ? Math.round(scoresWithValues.reduce((sum, e) => sum + (e.final_score || 0), 0) / scoresWithValues.length)
          : undefined;

        // 필터 조건 검사
        let isEligible = true;
        let eligibilityReason = '';

        if (has_active_courses !== undefined && (activeEnrollments.length > 0) !== has_active_courses) {
          isEligible = false;
          eligibilityReason = has_active_courses ? '현재 수강 중인 과정이 없습니다' : '이미 수강 중인 과정이 있습니다';
        }

        if (has_completed_courses !== undefined && (completedEnrollments.length > 0) !== has_completed_courses) {
          isEligible = false;
          eligibilityReason = has_completed_courses ? '완료한 과정이 없습니다' : '이미 완료한 과정이 있습니다';
        }

        if (min_average_score && averageScore && averageScore < min_average_score) {
          isEligible = false;
          eligibilityReason = `평균 점수가 ${min_average_score}점 미만입니다`;
        }

        if (max_current_enrollments && activeEnrollments.length > max_current_enrollments) {
          isEligible = false;
          eligibilityReason = `현재 수강 과정이 ${max_current_enrollments}개를 초과합니다`;
        }

        // 특정 과정에 이미 등록된 경우 제외
        if (exclude_enrolled_in_course) {
          const isAlreadyEnrolled = enrollments.some(e => 
            e.course_id === exclude_enrolled_in_course && e.status === 'active'
          );
          if (isAlreadyEnrolled) {
            continue; // 이 교육생은 결과에서 제외
          }
        }

        const trainee: AvailableTrainee = {
          ...user,
          current_enrollments: activeEnrollments.length,
          active_courses: activeEnrollments.map(e => e.course_name),
          completed_courses: completedEnrollments.length,
          average_score: averageScore,
          last_enrollment_date: enrollments[0]?.enrolled_at,
          is_eligible: isEligible,
          eligibility_reason: eligibilityReason || undefined
        };

        trainees.push(trainee);
      }

      return {
        trainees,
        total_count: count || 0,
        page,
        limit,
        has_next: (count || 0) > page * limit,
        has_previous: page > 1
      };

    } catch (error) {
      console.error('CourseEnrollmentService.searchAvailableTrainees error:', error);
      throw error;
    }
  }

  // 교육생 일괄 배정
  static async bulkEnrollTrainees(request: EnrollmentRequest): Promise<EnrollmentResult> {
    try {
      const { course_id, trainee_ids, enrollment_date, notes, auto_approve } = request;

      // 과정 정보 조회
      const course = await CourseService.getCourseById(course_id);
      const availableSpots = course.max_trainees - course.current_trainees;

      const result: EnrollmentResult = {
        successful_enrollments: [],
        failed_enrollments: [],
        waiting_list: [],
        course_full: availableSpots <= 0,
        total_requested: trainee_ids.length,
        total_enrolled: 0,
        total_failed: 0,
        total_waitlisted: 0
      };

      // 배정 충돌 검사
      const conflicts = await this.checkEnrollmentConflicts(course_id, trainee_ids);
      
      for (let i = 0; i < trainee_ids.length; i++) {
        const traineeId = trainee_ids[i];
        
        try {
          // 이미 등록되었는지 확인
          const existingEnrollment = await CourseService.getCourseEnrollments(course_id, traineeId);
          if (existingEnrollment.length > 0) {
            const user = await UserService.getUserById(traineeId);
            result.failed_enrollments.push({
              trainee_id: traineeId,
              trainee_name: user?.name || 'Unknown',
              trainee_email: user?.email || 'Unknown',
              reason: 'already_enrolled',
              reason_detail: '이미 해당 과정에 등록되어 있습니다.'
            });
            continue;
          }

          // 정원 확인
          if (result.total_enrolled >= availableSpots) {
            // 대기자 목록에 추가
            const waitingEntry = await this.addToWaitingList(course_id, traineeId, {
              priority: request.priority,
              notes: notes
            });
            result.waiting_list.push(waitingEntry);
            result.total_waitlisted++;
            continue;
          }

          // 실제 배정 수행
          const enrollment = await CourseService.enrollTrainee(course_id, traineeId);
          
          // 배정 이력 기록
          await this.recordEnrollmentHistory({
            course_id,
            trainee_id: traineeId,
            action: 'enrolled',
            reason: notes,
            action_by: 'system' // TODO: 현재 사용자 ID로 변경
          });

          result.successful_enrollments.push({
            ...enrollment,
            course_name: course.name,
            trainee_name: 'Unknown', // TODO: 실제 이름 조회
            trainee_email: 'Unknown' // TODO: 실제 이메일 조회
          } as CourseEnrollment);
          result.total_enrolled++;

        } catch (error) {
          console.error(`Failed to enroll trainee ${traineeId}:`, error);
          const user = await UserService.getUserById(traineeId);
          result.failed_enrollments.push({
            trainee_id: traineeId,
            trainee_name: user?.name || 'Unknown',
            trainee_email: user?.email || 'Unknown',
            reason: 'other',
            reason_detail: '배정 중 오류가 발생했습니다.'
          });
          result.total_failed++;
        }
      }

      return result;

    } catch (error) {
      console.error('CourseEnrollmentService.bulkEnrollTrainees error:', error);
      throw error;
    }
  }

  // 개별 교육생 배정 해제
  static async unenrollTrainee(enrollmentId: string, reason?: string): Promise<boolean> {
    try {
      // 배정 정보 조회
      const enrollments = await CourseService.getCourseEnrollments();
      const enrollment = enrollments.find(e => e.id === enrollmentId);
      
      if (!enrollment) {
        throw new Error('배정 정보를 찾을 수 없습니다.');
      }

      // 배정 해제
      await CourseService.unenrollTrainee(enrollmentId);

      // 배정 이력 기록
      await this.recordEnrollmentHistory({
        course_id: enrollment.course_id,
        trainee_id: enrollment.trainee_id,
        action: 'unenrolled',
        reason: reason,
        action_by: 'system' // TODO: 현재 사용자 ID로 변경
      });

      // 대기자가 있으면 자동으로 배정
      await this.processWaitingList(enrollment.course_id);

      return true;

    } catch (error) {
      console.error('CourseEnrollmentService.unenrollTrainee error:', error);
      throw error;
    }
  }

  // 과정별 배정 현황 조회
  static async getCourseEnrollmentSummary(courseId: string): Promise<CourseEnrollmentSummary> {
    try {
      const [course, enrollments, waitingList, history] = await Promise.all([
        CourseService.getCourseById(courseId),
        CourseService.getCourseEnrollments(courseId),
        this.getWaitingList(courseId),
        this.getEnrollmentHistory(courseId)
      ]);

      const activeEnrollments = enrollments.filter(e => e.status === 'active');
      const completedEnrollments = enrollments.filter(e => e.status === 'completed');
      const droppedEnrollments = enrollments.filter(e => e.status === 'dropped');

      const enrollmentStats = {
        total_enrolled: enrollments.length,
        active_enrollments: activeEnrollments.length,
        completed_enrollments: completedEnrollments.length,
        dropped_enrollments: droppedEnrollments.length,
        waiting_list_count: waitingList.length,
        available_spots: Math.max(0, course.max_trainees - activeEnrollments.length),
        enrollment_rate: course.max_trainees > 0 ? Math.round((enrollments.length / course.max_trainees) * 100) : 0,
        completion_rate: enrollments.length > 0 ? Math.round((completedEnrollments.length / enrollments.length) * 100) : 0,
        drop_rate: enrollments.length > 0 ? Math.round((droppedEnrollments.length / enrollments.length) * 100) : 0
      };

      return {
        course,
        enrollment_stats: enrollmentStats,
        recent_enrollments: enrollments.slice(0, 10),
        waiting_list: waitingList,
        enrollment_history: history.slice(0, 20)
      };

    } catch (error) {
      console.error('CourseEnrollmentService.getCourseEnrollmentSummary error:', error);
      throw error;
    }
  }

  // 배정 충돌 검사
  static async checkEnrollmentConflicts(courseId: string, traineeIds: string[]): Promise<EnrollmentConflict[]> {
    const conflicts: EnrollmentConflict[] = [];

    try {
      const course = await CourseService.getCourseById(courseId);
      const availableSpots = course.max_trainees - course.current_trainees;

      // 정원 초과 검사
      if (traineeIds.length > availableSpots) {
        conflicts.push({
          type: 'capacity',
          severity: 'warning',
          message: `정원을 ${traineeIds.length - availableSpots}명 초과합니다. 초과 인원은 대기자 목록에 추가됩니다.`,
          affected_trainee_ids: traineeIds.slice(availableSpots),
          can_override: true
        });
      }

      // TODO: 일정 충돌, 선수과정 등 다른 충돌 검사 로직 추가

      return conflicts;

    } catch (error) {
      console.error('CourseEnrollmentService.checkEnrollmentConflicts error:', error);
      return [];
    }
  }

  // 대기자 목록에 추가
  static async addToWaitingList(courseId: string, traineeId: string, options: {
    priority?: 'normal' | 'high' | 'urgent';
    notes?: string;
  } = {}): Promise<WaitingListEntry> {
    try {
      // 과정 및 교육생 정보 조회
      const [course, user] = await Promise.all([
        CourseService.getCourseById(courseId),
        UserService.getUserById(traineeId)
      ]);

      // 현재 대기자 목록 조회
      const currentWaitingList = await this.getWaitingList(courseId);
      const nextPosition = Math.max(...currentWaitingList.map(w => w.position), 0) + 1;

      const waitingEntry: WaitingListEntry = {
        id: `waiting_${Date.now()}_${Math.random()}`,
        course_id: courseId,
        course_name: course.name,
        trainee_id: traineeId,
        trainee_name: user?.name || 'Unknown',
        trainee_email: user?.email || 'unknown@example.com',
        requested_at: new Date().toISOString(),
        priority: options.priority || 'normal',
        position: nextPosition,
        notes: options.notes,
        status: 'waiting'
      };

      // 임시로 로컬 스토리지에 저장
      const existingWaitingList = JSON.parse(localStorage.getItem('waiting_list') || '[]');
      existingWaitingList.push(waitingEntry);
      localStorage.setItem('waiting_list', JSON.stringify(existingWaitingList));

      return waitingEntry;
      
    } catch (error) {
      console.error('Failed to add to waiting list:', error);
      throw error;
    }
  }

  // 대기자 목록 조회
  static async getWaitingList(courseId: string): Promise<WaitingListEntry[]> {
    try {
      // 임시로 로컬 스토리지에서 조회
      const allWaitingList: WaitingListEntry[] = JSON.parse(localStorage.getItem('waiting_list') || '[]');
      
      const courseWaitingList = allWaitingList
        .filter(w => w.course_id === courseId && w.status === 'waiting')
        .sort((a, b) => a.position - b.position);
      
      return courseWaitingList;
      
    } catch (error) {
      console.error('Failed to get waiting list:', error);
      return [];
    }
  }

  // 대기자 목록 처리
  static async processWaitingList(courseId: string): Promise<void> {
    try {
      const course = await CourseService.getCourseById(courseId);
      const waitingList = await this.getWaitingList(courseId);
      const availableSpots = course.max_trainees - course.current_trainees;

      if (availableSpots <= 0 || waitingList.length === 0) {
        return;
      }

      // 우선순위와 순번에 따라 정렬
      const sortedWaitingList = waitingList.sort((a, b) => {
        const priorityOrder = { 'urgent': 0, 'high': 1, 'normal': 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return priorityDiff !== 0 ? priorityDiff : a.position - b.position;
      });

      // 배정 가능한 만큼 순차적으로 배정
      const toEnroll = sortedWaitingList.slice(0, availableSpots);
      
      for (const entry of toEnroll) {
        try {
          // 실제 배정 수행
          await CourseService.enrollTrainee(courseId, entry.trainee_id);
          
          // 대기자 목록에서 제거
          const allWaitingList = JSON.parse(localStorage.getItem('waiting_list') || '[]');
          const updatedWaitingList = allWaitingList.filter((w: WaitingListEntry) => w.id !== entry.id);
          localStorage.setItem('waiting_list', JSON.stringify(updatedWaitingList));

          // 배정 이력 기록
          await this.recordEnrollmentHistory({
            course_id: courseId,
            trainee_id: entry.trainee_id,
            action: 'enrolled',
            reason: '대기자 자동 배정',
            action_by: 'system'
          });
          
        } catch (error) {
          console.error(`Failed to auto-enroll trainee ${entry.trainee_id}:`, error);
        }
      }

      console.log(`Processed waiting list: ${toEnroll.length} trainees enrolled`);
      
    } catch (error) {
      console.error('Failed to process waiting list:', error);
      throw error;
    }
  }

  // 배정 이력 기록
  static async recordEnrollmentHistory(data: {
    course_id: string;
    trainee_id: string;
    action: 'enrolled' | 'unenrolled' | 'transferred' | 'completed' | 'dropped';
    reason?: string;
    action_by: string;
  }): Promise<void> {
    try {
      // 과정 및 교육생 정보 조회
      const [course, user] = await Promise.all([
        CourseService.getCourseById(data.course_id),
        UserService.getUserById(data.trainee_id)
      ]);

      const historyData = {
        course_id: data.course_id,
        trainee_id: data.trainee_id,
        action: data.action,
        action_date: new Date().toISOString(),
        action_by: data.action_by,
        reason: data.reason,
        course_name: course.name,
        trainee_name: user?.name || 'Unknown',
        action_by_name: 'System' // TODO: 실제 사용자 이름으로 변경
      };

      // enrollment_history 테이블이 있다면 저장
      // 임시로 로컬 스토리지에 저장
      const existingHistory = JSON.parse(localStorage.getItem('enrollment_history') || '[]');
      existingHistory.push({
        id: `history_${Date.now()}_${Math.random()}`,
        ...historyData
      });
      localStorage.setItem('enrollment_history', JSON.stringify(existingHistory));
      
      console.log('Enrollment history recorded:', historyData);
    } catch (error) {
      console.error('Failed to record enrollment history:', error);
    }
  }

  // 배정 이력 조회
  static async getEnrollmentHistory(courseId?: string, traineeId?: string): Promise<EnrollmentHistory[]> {
    try {
      // 임시로 로컬 스토리지에서 조회
      const allHistory: EnrollmentHistory[] = JSON.parse(localStorage.getItem('enrollment_history') || '[]');
      
      let filteredHistory = allHistory;
      
      if (courseId) {
        filteredHistory = filteredHistory.filter(h => h.course_id === courseId);
      }
      
      if (traineeId) {
        filteredHistory = filteredHistory.filter(h => h.trainee_id === traineeId);
      }
      
      // 최신순으로 정렬
      return filteredHistory.sort((a, b) => 
        new Date(b.action_date).getTime() - new Date(a.action_date).getTime()
      );
      
    } catch (error) {
      console.error('Failed to get enrollment history:', error);
      return [];
    }
  }

  // 배정 통계 조회
  static async getEnrollmentStatistics(startDate: string, endDate: string): Promise<EnrollmentStatistics> {
    // TODO: 실제 통계 계산 로직 구현
    const mockStats: EnrollmentStatistics = {
      period: { start_date: startDate, end_date: endDate },
      total_enrollments: 0,
      successful_enrollments: 0,
      failed_enrollments: 0,
      cancellation_rate: 0,
      average_enrollment_time: 0,
      popular_courses: [],
      department_stats: [],
      monthly_trends: []
    };

    return mockStats;
  }

  // 부서별 교육생 목록 조회
  static async getTraineesByDepartment(): Promise<Record<string, AvailableTrainee[]>> {
    try {
      const searchResult = await this.searchAvailableTrainees({ limit: 1000 });
      const traineesByDepartment: Record<string, AvailableTrainee[]> = {};

      searchResult.trainees.forEach(trainee => {
        const dept = trainee.department || '미배정';
        if (!traineesByDepartment[dept]) {
          traineesByDepartment[dept] = [];
        }
        traineesByDepartment[dept].push(trainee);
      });

      return traineesByDepartment;

    } catch (error) {
      console.error('CourseEnrollmentService.getTraineesByDepartment error:', error);
      throw error;
    }
  }
}