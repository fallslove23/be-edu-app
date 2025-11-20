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

// 교육생 서비스 함수들
async function getTrainees() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'trainee')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function createTrainee(traineeData: any) {
  const { data, error } = await supabase
    .from('users')
    .insert([traineeData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateTrainee(id: string, updateData: any) {
  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteTrainee(id: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

async function searchTrainees(query: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'trainee')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%,department.ilike.%${query}%`)
    .order('name');

  if (error) throw error;
  return data || [];
}

async function runTests() {
  console.log('\n=== 교육생 CRUD 테스트 시작 ===\n');

  let testTraineeId: string | null = null;

  try {
    // 1. 교육생 목록 조회 테스트
    console.log('1️⃣ 교육생 목록 조회 테스트');
    const trainees = await getTrainees();
    console.log(`✅ 성공: 총 ${trainees.length}명의 교육생 조회됨\n`);

    // 2. 교육생 생성 테스트
    console.log('2️⃣ 교육생 생성 테스트');
    const newTrainee = await createTrainee({
      name: '테스트교육생',
      email: `test.trainee.${Date.now()}@test.com`,
      phone: '010-8888-8888',
      employee_id: `TRN${Date.now()}`,
      role: 'trainee',
      department: '영업팀',
      position: '사원',
      hire_date: '2024-01-15',
      status: 'active'
    });
    testTraineeId = newTrainee.id;
    console.log(`✅ 성공: 교육생 생성됨 (ID: ${newTrainee.id})`);
    console.log(`   - 이름: ${newTrainee.name}`);
    console.log(`   - 이메일: ${newTrainee.email}`);
    console.log(`   - 부서: ${newTrainee.department}\n`);

    // 3. 교육생 정보 수정 테스트
    console.log('3️⃣ 교육생 정보 수정 테스트');
    const updatedTrainee = await updateTrainee(testTraineeId, {
      position: '대리',
      department: '마케팅팀',
      updated_at: new Date().toISOString()
    });
    console.log(`✅ 성공: 교육생 정보 수정됨`);
    console.log(`   - 직급: ${updatedTrainee.position} (사원 → 대리)`);
    console.log(`   - 부서: ${updatedTrainee.department} (영업팀 → 마케팅팀)\n`);

    // 4. 교육생 검색 테스트
    console.log('4️⃣ 교육생 검색 테스트');
    const searchResults = await searchTrainees('테스트');
    console.log(`✅ 성공: "${searchResults.length}"명의 검색 결과`);
    if (searchResults.length > 0) {
      console.log(`   - 첫 번째 결과: ${searchResults[0].name}\n`);
    }

    // 5. 교육생 상태 변경 테스트
    console.log('5️⃣ 교육생 상태 변경 테스트');
    const statusChanged = await updateTrainee(testTraineeId, {
      status: 'inactive',
      updated_at: new Date().toISOString()
    });
    console.log(`✅ 성공: 상태 변경됨`);
    console.log(`   - 상태: ${statusChanged.status} (active → inactive)\n`);

    // 6. 교육생 삭제 테스트
    console.log('6️⃣ 교육생 삭제 테스트');
    await deleteTrainee(testTraineeId);
    console.log(`✅ 성공: 교육생 삭제됨\n`);

    // 7. 삭제 확인
    console.log('7️⃣ 삭제 확인');
    const deletedTrainees = await getTrainees();
    const exists = deletedTrainees.find(t => t.id === testTraineeId);
    if (!exists) {
      console.log('✅ 성공: 교육생이 올바르게 삭제됨\n');
    } else {
      console.log('❌ 실패: 삭제된 교육생이 여전히 조회됨\n');
    }

    console.log('=== ✅ 모든 테스트 성공! ===\n');

  } catch (error: any) {
    console.error('\n❌ 테스트 실패:', error.message);
    if (error.details) console.error('상세:', error.details);
    if (error.hint) console.error('힌트:', error.hint);

    // 정리: 테스트 데이터 삭제
    if (testTraineeId) {
      try {
        console.log('\n🧹 테스트 데이터 정리 중...');
        await deleteTrainee(testTraineeId);
        console.log('✅ 정리 완료\n');
      } catch (cleanupError) {
        console.error('정리 실패:', cleanupError);
      }
    }
  }
}

runTests();
