-- ========================================
-- 드롭다운 옵션 관리 시스템
-- ========================================
-- 목적: 관리자가 웹 UI에서 드롭다운 옵션을 직접 관리할 수 있도록 함
-- 작성일: 2025-12-10

-- 1. 드롭다운 카테고리 테이블
CREATE TABLE IF NOT EXISTS dropdown_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,  -- 'exam_type', 'exam_status' 등
  name VARCHAR(100) NOT NULL,         -- '시험 유형', '시험 상태' 등
  description TEXT,
  icon VARCHAR(10),
  is_system BOOLEAN DEFAULT false,    -- 시스템 카테고리는 삭제 불가
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 드롭다운 옵션 테이블
CREATE TABLE IF NOT EXISTS dropdown_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES dropdown_categories(id) ON DELETE CASCADE,
  value VARCHAR(100) NOT NULL,        -- 시스템 내부값 (예: 'final')
  label VARCHAR(200) NOT NULL,        -- 화면 표시값 (예: '최종평가')
  description TEXT,                   -- 옵션 설명
  icon VARCHAR(10),                   -- 이모지 아이콘
  color VARCHAR(50),                  -- 색상 (red, blue, green 등)
  is_default BOOLEAN DEFAULT false,   -- 기본 선택값
  is_system BOOLEAN DEFAULT false,    -- 시스템 옵션은 삭제 불가 (수정은 가능)
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  metadata JSONB,                     -- 추가 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- value는 카테고리 내에서 유일해야 함
  UNIQUE(category_id, value)
);

-- 3. 옵션 변경 이력 테이블
CREATE TABLE IF NOT EXISTS dropdown_option_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID REFERENCES dropdown_options(id) ON DELETE CASCADE,
  category_id UUID REFERENCES dropdown_categories(id),
  action VARCHAR(20) NOT NULL,        -- 'created', 'updated', 'deleted', 'activated', 'deactivated'
  old_value JSONB,                    -- 변경 전 값
  new_value JSONB,                    -- 변경 후 값
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT                         -- 변경 사유
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_dropdown_categories_code ON dropdown_categories(code);
CREATE INDEX IF NOT EXISTS idx_dropdown_categories_active ON dropdown_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_dropdown_options_category ON dropdown_options(category_id);
CREATE INDEX IF NOT EXISTS idx_dropdown_options_value ON dropdown_options(value);
CREATE INDEX IF NOT EXISTS idx_dropdown_options_active ON dropdown_options(is_active);
CREATE INDEX IF NOT EXISTS idx_dropdown_options_display_order ON dropdown_options(display_order);
CREATE INDEX IF NOT EXISTS idx_dropdown_option_history_option ON dropdown_option_history(option_id);
CREATE INDEX IF NOT EXISTS idx_dropdown_option_history_changed_at ON dropdown_option_history(changed_at);

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_dropdown_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dropdown_categories_updated_at
  BEFORE UPDATE ON dropdown_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_dropdown_updated_at();

CREATE TRIGGER trigger_dropdown_options_updated_at
  BEFORE UPDATE ON dropdown_options
  FOR EACH ROW
  EXECUTE FUNCTION update_dropdown_updated_at();

