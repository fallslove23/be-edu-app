/**
 * 만족도 평가 시스템 서비스
 * 외부 평가 앱(sseducationfeedback.info)의 Supabase와 연동
 */

import { createClient } from '@supabase/supabase-js';
import type {
  CourseSatisfaction,
  CourseSatisfactionCreate,
  InstructorSatisfaction,
  InstructorSatisfactionCreate,
  OperationSatisfaction,
  OperationSatisfactionCreate,
  FeedbackStatistics,
  CourseRoundFeedbackSummary,
  InstructorFeedbackSummary,
  FeedbackTrend
} from '../types/feedback.types';

// Supabase 클라이언트 (동일한 프로젝트 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다:', {
    url: !!supabaseUrl,
    key: !!supabaseKey,
  });
  throw new Error('Supabase 설정이 올바르지 않습니다. 환경 변수를 확인해주세요.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ========================================
// 과정 만족도 평가
// ========================================

/**
 * 과정 만족도 평가 목록 조회
 */
export async function getCourseSatisfactions(courseRoundId: string) {
  try {
    const { data, error } = await supabase
      .from('course_satisfactions')
      .select('*')
      .eq('course_round_id', courseRoundId)
      .order('submitted_at', { ascending: false });

    if (error) {
      // 에러 객체를 직렬화 가능한 형태로 변환
      const errorInfo = {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        courseRoundId,
      };
      
      console.error('과정 만족도 조회 오류:', JSON.stringify(errorInfo, null, 2));
      console.error('원본 에러 객체:', error);
      
      // 테이블이 없는 경우를 위한 특별 처리
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
        console.warn('course_satisfactions 테이블이 존재하지 않습니다. 빈 배열을 반환합니다.');
        return [];
      }
      
      // RLS 정책 문제인 경우
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        console.warn('RLS 정책으로 인해 접근이 거부되었습니다. 빈 배열을 반환합니다.');
        return [];
      }
      
      // 기타 오류는 경고만 하고 빈 배열 반환 (앱이 중단되지 않도록)
      console.warn('과정 만족도 조회 중 오류 발생. 빈 배열을 반환합니다:', error.message || error.code);
      return [];
    }
    return (data || []) as CourseSatisfaction[];
  } catch (err) {
    // 예상치 못한 오류도 빈 배열 반환 (앱이 중단되지 않도록)
    console.warn('과정 만족도 조회 중 예상치 못한 오류 발생. 빈 배열을 반환합니다:', err);
    return [];
  }
}

/**
 * 과정 만족도 평가 생성
 */
export async function createCourseSatisfaction(satisfaction: CourseSatisfactionCreate) {
  const { data, error } = await supabase
    .from('course_satisfactions')
    .insert(satisfaction)
    .select()
    .single();

  if (error) throw error;
  return data as CourseSatisfaction;
}

/**
 * 과정 만족도 평가 수정
 */
export async function updateCourseSatisfaction(id: string, updates: Partial<CourseSatisfaction>) {
  const { data, error } = await supabase
    .from('course_satisfactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CourseSatisfaction;
}

// ========================================
// 강사 만족도 평가
// ========================================

/**
 * 강사 만족도 평가 목록 조회
 */
export async function getInstructorSatisfactions(courseRoundId: string, instructorId?: string) {
  let query = supabase
    .from('instructor_satisfactions')
    .select('*')
    .eq('course_round_id', courseRoundId);

  if (instructorId) {
    query = query.eq('instructor_id', instructorId);
  }

  const { data, error } = await query.order('submitted_at', { ascending: false });

  if (error) {
    // 에러 객체를 직렬화 가능한 형태로 변환
    const errorInfo = {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      courseRoundId,
      instructorId,
    };
    
    console.error('강사 만족도 조회 오류:', JSON.stringify(errorInfo, null, 2));
    console.error('원본 에러 객체:', error);
    
    // 테이블이 없는 경우를 위한 특별 처리
    if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
      console.warn('instructor_satisfactions 테이블이 존재하지 않습니다. 빈 배열을 반환합니다.');
      return [];
    }
    
    // RLS 정책 문제인 경우
    if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
      console.warn('RLS 정책으로 인해 접근이 거부되었습니다. 빈 배열을 반환합니다.');
      return [];
    }
    
    // 기타 오류는 경고만 하고 빈 배열 반환 (앱이 중단되지 않도록)
    console.warn('강사 만족도 조회 중 오류 발생. 빈 배열을 반환합니다:', error.message || error.code);
    return [];
  }
  return (data || []) as InstructorSatisfaction[];
}

