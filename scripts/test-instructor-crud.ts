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

// 강사 서비스 함수들 (instructor.service.ts에서 복사)
async function getInstructors() {
  const { data, error } = await supabase
    .from('instructors')
    .select(`
      *,
      user:users(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function getInstructorById(id: string) {
  const { data, error } = await supabase
    .from('instructors')
    .select(`
      *,
      user:users(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

async function createInstructor(instructorData: any) {
  const { data, error } = await supabase
    .from('instructors')
    .insert([instructorData])
    .select(`
      *,
      user:users(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

async function updateInstructor(id: string, updateData: any) {
  const { data, error } = await supabase
    .from('instructors')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      user:users(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

async function deleteInstructor(id: string) {
  const { error } = await supabase
    .from('instructors')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// 테스트용 사용자 생성
async function createTestUser() {
  const testUser = {
    name: '테스트강사',
    email: `test.instructor.${Date.now()}@test.com`,
    phone: '010-9999-9999',
    employee_id: `INST${Date.now()}`,
    role: 'instructor',
    department: '교육팀',
    position: '강사',
    status: 'active'
  };

  const { data, error } = await supabase
    .from('users')
    .insert([testUser])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 테스트용 사용자 삭제
async function deleteTestUser(userId: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) console.warn('테스트 사용자 삭제 실패:', error);
}

async function runTests() {
  console.log('\n=== 강사 CRUD 테스트 시작 ===\n');

  let testUserId: string | null = null;
  let testInstructorId: string | null = null;

  try {
    // 1. 강사 목록 조회 테스트
    console.log('1️⃣ 강사 목록 조회 테스트');
    const instructors = await getInstructors();
    console.log(`✅ 성공: 총 ${instructors.length}명의 강사 조회됨\n`);

    // 2. 테스트용 사용자 생성
    console.log('2️⃣ 테스트용 사용자 생성');
    const testUser = await createTestUser();
    testUserId = testUser.id;
    console.log(`✅ 성공: 사용자 생성됨 (ID: ${testUser.id})\n`);

    // 3. 강사 프로필 생성 테스트
    console.log('3️⃣ 강사 프로필 생성 테스트');
    const newInstructor = await createInstructor({
      user_id: testUser.id,
      specializations: ['BS(균형성과표)', '전략경영'],
      years_of_experience: 5,
      education_background: '경영학 석사',
      bio: 'BS 교육 전문 강사입니다.'
    });
    testInstructorId = newInstructor.id;
    console.log(`✅ 성공: 강사 프로필 생성됨 (ID: ${newInstructor.id})`);
    console.log(`   - 전문 분야: ${newInstructor.specializations.join(', ')}`);
    console.log(`   - 경력: ${newInstructor.years_of_experience}년\n`);

    // 4. 강사 상세 조회 테스트
    console.log('4️⃣ 강사 상세 조회 테스트');
    const instructor = await getInstructorById(testInstructorId);
    console.log(`✅ 성공: 강사 정보 조회됨`);
    console.log(`   - 이름: ${instructor.name}`);
    console.log(`   - 이메일: ${instructor.email}`);
    console.log(`   - 전문 분야: ${instructor.specializations.join(', ')}\n`);

    // 5. 강사 정보 수정 테스트
    console.log('5️⃣ 강사 정보 수정 테스트');
    const updatedInstructor = await updateInstructor(testInstructorId, {
      years_of_experience: 7,
      bio: '업데이트된 강사 소개입니다.',
      specializations: ['BS(균형성과표)', '전략경영', '조직개발']
    });
    console.log(`✅ 성공: 강사 정보 수정됨`);
    console.log(`   - 경력: ${updatedInstructor.years_of_experience}년 (5년 → 7년)`);
    console.log(`   - 전문 분야: ${updatedInstructor.specializations.join(', ')}\n`);

    // 6. 자격증 추가 테스트
    console.log('6️⃣ 자격증 추가 테스트');
    const { data: certification, error: certError } = await supabase
      .from('instructor_certifications')
      .insert([{
        instructor_id: testInstructorId,
        name: 'BS 전문가 자격증',
        issuing_organization: '한국경영협회',
        issue_date: '2020-01-15'
      }])
      .select()
      .single();

    if (certError) throw certError;
    console.log(`✅ 성공: 자격증 추가됨`);
    console.log(`   - 자격증명: ${certification.name}`);
    console.log(`   - 발급기관: ${certification.issuing_organization}\n`);

    // 7. 담당 과목 추가 테스트
    console.log('7️⃣ 담당 과목 추가 테스트');
    const { data: subject, error: subjectError } = await supabase
      .from('instructor_teaching_subjects')
      .insert([{
        instructor_id: testInstructorId,
        subject_name: 'BS 기초',
        proficiency_level: 'expert'
      }])
      .select()
      .single();

    if (subjectError) throw subjectError;
    console.log(`✅ 성공: 담당 과목 추가됨`);
    console.log(`   - 과목명: ${subject.subject_name}`);
    console.log(`   - 숙련도: ${subject.proficiency_level}\n`);

    // 8. 강사 삭제 테스트
    console.log('8️⃣ 강사 삭제 테스트');
    await deleteInstructor(testInstructorId);
    console.log(`✅ 성공: 강사 프로필 삭제됨\n`);

    // 9. 삭제 확인
    console.log('9️⃣ 삭제 확인');
    try {
      await getInstructorById(testInstructorId);
      console.log('❌ 실패: 삭제된 강사가 여전히 조회됨\n');
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        console.log('✅ 성공: 강사가 올바르게 삭제됨\n');
      } else {
        throw error;
      }
    }

    console.log('=== ✅ 모든 테스트 성공! ===\n');

  } catch (error: any) {
    console.error('\n❌ 테스트 실패:', error.message);
    if (error.details) console.error('상세:', error.details);
    if (error.hint) console.error('힌트:', error.hint);
  } finally {
    // 정리: 테스트 데이터 삭제
    if (testUserId) {
      console.log('🧹 테스트 데이터 정리 중...');
      await deleteTestUser(testUserId);
      console.log('✅ 정리 완료\n');
    }
  }
}

runTests();
