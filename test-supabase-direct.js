import { createClient } from '@supabase/supabase-js'

// 환경 변수 직접 설정
const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMzNzI5NjUsImV4cCI6MjAzODk0ODk2NX0.lKKOdCCTkXrPrjd1WDBV3Nnj7Sx5z7ARlGHIB86oF2M'

console.log('🔗 Supabase 직접 연결 테스트...')
console.log('URL:', supabaseUrl)
console.log('Key length:', supabaseKey.length)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n1. 기본 연결 테스트...')
    
    // 테이블 존재 확인
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.log('❌ 테이블 조회 오류:', tablesError.message)
    } else {
      console.log('✅ 데이터베이스 연결 성공!')
      console.log('📋 발견된 테이블:', tables?.map(t => t.table_name).join(', '))
    }

    console.log('\n2. courses 테이블 직접 테스트...')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(5)
    
    if (coursesError) {
      console.log('❌ courses 테이블 오류:', coursesError.message)
      
      // RLS 정책 확인
      console.log('\n3. RLS 정책 상태 확인...')
      const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('check_rls_status')
        .catch(() => null)
      
      if (rlsError) {
        console.log('⚠️  RLS 상태 확인 불가:', rlsError.message)
      }
    } else {
      console.log('✅ courses 테이블 접근 성공!')
      console.log('📊 과정 수:', courses?.length || 0)
      if (courses && courses.length > 0) {
        console.log('📝 첫 번째 과정:', courses[0])
      }
    }

    console.log('\n4. 사용자 인증 상태 확인...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log('❌ 인증 오류:', authError.message)
    } else {
      console.log('👤 사용자 상태:', user ? '로그인됨' : '익명 사용자')
    }

  } catch (error) {
    console.error('❌ 전체 테스트 실패:', error.message)
  }
}

testConnection()