/**
 * 강사 만족도 평가 생성
 */
export async function createInstructorSatisfaction(satisfaction: InstructorSatisfactionCreate) {
  const { data, error } = await supabase
    .from('instructor_satisfactions')
    .insert(satisfaction)
    .select()
    .single();

  if (error) throw error;
  return data as InstructorSatisfaction;
}

/**
 * 강사 만족도 평가 수정
 */
export async function updateInstructorSatisfaction(id: string, updates: Partial<InstructorSatisfaction>) {
  const { data, error } = await supabase
    .from('instructor_satisfactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as InstructorSatisfaction;
}

// ========================================
// 운영 만족도 평가
// ========================================

/**
 * 운영 만족도 평가 목록 조회
 */
export async function getOperationSatisfactions(courseRoundId: string) {
  try {
    const { data, error } = await supabase
      .from('operation_satisfactions')
      .select('*')
      .eq('course_round_id', courseRoundId)
      .order('submitted_at', { ascending: false });

    if (error) {
      // 에러 객체를 직렬화 가능한 형태로 변환
      const errorInfo = {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        courseRoundId,
      };
      
      console.error('운영 만족도 조회 오류:', JSON.stringify(errorInfo, null, 2));
      console.error('원본 에러 객체:', error);
      
      // 테이블이 없는 경우를 위한 특별 처리
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
        console.warn('operation_satisfactions 테이블이 존재하지 않습니다. 빈 배열을 반환합니다.');
        return [];
      }
      
      // RLS 정책 문제인 경우
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        console.warn('RLS 정책으로 인해 접근이 거부되었습니다. 빈 배열을 반환합니다.');
        return [];
      }
      
      // 기타 오류는 경고만 하고 빈 배열 반환 (앱이 중단되지 않도록)
      console.warn('운영 만족도 조회 중 오류 발생. 빈 배열을 반환합니다:', error.message || error.code);
      return [];
    }
    return (data || []) as OperationSatisfaction[];
  } catch (err) {
    // 예상치 못한 오류도 빈 배열 반환 (앱이 중단되지 않도록)
    console.warn('운영 만족도 조회 중 예상치 못한 오류 발생. 빈 배열을 반환합니다:', err);
    return [];
  }
}

/**
 * 운영 만족도 평가 생성
 */
export async function createOperationSatisfaction(satisfaction: OperationSatisfactionCreate) {
  const { data, error } = await supabase
    .from('operation_satisfactions')
    .insert(satisfaction)
    .select()
    .single();

  if (error) throw error;
  return data as OperationSatisfaction;
}

/**
 * 운영 만족도 평가 수정
 */
