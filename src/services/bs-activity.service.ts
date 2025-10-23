import { supabase } from './supabase';
import type {
  BSActivity,
  CreateBSActivityData,
  UpdateBSActivityData,
  BSActivityFilter,
  BSActivityStats,
  BSActivityDashboard,
  BSActivityDeadline,
  BSPresentationOrder,
  ActivityImage,
  PresentationStatus
} from '../types/bs-activity.types';

export class BSActivityService {
  // ==================== BS 활동 CRUD ====================

  /**
   * BS 활동 목록 조회 (필터링 지원)
   */
  static async getActivities(filter: BSActivityFilter = {}): Promise<BSActivity[]> {
    try {
      let query = supabase
        .from('bs_activities')
        .select(`
          *,
          trainee:users!trainee_id(id, name, email),
          course:courses!course_id(id, name)
        `)
        .order('activity_date', { ascending: false });

      // 필터 적용
      if (filter.trainee_id) {
        query = query.eq('trainee_id', filter.trainee_id);
      }
      if (filter.course_id) {
        query = query.eq('course_id', filter.course_id);
      }
      if (filter.category) {
        query = query.eq('category', filter.category);
      }
      if (filter.submission_status) {
        query = query.eq('submission_status', filter.submission_status);
      }
      if (filter.is_best_practice !== undefined) {
        query = query.eq('is_best_practice', filter.is_best_practice);
      }
      if (filter.date_from) {
        query = query.gte('activity_date', filter.date_from);
      }
      if (filter.date_to) {
        query = query.lte('activity_date', filter.date_to);
      }
      if (filter.search_keyword) {
        query = query.or(`title.ilike.%${filter.search_keyword}%,content.ilike.%${filter.search_keyword}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[BSActivityService] getActivities error:', error);
        // 테이블이 없는 경우 목데이터 반환
        return this.getMockActivities(filter);
      }

      // 데이터 매핑
      return (data || []).map((item: any) => ({
        ...item,
        trainee_name: item.trainee?.name,
        trainee_email: item.trainee?.email,
        course_name: item.course?.name,
        images: item.images || [],
        location: item.location || undefined,
        feedback: item.feedback || undefined
      }));
    } catch (error) {
      console.error('[BSActivityService] getActivities error:', error);
      return this.getMockActivities(filter);
    }
  }

  // 목데이터 반환
  private static getMockActivities(filter: BSActivityFilter = {}): BSActivity[] {
    const mockData: BSActivity[] = [
      {
        id: 'mock-1',
        trainee_id: 'trainee-1',
        trainee_name: '서울스마일치과의원 김영업',
        trainee_email: 'kim@example.com',
        course_id: filter.course_id || 'test-course-123',
        course_name: 'BS 영업 기초 과정',
        activity_date: '2025-01-15',
        category: 'new_visit',
        title: '서울스마일치과의원 신규 방문',
        content: '병원장님과 첫 미팅을 진행했습니다. 병원 현황과 니즈를 파악했으며, 다음 방문시 제안서를 가져오기로 했습니다.',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800',
            file_name: 'clinic-front.jpg',
            file_size: 150000,
            uploaded_at: '2025-01-15T10:30:00Z'
          }
        ],
        submission_status: 'submitted',
        submitted_at: '2025-01-15T14:00:00Z',
        is_best_practice: false,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T14:00:00Z'
      },
      {
        id: 'mock-2',
        trainee_id: 'trainee-1',
        trainee_name: '강남치과 이판매',
        trainee_email: 'lee@example.com',
        course_id: filter.course_id || 'test-course-123',
        course_name: 'BS 영업 기초 과정',
        activity_date: '2025-01-14',
        category: 'contract',
        title: '강남치과 계약 체결',
        content: '3개월 전부터 진행한 영업 활동이 결실을 맺어 계약을 체결했습니다. 연간 5천만원 규모의 계약입니다.',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800',
            file_name: 'contract-signing.jpg',
            file_size: 180000,
            uploaded_at: '2025-01-14T15:00:00Z'
          }
        ],
        submission_status: 'submitted',
        submitted_at: '2025-01-14T16:00:00Z',
        feedback: {
          comment: '훌륭한 성과입니다! 계약 체결 과정에서의 노하우를 다른 교육생들과 공유해주세요.',
          score: 5,
          reviewer_id: 'instructor-1',
          reviewer_name: '김강사',
          reviewed_at: '2025-01-15T09:00:00Z'
        },
        is_best_practice: true,
        created_at: '2025-01-14T11:00:00Z',
        updated_at: '2025-01-15T09:00:00Z'
      }
    ];

    // 필터 적용
    let filtered = mockData;

    if (filter.submission_status) {
      filtered = filtered.filter(a => a.submission_status === filter.submission_status);
    }
    if (filter.category) {
      filtered = filtered.filter(a => a.category === filter.category);
    }
    if (filter.is_best_practice !== undefined) {
      filtered = filtered.filter(a => a.is_best_practice === filter.is_best_practice);
    }

    return filtered;
  }

  /**
   * BS 활동 상세 조회
   */
  static async getActivity(id: string): Promise<BSActivity | null> {
    try {
      const { data, error } = await supabase
        .from('bs_activities')
        .select(`
          *,
          trainee:users!trainee_id(id, name, email),
          course:courses!course_id(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('[BSActivityService] getActivity error:', error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        trainee_name: data.trainee?.name,
        trainee_email: data.trainee?.email,
        course_name: data.course?.name,
        images: data.images || [],
        location: data.location || undefined,
        feedback: data.feedback || undefined
      };
    } catch (error) {
      console.error('[BSActivityService] getActivity error:', error);
      throw error;
    }
  }

  /**
   * BS 활동 생성
   */
  static async createActivity(data: CreateBSActivityData): Promise<BSActivity> {
    try {
      const { data: created, error } = await supabase
        .from('bs_activities')
        .insert({
          ...data,
          images: data.images || [],
          location: data.location || null,
          submission_status: data.submission_status || 'draft'
        })
        .select()
        .single();

      if (error) {
        console.error('[BSActivityService] createActivity error:', error);
        throw error;
      }

      return created;
    } catch (error) {
      console.error('[BSActivityService] createActivity error:', error);
      throw error;
    }
  }

  /**
   * BS 활동 수정
   */
  static async updateActivity(id: string, data: UpdateBSActivityData): Promise<BSActivity> {
    try {
      const { data: updated, error } = await supabase
        .from('bs_activities')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[BSActivityService] updateActivity error:', error);
        throw error;
      }

      return updated;
    } catch (error) {
      console.error('[BSActivityService] updateActivity error:', error);
      throw error;
    }
  }

  /**
   * BS 활동 삭제
   */
  static async deleteActivity(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bs_activities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[BSActivityService] deleteActivity error:', error);
        throw error;
      }
    } catch (error) {
      console.error('[BSActivityService] deleteActivity error:', error);
      throw error;
    }
  }

