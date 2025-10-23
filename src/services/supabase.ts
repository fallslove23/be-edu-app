import { createClient } from '@supabase/supabase-js'

// Next.js 환경 변수 사용 - 하드코딩된 fallback으로 클라이언트 사이드에서도 동작하도록 보장
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sdecinmapanpmohbtdbi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMzNzI5NjUsImV4cCI6MjAzODk0ODk2NX0.lKKOdCCTkXrPrjd1WDBV3Nnj7Sx5z7ARlGHIB86oF2M'

// 클라이언트 사이드 로깅
if (typeof window !== 'undefined') {
  console.log('🔍 [Client] Supabase 환경 변수 체크:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey?.length,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    envKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
  })
}

console.log('✅ Supabase 클라이언트 초기화:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
})

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL 또는 Anon Key가 설정되지 않았습니다.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 클라이언트 생성 후 검증
if (typeof window !== 'undefined') {
  console.log('✅ [Client] Supabase 클라이언트 생성 완료:', {
    hasClient: !!supabase,
    hasFrom: typeof supabase?.from === 'function',
    clientType: supabase?.constructor?.name
  })
}