export async function updateOperationSatisfaction(id: string, updates: Partial<OperationSatisfaction>) {
  const { data, error } = await supabase
    .from('operation_satisfactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as OperationSatisfaction;
}

// ========================================
// 통계 및 분석
// ========================================

/**
 * 과정별 종합 만족도 통계
 */
export async function getFeedbackStatistics(courseRoundId: string): Promise<FeedbackStatistics> {
  if (!courseRoundId) {
    throw new Error('과정 차수 ID가 필요합니다.');
  }

  try {
    // 과정 만족도
    const courseData = await getCourseSatisfactions(courseRoundId);

    // 강사 만족도
    const instructorData = await getInstructorSatisfactions(courseRoundId);

    // 운영 만족도
    const operationData = await getOperationSatisfactions(courseRoundId);

    // 교육생 수 조회
    const { count: totalTrainees, error: countError } = await supabase
      .from('round_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('round_id', courseRoundId);

    if (countError) {
      const errorInfo = {
        code: countError.code,
        message: countError.message,
        details: countError.details,
        hint: countError.hint,
        courseRoundId,
      };
      console.error('교육생 수 조회 오류:', JSON.stringify(errorInfo, null, 2));
      console.error('원본 에러 객체:', countError);
      
      // 테이블이 없거나 RLS 문제인 경우 0으로 처리
      if (countError.code === '42P01' || countError.code === '42501' || 
          countError.message?.includes('does not exist') || 
          countError.message?.includes('permission') ||
          countError.message?.includes('policy')) {
        console.warn('round_enrollments 테이블 접근 오류. 교육생 수를 0으로 처리합니다.');
      }
      // 에러를 던지지 않고 0으로 처리하여 계속 진행
    }

    const responseCount = courseData.length;
    const responseRate = totalTrainees ? (responseCount / totalTrainees) * 100 : 0;

    // 과정 만족도 평균 계산
    const courseSatisfaction = {
      content_quality: calculateAverage(courseData, 'content_quality'),
      difficulty_level: calculateAverage(courseData, 'difficulty_level'),
      practical_applicability: calculateAverage(courseData, 'practical_applicability'),
      materials_quality: calculateAverage(courseData, 'materials_quality'),
      facility_satisfaction: calculateAverage(courseData, 'facility_satisfaction'),
      overall_satisfaction: calculateAverage(courseData, 'overall_satisfaction'),
    };

    // 강사 만족도 평균 계산
    const instructorSatisfaction = {
      teaching_skill: calculateAverage(instructorData, 'teaching_skill'),
      communication: calculateAverage(instructorData, 'communication'),
      preparation: calculateAverage(instructorData, 'preparation'),
      response_to_questions: calculateAverage(instructorData, 'response_to_questions'),
      enthusiasm: calculateAverage(instructorData, 'enthusiasm'),
      overall_satisfaction: calculateAverage(instructorData, 'overall_satisfaction'),
    };

    // 운영 만족도 평균 계산
    const operationSatisfaction = {
      registration_process: calculateAverage(operationData, 'registration_process'),
      schedule_management: calculateAverage(operationData, 'schedule_management'),
      communication: calculateAverage(operationData, 'communication'),
      administrative_support: calculateAverage(operationData, 'administrative_support'),
      facility_management: calculateAverage(operationData, 'facility_management'),
      overall_satisfaction: calculateAverage(operationData, 'overall_satisfaction'),
    };

    // 전체 종합 만족도
    const overallAverage = (
      courseSatisfaction.overall_satisfaction +
      instructorSatisfaction.overall_satisfaction +
      operationSatisfaction.overall_satisfaction
    ) / 3;

    // 분포도 계산
    const allScores = [
      ...courseData.map(d => d.overall_satisfaction),
      ...instructorData.map(d => d.overall_satisfaction),
      ...operationData.map(d => d.overall_satisfaction),
    ];

    const distribution = calculateDistribution(allScores);

    return {
      course_round_id: courseRoundId,
      total_trainees: totalTrainees || 0,
      response_count: responseCount,
      response_rate: responseRate,
      course_satisfaction: courseSatisfaction,
      instructor_satisfaction: instructorSatisfaction,
      operation_satisfaction: operationSatisfaction,
      overall_average: overallAverage,
      distribution,
      calculated_at: new Date().toISOString(),
    };
  } catch (error) {
    // 에러 정보를 더 자세히 로깅
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error;
    
    console.error('getFeedbackStatistics 오류:', {
      error: errorDetails,
      courseRoundId,
    });
    
    // 테이블이 없는 경우 기본값 반환 (앱이 중단되지 않도록)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('table')) {
      console.warn('만족도 테이블이 존재하지 않습니다. 기본 통계를 반환합니다.');
      
      // 기본 통계 반환
      return {
        course_round_id: courseRoundId,
        total_trainees: 0,
        response_count: 0,
        response_rate: 0,
        course_satisfaction: {
          content_quality: 0,
          difficulty_level: 0,
          practical_applicability: 0,
          materials_quality: 0,
          facility_satisfaction: 0,
          overall_satisfaction: 0,
        },
        instructor_satisfaction: {
          teaching_skill: 0,
          communication: 0,
          preparation: 0,
          response_to_questions: 0,
          enthusiasm: 0,
          overall_satisfaction: 0,
        },
        operation_satisfaction: {
          registration_process: 0,
          schedule_management: 0,
          communication: 0,
          administrative_support: 0,
          facility_management: 0,
          overall_satisfaction: 0,
        },
        overall_average: 0,
        distribution: {
          very_satisfied: 0,
          satisfied: 0,
          neutral: 0,
          dissatisfied: 0,
          very_dissatisfied: 0,
        },
        calculated_at: new Date().toISOString(),
      };
    }
    
    // 기타 오류도 기본값 반환 (앱이 중단되지 않도록)
    console.warn('만족도 통계 조회 중 오류 발생. 기본 통계를 반환합니다.');
    return {
      course_round_id: courseRoundId,
      total_trainees: 0,
      response_count: 0,
      response_rate: 0,
      course_satisfaction: {
        content_quality: 0,
        difficulty_level: 0,
        practical_applicability: 0,
        materials_quality: 0,
        facility_satisfaction: 0,
        overall_satisfaction: 0,
      },
      instructor_satisfaction: {
        teaching_skill: 0,
        communication: 0,
        preparation: 0,
        response_to_questions: 0,
        enthusiasm: 0,
        overall_satisfaction: 0,
      },
      operation_satisfaction: {
        registration_process: 0,
        schedule_management: 0,
        communication: 0,
        administrative_support: 0,
        facility_management: 0,
        overall_satisfaction: 0,
      },
      overall_average: 0,
      distribution: {
        very_satisfied: 0,
        satisfied: 0,
        neutral: 0,
        dissatisfied: 0,
        very_dissatisfied: 0,
      },
      calculated_at: new Date().toISOString(),
    };
  }
}

/**
 * 과정별 만족도 요약 목록
 */
export async function getCourseRoundFeedbackSummaries(): Promise<CourseRoundFeedbackSummary[]> {
  try {
    // 모든 과정 차수 조회
    const { data: rounds, error: roundsError } = await supabase
      .from('course_rounds')
      .select('id, title, start_date, end_date')
      .order('start_date', { ascending: false });

    if (roundsError) {
      console.error('과정 차수 조회 오류:', roundsError);
      throw new Error(roundsError.message || '과정 차수 정보를 가져오는데 실패했습니다.');
    }

    if (!rounds || rounds.length === 0) {
      // 데이터가 없는 경우 빈 배열 반환
      return [];
    }

    // 각 과정별 통계 계산
    type RoundData = { id: string; title: string | null; start_date: string | null; end_date: string | null };
    const summaries = await Promise.all(
      (rounds as RoundData[]).map(async (round) => {
        try {
          const stats = await getFeedbackStatistics(round.id);

          return {
            course_round_id: round.id,
            course_name: round.title || '과정명 없음',
            course_period: `${round.start_date || ''} ~ ${round.end_date || ''}`,
            total_trainees: stats.total_trainees,
            response_count: stats.response_count,
            response_rate: stats.response_rate,
            course_avg: stats.course_satisfaction.overall_satisfaction,
            instructor_avg: stats.instructor_satisfaction.overall_satisfaction,
            operation_avg: stats.operation_satisfaction.overall_satisfaction,
            overall_avg: stats.overall_average,
            is_completed: stats.response_rate >= 80, // 80% 이상 응답 시 완료로 간주
            completed_at: stats.response_rate >= 80 ? new Date().toISOString() : undefined,
          };
        } catch (error) {
          // 에러 정보를 더 자세히 로깅
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorDetails = error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : error;
          
          console.error(`과정 ${round.id} (${round.title || '이름 없음'}) 통계 계산 오류:`, {
            error: errorDetails,
            errorMessage,
            roundId: round.id,
          });
          
          // 개별 과정 오류는 무시하고 기본값 반환
          return {
            course_round_id: round.id,
            course_name: round.title || '과정명 없음',
            course_period: `${round.start_date || ''} ~ ${round.end_date || ''}`,
            total_trainees: 0,
            response_count: 0,
            response_rate: 0,
            course_avg: 0,
            instructor_avg: 0,
            operation_avg: 0,
            overall_avg: 0,
            is_completed: false,
          };
        }
      })
    );

    return summaries;
  } catch (error) {
    console.error('getCourseRoundFeedbackSummaries 오류:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as any)?.message || '과정 요약 정보를 가져오는 중 오류가 발생했습니다.';
    throw new Error(errorMessage);
  }
}

/**
 * 강사별 만족도 요약
 */
export async function getInstructorFeedbackSummaries(): Promise<InstructorFeedbackSummary[]> {
  try {
    // 모든 강사 평가 조회
    const { data: allEvaluations, error } = await supabase
      .from('instructor_satisfactions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('강사 만족도 조회 오류:', error);
      throw new Error(error.message || '강사 만족도 데이터를 가져오는데 실패했습니다.');
    }

    if (!allEvaluations || allEvaluations.length === 0) {
      return [];
    }

    // 강사별로 그룹화
    const instructorMap = new Map<string, InstructorSatisfaction[]>();
    allEvaluations.forEach((evaluation) => {
      const existing = instructorMap.get(evaluation.instructor_id) || [];
      instructorMap.set(evaluation.instructor_id, [...existing, evaluation]);
    });

    // 강사별 통계 계산
    const summaries: InstructorFeedbackSummary[] = [];
    instructorMap.forEach((evaluations, instructorId) => {
      const instructorName = evaluations[0].instructor_name;

      summaries.push({
        instructor_id: instructorId,
        instructor_name: instructorName,
        total_evaluations: evaluations.length,
        teaching_skill_avg: calculateAverage(evaluations, 'teaching_skill'),
        communication_avg: calculateAverage(evaluations, 'communication'),
        preparation_avg: calculateAverage(evaluations, 'preparation'),
        response_to_questions_avg: calculateAverage(evaluations, 'response_to_questions'),
        enthusiasm_avg: calculateAverage(evaluations, 'enthusiasm'),
        overall_avg: calculateAverage(evaluations, 'overall_satisfaction'),
        last_evaluation_date: evaluations[0].submitted_at,
      });
    });

    return summaries.sort((a, b) => b.overall_avg - a.overall_avg);
  } catch (error) {
    console.error('getInstructorFeedbackSummaries 오류:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as any)?.message || '강사 요약 정보를 가져오는 중 오류가 발생했습니다.';
    throw new Error(errorMessage);
  }
}

/**
 * 만족도 트렌드 데이터 (월별)
 */
export async function getFeedbackTrends(months: number = 12): Promise<FeedbackTrend[]> {
  const trends: FeedbackTrend[] = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

    const nextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);

    // 해당 월의 모든 평가 조회
    const { data: courseData, error: courseError } = await supabase
      .from('course_satisfactions')
      .select('overall_satisfaction')
      .gte('submitted_at', targetDate.toISOString())
      .lt('submitted_at', nextMonth.toISOString());

    const { data: instructorData, error: instructorError } = await supabase
      .from('instructor_satisfactions')
      .select('overall_satisfaction')
      .gte('submitted_at', targetDate.toISOString())
      .lt('submitted_at', nextMonth.toISOString());

    const { data: operationData, error: operationError } = await supabase
      .from('operation_satisfactions')
      .select('overall_satisfaction')
      .gte('submitted_at', targetDate.toISOString())
      .lt('submitted_at', nextMonth.toISOString());

    if (courseError) console.error(`과정 만족도 조회 오류 (${period}):`, courseError);
    if (instructorError) console.error(`강사 만족도 조회 오류 (${period}):`, instructorError);
    if (operationError) console.error(`운영 만족도 조회 오류 (${period}):`, operationError);

    const courseAvg = calculateAverage(courseData || [], 'overall_satisfaction');
    const instructorAvg = calculateAverage(instructorData || [], 'overall_satisfaction');
    const operationAvg = calculateAverage(operationData || [], 'overall_satisfaction');

    trends.push({
      period,
      course_avg: courseAvg,
      instructor_avg: instructorAvg,
      operation_avg: operationAvg,
      overall_avg: (courseAvg + instructorAvg + operationAvg) / 3,
      response_count: (courseData?.length || 0) + (instructorData?.length || 0) + (operationData?.length || 0),
    });
  }

  return trends.reverse(); // 오래된 순으로 정렬
}

// ========================================
// 유틸리티 함수
// ========================================

/**
 * 평균 계산 헬퍼
 */
function calculateAverage<T>(data: T[], field: keyof T): number {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
  return Math.round((sum / data.length) * 10) / 10; // 소수점 1자리
}

/**
 * 점수 분포 계산
 */
function calculateDistribution(scores: number[]) {
  if (scores.length === 0) {
    return {
      very_satisfied: 0,
      satisfied: 0,
      neutral: 0,
      dissatisfied: 0,
      very_dissatisfied: 0,
    };
  }

  const total = scores.length;
  const counts = {
    very_satisfied: scores.filter(s => s === 5).length,
    satisfied: scores.filter(s => s === 4).length,
    neutral: scores.filter(s => s === 3).length,
    dissatisfied: scores.filter(s => s === 2).length,
    very_dissatisfied: scores.filter(s => s === 1).length,
  };

  return {
    very_satisfied: Math.round((counts.very_satisfied / total) * 100),
    satisfied: Math.round((counts.satisfied / total) * 100),
    neutral: Math.round((counts.neutral / total) * 100),
    dissatisfied: Math.round((counts.dissatisfied / total) * 100),
    very_dissatisfied: Math.round((counts.very_dissatisfied / total) * 100),
  };
}
