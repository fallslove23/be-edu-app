import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI5ODksImV4cCI6MjA2NTAyODk4OX0.Amef6P0VDQ0hvzjUkyym9blu5OzwRa61I0nMTGpVEw0'

// Service role key가 필요하지만, 없으므로 anon key로 시도
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixRLSAndTest() {
  console.log('🔧 RLS 및 데이터베이스 문제 해결 중...')
  
  try {
    // 1. 먼저 간단한 인증으로 시도 (개발용)
    console.log('\n1. 개발용 사용자 생성 및 로그인 시도:')
    
    // 테스트용 사용자 생성
    const testEmail = 'test@bs-learning.com'
    const testPassword = 'test123456'
    
    // 기존 세션이 있다면 로그아웃
    await supabase.auth.signOut()
    
    // 사용자 등록 시도
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: '테스트 관리자',
          role: 'admin'
        }
      }
    })
    
    if (signUpError && !signUpError.message.includes('already registered')) {
      console.log(`❌ 사용자 등록 오류: ${signUpError.message}`)
    } else {
      console.log('✅ 사용자 등록 완료 (또는 이미 존재)')
    }
    
    // 로그인 시도
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (signInError) {
      console.log(`❌ 로그인 오류: ${signInError.message}`)
      
      // 로그인 실패 시 RLS 없이 테스트 진행
      console.log('\n2. RLS 없이 직접 테스트:')
      await testWithoutRLS()
    } else {
      console.log('✅ 로그인 성공')
      console.log('현재 사용자:', signInData.user.email)
      
      // 로그인 후 데이터 삽입 시도
      console.log('\n2. 인증된 상태에서 데이터 삽입 시도:')
      await testDataInsertion()
    }
    
  } catch (error) {
    console.error('❌ 전체 오류:', error)
    await testWithoutRLS()
  }
}

async function testWithoutRLS() {
  console.log('\n📋 RLS 없이 테이블 구조 확인:')
  
  // 실제 courses 테이블의 컬럼을 확인하기 위해 SQL 실행 시도
  try {
    // PostgreSQL의 information_schema를 통해 컬럼 정보 확인
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'courses' })
    
    if (columnError) {
      console.log('RPC 함수가 없어서 직접 확인 불가')
      
      // 대신 간접적인 방법으로 확인
      console.log('\n3. 간접적 컬럼 확인 - 최소한의 데이터로 삽입 시도:')
      
      const testCourses = [
        { name: '테스트 과정 1', start_date: '2024-01-15', end_date: '2024-01-19' },
        { name: '테스트 과정 2', start_date: '2024-02-01', end_date: '2024-02-05', description: '설명 포함' }
      ]
      
      for (let i = 0; i < testCourses.length; i++) {
        const course = testCourses[i]
        console.log(`\n테스트 ${i + 1}: ${Object.keys(course).join(', ')} 컬럼으로 삽입`)
        
        const { data, error } = await supabase
          .from('courses')
          .insert(course)
          .select()
        
        if (error) {
          console.log(`❌ 삽입 오류: ${error.message}`)
          
          // 오류 메시지 분석
          if (error.message.includes('row-level security')) {
            console.log('💡 RLS 정책으로 인한 차단')
          } else if (error.message.includes('column')) {
            console.log('💡 컬럼 구조 문제')
          } else if (error.message.includes('null value')) {
            console.log('💡 필수 컬럼 누락')
          }
        } else {
          console.log(`✅ 삽입 성공:`, data)
        }
      }
    } else {
      console.log('✅ 컬럼 정보:', columnInfo)
    }
    
  } catch (err) {
    console.log('RPC 확인 실패:', err.message)
  }
}

async function testDataInsertion() {
  console.log('인증된 사용자로 데이터 삽입 테스트...')
  
  const testCourse = {
    name: '인증된 테스트 과정',
    description: '로그인 후 삽입 테스트',
    start_date: '2024-01-15',
    end_date: '2024-01-19',
    max_trainees: 20,
    status: 'draft'
  }
  
  const { data, error } = await supabase
    .from('courses')
    .insert(testCourse)
    .select()
  
  if (error) {
    console.log(`❌ 인증된 삽입 오류: ${error.message}`)
  } else {
    console.log(`✅ 인증된 삽입 성공:`, data)
    
    // 삽입된 데이터 조회 테스트
    const { data: courses, error: selectError } = await supabase
      .from('courses')
      .select('*')
    
    if (selectError) {
      console.log(`❌ 조회 오류: ${selectError.message}`)
    } else {
      console.log(`✅ 총 ${courses.length}개 과정 조회 성공`)
    }
  }
}

fixRLSAndTest()