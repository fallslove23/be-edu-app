// 과정 API 연결 테스트
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI5ODksImV4cCI6MjA2NTAyODk4OX0.Amef6P0VDQ0hvzjUkyym9blu5OzwRa61I0nMTGpVEw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCoursesAPI() {
  console.log('🚀 과정 API 연결 테스트...\n');

  try {
    // 1. 과정 목록 조회 (애플리케이션에서 사용하는 쿼리와 동일)
    console.log('1. 과정 목록 조회:');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (coursesError) {
      console.log('❌ 과정 조회 오류:', coursesError.message);
    } else {
      console.log(`✅ 과정 ${courses.length}개 조회 성공:`);
      courses.forEach(course => {
        console.log(`   - ${course.name} (${course.status})`);
        console.log(`     설명: ${course.description || '없음'}`);
        console.log(`     기간: ${course.start_date} ~ ${course.end_date}`);
        console.log(`     정원: ${course.current_trainees}/${course.max_trainees}명`);
        console.log(`     강사ID: ${course.instructor_id || '없음'}`);
        console.log(`     매니저ID: ${course.manager_id || '없음'}`);
        console.log('');
      });
    }

    // 2. 강사 정보와 JOIN 쿼리 테스트
    console.log('2. 강사 정보 포함 과정 조회:');
    const { data: coursesWithInstructor, error: joinError } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:instructor_id(name, email),
        manager:manager_id(name, email)
      `)
      .order('created_at', { ascending: false });

    if (joinError) {
      console.log('❌ JOIN 쿼리 오류:', joinError.message);
    } else {
      console.log(`✅ JOIN 쿼리 성공:`);
      coursesWithInstructor.forEach(course => {
        console.log(`   - ${course.name}`);
        console.log(`     강사: ${course.instructor?.name || '미배정'}`);
        console.log(`     매니저: ${course.manager?.name || '미배정'}`);
        console.log('');
      });
    }

    // 3. 사용자 목록 확인
    console.log('3. 사용자 목록 확인:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, department')
      .order('role', { ascending: true });

    if (usersError) {
      console.log('❌ 사용자 조회 오류:', usersError.message);
    } else {
      console.log(`✅ 사용자 ${users.length}명:`);
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.role}) - ${user.email}`);
      });
    }

    // 4. 공지사항 확인
    console.log('\n4. 공지사항 확인:');
    const { data: notices, error: noticesError } = await supabase
      .from('notices')
      .select('title, category, is_pinned, created_at')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    if (noticesError) {
      console.log('❌ 공지사항 조회 오류:', noticesError.message);
    } else {
      console.log(`✅ 최신 공지사항 ${notices.length}개:`);
      notices.forEach(notice => {
        const pinIcon = notice.is_pinned ? '📌' : '📄';
        console.log(`   ${pinIcon} ${notice.title} (${notice.category})`);
      });
    }

  } catch (error) {
    console.error('❌ 전체 테스트 오류:', error);
  }
}

testCoursesAPI();