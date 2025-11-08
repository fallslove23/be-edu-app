/**
 * 평가 시스템 데이터 확인 스크립트
 * 사용법: VITE_SUPABASE_URL=xxx VITE_SUPABASE_ANON_KEY=xxx npx tsx scripts/check-evaluation-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  console.error('\n사용법:');
  console.error('  source .env.local && npx tsx scripts/check-evaluation-data.ts');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvaluationData() {
  console.log('=== 평가 시스템 데이터 확인 ===\n');

  // 1. 진행 중인 과정 회차
  console.log('1️⃣ 진행 중인 과정 회차:');
  const { data: rounds, error: roundsError } = await supabase
    .from('course_rounds')
    .select(`
      id,
      round_number,
      status,
      start_date,
      end_date,
      template_id,
      course_templates(name)
    `)
    .eq('status', 'in_progress')
    .order('start_date', { ascending: false })
    .limit(5);

  if (roundsError) {
    console.error('❌ Error:', roundsError.message);
  } else if (!rounds || rounds.length === 0) {
    console.log('⚠️  진행 중인 과정 회차가 없습니다.');
  } else {
    rounds.forEach((round: any) => {
      console.log(`  - ${round.course_templates?.name} ${round.round_number}차`);
      console.log(`    ID: ${round.id}`);
      console.log(`    기간: ${round.start_date} ~ ${round.end_date}`);
    });
  }

  // 2. 평가 템플릿
  console.log('\n2️⃣ 활성 평가 템플릿:');
  const { data: templates, error: templatesError } = await supabase
    .from('evaluation_templates')
    .select('id, name, course_template_id, passing_total_score, is_active')
    .eq('is_active', true);

  if (templatesError) {
    console.error('❌ Error:', templatesError.message);
  } else if (!templates || templates.length === 0) {
    console.log('⚠️  활성 평가 템플릿이 없습니다.');
  } else {
    templates.forEach((template: any) => {
      console.log(`  - ${template.name}`);
      console.log(`    ID: ${template.id}`);
      console.log(`    수료 기준: ${template.passing_total_score}점`);
    });
  }

  // 3. 각 회차별 등록 학생 수
  console.log('\n3️⃣ 회차별 등록 학생 수:');
  if (rounds && rounds.length > 0) {
    for (const round of rounds) {
      const { data: enrollments, error: enrollError } = await supabase
        .from('round_enrollments')
        .select('id, user_id, users(name, email)', { count: 'exact' })
        .eq('round_id', round.id);

      if (enrollError) {
        console.error(`  ❌ ${round.course_templates?.name}: ${enrollError.message}`);
      } else {
        console.log(`  - ${round.course_templates?.name} ${round.round_number}차: ${enrollments?.length || 0}명`);
        if (enrollments && enrollments.length > 0) {
          enrollments.slice(0, 3).forEach((e: any) => {
            console.log(`    • ${e.users?.name} (${e.users?.email})`);
          });
          if (enrollments.length > 3) {
            console.log(`    ... 외 ${enrollments.length - 3}명`);
          }
        }
      }
    }
  }

  // 4. 평가 구성 요소 확인
  console.log('\n4️⃣ 평가 구성 요소:');
  if (templates && templates.length > 0) {
    for (const template of templates) {
      const { data: components, error: compError } = await supabase
        .from('evaluation_components')
        .select('id, name, weight_percentage, evaluation_type')
        .eq('template_id', template.id)
        .order('display_order');

      if (compError) {
        console.error(`  ❌ ${template.name}: ${compError.message}`);
      } else if (components && components.length > 0) {
        console.log(`  ${template.name}:`);
        components.forEach((comp: any) => {
          console.log(`    • ${comp.name} ${comp.weight_percentage}% (${comp.evaluation_type})`);
        });
      }
    }
  }

  console.log('\n✅ 데이터 확인 완료');
}

checkEvaluationData().catch(console.error);
