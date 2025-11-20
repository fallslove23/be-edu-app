import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// .env.local 파일 로드
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are missing');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 과정 서비스 함수들
async function getCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function getCourseById(id: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

async function createCourse(courseData: any) {
  const { data, error } = await supabase
    .from('courses')
    .insert([courseData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateCourse(id: string, updateData: any) {
  const { data, error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteCourse(id: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// 강사/관리자 ID 가져오기
async function getInstructorAndManager() {
  // 강사 조회
  const { data: instructors } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'instructor')
    .limit(1);

  // 관리자 조회
  const { data: managers } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1);

  return {
    instructorId: instructors?.[0]?.id,
    managerId: managers?.[0]?.id
  };
}

async function runTests() {
  console.log('\n=== 과정 CRUD 테스트 시작 ===\n');

  let testCourseId: string | null = null;

  try {
    // 0. 강사/관리자 ID 가져오기
    console.log('0️⃣ 강사/관리자 조회');
    const { instructorId, managerId } = await getInstructorAndManager();
    console.log(`✅ 성공: 강사 ID = ${instructorId}, 관리자 ID = ${managerId}\n`);

    // 1. 과정 목록 조회 테스트
    console.log('1️⃣ 과정 목록 조회 테스트');
    const courses = await getCourses();
    console.log(`✅ 성공: 총 ${courses.length}개의 과정 조회됨\n`);

    // 2. 과정 생성 테스트
    console.log('2️⃣ 과정 생성 테스트');
    const newCourse = await createCourse({
      name: '테스트 BS 과정',
      description: '테스트용 BS 교육 과정입니다.',
      instructor_id: instructorId,
      manager_id: managerId,
      start_date: '2025-02-01',
      end_date: '2025-02-28',
      max_trainees: 20,
      current_trainees: 0,
      status: 'draft'
    });
    testCourseId = newCourse.id;
    console.log(`✅ 성공: 과정 생성됨 (ID: ${newCourse.id})`);
    console.log(`   - 과정명: ${newCourse.name}`);
    console.log(`   - 기간: ${newCourse.start_date} ~ ${newCourse.end_date}`);
    console.log(`   - 최대 인원: ${newCourse.max_trainees}명\n`);

    // 3. 과정 상세 조회 테스트
    console.log('3️⃣ 과정 상세 조회 테스트');
    const course = await getCourseById(testCourseId);
    console.log(`✅ 성공: 과정 정보 조회됨`);
    console.log(`   - 과정명: ${course.name}`);
    console.log(`   - 설명: ${course.description}`);
    console.log(`   - 상태: ${course.status}\n`);

    // 4. 과정 정보 수정 테스트
    console.log('4️⃣ 과정 정보 수정 테스트');
    const updatedCourse = await updateCourse(testCourseId, {
      name: '수정된 BS 과정',
      max_trainees: 25,
      status: 'active',
      updated_at: new Date().toISOString()
    });
    console.log(`✅ 성공: 과정 정보 수정됨`);
    console.log(`   - 과정명: ${updatedCourse.name} (테스트 BS 과정 → 수정된 BS 과정)`);
    console.log(`   - 최대 인원: ${updatedCourse.max_trainees}명 (20명 → 25명)`);
    console.log(`   - 상태: ${updatedCourse.status} (draft → active)\n`);

    // 5. 과정 상태별 조회 테스트
    console.log('5️⃣ 과정 상태별 조회 테스트');
    const { data: activeCourses } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'active');
    console.log(`✅ 성공: active 상태 과정 ${activeCourses?.length || 0}개 조회됨\n`);

    // 6. 과정 삭제 테스트
    console.log('6️⃣ 과정 삭제 테스트');
    await deleteCourse(testCourseId);
    console.log(`✅ 성공: 과정 삭제됨\n`);

    // 7. 삭제 확인
    console.log('7️⃣ 삭제 확인');
    try {
      await getCourseById(testCourseId);
      console.log('❌ 실패: 삭제된 과정이 여전히 조회됨\n');
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
        console.log('✅ 성공: 과정이 올바르게 삭제됨\n');
      } else {
        throw error;
      }
    }

    console.log('=== ✅ 모든 테스트 성공! ===\n');

  } catch (error: any) {
    console.error('\n❌ 테스트 실패:', error.message);
    if (error.details) console.error('상세:', error.details);
    if (error.hint) console.error('힌트:', error.hint);

    // 정리: 테스트 데이터 삭제
    if (testCourseId) {
      try {
        console.log('\n🧹 테스트 데이터 정리 중...');
        await deleteCourse(testCourseId);
        console.log('✅ 정리 완료\n');
      } catch (cleanupError) {
        console.error('정리 실패:', cleanupError);
      }
    }
  }
}

runTests();
