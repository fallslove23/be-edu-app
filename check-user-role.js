import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI5ODksImV4cCI6MjA2NTAyODk4OX0.Amef6P0VDQ0hvzjUkyym9blu5OzwRa61I0nMTGpVEw0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUserAndRoles() {
  console.log('🔍 사용자 정보 및 역할 확인...')
  
  try {
    // 모든 사용자 조회
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (userError) {
      console.error('❌ 사용자 조회 실패:', userError);
      return;
    }

    console.log(`\n👥 총 ${users.length}명의 사용자가 있습니다:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - 역할: ${user.role}`);
      console.log(`   - 부서: ${user.department || '미설정'}`);
      console.log(`   - 생성일: ${user.created_at}`);
      console.log('');
    });

    // 공지사항 테이블 RLS 상태 확인
    console.log('📋 공지사항 테이블 상태 확인...');
    
    const { data: notices, error: noticesError } = await supabase
      .from('notices')
      .select('*')
      .limit(5);

    if (noticesError) {
      console.error('❌ 공지사항 테이블 접근 실패:', noticesError);
      console.log('💡 Supabase 대시보드에서 다음 SQL을 실행하세요:');
      console.log('   ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;');
    } else {
      console.log(`✅ 공지사항 테이블 접근 성공: ${notices.length}개 공지사항 존재`);
      notices.forEach(notice => {
        console.log(`   - ${notice.title} (${notice.category})`);
      });
    }

  } catch (error) {
    console.error('❌ 확인 실패:', error);
  }
}

checkUserAndRoles()