-- 트리거: 옵션 변경 시 이력 자동 기록
CREATE OR REPLACE FUNCTION record_dropdown_option_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO dropdown_option_history (option_id, category_id, action, old_value)
    VALUES (OLD.id, OLD.category_id, 'deleted', row_to_json(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO dropdown_option_history (option_id, category_id, action, old_value, new_value, changed_by)
    VALUES (NEW.id, NEW.category_id, 'updated', row_to_json(OLD), row_to_json(NEW), NEW.updated_by);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO dropdown_option_history (option_id, category_id, action, new_value, changed_by)
    VALUES (NEW.id, NEW.category_id, 'created', row_to_json(NEW), NEW.created_by);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dropdown_option_history
  AFTER INSERT OR UPDATE OR DELETE ON dropdown_options
  FOR EACH ROW
  EXECUTE FUNCTION record_dropdown_option_change();

-- ========================================
-- 초기 데이터 삽입
-- ========================================

-- 카테고리 삽입
INSERT INTO dropdown_categories (code, name, description, icon, is_system, display_order) VALUES
  ('exam_type', '시험 유형', '시험의 종류를 구분합니다', '📝', true, 1),
  ('exam_status', '시험 상태', '시험의 진행 상태를 나타냅니다', '📊', true, 2),
  ('question_type', '문제 유형', '문제의 출제 방식을 구분합니다', '❓', true, 3),
  ('difficulty', '난이도', '문제의 난이도를 구분합니다', '🎯', true, 4),
  ('course_status', '과정 상태', '과정의 진행 상태를 나타냅니다', '📚', true, 5),
  ('attendance_status', '출석 상태', '교육생의 출석 상태를 구분합니다', '✅', true, 6),
  ('user_role', '사용자 역할', '시스템 사용자의 권한을 구분합니다', '👤', true, 7),
  ('evaluation_type', '평가 유형', '평가 방식을 구분합니다', '🎓', true, 8),
  ('grade', '성적 등급', '성적 등급을 구분합니다', '🏆', true, 9)
ON CONFLICT (code) DO NOTHING;

-- 시험 유형 옵션
INSERT INTO dropdown_options (category_id, value, label, description, icon, color, is_system, display_order)
SELECT
  id,
  unnest(ARRAY['final', 'midterm', 'quiz', 'daily_test', 'practice', 'assignment']),
  unnest(ARRAY['최종평가', '중간평가', '퀴즈', '일일평가', '연습문제', '과제']),
  unnest(ARRAY['과정 수료를 위한 최종 평가', '과정 중간 진도 평가', '간단한 이해도 확인 퀴즈', '매일 진행되는 간단한 평가', '실습 및 연습을 위한 문제', '집에서 수행하는 과제']),
  unnest(ARRAY['🎯', '📊', '❓', '📝', '💡', '📚']),
  unnest(ARRAY['red', 'blue', 'green', 'yellow', 'purple', 'orange']),
  true,
  unnest(ARRAY[1, 2, 3, 4, 5, 6])
FROM dropdown_categories WHERE code = 'exam_type'
ON CONFLICT (category_id, value) DO NOTHING;

-- 시험 상태 옵션
INSERT INTO dropdown_options (category_id, value, label, description, icon, color, is_system, display_order)
SELECT
  id,
  unnest(ARRAY['draft', 'published', 'scheduled', 'active', 'completed', 'archived']),
  unnest(ARRAY['준비중', '발행됨', '예정됨', '진행중', '완료', '보관됨']),
  unnest(ARRAY['시험 작성 중', '시험이 발행되어 학생들에게 공개', '시험 일정이 예약됨', '현재 시험 진행 중', '시험이 종료됨', '시험이 보관됨']),
  unnest(ARRAY['✏️', '📢', '📅', '▶️', '✅', '📦']),
  unnest(ARRAY['gray', 'blue', 'yellow', 'green', 'indigo', 'gray']),
  true,
  unnest(ARRAY[1, 2, 3, 4, 5, 6])
FROM dropdown_categories WHERE code = 'exam_status'
ON CONFLICT (category_id, value) DO NOTHING;

-- 문제 유형 옵션
INSERT INTO dropdown_options (category_id, value, label, description, icon, color, is_system, display_order)
SELECT
  id,
  unnest(ARRAY['multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'ordering']),
  unnest(ARRAY['객관식', 'O/X', '단답형', '서술형', '짝맞추기', '순서배열']),
  unnest(ARRAY['여러 선택지 중 정답 선택', '참/거짓 판단', '짧은 답변 작성', '긴 형식의 답변 작성', '항목들을 짝지어 매칭', '항목들을 올바른 순서로 배치']),
  unnest(ARRAY['☑️', '⭕', '✍️', '📝', '🔗', '🔢']),
  NULL,
  true,
  unnest(ARRAY[1, 2, 3, 4, 5, 6])
FROM dropdown_categories WHERE code = 'question_type'
ON CONFLICT (category_id, value) DO NOTHING;

-- 난이도 옵션
INSERT INTO dropdown_options (category_id, value, label, description, icon, color, is_system, display_order)
SELECT
  id,
  unnest(ARRAY['easy', 'medium', 'hard']),
  unnest(ARRAY['쉬움', '보통', '어려움']),
  unnest(ARRAY['기초 수준', '중급 수준', '고급 수준']),
  unnest(ARRAY['🟢', '🟡', '🔴']),
  unnest(ARRAY['green', 'yellow', 'red']),
  true,
  unnest(ARRAY[1, 2, 3])
FROM dropdown_categories WHERE code = 'difficulty'
ON CONFLICT (category_id, value) DO NOTHING;

-- 과정 상태 옵션
INSERT INTO dropdown_options (category_id, value, label, description, icon, color, is_system, display_order)
SELECT
  id,
  unnest(ARRAY['planning', 'recruiting', 'in_progress', 'completed', 'cancelled']),
  unnest(ARRAY['계획중', '모집중', '진행중', '완료', '취소됨']),
  unnest(ARRAY['과정 계획 단계', '교육생 모집 중', '과정 진행 중', '과정 완료', '과정 취소']),
  unnest(ARRAY['📋', '📢', '▶️', '✅', '❌']),
  unnest(ARRAY['gray', 'blue', 'green', 'indigo', 'red']),
  true,
  unnest(ARRAY[1, 2, 3, 4, 5])
FROM dropdown_categories WHERE code = 'course_status'
ON CONFLICT (category_id, value) DO NOTHING;

-- 출석 상태 옵션
INSERT INTO dropdown_options (category_id, value, label, description, icon, color, is_system, display_order)
SELECT
  id,
  unnest(ARRAY['present', 'late', 'absent', 'excused']),
  unnest(ARRAY['출석', '지각', '결석', '공결']),
  unnest(ARRAY['정상 출석', '늦게 출석', '출석하지 않음', '공인된 결석']),
  unnest(ARRAY['✅', '⏰', '❌', '📄']),
  unnest(ARRAY['green', 'yellow', 'red', 'blue']),
  true,
  unnest(ARRAY[1, 2, 3, 4])
FROM dropdown_categories WHERE code = 'attendance_status'
ON CONFLICT (category_id, value) DO NOTHING;

-- 사용자 역할 옵션
INSERT INTO dropdown_options (category_id, value, label, description, icon, color, is_system, display_order)
SELECT
  id,
  unnest(ARRAY['admin', 'manager', 'operator', 'instructor', 'trainee']),
  unnest(ARRAY['관리자', '매니저', '운영자', '강사', '교육생']),
  unnest(ARRAY['시스템 전체 관리', '과정 및 운영 관리', '일상 운영 담당', '교육 담당', '교육 수강생']),
  unnest(ARRAY['👑', '👔', '⚙️', '👨‍🏫', '🎓']),
  unnest(ARRAY['red', 'blue', 'green', 'purple', 'yellow']),
  true,
  unnest(ARRAY[1, 2, 3, 4, 5])
FROM dropdown_categories WHERE code = 'user_role'
ON CONFLICT (category_id, value) DO NOTHING;

-- 평가 유형 옵션
INSERT INTO dropdown_options (category_id, value, label, description, icon, color, is_system, display_order)
SELECT
  id,
  unnest(ARRAY['theory', 'practice', 'project', 'presentation']),
  unnest(ARRAY['이론 평가', '실습 평가', '프로젝트', '발표']),
  unnest(ARRAY['이론 지식 평가', '실기 및 실습 평가', '종합 프로젝트 평가', '발표 평가']),
  unnest(ARRAY['📚', '🔧', '🎯', '🎤']),
  NULL,
  true,
  unnest(ARRAY[1, 2, 3, 4])
FROM dropdown_categories WHERE code = 'evaluation_type'
ON CONFLICT (category_id, value) DO NOTHING;

-- 성적 등급 옵션
INSERT INTO dropdown_options (category_id, value, label, description, icon, color, is_system, display_order)
SELECT
  id,
  unnest(ARRAY['A+', 'A', 'B+', 'B', 'C', 'F']),
  unnest(ARRAY['A+', 'A', 'B+', 'B', 'C', 'F']),
  unnest(ARRAY['최우수', '우수', '양호', '보통', '미흡', '불합격']),
  NULL,
  unnest(ARRAY['red', 'red', 'blue', 'blue', 'yellow', 'red']),
  true,
  unnest(ARRAY[1, 2, 3, 4, 5, 6])
FROM dropdown_categories WHERE code = 'grade'
ON CONFLICT (category_id, value) DO NOTHING;

-- RLS (Row Level Security) 정책
ALTER TABLE dropdown_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropdown_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropdown_option_history ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 인증된 사용자
CREATE POLICY "dropdown_categories_read" ON dropdown_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "dropdown_options_read" ON dropdown_options
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "dropdown_option_history_read" ON dropdown_option_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- 쓰기: 관리자와 매니저만 가능
CREATE POLICY "dropdown_categories_write" ON dropdown_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "dropdown_options_write" ON dropdown_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- 코멘트 추가
COMMENT ON TABLE dropdown_categories IS '드롭다운 카테고리 관리 테이블';
COMMENT ON TABLE dropdown_options IS '드롭다운 옵션 관리 테이블';
COMMENT ON TABLE dropdown_option_history IS '드롭다운 옵션 변경 이력 테이블';

COMMENT ON COLUMN dropdown_options.is_system IS '시스템 옵션은 삭제 불가능 (수정은 가능)';
COMMENT ON COLUMN dropdown_options.is_active IS '비활성화된 옵션은 새로운 데이터 입력 시 표시되지 않음';
