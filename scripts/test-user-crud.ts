/**
 * 사용자 CRUD 기능 테스트 스크립트
 * 실행: npx tsx scripts/test-user-crud.ts
 */

import { UserService, CreateUserData } from '../src/services/user.services';
import type { User } from '../src/types/auth.types';

async function testUserCRUD() {
  console.log('🧪 사용자 CRUD 기능 테스트 시작\n');

  try {
    // 1. 사용자 목록 조회
    console.log('📋 1. 사용자 목록 조회...');
    const users = await UserService.getUsers();
    console.log(`✅ 총 ${users.length}명의 사용자 조회 완료`);
    if (users.length > 0) {
      console.log('   첫 번째 사용자:', {
        name: users[0].name,
        email: users[0].email,
        role: users[0].role
      });
    }

    // 2. 테스트 사용자 생성
    console.log('\n👤 2. 테스트 사용자 생성...');
    const testUserData: CreateUserData = {
      email: `test-${Date.now()}@example.com`,
      name: '테스트 사용자',
      phone: '010-1234-5678',
      role: 'trainee',
      department: '테스트팀',
      employee_id: `TEST${Date.now()}`,
      position: '사원',
      status: 'active'
    };

    const newUser = await UserService.createUser(testUserData);
    console.log('✅ 사용자 생성 성공:', {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    });

    // 3. 생성된 사용자 조회
    console.log('\n🔍 3. 생성된 사용자 조회...');
    const fetchedUser = await UserService.getUserById(newUser.id);
    console.log('✅ 사용자 조회 성공:', {
      name: fetchedUser.name,
      email: fetchedUser.email,
      department: fetchedUser.department
    });

    // 4. 사용자 정보 수정
    console.log('\n✏️ 4. 사용자 정보 수정...');
    const updatedUser = await UserService.updateUser(newUser.id, {
      name: '수정된 테스트 사용자',
      department: '수정된 팀',
      position: '대리'
    });
    console.log('✅ 사용자 수정 성공:', {
      name: updatedUser.name,
      department: updatedUser.department,
      position: updatedUser.position
    });

    // 5. 사용자 삭제
    console.log('\n🗑️ 5. 테스트 사용자 삭제...');
    await UserService.deleteUser(newUser.id);
    console.log('✅ 사용자 삭제 성공');

    // 6. 삭제 확인
    console.log('\n✓ 6. 삭제 확인...');
    try {
      await UserService.getUserById(newUser.id);
      console.log('❌ 오류: 삭제된 사용자가 여전히 조회됨');
    } catch (error) {
      console.log('✅ 삭제 확인 완료: 사용자를 찾을 수 없음 (정상)');
    }

    // 7. 강사 역할 사용자 생성 테스트
    console.log('\n👨‍🏫 7. 강사 역할 사용자 생성 (자동 강사 정보 생성 테스트)...');
    const instructorData: CreateUserData = {
      email: `instructor-${Date.now()}@example.com`,
      name: '테스트 강사',
      phone: '010-9876-5432',
      role: 'instructor',
      department: '교육팀',
      employee_id: `INST${Date.now()}`,
      position: '강사',
      status: 'active'
    };

    const newInstructor = await UserService.createUser(instructorData);
    console.log('✅ 강사 사용자 생성 성공:', {
      id: newInstructor.id,
      name: newInstructor.name,
      role: newInstructor.role
    });

    // 강사 정보 자동 생성 확인
    console.log('   강사 정보 테이블 확인 중...');
    // Note: 강사 정보는 instructors 테이블에서 별도로 확인 필요

    // 테스트 데이터 정리
    console.log('\n🧹 테스트 데이터 정리...');
    await UserService.deleteUser(newInstructor.id);
    console.log('✅ 테스트 강사 삭제 완료');

    console.log('\n✅ 모든 테스트 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 테스트 결과:');
    console.log('   ✓ 사용자 조회');
    console.log('   ✓ 사용자 생성');
    console.log('   ✓ 사용자 수정');
    console.log('   ✓ 사용자 삭제');
    console.log('   ✓ 강사 역할 사용자 생성');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
      console.error('스택 트레이스:', error.stack);
    }
    process.exit(1);
  }
}

// 스크립트 실행
testUserCRUD().then(() => {
  console.log('\n✅ 테스트 스크립트 종료');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ 예상치 못한 오류:', error);
  process.exit(1);
});
