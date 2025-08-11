import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI5ODksImV4cCI6MjA2NTAyODk4OX0.Amef6P0VDQ0hvzjUkyym9blu5OzwRa61I0nMTGpVEw0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabaseConnection() {
  console.log('🔍 데이터베이스 연결 테스트 시작...')
  
  try {
    // 1. 테이블 존재 확인
    console.log('\n1. 테이블 존재 확인:')
    const tables = ['courses', 'course_enrollments', 'course_curriculum', 'course_schedules', 'course_attendance']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: 존재함`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }
    
    // 2. courses 테이블 데이터 확인
    console.log('\n2. courses 테이블 데이터 확인:')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(5)
    
    if (coursesError) {
      console.log(`❌ courses 조회 오류: ${coursesError.message}`)
    } else {
      console.log(`✅ courses 데이터: ${courses.length}개 과정 존재`)
      courses.forEach(course => {
        console.log(`  - ${course.name} (${course.status})`)
      })
    }
    
    // 3. 특정 오류 재현 테스트 (JOIN 쿼리)
    console.log('\n3. JOIN 쿼리 테스트:')
    try {
      const { data: joinData, error: joinError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses!inner (
            id,
            name,
            description,
            start_date,
            end_date,
            status
          )
        `)
        .limit(3)
      
      if (joinError) {
        console.log(`❌ JOIN 쿼리 오류: ${joinError.message}`)
      } else {
        console.log(`✅ JOIN 쿼리 성공: ${joinData.length}개 결과`)
      }
    } catch (err) {
      console.log(`❌ JOIN 쿼리 예외: ${err.message}`)
    }
    
  } catch (error) {
    console.error('❌ 전체 테스트 오류:', error)
  }
}

testDatabaseConnection()