import { supabase } from '../services/supabase';

/**
 * Supabase 연결 및 테이블 존재 여부 테스트
 */
export async function testSupabaseConnection() {
  console.log('🧪 Supabase 연결 테스트 시작...');

  try {
    // 1. Supabase 클라이언트 확인
    console.log('✅ Step 1: Supabase client exists:', !!supabase);

    // 2. courses 테이블 존재 확인 (limit 1로 간단히 조회)
    console.log('🔍 Step 2: Testing courses table...');
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Courses table query failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return {
        success: false,
        error: error,
        message: 'courses 테이블 조회 실패'
      };
    }

    console.log('✅ Step 2: Courses table accessible, data:', data);

    // 3. users 테이블 확인
    console.log('🔍 Step 3: Testing users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .limit(1);

    if (usersError) {
      console.error('❌ Users table query failed:', {
        message: usersError.message,
        details: usersError.details,
        hint: usersError.hint,
        code: usersError.code
      });
    } else {
      console.log('✅ Step 3: Users table accessible, data:', usersData);
    }

    // 4. 인증 상태 확인
    console.log('🔍 Step 4: Testing auth status...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('✅ Step 4: Auth session:', session ? 'Logged in' : 'Anonymous');

    return {
      success: true,
      coursesTable: !!data,
      usersTable: !usersError,
      authenticated: !!session,
      message: 'Supabase 연결 성공'
    };

  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return {
      success: false,
      error: error,
      message: 'Supabase 연결 실패'
    };
  }
}
