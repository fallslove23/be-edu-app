import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI5ODksImV4cCI6MjA2NTAyODk4OX0.Amef6P0VDQ0hvzjUkyym9blu5OzwRa61I0nMTGpVEw0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixUserRolesAndCreateNotices() {
  console.log('🔧 사용자 역할 수정 및 공지사항 생성...')
  
  try {
    // 1. 사용자 역할 업데이트
    console.log('\n👤 사용자 역할 업데이트...');
    
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*');

    if (userError) {
      console.error('❌ 사용자 조회 실패:', userError);
      return;
    }

    // 첫 번째 사용자를 관리자로, 두 번째 사용자를 과정 운영자로 설정
    if (users.length >= 1) {
      const { error: updateError1 } = await supabase
        .from('users')
        .update({ 
          role: 'app_admin',
          department: '관리팀'
        })
        .eq('id', users[0].id);

      if (updateError1) {
        console.error('❌ 첫 번째 사용자 역할 업데이트 실패:', updateError1);
      } else {
        console.log(`✅ ${users[0].name}을 app_admin으로 업데이트`);
      }
    }

    if (users.length >= 2) {
      const { error: updateError2 } = await supabase
        .from('users')
        .update({ 
          role: 'course_manager',
          department: '교육팀'
        })
        .eq('id', users[1].id);

      if (updateError2) {
        console.error('❌ 두 번째 사용자 역할 업데이트 실패:', updateError2);
      } else {
        console.log(`✅ ${users[1].name}을 course_manager로 업데이트`);
      }
    }

    // 2. 공지사항 생성
    console.log('\n📢 테스트 공지사항 생성...');
    
    const adminUser = users[0]; // 첫 번째 사용자를 관리자로 사용

    const testNotices = [
      {
        title: '🎉 BS 학습 관리 시스템 오픈 안내',
        content: `안녕하세요!

BS 학습 관리 시스템이 정식으로 오픈되었습니다.

주요 기능:
✅ 과정 관리 및 등록
✅ 출석 관리 시스템
✅ BS 활동 등록 및 관리
✅ 공지사항 시스템

시스템 이용에 대한 궁금한 사항이 있으시면 언제든 문의해 주세요.

감사합니다.`,
        category: '공지',
        is_pinned: true,
        author_id: adminUser.id
      },
      {
        title: '📚 신입 영업사원 기초 교육 과정 안내',
        content: `신입 영업사원을 위한 기초 교육 과정이 시작됩니다.

📅 교육 일정: 2024년 1월 15일 ~ 1월 19일 (5일간)
👥 교육 대상: 신입 영업사원
📖 교육 내용:
- 기본 영업 스킬
- 고객 응대 방법
- 제품 지식
- 세일즈 프로세스

💡 등록 방법: '과정 관리' 메뉴에서 신청

많은 참여 부탁드립니다!`,
        category: '교육과정',
        is_pinned: false,
        author_id: adminUser.id
      },
      {
        title: '⚠️ 시스템 정기 점검 안내',
        content: `시스템 안정성 향상을 위한 정기 점검을 실시합니다.

🔧 점검 일시: 2024년 12월 20일 새벽 2:00 ~ 4:00
⏰ 예상 소요 시간: 약 2시간
🚫 점검 중 영향: 전체 시스템 접속 불가

점검 중에는 시스템 이용이 불가하니 양해 부탁드립니다.
긴급한 사항은 유선으로 연락 부탁드립니다.`,
        category: '시스템',
        is_pinned: true,
        author_id: adminUser.id
      },
      {
        title: '📝 12월 BS 활동 보고서 제출 안내',
        content: `12월 월말 BS 활동 보고서 제출 기한이 다가왔습니다.

📅 제출 기한: 12월 31일 (화) 18:00까지
💻 제출 방법: 'BS 활동 등록' 메뉴에서 등록
📋 필수 항목:
- 활동 내용 상세 기록
- 관련 첨부 자료
- 활동 사진 (선택사항)

⚠️ 기한 내 미제출 시 다음 달 평가에 반영될 수 있으니 꼭 기한 내 제출 부탁드립니다.`,
        category: '일반',
        is_pinned: false,
        author_id: adminUser.id
      },
      {
        title: '🏆 우수 교육생 시상식 안내',
        content: `2024년 4분기 우수 교육생 시상식을 개최합니다.

🎖️ 시상 부문:
- 최우수 교육생상 (1명)
- 우수 교육생상 (3명)
- 성실상 (5명)
- 특별상 (2명)

📅 시상식 일정: 2024년 12월 27일 (금) 15:00
📍 장소: 본사 대회의실

축하 메시지와 함께 많은 참석 부탁드립니다!`,
        category: '행사',
        is_pinned: false,
        author_id: adminUser.id
      }
    ];

    // 공지사항 생성
    for (const notice of testNotices) {
      const { data, error } = await supabase
        .from('notices')
        .insert({
          ...notice,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ 공지사항 "${notice.title}" 생성 실패:`, error);
      } else {
        console.log(`✅ 공지사항 "${notice.title}" 생성 완료`);
      }
    }

    // 3. 결과 확인
    console.log('\n📊 업데이트 결과 확인...');
    
    const { data: updatedUsers, error: checkUserError } = await supabase
      .from('users')
      .select('name, role, department');

    if (!checkUserError) {
      console.log('👥 업데이트된 사용자 정보:');
      updatedUsers.forEach(user => {
        console.log(`   - ${user.name}: ${user.role} (${user.department})`);
      });
    }

    const { data: notices, error: checkNoticesError } = await supabase
      .from('notices')
      .select('title, category, is_pinned')
      .order('created_at', { ascending: false });

    if (!checkNoticesError) {
      console.log(`\n📢 생성된 공지사항 (총 ${notices.length}개):`);
      notices.forEach(notice => {
        console.log(`   ${notice.is_pinned ? '📌' : '📄'} [${notice.category}] ${notice.title}`);
      });
    }

    console.log('\n🎉 모든 작업이 완료되었습니다! 브라우저를 새로고침하여 확인하세요.');

  } catch (error) {
    console.error('❌ 작업 실패:', error);
  }
}

fixUserRolesAndCreateNotices()