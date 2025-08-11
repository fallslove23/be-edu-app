-- 🔧 Supabase 대시보드에서 실행할 SQL 명령어들
-- https://supabase.com/dashboard 접속 후 SQL Editor에서 실행하세요

-- 1. 사용자 역할 제약조건 확인 및 수정
-- 현재 제약조건 확인
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND conname LIKE '%role%';

-- 기존 역할 제약조건 삭제 (있다면)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 새로운 역할 제약조건 추가
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('app_admin', 'course_manager', 'instructor', 'trainee'));

-- 2. 공지사항 관련 테이블 RLS 비활성화
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_images DISABLE ROW LEVEL SECURITY;

-- 3. 사용자 역할 업데이트
UPDATE public.users 
SET role = 'course_manager', department = '교육팀'
WHERE email = 'test1@osstem.com';

UPDATE public.users 
SET role = 'app_admin', department = '관리팀'
WHERE email = 'sethetrend87@osstem.com';

-- 4. 테스트 공지사항 생성
INSERT INTO public.notices (title, content, category, is_pinned, author_id, created_at, updated_at) 
VALUES 
(
  '🎉 BS 학습 관리 시스템 오픈 안내',
  E'안녕하세요!\n\nBS 학습 관리 시스템이 정식으로 오픈되었습니다.\n\n주요 기능:\n✅ 과정 관리 및 등록\n✅ 출석 관리 시스템\n✅ BS 활동 등록 및 관리\n✅ 공지사항 시스템\n\n시스템 이용에 대한 궁금한 사항이 있으시면 언제든 문의해 주세요.\n\n감사합니다.',
  '공지',
  true,
  (SELECT id FROM public.users WHERE email = 'sethetrend87@osstem.com' LIMIT 1),
  NOW(),
  NOW()
),
(
  '📚 신입 영업사원 기초 교육 과정 안내',
  E'신입 영업사원을 위한 기초 교육 과정이 시작됩니다.\n\n📅 교육 일정: 2024년 1월 15일 ~ 1월 19일 (5일간)\n👥 교육 대상: 신입 영업사원\n📖 교육 내용:\n- 기본 영업 스킬\n- 고객 응대 방법\n- 제품 지식\n- 세일즈 프로세스\n\n💡 등록 방법: ''과정 관리'' 메뉴에서 신청\n\n많은 참여 부탁드립니다!',
  '교육과정',
  false,
  (SELECT id FROM public.users WHERE email = 'sethetrend87@osstem.com' LIMIT 1),
  NOW(),
  NOW()
),
(
  '⚠️ 시스템 정기 점검 안내',
  E'시스템 안정성 향상을 위한 정기 점검을 실시합니다.\n\n🔧 점검 일시: 2024년 12월 20일 새벽 2:00 ~ 4:00\n⏰ 예상 소요 시간: 약 2시간\n🚫 점검 중 영향: 전체 시스템 접속 불가\n\n점검 중에는 시스템 이용이 불가하니 양해 부탁드립니다.\n긴급한 사항은 유선으로 연락 부탁드립니다.',
  '시스템',
  true,
  (SELECT id FROM public.users WHERE email = 'sethetrend87@osstem.com' LIMIT 1),
  NOW(),
  NOW()
),
(
  '📝 12월 BS 활동 보고서 제출 안내',
  E'12월 월말 BS 활동 보고서 제출 기한이 다가왔습니다.\n\n📅 제출 기한: 12월 31일 (화) 18:00까지\n💻 제출 방법: ''BS 활동 등록'' 메뉴에서 등록\n📋 필수 항목:\n- 활동 내용 상세 기록\n- 관련 첨부 자료\n- 활동 사진 (선택사항)\n\n⚠️ 기한 내 미제출 시 다음 달 평가에 반영될 수 있으니 꼭 기한 내 제출 부탁드립니다.',
  '일반',
  false,
  (SELECT id FROM public.users WHERE email = 'sethetrend87@osstem.com' LIMIT 1),
  NOW(),
  NOW()
);

-- 5. 결과 확인
SELECT '=== 사용자 정보 ===' as info;
SELECT name, email, role, department FROM public.users;

SELECT '=== 공지사항 목록 ===' as info;  
SELECT title, category, is_pinned, created_at FROM public.notices ORDER BY created_at DESC;

-- 성공 메시지
SELECT '🎉 모든 설정이 완료되었습니다! 브라우저를 새로고침하세요.' as result;