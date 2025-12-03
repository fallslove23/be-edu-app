/**
 * 샘플 교육생 데이터 생성 스크립트
 * 관리자가 미리보기 기능을 테스트할 수 있도록 샘플 데이터 삽입
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSampleTrainee() {
  console.log('🌱 샘플 교육생 데이터 생성 시작...');

  try {
    // 1. 기존 샘플 교육생이 있는지 확인
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'sample.trainee@example.com')
      .single();

    if (existing) {
      console.log('✅ 샘플 교육생이 이미 존재합니다:', existing.id);
      return existing.id;
    }

    // 2. 샘플 교육생 생성
    const { data: trainee, error: traineeError } = await supabase
      .from('users')
      .insert({
        name: '김교육',
        email: 'sample.trainee@example.com',
        phone: '010-1234-5678',
        role: 'trainee',
        department: '연구개발팀',
        employee_id: 'EMP-2024-001',
        is_active: true,
        first_login: false
      })
      .select()
      .single();

    if (traineeError) {
      throw traineeError;
    }

    console.log('✅ 샘플 교육생 생성 완료:', trainee.id, trainee.name);

    // 3. 샘플 과정 조회 (있으면)
    const { data: courses } = await supabase
      .from('courses')
      .select('id, name')
      .limit(2);

    if (courses && courses.length > 0) {
      // 4. 과정 등록
      for (const course of courses) {
        const { error: enrollError } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: trainee.id,
            course_id: course.id,
            status: 'active',
            enrolled_at: new Date().toISOString()
          });

        if (!enrollError) {
          console.log(`  ✅ 과정 등록: ${course.name}`);
        }
      }
    }

    console.log('');
    console.log('🎉 샘플 데이터 생성 완료!');
    console.log('📧 이메일: sample.trainee@example.com');
    console.log('👤 이름: 김교육');
    console.log('🆔 ID:', trainee.id);

    return trainee.id;
  } catch (error) {
    console.error('❌ 샘플 데이터 생성 실패:', error);
    throw error;
  }
}

seedSampleTrainee()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
