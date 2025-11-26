/**
 * 직급 공통 코드 업데이트 스크립트
 * 사원, 주임, 대리, 과장, 차장, 부장, 이사, 상무 등
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

interface Position {
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

const positions: Position[] = [
  { code: 'STAFF', name: '사원', description: '일반 사원', sort_order: 1 },
  { code: 'ASSISTANT', name: '주임', description: '주임', sort_order: 2 },
  { code: 'ASSOCIATE', name: '대리', description: '대리', sort_order: 3 },
  { code: 'MANAGER', name: '과장', description: '과장', sort_order: 4 },
  { code: 'DEPUTY_GM', name: '차장', description: '차장', sort_order: 5 },
  { code: 'GENERAL_MANAGER', name: '부장', description: '부장', sort_order: 6 },
  { code: 'DIRECTOR', name: '이사', description: '이사', sort_order: 7 },
  { code: 'SENIOR_DIRECTOR', name: '상무', description: '상무이사', sort_order: 8 },
  { code: 'EXECUTIVE_DIRECTOR', name: '전무', description: '전무이사', sort_order: 9 },
  { code: 'VICE_PRESIDENT', name: '부사장', description: '부사장', sort_order: 10 },
  { code: 'PRESIDENT', name: '사장', description: '사장', sort_order: 11 },
  { code: 'CEO', name: '대표이사', description: '최고경영자', sort_order: 12 }
];

async function updatePositions() {
  try {
    console.log('🚀 직급 공통 코드 업데이트 시작...\n');

    // 1. POSITION 그룹 조회
    console.log('1️⃣ POSITION 그룹 확인 중...');
    const { data: group, error: groupError } = await supabase
      .from('common_code_groups')
      .select('id')
      .eq('code', 'POSITION')
      .maybeSingle();

    if (groupError) {
      throw new Error(`그룹 조회 실패: ${groupError.message}`);
    }

    if (!group) {
      console.error('   ❌ POSITION 그룹이 없습니다.');
      console.error('   ℹ️ Supabase 대시보드에서 수동으로 그룹을 생성해주세요:');
      console.error('      - code: POSITION');
      console.error('      - name: 직급');
      console.error('      - description: 조직 내 직급 체계');
      console.error('      - is_system: true');
      console.error('      - is_active: true');
      console.error('      - sort_order: 2');
      throw new Error('POSITION 그룹이 존재하지 않습니다.');
    }

    console.log(`   ✅ POSITION 그룹 존재 (ID: ${group.id})`);
    const groupId = group.id;

    // 2. 기존 직급 데이터 비활성화
    console.log('\n2️⃣ 기존 직급 데이터 비활성화 중...');
    const { error: deactivateError } = await supabase
      .from('common_codes')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('group_id', groupId);

    if (deactivateError) {
      console.warn(`   ⚠️ 비활성화 중 경고: ${deactivateError.message}`);
    } else {
      console.log('   ✅ 기존 직급 데이터 비활성화 완료');
    }

    // 3. 새로운 직급 데이터 삽입
    console.log('\n3️⃣ 새로운 직급 데이터 삽입 중...');
    let successCount = 0;
    let errorCount = 0;

    for (const position of positions) {
      const { error } = await supabase
        .from('common_codes')
        .upsert({
          group_id: groupId,
          code: position.code,
          name: position.name,
          description: position.description,
          is_system: true,
          is_active: true,
          sort_order: position.sort_order
        }, {
          onConflict: 'group_id,code'
        });

      if (error) {
        console.error(`   ❌ ${position.name} 삽입 실패: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ ${position.name} (${position.code})`);
        successCount++;
      }
    }

    console.log(`\n✨ 삽입 완료: 성공 ${successCount}개, 실패 ${errorCount}개`);

    // 4. 결과 확인
    console.log('\n4️⃣ 업데이트된 직급 목록 확인...\n');
    const { data: updatedPositions, error: fetchError } = await supabase
      .from('common_codes')
      .select('code, name, description, sort_order, is_active')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('sort_order');

    if (fetchError) {
      throw new Error(`조회 실패: ${fetchError.message}`);
    }

    console.log('┌─────────────────────┬──────────┬─────────────────────────┐');
    console.log('│ 코드                │ 직급     │ 설명                    │');
    console.log('├─────────────────────┼──────────┼─────────────────────────┤');
    updatedPositions?.forEach(pos => {
      console.log(`│ ${pos.code.padEnd(19)} │ ${pos.name.padEnd(8)} │ ${pos.description.padEnd(23)} │`);
    });
    console.log('└─────────────────────┴──────────┴─────────────────────────┘');

    console.log('\n🎉 직급 공통 코드 업데이트 완료!\n');

  } catch (error: any) {
    console.error('\n❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
updatePositions();
