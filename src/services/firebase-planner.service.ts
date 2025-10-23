import type { 
  Course, 
  Schedule, 
  Instructor, 
  FirebasePlannerCourse, 
  FirebaseScheduleItem,
  CalendarEvent 
} from '../types/schedule.types';

/**
 * Firebase 플래너와의 연동을 위한 서비스
 * 기존 Firebase 앱의 API를 호출하여 데이터를 동기화
 */
export class FirebasePlannerService {
  private static readonly FIREBASE_PLANNER_URL = 'https://studio--eduscheduler-nrx9o.us-central1.hosted.app';
  private static readonly API_BASE = `${this.FIREBASE_PLANNER_URL}/api`;

  /**
   * Firebase 플래너에서 과정 목록 가져오기
   */
  static async getCoursesFromPlanner(): Promise<FirebasePlannerCourse[]> {
    try {
      const response = await fetch(`${this.API_BASE}/courses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Firebase 인증 토큰이 필요한 경우
          // 'Authorization': `Bearer ${await this.getFirebaseToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('Firebase 플래너에서 과정 목록 가져오기 실패:', error);
      // Fallback: 목업 데이터 반환
      return this.getMockPlannerCourses();
    }
  }

  /**
   * Firebase 플래너에서 특정 과정의 상세 정보 가져오기
   */
  static async getCourseFromPlanner(courseId: string): Promise<FirebasePlannerCourse | null> {
    try {
      const response = await fetch(`${this.API_BASE}/courses/${courseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error(`Firebase 플래너에서 과정 ${courseId} 가져오기 실패:`, error);
      return null;
    }
  }

  /**
   * Firebase 플래너의 과정을 BS App 형식으로 변환
   */
  static convertFirebaseCoursetoBSCourse(firebaseCourse: FirebasePlannerCourse): Course {
    return {
      id: firebaseCourse.id,
      name: firebaseCourse.title,
      description: `Firebase 플래너에서 가져온 과정: ${firebaseCourse.title}`,
      category: 'BS Basic', // 기본 카테고리
      duration_hours: this.calculateTotalHours(firebaseCourse.schedules),
      max_capacity: 20, // 기본값
      current_enrollment: 0,
      start_date: firebaseCourse.startDate,
      end_date: firebaseCourse.endDate,
      status: 'confirmed',
      instructor_ids: firebaseCourse.instructors,
      trainee_ids: [],
      classroom: this.extractClassroom(firebaseCourse.schedules),
      materials: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Firebase 플래너의 스케줄을 BS App 형식으로 변환
   */
  static convertFirebaseSchedulesToBSSchedules(
    courseId: string, 
    firebaseSchedules: FirebaseScheduleItem[]
  ): Schedule[] {
    return firebaseSchedules.map(schedule => ({
      id: schedule.id,
      course_id: courseId,
      title: schedule.title,
      subject: schedule.title,
      instructor_id: schedule.instructor,
      start_time: schedule.startTime,
      end_time: schedule.endTime,
      date: schedule.startTime.split('T')[0], // ISO 날짜에서 날짜 부분 추출
      classroom: schedule.room,
      notes: '',
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }

  /**
   * BS App의 과정을 Firebase 플래너로 동기화
   */
  static async syncCourseToPlanner(course: Course, schedules: Schedule[]): Promise<boolean> {
    try {
      const firebaseCourse: FirebasePlannerCourse = {
        id: course.id,
        title: course.name,
        startDate: course.start_date,
        endDate: course.end_date,
        instructors: course.instructor_ids,
        schedules: schedules.map(schedule => ({
          id: schedule.id,
          title: schedule.title,
          startTime: `${schedule.date}T${schedule.start_time}`,
          endTime: `${schedule.date}T${schedule.end_time}`,
          instructor: schedule.instructor_id || '',
          room: schedule.classroom
        }))
      };

      const response = await fetch(`${this.API_BASE}/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(firebaseCourse)
      });

      return response.ok;
      
    } catch (error) {
      console.error('Firebase 플래너로 과정 동기화 실패:', error);
      return false;
    }
  }

  /**
   * Firebase 플래너에서 캘린더 이벤트 가져오기
   */
  static async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    try {
      const response = await fetch(
        `${this.API_BASE}/calendar?start=${startDate}&end=${endDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.convertFirebaseEventsToCalendarEvents(data);
      
    } catch (error) {
      console.error('Firebase 플래너에서 캘린더 이벤트 가져오기 실패:', error);
      return this.getMockCalendarEvents();
    }
  }

  /**
   * Firebase 플래너의 이벤트를 캘린더 이벤트로 변환
   */
  private static convertFirebaseEventsToCalendarEvents(firebaseEvents: any[]): CalendarEvent[] {
    return firebaseEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startTime,
      end: event.endTime,
      type: 'course',
      course_id: event.courseId,
      instructor_id: event.instructor,
      classroom: event.room,
      status: event.status || 'scheduled',
      color: this.getEventColor(event.type),
      editable: false // Firebase 플래너에서 가져온 이벤트는 읽기 전용
    }));
  }

  /**
   * 이벤트 타입에 따른 색상 반환
   */
  private static getEventColor(eventType: string): string {
    const colorMap: Record<string, string> = {
      'BS아무튼': '#3B82F6', // 파란색
      'PC기초아무튼': '#10B981', // 초록색
      '마스터과정': '#F59E0B', // 주황색
      'SNAP': '#8B5CF6', // 보라색
      'Kavo': '#EF4444', // 빨간색
      'OneClick': '#06B6D4', // 청록색
      'V-Ceph': '#84CC16', // 연두색
      default: '#6B7280' // 회색
    };

    return colorMap[eventType] || colorMap.default;
  }

  /**
   * 스케줄 목록에서 총 시간 계산
   */
  private static calculateTotalHours(schedules: FirebaseScheduleItem[]): number {
    let totalMinutes = 0;
    
    schedules.forEach(schedule => {
      const startTime = new Date(schedule.startTime);
      const endTime = new Date(schedule.endTime);
      const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      totalMinutes += diffMinutes;
    });

    return Math.round(totalMinutes / 60 * 10) / 10; // 소수점 첫째자리까지
  }

  /**
   * 스케줄 목록에서 주로 사용되는 강의실 추출
   */
  private static extractClassroom(schedules: FirebaseScheduleItem[]): string {
    const roomCounts: Record<string, number> = {};
    
    schedules.forEach(schedule => {
      if (schedule.room) {
        roomCounts[schedule.room] = (roomCounts[schedule.room] || 0) + 1;
      }
    });

    // 가장 많이 사용된 강의실 반환
    const mostUsedRoom = Object.entries(roomCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return mostUsedRoom ? mostUsedRoom[0] : '';
  }

  /**
   * Firebase 인증 토큰 가져오기 (필요시 구현)
   */
  private static async getFirebaseToken(): Promise<string> {
    // Firebase Auth를 통한 토큰 획득 로직
    // 현재는 공개 API라고 가정
    return '';
  }

  /**
   * 목업 데이터 - Firebase 연결 실패시 사용
   */
  private static getMockPlannerCourses(): FirebasePlannerCourse[] {
    return [
      {
        id: 'bs-basic-001',
        title: '25-7차 BS Basic 과정',
        startDate: '2025-09-03',
        endDate: '2025-09-05',
        instructors: ['instructor1', 'instructor2'],
        schedules: [
          {
            id: 'schedule-001',
            title: 'BS아무튼',
            startTime: '2025-09-03T09:00:00',
            endTime: '2025-09-03T10:00:00',
            instructor: 'instructor1',
            room: '강의실 1'
          },
          {
            id: 'schedule-002',
            title: 'PC 기초아무튼',
            startTime: '2025-09-03T10:00:00',
            endTime: '2025-09-03T11:00:00',
            instructor: 'instructor2',
            room: '강의실 1'
          }
        ]
      }
    ];
  }

  /**
   * 목업 캘린더 이벤트
   */
  private static getMockCalendarEvents(): CalendarEvent[] {
    return [
      {
        id: 'event-001',
        title: 'BS Basic 과정',
        start: '2025-09-03T09:00:00',
        end: '2025-09-03T18:00:00',
        type: 'course',
        course_id: 'bs-basic-001',
        instructor_id: 'instructor1',
        classroom: '강의실 1',
        status: 'scheduled',
        color: '#3B82F6',
        editable: false
      }
    ];
  }
}