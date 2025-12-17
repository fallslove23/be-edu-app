import { supabase } from '../src/services/supabase';

async function checkTables() {
  console.log('🔍 데이터베이스 테이블 확인 중...\n');

  // 주요 테이블 목록
  const tables = [
    'users',
    'course_templates',
    'course_rounds',
    'course_enrollments',
    'instructors',
    'subjects',
    'classrooms',
    'categories',
    'schedules',
    'attendance_records',
    'exams',
    'exam_attempts',
    'practice_submissions',
    'evaluation_templates',
    'evaluation_components',
    'dropdown_categories',
    'dropdown_options'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0}개 레코드`);
      }
    } catch (err: any) {
      console.log(`⚠️  ${table}: 테이블 확인 실패`);
    }
  }
}

checkTables();