  /**
   * BS 활동 제출
   */
  static async submitActivity(id: string): Promise<BSActivity> {
    try {
      const { data, error } = await supabase
        .from('bs_activities')
        .update({
          submission_status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[BSActivityService] submitActivity error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[BSActivityService] submitActivity error:', error);
      throw error;
    }
  }

  // ==================== 피드백 관리 ====================

  /**
   * BS 활동 피드백 작성
   */
  static async addFeedback(
    activityId: string,
    comment: string,
    score: number,
    reviewerId: string,
    reviewerName: string
  ): Promise<BSActivity> {
    try {
      const feedback = {
        comment,
        score,
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        reviewed_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bs_activities')
        .update({ feedback })
        .eq('id', activityId)
        .select()
        .single();

      if (error) {
        console.error('[BSActivityService] addFeedback error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[BSActivityService] addFeedback error:', error);
      throw error;
    }
  }

  /**
   * 우수 사례 마킹
   */
  static async markAsBestPractice(activityId: string, isBest: boolean): Promise<BSActivity> {
    try {
      const { data, error } = await supabase
        .from('bs_activities')
        .update({ is_best_practice: isBest })
        .eq('id', activityId)
        .select()
        .single();

      if (error) {
        console.error('[BSActivityService] markAsBestPractice error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[BSActivityService] markAsBestPractice error:', error);
      throw error;
    }
  }

  // ==================== 통계 및 대시보드 ====================

  /**
   * BS 활동 통계 조회
   */
  static async getActivityStats(courseId: string): Promise<BSActivityStats> {
    try {
      const { data: activities, error } = await supabase
        .from('bs_activities')
        .select('*')
        .eq('course_id', courseId);

      if (error) {
        console.error('[BSActivityService] getActivityStats error:', error);
        return this.getMockActivityStats(courseId);
      }

      const stats: BSActivityStats = {
        total_activities: activities?.length || 0,
        submitted_activities: activities?.filter(a => a.submission_status === 'submitted').length || 0,
        draft_activities: activities?.filter(a => a.submission_status === 'draft').length || 0,
        on_time_submissions: 0, // TODO: 기한 체크 로직 추가
        late_submissions: 0,
        average_score: 0,
        best_practices_count: activities?.filter(a => a.is_best_practice).length || 0,
        activities_by_category: {
          new_visit: activities?.filter(a => a.category === 'new_visit').length || 0,
          follow_up: activities?.filter(a => a.category === 'follow_up').length || 0,
          contract: activities?.filter(a => a.category === 'contract').length || 0,
          presentation: activities?.filter(a => a.category === 'presentation').length || 0,
          feedback: activities?.filter(a => a.category === 'feedback').length || 0,
          networking: activities?.filter(a => a.category === 'networking').length || 0,
          other: activities?.filter(a => a.category === 'other').length || 0
        }
      };

      // 평균 점수 계산
      const feedbackActivities = activities?.filter(a => a.feedback?.score) || [];
      if (feedbackActivities.length > 0) {
        const totalScore = feedbackActivities.reduce((sum, a) => sum + (a.feedback?.score || 0), 0);
        stats.average_score = totalScore / feedbackActivities.length;
      }

      return stats;
    } catch (error) {
      console.error('[BSActivityService] getActivityStats error:', error);
      return this.getMockActivityStats(courseId);
    }
  }

  /**
   * Mock 통계 데이터 (테스트용)
   */
  private static getMockActivityStats(courseId: string): BSActivityStats {
    return {
      total_activities: 2,
      submitted_activities: 2,
      draft_activities: 0,
      on_time_submissions: 2,
      late_submissions: 0,
      average_score: 5.0,
      best_practices_count: 1,
      activities_by_category: {
        new_visit: 1,
        follow_up: 0,
        contract: 1,
        presentation: 0,
        feedback: 0,
        networking: 0,
        other: 0
      }
    };
  }

  /**
   * BS 활동 대시보드 데이터 조회
   */
  static async getDashboard(courseId: string): Promise<BSActivityDashboard> {
    try {
      const [stats, deadlines, activities, bestPractices] = await Promise.all([
        this.getActivityStats(courseId),
        this.getDeadlines(courseId),
        this.getActivities({ course_id: courseId }),
        this.getActivities({ course_id: courseId, is_best_practice: true })
      ]);

      return {
        stats,
        upcoming_deadlines: deadlines.filter(d => new Date(d.deadline_date) >= new Date()),
        recent_activities: activities.slice(0, 10),
        best_practices: bestPractices
      };
    } catch (error) {
      console.error('[BSActivityService] getDashboard error:', error);
      throw error;
    }
  }

  // ==================== 제출 기한 관리 ====================

  /**
   * 제출 기한 목록 조회
   */
  static async getDeadlines(courseId: string): Promise<BSActivityDeadline[]> {
    try {
      const { data, error } = await supabase
        .from('bs_activity_deadlines')
        .select('*')
        .eq('course_id', courseId)
        .order('week_number', { ascending: true });

      if (error) {
        console.error('[BSActivityService] getDeadlines error:', error);
        // Return mock deadlines for testing
        return this.getMockDeadlines(courseId);
      }
      return data || [];
    } catch (error) {
      console.error('[BSActivityService] getDeadlines error:', error);
      return this.getMockDeadlines(courseId);
    }
  }

  /**
   * Mock 제출 기한 데이터 (테스트용)
   */
  private static getMockDeadlines(courseId: string): BSActivityDeadline[] {
    return [
      {
        id: 'mock-deadline-1',
        course_id: courseId,
        week_number: 1,
        deadline_date: '2025-01-20',
        title: '1주차 BS 활동 제출',
        description: '신규 방문 또는 후속 방문 활동을 최소 2건 이상 작성해주세요.',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'mock-deadline-2',
        course_id: courseId,
        week_number: 2,
        deadline_date: '2025-01-27',
        title: '2주차 BS 활동 제출',
        description: '계약 체결 또는 발표 활동을 포함하여 3건 이상 작성해주세요.',
        created_at: '2025-01-01T00:00:00Z'
      }
    ];
  }

  /**
   * 제출 기한 생성
   */
  static async createDeadline(deadline: Omit<BSActivityDeadline, 'id' | 'created_at'>): Promise<BSActivityDeadline> {
    try {
      const { data, error } = await supabase
        .from('bs_activity_deadlines')
        .insert(deadline)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[BSActivityService] createDeadline error:', error);
      throw error;
    }
  }

  // ==================== 발표 순서 관리 ====================

  /**
   * 발표 순서 조회
   */
  static async getPresentationOrders(courseId: string, presentationDate: string): Promise<BSPresentationOrder[]> {
    try {
      const { data, error } = await supabase
        .from('bs_presentation_orders')
        .select(`
          *,
          trainee:users!trainee_id(id, name)
        `)
        .eq('course_id', courseId)
        .eq('presentation_date', presentationDate)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('[BSActivityService] getPresentationOrders error:', error);
        // 테이블이 없거나 에러 발생 시 빈 배열 반환
        return this.getMockPresentationOrders(courseId, presentationDate);
      }

      return (data || []).map((item: any) => ({
        ...item,
        trainee_name: item.trainee?.name
      }));
    } catch (error) {
      console.error('[BSActivityService] getPresentationOrders error:', error);
      return this.getMockPresentationOrders(courseId, presentationDate);
    }
  }

  /**
   * Mock 발표 순서 데이터 (테스트용)
   */
  private static getMockPresentationOrders(courseId: string, presentationDate: string): BSPresentationOrder[] {
    return [
      {
        id: 'mock-order-1',
        course_id: courseId,
        presentation_date: presentationDate,
        trainee_id: 'trainee-1',
        trainee_name: '김영업',
        order_index: 1,
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 'mock-order-2',
        course_id: courseId,
        presentation_date: presentationDate,
        trainee_id: 'trainee-2',
        trainee_name: '이판매',
        order_index: 2,
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 'mock-order-3',
        course_id: courseId,
        presentation_date: presentationDate,
        trainee_id: 'trainee-3',
        trainee_name: '박세일즈',
        order_index: 3,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ];
  }

  /**
   * 발표 순서 생성
   */
  static async createPresentationOrder(
    courseId: string,
    presentationDate: string,
    traineeId: string,
    orderIndex: number
  ): Promise<BSPresentationOrder> {
    try {
      const { data, error } = await supabase
        .from('bs_presentation_orders')
        .insert({
          course_id: courseId,
          presentation_date: presentationDate,
          trainee_id: traineeId,
          order_index: orderIndex,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[BSActivityService] createPresentationOrder error:', error);
      throw error;
    }
  }

  /**
   * 발표 상태 업데이트
   */
  static async updatePresentationStatus(orderId: string, status: PresentationStatus): Promise<BSPresentationOrder> {
    try {
      const { data, error } = await supabase
        .from('bs_presentation_orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[BSActivityService] updatePresentationStatus error:', error);
      throw error;
    }
  }

  // ==================== 이미지 업로드 ====================

  /**
   * 이미지 업로드 (Supabase Storage)
   */
  static async uploadImage(file: File, traineeId: string): Promise<ActivityImage> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${traineeId}/${Date.now()}.${fileExt}`;
      const filePath = `bs-activity-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from('bs-activity-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('bs-activity-images')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('[BSActivityService] uploadImage error:', error);
      throw error;
    }
  }

  /**
   * 이미지 삭제
   */
  static async deleteImage(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from('bs-activity-images')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('[BSActivityService] deleteImage error:', error);
      throw error;
    }
  }
}
