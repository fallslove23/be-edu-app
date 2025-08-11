import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI5ODksImV4cCI6MjA2NTAyODk4OX0.Amef6P0VDQ0hvzjUkyym9blu5OzwRa61I0nMTGpVEw0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestNotices() {
  console.log('🔍 테스트 공지사항 생성...')
  
  try {
    // 먼저 테스트 사용자 확인
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, role')
      .limit(3);

    if (userError) {
      console.error('사용자 조회 실패:', userError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ 사용자가 없어서 공지사항을 생성할 수 없습니다.');
      return;
    }

    console.log('✅ 찾은 사용자:', users.map(u => `${u.name} (${u.role})`).join(', '));

    // 관리자나 과정 운영자 찾기
    const admin = users.find(u => ['app_admin', 'course_manager'].includes(u.role)) || users[0];
    console.log('📝 공지사항 작성자:', admin.name);

    // 테스트 공지사항 데이터
    const testNotices = [
      {
        title: '🎉 BS 학습 관리 시스템 오픈 안내',
        content: `안녕하세요!

BS 학습 관리 시스템이 정식으로 오픈되었습니다.

주요 기능:
- 과정 관리 및 등록
- 출석 관리
- BS 활동 등록 및 관리
- 공지사항 시스템

궁금한 사항이 있으시면 언제든 문의해 주세요.

감사합니다.`,
        category: '공지',
        is_pinned: true,
        author_id: admin.id
      },
      {
        title: '📚 신입 영업사원 기초 교육 과정 안내',
        content: `신입 영업사원을 위한 기초 교육 과정이 시작됩니다.

일정: 2024년 1월 15일 ~ 1월 19일
대상: 신입 영업사원
내용: 기본 영업 스킬, 고객 응대, 제품 지식 등

등록을 원하시는 분은 과정 관리에서 신청해 주세요.`,
        category: '교육과정',
        is_pinned: false,
        author_id: admin.id
      },
      {
        title: '⚠️ 시스템 점검 안내',
        content: `시스템 안정성 향상을 위한 정기 점검을 실시합니다.

점검 일시: 2024년 12월 20일 새벽 2시 ~ 4시
예상 시간: 약 2시간
영향: 전체 시스템 접속 불가

점검 중에는 시스템 이용이 불가하니 양해 부탁드립니다.`,
        category: '시스템',
        is_pinned: true,
        author_id: admin.id
      },
      {
        title: '📝 월말 BS 활동 보고서 제출 안내',
        content: `12월 월말 BS 활동 보고서 제출 기한이 다가왔습니다.

제출 기한: 12월 31일까지
제출 방법: BS 활동 등록 메뉴에서 등록
필수 항목: 활동 내용, 첨부 자료

기한 내 제출 부탁드립니다.`,
        category: '일반',
        is_pinned: false,
        author_id: admin.id
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

    // 생성된 공지사항 확인
    const { data: notices, error: noticesError } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (noticesError) {
      console.error('❌ 공지사항 조회 실패:', noticesError);
    } else {
      console.log(`\n📋 총 ${notices.length}개의 공지사항이 있습니다:`);
      notices.forEach(notice => {
        console.log(`- ${notice.is_pinned ? '📌' : '📄'} [${notice.category}] ${notice.title}`);
      });
    }

  } catch (error) {
    console.error('❌ 테스트 공지사항 생성 실패:', error);
  }
}

createTestNotices()