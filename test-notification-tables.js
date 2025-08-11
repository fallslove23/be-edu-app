import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI5ODksImV4cCI6MjA2NTAyODk4OX0.Amef6P0VDQ0hvzjUkyym9blu5OzwRa61I0nMTGpVEw0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testNotificationTables() {
  console.log('🔍 알림/공지사항 관련 테이블 확인...')
  
  try {
    // 알림/공지사항 관련 테이블들 확인
    const tables = ['notices', 'notifications', 'notice_files', 'notice_images']
    
    console.log('\n알림/공지사항 테이블 존재 여부:')
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

    // 기존 테이블들도 확인
    const existingTables = ['users', 'courses']
    console.log('\n기존 테이블 상태:')
    for (const table of existingTables) {
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

  } catch (error) {
    console.error('테이블 확인 실패:', error)
  }
}

testNotificationTables()