/**
 * 강사 및 과목 샘플 데이터 생성 스크립트
 *
 * 사용법:
 *   npx tsx scripts/seed-instructors-and-subjects.ts
 */

import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 샘플 강사 데이터
const sampleInstructors = [
  { name: '김철수', email: 'kim.cs@example.com', password: 'instructor123' },
  { name: '이영희', email: 'lee.yh@example.com', password: 'instructor123' },
  { name: '박민수', email: 'park.ms@example.com', password: 'instructor123' },
  { name: '최지은', email: 'choi.je@example.com', password: 'instructor123' },
  { name: '정수진', email: 'jung.sj@example.com', password: 'instructor123' },
];

// 샘플 과목 데이터 (subjects 테이블 구조: name, description, category)
const sampleSubjects = [
  { name: 'BS 기본과정', category: '이론', description: 'BS 교육 기본 과정' },
  { name: 'BS 심화과정', category: '이론', description: 'BS 교육 심화 과정' },
  { name: '리더십 기초', category: '이론', description: '리더십 기본 과정' },
  { name: '커뮤니케이션 스킬', category: '실습', description: '효과적인 커뮤니케이션 기법' },
  { name: '프로젝트 관리', category: '이론', description: '프로젝트 관리 실무' },
  { name: '팀 빌딩', category: '실습', description: '팀워크 향상 프로그램' },
  { name: '문제해결 기법', category: '실습', description: '창의적 문제 해결 방법론' },
  { name: '시간관리', category: '이론', description: '효율적인 시간 관리 전략' },
];

async function main() {
  console.log('🚀 강사 및 과목 샘플 데이터 생성 시작...\n');

  try {
    // 1. 강사 생성
    console.log('👨‍🏫 강사 데이터 생성 중...');
    const instructorIds: string[] = [];

    for (const instructor of sampleInstructors) {
      // 이미 존재하는지 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', instructor.email)
        .single();

      if (existingUser) {
        console.log(`  ℹ️  ${instructor.name} (${instructor.email}) - 이미 존재함`);
        instructorIds.push(existingUser.id);
        continue;
      }

      // Supabase Auth를 통한 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: instructor.email,
        password: instructor.password,
        options: {
          data: {
            name: instructor.name,
            role: 'instructor',
          }
        }
      });

      if (authError) {
        console.error(`  ❌ ${instructor.name} 생성 실패:`, authError.message);

        // Auth 실패 시 users 테이블에 직접 삽입 시도
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            email: instructor.email,
            name: instructor.name,
            role: 'instructor',
          })
          .select()
          .single();

        if (userError) {
          console.error(`  ❌ ${instructor.name} users 테이블 삽입 실패:`, userError.message);
          continue;
        }

        if (userData) {
          instructorIds.push(userData.id);
          console.log(`  ✅ ${instructor.name} (${instructor.email}) - users 테이블에 직접 생성`);
        }
      } else if (authData.user) {
        // users 테이블 업데이트 (role 설정)
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'instructor', name: instructor.name })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error(`  ⚠️  ${instructor.name} role 업데이트 실패:`, updateError.message);
        }

        instructorIds.push(authData.user.id);
        console.log(`  ✅ ${instructor.name} (${instructor.email})`);
      }
    }

    console.log(`\n📊 총 ${instructorIds.length}명의 강사 생성/확인 완료\n`);

    // 2. 과목 생성
    console.log('📚 과목 데이터 생성 중...');
    const subjectIds: string[] = [];

    for (const subject of sampleSubjects) {
      // 이미 존재하는지 확인
      const { data: existingSubject } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', subject.name)
        .single();

      if (existingSubject) {
        console.log(`  ℹ️  ${subject.name} - 이미 존재함`);
        subjectIds.push(existingSubject.id);
        continue;
      }

      const { data, error } = await supabase
        .from('subjects')
        .insert(subject)
        .select()
        .single();

      if (error) {
        console.error(`  ❌ ${subject.name} 생성 실패:`, error.message);
        continue;
      }

      if (data) {
        subjectIds.push(data.id);
        console.log(`  ✅ ${subject.name} (${subject.category})`);
      }
    }

    console.log(`\n📊 총 ${subjectIds.length}개의 과목 생성/확인 완료\n`);

    // 3. 강사-과목 매핑 (instructor_subjects)
    if (instructorIds.length > 0 && subjectIds.length > 0) {
      console.log('🔗 강사-과목 매핑 생성 중...');

      let mappingCount = 0;

      // 각 강사에게 2-4개의 과목 무작위 할당
      for (const instructorId of instructorIds) {
        const numSubjects = Math.floor(Math.random() * 3) + 2; // 2-4개
        const shuffled = [...subjectIds].sort(() => 0.5 - Math.random());
        const selectedSubjects = shuffled.slice(0, numSubjects);

        for (const subjectId of selectedSubjects) {
          // 이미 존재하는지 확인
          const { data: existingMapping } = await supabase
            .from('instructor_subjects')
            .select('id')
            .eq('instructor_id', instructorId)
            .eq('subject_id', subjectId)
            .single();

          if (existingMapping) {
            continue;
          }

          const { error } = await supabase
            .from('instructor_subjects')
            .insert({
              instructor_id: instructorId,
              subject_id: subjectId,
            });

          if (!error) {
            mappingCount++;
          }
        }
      }

      console.log(`  ✅ ${mappingCount}개의 강사-과목 매핑 생성 완료\n`);
    }

    // 4. 교실 데이터 생성 (선택사항)
    console.log('🏫 교실 데이터 생성 중...');
    const sampleClassrooms = [
      { name: '본사 1강의실', location: '본사', capacity: 30, facilities: ['빔프로젝터', '화이트보드', '음향시스템'] },
      { name: '본사 2강의실', location: '본사', capacity: 20, facilities: ['빔프로젝터', '화이트보드'] },
      { name: '지사 A강의실', location: '지사', capacity: 25, facilities: ['빔프로젝터', '화이트보드'] },
      { name: '대회의실', location: '본사', capacity: 50, facilities: ['빔프로젝터', '음향시스템', '무선마이크'] },
    ];

    let classroomCount = 0;
    for (const classroom of sampleClassrooms) {
      const { data: existing } = await supabase
        .from('classrooms')
        .select('id')
        .eq('name', classroom.name)
        .single();

      if (existing) {
        console.log(`  ℹ️  ${classroom.name} - 이미 존재함`);
        continue;
      }

      const { error } = await supabase
        .from('classrooms')
        .insert(classroom);

      if (!error) {
        classroomCount++;
        console.log(`  ✅ ${classroom.name} (정원: ${classroom.capacity}명)`);
      }
    }

    console.log(`\n📊 총 ${classroomCount}개의 교실 생성 완료\n`);

    // 완료
    console.log('✅ 모든 샘플 데이터 생성 완료!\n');
    console.log('📋 생성된 데이터:');
    console.log(`   - 강사: ${instructorIds.length}명`);
    console.log(`   - 과목: ${subjectIds.length}개`);
    console.log(`   - 교실: ${classroomCount}개`);
    console.log('\n💡 이제 통합 캘린더에서 일정을 생성할 수 있습니다.');

  } catch (error) {
    console.error('\n❌ 데이터 생성 실패:', error);
    process.exit(1);
  }
}

main();
