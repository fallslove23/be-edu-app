// 기존 테이블 제약조건 확인
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI5ODksImV4cCI6MjA2NTAyODk4OX0.Amef6P0VDQ0hvzjUkyym9blu5OzwRa61I0nMTGpVEw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
  console.log('🔍 테이블 제약조건 확인...\n');

  try {
    // 1. users 테이블 구조 확인
    console.log('1. users 테이블 정보:');
    const { data: usersInfo, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ users 테이블 조회 오류:', usersError.message);
    } else {
      console.log('✅ users 테이블 접근 가능');
      if (usersInfo.length > 0) {
        console.log('📊 users 테이블 컬럼:', Object.keys(usersInfo[0]));
      }
    }

    // 2. 기존 role 값들 확인
    console.log('\n2. 기존 role 값들:');
    const { data: roles, error: rolesError } = await supabase
      .from('users')
      .select('role')
      .neq('role', null);
    
    if (rolesError) {
      console.log('❌ role 조회 오류:', rolesError.message);
    } else {
      const uniqueRoles = [...new Set(roles.map(r => r.role))];
      console.log('✅ 기존 role 값들:', uniqueRoles);
    }

    // 3. 테스트 삽입으로 허용되는 role 값 확인
    console.log('\n3. role 제약조건 테스트:');
    const testRoles = ['trainee', 'instructor', 'admin', 'manager', 'operator'];
    
    for (const role of testRoles) {
      try {
        const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: testId,
            name: `테스트 ${role}`,
            email: `test-${role}@example.com`,
            role: role
          })
          .select();

        if (error) {
          console.log(`❌ ${role}: ${error.message}`);
        } else {
          console.log(`✅ ${role}: 허용됨`);
          // 테스트 데이터 삭제
          await supabase.from('users').delete().eq('id', testId);
        }
      } catch (err) {
        console.log(`❌ ${role}: ${err.message}`);
      }
    }

    // 4. courses 테이블 상태 확인
    console.log('\n4. courses 테이블 컬럼 확인:');
    const { data: coursesInfo, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    if (coursesError) {
      console.log('❌ courses 테이블 오류:', coursesError.message);
    } else if (coursesInfo.length > 0) {
      console.log('✅ courses 테이블 컬럼:', Object.keys(coursesInfo[0]));
    } else {
      console.log('ℹ️ courses 테이블이 비어있음');
    }

  } catch (error) {
    console.error('❌ 전체 오류:', error);
  }
}

checkConstraints();