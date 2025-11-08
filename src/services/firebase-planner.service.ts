import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getPlannerDb, isPlannerConfigured } from './firebase';
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
 * Firestore를 직접 사용하여 데이터를 동기화
 */
export class FirebasePlannerService {
  private static readonly FIREBASE_PLANNER_URL = process.env.NEXT_PUBLIC_FIREBASE_PLANNER_URL || 'https://studio--eduscheduler-nrx9o.us-central1.hosted.app';

  /**
   * Firebase 플래너에서 과정 목록 가져오기 (Firestore 직접 사용)
   */
  static async getCoursesFromPlanner(): Promise<FirebasePlannerCourse[]> {
    try {
      // Firebase 설정 확인
      if (!isPlannerConfigured()) {
        console.warn('Firebase 플래너가 설정되지 않았습니다. 목업 데이터를 사용합니다.');
        return this.getMockPlannerCourses();
      }

      const db = getPlannerDb();
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, orderBy('startDate', 'desc'));

      const snapshot = await getDocs(q);
      const courses: FirebasePlannerCourse[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        courses.push({
          id: doc.id,
          title: data.title || '',
          startDate: this.convertTimestampToString(data.startDate),
          endDate: this.convertTimestampToString(data.endDate),
          instructors: data.instructors || [],
          schedules: data.schedules || []
        });
      });

      console.log('✅ Firebase 플래너에서 과정 가져오기 성공:', courses.length, '개');
      return courses;

    } catch (error) {
      console.error('❌ Firebase 플래너에서 과정 목록 가져오기 실패:', error);
      // Fallback: 목업 데이터 반환
      return this.getMockPlannerCourses();
    }
  }

  /**
   * Firebase 플래너에서 특정 과정의 상세 정보 가져오기
   */
  static async getCourseFromPlanner(courseId: string): Promise<FirebasePlannerCourse | null> {
    try {
      if (!isPlannerConfigured()) {
        return null;
      }

      const db = getPlannerDb();
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, where('__name__', '==', courseId));

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        title: data.title || '',
        startDate: this.convertTimestampToString(data.startDate),
        endDate: this.convertTimestampToString(data.endDate),
        instructors: data.instructors || [],
        schedules: data.schedules || []
      };

    } catch (error) {
      console.error(`❌ Firebase 플래너에서 과정 ${courseId} 가져오기 실패:`, error);
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
   * Firebase 플래너에서 캘린더 이벤트 가져오기 (Firestore 직접 사용)
   */
  static async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    try {
      if (!isPlannerConfigured()) {
        console.warn('Firebase 플래너가 설정되지 않았습니다. 목업 데이터를 사용합니다.');
        return this.getMockCalendarEvents();
      }

      const db = getPlannerDb();
      const schedulesRef = collection(db, 'schedules');

      // Firestore에서 날짜 범위로 쿼리
      const q = query(
        schedulesRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(q);
      const events: CalendarEvent[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // 시작/종료 시간 조합
        const startDateTime = `${data.date}T${data.startTime || '09:00'}:00`;
        const endDateTime = `${data.date}T${data.endTime || '18:00'}:00`;

        events.push({
          id: doc.id,
          title: data.title || data.subject || '제목 없음',
          start: startDateTime,
          end: endDateTime,
          type: 'course',
          course_id: data.courseId || '',
          instructor_id: data.instructorId || data.instructor || '',
          classroom: data.classroom || data.room || '',
          status: data.status || 'scheduled',
          color: this.getEventColor(data.courseType || data.title),
          editable: false
        });
      });

      console.log('✅ Firebase 플래너에서 캘린더 이벤트 가져오기 성공:', events.length, '개');
      return events;

    } catch (error) {
      console.error('❌ Firebase 플래너에서 캘린더 이벤트 가져오기 실패:', error);
      return this.getMockCalendarEvents();
    }
  }

  /**
   * Firestore Timestamp를 문자열로 변환
   */
  private static convertTimestampToString(timestamp: any): string {
    if (!timestamp) return '';

    try {
      // Firestore Timestamp 객체인 경우
      if (timestamp.toDate) {
        return timestamp.toDate().toISOString().split('T')[0];
      }

      // 이미 문자열인 경우
      if (typeof timestamp === 'string') {
        return timestamp.split('T')[0];
      }

      // Date 객체인 경우
      if (timestamp instanceof Date) {
        return timestamp.toISOString().split('T')[0];
      }

      return '';
    } catch (error) {
      console.error('Timestamp 변환 실패:', error);
      return '';
    }
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

    // 부분 매칭
    for (const [key, color] of Object.entries(colorMap)) {
      if (eventType && eventType.includes(key)) {
        return color;
      }
    }

    return colorMap.default;
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
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return [
      {
        id: 'event-001',
        title: 'BS Basic 과정',
        start: `${todayStr}T09:00:00`,
        end: `${todayStr}T12:00:00`,
        type: 'course',
        course_id: 'bs-basic-001',
        instructor_id: 'instructor1',
        classroom: '강의실 1',
        status: 'scheduled',
        color: '#3B82F6',
        editable: false
      },
      {
        id: 'event-002',
        title: 'PC기초아무튼',
        start: `${todayStr}T14:00:00`,
        end: `${todayStr}T17:00:00`,
        type: 'course',
        course_id: 'bs-basic-002',
        instructor_id: 'instructor2',
        classroom: '강의실 2',
        status: 'scheduled',
        color: '#10B981',
        editable: false
      }
    ];
  }
}
