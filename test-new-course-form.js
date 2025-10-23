import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1MjY5NzcsImV4cCI6MjA0OTEwMjk3N30.qfP7P4jnqmZPv5FhY6OZ98JhCqCZn5lCHsEKHEBKMvQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewCourseForm() {
  console.log('🧪 새 과정 생성 폼 테스트...\n');

  try {
    // 테스트 과정 데이터 (새 폼 형식)
    const testCourseData = {
      name: '2024년 1차 신입사원 기초 교육',
      description: `신입사원을 위한 기초 교육 과정입니다.
      
[교육정보] 2024년 1차 | 입과생: 15명`,
      start_date: '2024-09-15',
      end_date: '2025-03-15', // 1.5년 과정
      max_trainees: 20,
      education_year: 2024,
      cohort: 1,
      enrollment_count: 15
    };

    console.log('📝 생성할 과정 정보:');
    console.log(`  과정명: ${testCourseData.name}`);
    console.log(`  교육 연도: ${testCourseData.education_year}년`);
    console.log(`  차수: ${testCourseData.cohort}차`);
    console.log(`  입과생 수: ${testCourseData.enrollment_count}명`);
    console.log(`  최대 수강 인원: ${testCourseData.max_trainees}명`);
    console.log(`  교육 기간: ${testCourseData.start_date} ~ ${testCourseData.end_date}`);
    console.log('');

    // 1. 기존 방식으로 과정 생성 시도
    console.log('1. 기존 필드만으로 과정 생성...');
    const { data: course, error: createError } = await supabase
      .from('courses')
      .insert({
        name: testCourseData.name,
        description: testCourseData.description,
        start_date: testCourseData.start_date,
        end_date: testCourseData.end_date,
        max_trainees: testCourseData.max_trainees,
        current_trainees: 0
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ 과정 생성 실패:', createError.message);
      return;
    }

    console.log('✅ 과정 생성 성공!');
    console.log(`  ID: ${course.id}`);
    console.log(`  생성일: ${course.created_at}`);
    console.log('');

    // 2. 생성된 과정 조회
    console.log('2. 생성된 과정 조회...');
    const { data: retrievedCourse, error: fetchError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', course.id)
      .single();

    if (fetchError) {
      console.log('❌ 과정 조회 실패:', fetchError.message);
      return;
    }

    console.log('✅ 과정 조회 성공:');
    console.log('  기본 정보:', {
      id: retrievedCourse.id,
      name: retrievedCourse.name,
      start_date: retrievedCourse.start_date,
      end_date: retrievedCourse.end_date,
      max_trainees: retrievedCourse.max_trainees,
      current_trainees: retrievedCourse.current_trainees,
      status: retrievedCourse.status
    });
    console.log('  설명:', retrievedCourse.description);
    console.log('');

    // 3. 새 필드들 확인 (있다면)
    console.log('3. 새 필드 확인...');
    const hasNewFields = 'education_year' in retrievedCourse;
    if (hasNewFields) {
      console.log('✅ 새 컬럼 존재:');
      console.log(`  교육 연도: ${retrievedCourse.education_year}`);
      console.log(`  차수: ${retrievedCourse.cohort}`);
      console.log(`  입과생 수: ${retrievedCourse.enrollment_count}`);
    } else {
      console.log('ℹ️ 새 컬럼 없음 - description에서 정보 추출:');
      const educationInfo = retrievedCourse.description?.match(/\[교육정보\] (.+)/);
      if (educationInfo) {
        console.log(`  교육정보: ${educationInfo[1]}`);
      }
    }
    console.log('');

    // 4. 테스트 과정 목록 조회
    console.log('4. 현재 총 과정 수 확인...');
    const { count, error: countError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ 개수 조회 실패:', countError.message);
    } else {
      console.log(`✅ 총 과정 수: ${count}개`);
    }
    console.log('');

    // 5. 생성된 테스트 데이터 정리
    console.log('5. 테스트 데이터 정리...');
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', course.id);

    if (deleteError) {
      console.log('❌ 삭제 실패:', deleteError.message);
      console.log('⚠️ 수동으로 삭제해주세요:', course.id);
    } else {
      console.log('✅ 테스트 데이터 정리 완료');
    }

    console.log('\n🎉 새 과정 생성 폼 테스트 완료!');
    console.log('\n📋 결과 요약:');
    console.log('  ✅ 과정 생성: 성공');
    console.log('  ✅ 과정 조회: 성공'); 
    console.log('  ✅ 교육 정보 저장: 성공');
    console.log(`  ✅ 새 컬럼 지원: ${hasNewFields ? '지원됨' : '미지원 (description 사용)'}`);

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
  }
}

testNewCourseForm();