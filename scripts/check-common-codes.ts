/**
 * 공통 코드 현황 확인 스크립트
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkCommonCodes() {
  try {
    console.log('\n📋 공통 코드 그룹 현황\n');

    const { data: groups, error: groupsError } = await supabase
      .from('common_code_groups')
      .select('*')
      .order('sort_order');

    if (groupsError) {
      throw new Error(`그룹 조회 실패: ${groupsError.message}`);
    }

    if (!groups || groups.length === 0) {
      console.log('   ℹ️ 등록된 공통 코드 그룹이 없습니다.\n');
      return;
    }

    console.log('┌────────────────────┬──────────────────┬──────────────────────────────────┐');
    console.log('│ 코드               │ 이름             │ 설명                             │');
    console.log('├────────────────────┼──────────────────┼──────────────────────────────────┤');

    for (const group of groups) {
      console.log(`│ ${group.code.padEnd(18)} │ ${group.name.padEnd(16)} │ ${(group.description || '').padEnd(32)} │`);

      // 각 그룹의 코드 개수 조회
      const { data: codes, error: codesError } = await supabase
        .from('common_codes')
        .select('id, code, name, is_active')
        .eq('group_id', group.id)
        .eq('is_active', true)
        .order('sort_order');

      if (!codesError && codes) {
        console.log(`│    └─ ${codes.length}개 활성 코드${' '.repeat(68)}│`);
        codes.slice(0, 3).forEach((code, idx) => {
          const isLast = idx === Math.min(codes.length - 1, 2);
          console.log(`│       ${isLast ? '└' : '├'}─ ${code.name} (${code.code})${' '.repeat(56 - code.name.length - code.code.length)}│`);
        });
        if (codes.length > 3) {
          console.log(`│       └─ ...외 ${codes.length - 3}개${' '.repeat(60)}│`);
        }
      }
      console.log('├────────────────────┼──────────────────┼──────────────────────────────────┤');
    }

    console.log('└────────────────────┴──────────────────┴──────────────────────────────────┘\n');

  } catch (error: any) {
    console.error('\n❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
checkCommonCodes();
