import { supabase } from './supabase'

export type ActivityType = 'customer_visit' | 'phone_call' | 'proposal' | 'meeting' | 'training' | 'other'
export type ActivityStatus = 'pending' | 'approved' | 'rejected'

export interface Activity {
  id: string
  trainee_id: string
  trainee_name: string
  trainee_email: string
  type: ActivityType
  title: string
  description: string
  customer_name?: string
  customer_company?: string
  activity_date: string
  duration_minutes?: number
  location?: string
  photo_url?: string
  status: ActivityStatus
  instructor_feedback?: string
  instructor_id?: string
  instructor_name?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface CreateActivityData {
  type: ActivityType
  title: string
  description: string
  customer_name?: string
  customer_company?: string
  activity_date: string
  duration_minutes?: number
  location?: string
  photo?: File
}

export interface ActivityStats {
  total: number
  pending: number
  approved: number
  rejected: number
  by_type: Record<ActivityType, number>
  this_week: number
  this_month: number
}

export interface ActivityFilter {
  trainee_id?: string
  instructor_id?: string
  status?: ActivityStatus
  type?: ActivityType
  date_from?: string
  date_to?: string
  search?: string
}

// 활동 타입 라벨
export const activityTypeLabels: { [key in ActivityType]: string } = {
  customer_visit: '고객 방문',
  phone_call: '전화 상담',
  proposal: '제안서 작성',
  meeting: '회의 참석',
  training: '교육 참여',
  other: '기타'
}

// 활동 상태 라벨
export const activityStatusLabels: { [key in ActivityStatus]: string } = {
  pending: '검토 대기',
  approved: '승인',
  rejected: '반려'
}

export class ActivityService {
  // 활동 목록 조회 (필터링 지원)
  static async getActivities(filter: ActivityFilter = {}) {
    let query = supabase
      .from('bs_activities')
      .select('*')
      .order('created_at', { ascending: false })

    // 필터 적용
    if (filter.trainee_id) {
      query = query.eq('trainee_id', filter.trainee_id)
    }
    if (filter.instructor_id) {
      query = query.eq('instructor_id', filter.instructor_id)
    }
    if (filter.status) {
      query = query.eq('status', filter.status)
    }
    if (filter.type) {
      query = query.eq('type', filter.type)
    }
    if (filter.date_from) {
      query = query.gte('activity_date', filter.date_from)
    }
    if (filter.date_to) {
      query = query.lte('activity_date', filter.date_to)
    }
    if (filter.search) {
      query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%,customer_name.ilike.%${filter.search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    // 사용자 정보 가져오기 (별도 쿼리)
    if (!data || data.length === 0) {
      return [];
    }

    const traineeIds = [...new Set(data.map(item => item.trainee_id))];
    const instructorIds = [...new Set(data.map(item => item.instructor_id).filter(Boolean))];
    const allUserIds = [...traineeIds, ...instructorIds];

    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', allUserIds);

    const userMap = users?.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, any>) || {};

    // 데이터 매핑
    return data?.map(item => ({
      id: item.id,
      trainee_id: item.trainee_id,
      trainee_name: userMap[item.trainee_id]?.name || '',
      trainee_email: userMap[item.trainee_id]?.email || '',
      type: item.type,
      title: item.title,
      description: item.description,
      customer_name: item.customer_name,
      customer_company: item.customer_company,
      activity_date: item.activity_date,
      duration_minutes: item.duration_minutes,
      location: item.location,
      photo_url: item.photo_url,
      status: item.status,
      instructor_feedback: item.instructor_feedback,
      instructor_id: item.instructor_id,
      instructor_name: userMap[item.instructor_id]?.name || '',
      reviewed_at: item.reviewed_at,
      created_at: item.created_at,
      updated_at: item.updated_at
    })) as Activity[]
  }

  // 특정 활동 조회
  static async getActivityById(activityId: string) {
    const { data, error } = await supabase
      .from('bs_activities')
      .select('*')
      .eq('id', activityId)
      .single()

    if (error) throw error

    // 사용자 정보 가져오기
    const userIds = [data.trainee_id, data.instructor_id].filter(Boolean);
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds);

    const userMap = users?.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, any>) || {};

    return {
      id: data.id,
      trainee_id: data.trainee_id,
      trainee_name: userMap[data.trainee_id]?.name || '',
      trainee_email: userMap[data.trainee_id]?.email || '',
      type: data.type,
      title: data.title,
      description: data.description,
      customer_name: data.customer_name,
      customer_company: data.customer_company,
      activity_date: data.activity_date,
      duration_minutes: data.duration_minutes,
      location: data.location,
      photo_url: data.photo_url,
      status: data.status,
      instructor_feedback: data.instructor_feedback,
      instructor_id: data.instructor_id,
      instructor_name: userMap[data.instructor_id]?.name || '',
      reviewed_at: data.reviewed_at,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as Activity
  }

