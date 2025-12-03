/**
 * 샘플 강사 데이터 생성 스크립트
 * 관리자가 미리보기 기능을 테스트할 수 있도록 샘플 데이터 삽입
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSampleInstructor() {
  console.log('🌱 샘플 강사 데이터 생성 시작...');

  try {
    // 1. 기존 샘플 강사가 있는지 확인
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'sample.instructor@example.com')
      .single();

    if (existing) {
      console.log('✅ 샘플 강사가 이미 존재합니다:', existing.id);
      return existing.id;
    }

    // 2. 샘플 강사 생성
    const { data: instructor, error: instructorError } = await supabase
      .from('users')
      .insert({
        name: '박강사',
        email: 'sample.instructor@example.com',
        phone: '010-9876-5432',
        role: 'instructor',
        department: '교육팀',
        employee_id: 'INST-2024-001',
        is_active: true,
        first_login: false
      })
      .select()
      .single();

    if (instructorError) {
      throw instructorError;
    }

    console.log('✅ 샘플 강사 생성 완료:', instructor.id, instructor.name);

    // 3. 샘플 과정 생성 (강사가 담당할 과정)
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        name: 'BS Basic 과정 (샘플)',
        course_code: 'BS-BASIC-001',
        description: '기초 브라더스 교육 과정',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        instructor_id: instructor.id,
        max_students: 30,
        category: 'basic'
      })
      .select()
      .single();

    if (!courseError && course) {
      console.log(`  ✅ 샘플 과정 생성: ${course.name}`);

      // 4. 과정 일정 생성 (샘플)
      const schedules = [
        {
          course_id: course.id,
          course_name: course.name,
          title: 'Week 1: 오리엔테이션',
          scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '12:00',
          location: '제1강의실',
          instructor_name: instructor.name,
          status: 'scheduled',
          session_number: 1
        },
        {
          course_id: course.id,
          course_name: course.name,
          title: 'Week 2: 기본 개념',
          scheduled_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '12:00',
          location: '제1강의실',
          instructor_name: instructor.name,
          status: 'scheduled',
          session_number: 2
        }
      ];

      const { error: scheduleError } = await supabase
        .from('course_schedules')
        .insert(schedules);

      if (!scheduleError) {
        console.log(`  ✅ ${schedules.length}개의 일정 생성`);
      }

      // 5. 교육생 등록 (기존 교육생이 있으면)
      const { data: trainees } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'trainee')
        .limit(3);

      if (trainees && trainees.length > 0) {
        const enrollments = trainees.map(trainee => ({
          user_id: trainee.id,
          course_id: course.id,
          status: 'active',
          enrolled_at: new Date().toISOString()
        }));

        const { error: enrollError } = await supabase
          .from('course_enrollments')
          .insert(enrollments);

        if (!enrollError) {
          console.log(`  ✅ ${trainees.length}명의 교육생 등록`);
        }
      }
    }

    console.log('');
    console.log('🎉 샘플 데이터 생성 완료!');
    console.log('📧 이메일: sample.instructor@example.com');
    console.log('👤 이름: 박강사');
    console.log('🆔 ID:', instructor.id);

    return instructor.id;
  } catch (error) {
    console.error('❌ 샘플 데이터 생성 실패:', error);
    throw error;
  }
}

seedSampleInstructor()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
