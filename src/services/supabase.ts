import { createClient } from '@supabase/supabase-js'

// Supabase 환경 변수 - 하드코딩된 값 사용 (환경 변수 로드 문제 해결)
const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI5ODksImV4cCI6MjA2NTAyODk4OX0.Amef6P0VDQ0hvzjUkyym9blu5OzwRa61I0nMTGpVEw0'

console.log('🔧 Supabase 클라이언트 초기화:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length,
  keyValid: supabaseAnonKey?.startsWith('eyJ')
})

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase URL 또는 Anon Key가 설정되지 않았습니다.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

console.log('✅ Supabase 클라이언트 생성 완료')