  // 활동 등록
  static async createActivity(traineeId: string, activityData: CreateActivityData) {
    let photoUrl = null

    // 사진 업로드
    if (activityData.photo) {
      const fileExt = activityData.photo.name.split('.').pop()
      const fileName = `${traineeId}_${Date.now()}.${fileExt}`
      const filePath = `activities/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('activity-photos')
        .upload(filePath, activityData.photo)

      if (uploadError) throw uploadError

      // 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from('activity-photos')
        .getPublicUrl(filePath)

      photoUrl = urlData.publicUrl
    }

    // 활동 데이터 저장
    const { data, error } = await supabase
      .from('bs_activities')
      .insert({
        trainee_id: traineeId,
        type: activityData.type,
        title: activityData.title,
        description: activityData.description,
        customer_name: activityData.customer_name,
        customer_company: activityData.customer_company,
        activity_date: activityData.activity_date,
        duration_minutes: activityData.duration_minutes,
        location: activityData.location,
        photo_url: photoUrl,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 활동 수정 (교육생만)
  static async updateActivity(activityId: string, traineeId: string, activityData: Partial<CreateActivityData>) {
    // 수정 권한 확인 (본인 활동이고 pending 상태인지)
    const { data: existingActivity, error: checkError } = await supabase
      .from('bs_activities')
      .select('trainee_id, status, photo_url')
      .eq('id', activityId)
      .single()

    if (checkError) throw checkError
    if (existingActivity.trainee_id !== traineeId) {
      throw new Error('본인의 활동만 수정할 수 있습니다')
    }
    if (existingActivity.status !== 'pending') {
      throw new Error('검토 대기 중인 활동만 수정할 수 있습니다')
    }

    let photoUrl = existingActivity.photo_url

    // 새 사진 업로드
    if (activityData.photo) {
      // 기존 사진 삭제
      if (existingActivity.photo_url) {
        const oldPath = existingActivity.photo_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('activity-photos')
            .remove([`activities/${oldPath}`])
        }
      }

      // 새 사진 업로드
      const fileExt = activityData.photo.name.split('.').pop()
      const fileName = `${traineeId}_${Date.now()}.${fileExt}`
      const filePath = `activities/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('activity-photos')
        .upload(filePath, activityData.photo)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('activity-photos')
        .getPublicUrl(filePath)

      photoUrl = urlData.publicUrl
    }

    // 활동 데이터 업데이트
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (activityData.type !== undefined) updateData.type = activityData.type
    if (activityData.title !== undefined) updateData.title = activityData.title
    if (activityData.description !== undefined) updateData.description = activityData.description
    if (activityData.customer_name !== undefined) updateData.customer_name = activityData.customer_name
    if (activityData.customer_company !== undefined) updateData.customer_company = activityData.customer_company
    if (activityData.activity_date !== undefined) updateData.activity_date = activityData.activity_date
    if (activityData.duration_minutes !== undefined) updateData.duration_minutes = activityData.duration_minutes
    if (activityData.location !== undefined) updateData.location = activityData.location
    if (photoUrl !== existingActivity.photo_url) updateData.photo_url = photoUrl

    const { data, error } = await supabase
      .from('bs_activities')
      .update(updateData)
      .eq('id', activityId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 활동 삭제 (교육생만, pending 상태만)
  static async deleteActivity(activityId: string, traineeId: string) {
    // 삭제 권한 확인
    const { data: existingActivity, error: checkError } = await supabase
      .from('bs_activities')
      .select('trainee_id, status, photo_url')
      .eq('id', activityId)
      .single()

    if (checkError) throw checkError
    if (existingActivity.trainee_id !== traineeId) {
      throw new Error('본인의 활동만 삭제할 수 있습니다')
    }
    if (existingActivity.status !== 'pending') {
      throw new Error('검토 대기 중인 활동만 삭제할 수 있습니다')
    }

    // 사진 파일 삭제
    if (existingActivity.photo_url) {
      const fileName = existingActivity.photo_url.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('activity-photos')
          .remove([`activities/${fileName}`])
      }
    }

    // 활동 삭제
    const { error } = await supabase
      .from('bs_activities')
      .delete()
      .eq('id', activityId)

    if (error) throw error
    return true
  }

  // 강사의 활동 검토 (승인/반려)
  static async reviewActivity(activityId: string, instructorId: string, status: 'approved' | 'rejected', feedback?: string) {
    const { data, error } = await supabase
      .from('bs_activities')
      .update({
        status,
        instructor_id: instructorId,
        instructor_feedback: feedback,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', activityId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 활동 통계 조회
  static async getActivityStats(filter: { trainee_id?: string, instructor_id?: string } = {}) {
    let query = supabase
      .from('bs_activities')
      .select('type, status, created_at')

    if (filter.trainee_id) {
      query = query.eq('trainee_id', filter.trainee_id)
    }
    if (filter.instructor_id) {
      query = query.eq('instructor_id', filter.instructor_id)
    }

    const { data, error } = await query

    if (error) throw error

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)

    const stats: ActivityStats = {
      total: data?.length || 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      by_type: {
        customer_visit: 0,
        phone_call: 0,
        proposal: 0,
        meeting: 0,
        training: 0,
        other: 0
      },
      this_week: 0,
      this_month: 0
    }

    data?.forEach(activity => {
      // 상태별 통계
      stats[activity.status as ActivityStatus]++

      // 타입별 통계
      stats.by_type[activity.type as ActivityType]++

      // 기간별 통계
      const createdAt = new Date(activity.created_at)
      if (createdAt >= weekAgo) {
        stats.this_week++
      }
      if (createdAt >= monthAgo) {
        stats.this_month++
      }
    })

    return stats
  }

  // 교육생별 활동 요약
  static async getTraineeActivitySummary(traineeId: string) {
    const activities = await this.getActivities({ trainee_id: traineeId })
    const stats = await this.getActivityStats({ trainee_id: traineeId })

    return {
      activities,
      stats,
      recent_activities: activities.slice(0, 5)
    }
  }

  // 강사별 검토 대기 활동 수
  static async getPendingActivitiesCount(instructorId?: string) {
    let query = supabase
      .from('bs_activities')
      .select('id', { count: 'exact' })
      .eq('status', 'pending')

    if (instructorId) {
      // 담당 교육생의 활동만 (향후 과정 배정 테이블과 연동)
      // 현재는 모든 pending 활동 반환
    }

    const { count, error } = await query

    if (error) throw error
    return count || 0
  }
}