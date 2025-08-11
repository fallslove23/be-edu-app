import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI5ODksImV4cCI6MjA2NTAyODk4OX0.Amef6P0VDQ0hvzjUkyym9blu5OzwRa61I0nMTGpVEw0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTableStructure() {
  console.log('🔍 테이블 구조 확인...')
  
  try {
    // 1. RPC로 테이블 컬럼 정보 확인
    console.log('\n1. courses 테이블 구조:')
    
    // 실제로 존재하는 컬럼을 확인하기 위해 빈 INSERT를 시도
    try {
      const { error } = await supabase
        .from('courses')
        .insert({})
        .select()
      
      if (error) {
        console.log('테이블 구조 오류 정보:', error.message)
        
        // 오류 메시지에서 필수 컬럼 정보 파악
        if (error.message.includes('null value in column')) {
          console.log('💡 필수 컬럼이 누락되어 있습니다.')
        }
      }
    } catch (err) {
      console.log('구조 확인 중 오류:', err.message)
    }
    
    // 2. 간단한 컬럼만으로 삽입 시도
    console.log('\n2. 최소 컬럼으로 삽입 테스트:')
    const minimalCourse = {
      name: '테스트 과정',
      start_date: '2024-01-15',
      end_date: '2024-01-19'
    }
    
    const { data: testCourse, error: minimalError } = await supabase
      .from('courses')
      .insert(minimalCourse)
      .select()
    
    if (minimalError) {
      console.log(`❌ 최소 삽입 오류: ${minimalError.message}`)
    } else {
      console.log(`✅ 최소 삽입 성공:`, testCourse)
      
      // 삽입된 데이터 삭제
      if (testCourse && testCourse[0]) {
        await supabase.from('courses').delete().eq('id', testCourse[0].id)
        console.log('✅ 테스트 데이터 삭제 완료')
      }
    }
    
    // 3. 현재 존재하는 courses 데이터 구조 확인
    console.log('\n3. 기존 courses 데이터 구조 확인:')
    const { data: existingCourses, error: selectError } = await supabase
      .from('courses')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.log(`❌ 조회 오류: ${selectError.message}`)
    } else {
      if (existingCourses && existingCourses.length > 0) {
        console.log('✅ 기존 데이터 구조:', Object.keys(existingCourses[0]))
      } else {
        console.log('ℹ️ 기존 데이터 없음')
      }
    }
    
  } catch (error) {
    console.error('❌ 전체 확인 오류:', error)
  }
}

checkTableStructure()