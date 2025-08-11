import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI5ODksImV4cCI6MjA2NTAyODk4OX0.Amef6P0VDQ0hvzjUkyym9blu5OzwRa61I0nMTGpVEw0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function insertTestData() {
  console.log('📝 테스트 데이터 삽입 시작...')
  
  try {
    // 1. 테스트용 과정 데이터 삽입
    console.log('\n1. 과정 데이터 삽입:')
    const coursesToInsert = [
      {
        name: '신입 영업사원 기초 교육',
        description: '신입 영업사원을 위한 기본 교육 과정입니다.',
        start_date: '2024-01-15',
        end_date: '2024-01-19',
        max_trainees: 20,
        status: 'active'
      },
      {
        name: '중급 영업 스킬 향상',
        description: '경력 영업사원을 위한 심화 교육 과정입니다.',
        start_date: '2024-02-01',
        end_date: '2024-02-05',
        max_trainees: 15,
        status: 'draft'
      },
      {
        name: '고객 관계 관리 전문',
        description: '고객 관계 관리 전문가 양성 과정입니다.',
        start_date: '2024-03-01',
        end_date: '2024-03-08',
        max_trainees: 25,
        status: 'active'
      }
    ]
    
    const { data: insertedCourses, error: courseError } = await supabase
      .from('courses')
      .insert(coursesToInsert)
      .select()
    
    if (courseError) {
      console.log(`❌ 과정 삽입 오류: ${courseError.message}`)
      return
    }
    
    console.log(`✅ ${insertedCourses.length}개 과정 삽입 완료`)
    insertedCourses.forEach(course => {
      console.log(`  - ${course.name} (ID: ${course.id})`)
    })
    
    // 2. 테스트용 유저 데이터 삽입 (이미 있는지 확인 먼저)
    console.log('\n2. 유저 데이터 확인:')
    const { data: existingUsers, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .limit(3)
    
    if (userCheckError) {
      console.log(`❌ 유저 조회 오류: ${userCheckError.message}`)
    } else {
      console.log(`✅ 기존 유저: ${existingUsers.length}명`)
      
      if (existingUsers.length === 0) {
        // 테스트용 유저 삽입
        const testUsers = [
          {
            id: 'test-user-1',
            name: '홍길동',
            email: 'hong@example.com',
            role: 'trainee',
            department: '영업팀'
          },
          {
            id: 'test-user-2',
            name: '김영희',
            email: 'kim@example.com',
            role: 'trainee',
            department: '마케팅팀'
          }
        ]
        
        const { data: insertedUsers, error: userInsertError } = await supabase
          .from('users')
          .insert(testUsers)
          .select()
        
        if (userInsertError) {
          console.log(`❌ 유저 삽입 오류: ${userInsertError.message}`)
        } else {
          console.log(`✅ ${insertedUsers.length}명 유저 삽입 완료`)
        }
      }
    }
    
    // 3. 과정 데이터 재확인
    console.log('\n3. 삽입 후 과정 데이터 확인:')
    const { data: finalCourses, error: finalError } = await supabase
      .from('courses')
      .select('*')
    
    if (finalError) {
      console.log(`❌ 최종 확인 오류: ${finalError.message}`)
    } else {
      console.log(`✅ 총 ${finalCourses.length}개 과정 존재`)
      finalCourses.forEach(course => {
        console.log(`  - ${course.name} (${course.status}, ID: ${course.id})`)
      })
    }
    
  } catch (error) {
    console.error('❌ 전체 삽입 오류:', error)
  }
}

insertTestData()