-- ========================================
-- 자원 관리와 일정 관리 통합 마이그레이션
-- ========================================
-- 작성일: 2025-11-04
-- 목적:
--   1. 강의실 테이블 통합 (resource의 classrooms 사용)
--   2. instructor_profiles 테이블 추가
--   3. schedules 테이블 수정
-- ========================================

-- ========================================
-- 1. 강사 프로필 테이블 생성
-- ========================================

CREATE TABLE IF NOT EXISTS instructor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- 전문 분야
  specializations TEXT[] DEFAULT '{}',  -- ['영업', '리더십', '전문가과정']

  -- 자격증 및 학력
  certifications JSONB DEFAULT '[]'::jsonb,
  -- [{"name": "BS 강사 자격증", "issued_by": "BS협회", "date": "2024-01-01"}]

  -- 계약 정보
  contract_type TEXT CHECK (contract_type IN ('full-time', 'part-time', 'freelance')),
  hourly_rate NUMERIC(10,2),  -- 시급
  max_hours_per_week INTEGER DEFAULT 40,

  -- 프로필 정보
  bio TEXT,  -- 자기소개
  profile_photo_url TEXT,

  -- 평가
  rating NUMERIC(3,2) DEFAULT 0.00,
  total_sessions INTEGER DEFAULT 0,  -- 총 강의 횟수

  -- 상태
  is_active BOOLEAN DEFAULT true,

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 제약조건
  CONSTRAINT instructor_profiles_rating_range CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT instructor_profiles_hours_range CHECK (max_hours_per_week > 0 AND max_hours_per_week <= 168)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_user ON instructor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_active ON instructor_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_contract ON instructor_profiles(contract_type);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_rating ON instructor_profiles(rating);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_instructor_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_instructor_profiles_updated_at
  BEFORE UPDATE ON instructor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_instructor_profiles_updated_at();

-- ========================================
-- 2. 강의실 테이블 통합
-- ========================================

-- Schedule용 classrooms 테이블이 있다면 데이터 마이그레이션
DO $$
DECLARE
  schedule_classrooms_exists BOOLEAN;
  resource_classrooms_exists BOOLEAN;
BEGIN
  -- Schedule용 classrooms 존재 여부 확인
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'classrooms'
  ) INTO schedule_classrooms_exists;

  -- Resource용 classrooms이 없으면 생성 필요
  IF NOT schedule_classrooms_exists THEN
    RAISE NOTICE 'Classrooms 테이블이 존재하지 않습니다. create-resource-management-tables.sql을 먼저 실행하세요.';
  ELSE
    RAISE NOTICE 'Classrooms 테이블이 이미 존재합니다.';

    -- Resource의 classrooms 구조 확인 및 필요시 컬럼 추가
    -- code 컬럼이 없으면 추가
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'classrooms'
      AND column_name = 'code'
    ) THEN
      ALTER TABLE classrooms ADD COLUMN code VARCHAR(50) UNIQUE;
      RAISE NOTICE 'Added code column to classrooms';
    END IF;

    -- building 컬럼이 없으면 추가
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'classrooms'
      AND column_name = 'building'
    ) THEN
      ALTER TABLE classrooms ADD COLUMN building VARCHAR(100);
      RAISE NOTICE 'Added building column to classrooms';
    END IF;

    -- floor 컬럼이 없으면 추가
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'classrooms'
      AND column_name = 'floor'
    ) THEN
      ALTER TABLE classrooms ADD COLUMN floor INTEGER;
      RAISE NOTICE 'Added floor column to classrooms';
    END IF;

    -- facilities 컬럼이 없으면 추가
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'classrooms'
      AND column_name = 'facilities'
    ) THEN
      ALTER TABLE classrooms ADD COLUMN facilities JSONB DEFAULT '[]'::jsonb;
      RAISE NOTICE 'Added facilities column to classrooms';
    END IF;

    -- is_available 컬럼이 없으면 추가
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'classrooms'
      AND column_name = 'is_available'
    ) THEN
      ALTER TABLE classrooms ADD COLUMN is_available BOOLEAN DEFAULT true;
      RAISE NOTICE 'Added is_available column to classrooms';
    END IF;

    -- photo_url 컬럼이 없으면 추가
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'classrooms'
      AND column_name = 'photo_url'
    ) THEN
      ALTER TABLE classrooms ADD COLUMN photo_url TEXT;
      RAISE NOTICE 'Added photo_url column to classrooms';
    END IF;

    -- created_by 컬럼이 없으면 추가
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'classrooms'
      AND column_name = 'created_by'
    ) THEN
      ALTER TABLE classrooms ADD COLUMN created_by UUID REFERENCES users(id);
      RAISE NOTICE 'Added created_by column to classrooms';
    END IF;
  END IF;
END $$;

-- ========================================
-- 3. Schedules 테이블 확인 및 수정
-- ========================================

-- course_round_id가 NULL 허용인지 확인
DO $$
BEGIN
  -- schedules 테이블이 존재하는지 확인
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'schedules'
  ) THEN
    RAISE NOTICE 'Schedules 테이블이 존재합니다. 구조를 확인합니다.';

    -- course_round_id가 NOT NULL이면 NULL 허용으로 변경
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'schedules'
      AND column_name = 'course_round_id'
      AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE schedules ALTER COLUMN course_round_id DROP NOT NULL;
      RAISE NOTICE 'Changed course_round_id to allow NULL (standalone schedules)';
    END IF;
  ELSE
    RAISE NOTICE 'Schedules 테이블이 존재하지 않습니다. create-schedule-tables-only.sql을 먼저 실행하세요.';
  END IF;
END $$;

-- ========================================
-- 4. RLS 정책 설정
-- ========================================

-- Instructor profiles RLS
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 강사 프로필 조회 가능
DROP POLICY IF EXISTS "Everyone can view instructor profiles" ON instructor_profiles;
CREATE POLICY "Everyone can view instructor profiles"
  ON instructor_profiles FOR SELECT
  USING (true);

-- 본인 프로필 수정 가능
DROP POLICY IF EXISTS "Instructors can update their own profile" ON instructor_profiles;
CREATE POLICY "Instructors can update their own profile"
  ON instructor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 관리자는 모든 프로필 관리 가능
DROP POLICY IF EXISTS "Admins can manage all instructor profiles" ON instructor_profiles;
CREATE POLICY "Admins can manage all instructor profiles"
  ON instructor_profiles FOR ALL
  USING (auth.jwt()->>'role' IN ('admin', 'manager'));

-- ========================================
-- 5. 샘플 데이터 생성
-- ========================================

-- 강사 프로필 샘플 데이터 (instructor 역할 사용자가 있는 경우)
DO $$
DECLARE
  v_instructor_id UUID;
BEGIN
  -- 첫 번째 강사 찾기
  SELECT id INTO v_instructor_id
  FROM users
  WHERE role = 'instructor'
  LIMIT 1;

  IF v_instructor_id IS NOT NULL THEN
    -- 이미 프로필이 있는지 확인
    IF NOT EXISTS (
      SELECT 1 FROM instructor_profiles WHERE user_id = v_instructor_id
    ) THEN
      INSERT INTO instructor_profiles (
        user_id,
        specializations,
        certifications,
        contract_type,
        hourly_rate,
        max_hours_per_week,
        bio,
        rating,
        total_sessions,
        is_active
      ) VALUES (
        v_instructor_id,
        ARRAY['BS 영업', '리더십'],
        '[{"name": "BS 전문강사 자격증", "issued_by": "BS협회", "date": "2024-01-01"}]'::jsonb,
        'full-time',
        50000.00,
        40,
        '10년 경력의 BS 전문 강사입니다.',
        4.8,
        150,
        true
      );
      RAISE NOTICE '강사 프로필 샘플 데이터가 생성되었습니다.';
    ELSE
      RAISE NOTICE '강사 프로필이 이미 존재합니다.';
    END IF;
  ELSE
    RAISE NOTICE 'Instructor 역할의 사용자가 없어 샘플 데이터를 생성하지 않았습니다.';
  END IF;
END $$;

-- ========================================
-- 6. 검증 쿼리
-- ========================================

-- 강사 프로필 확인
SELECT
  u.name as instructor_name,
  u.email,
  ip.specializations,
  ip.contract_type,
  ip.hourly_rate,
  ip.rating,
  ip.total_sessions,
  ip.is_active
FROM instructor_profiles ip
JOIN users u ON ip.user_id = u.id
ORDER BY ip.rating DESC;

-- 강의실 확인 (통합된 구조)
SELECT
  name,
  COALESCE(code, 'N/A') as code,
  location,
  COALESCE(building, 'N/A') as building,
  COALESCE(floor, 0) as floor,
  capacity,
  jsonb_array_length(COALESCE(facilities, '[]'::jsonb)) as facilities_count,
  jsonb_array_length(COALESCE(equipment, '[]'::jsonb)) as equipment_count,
  COALESCE(is_available, true) as available
FROM classrooms
ORDER BY capacity DESC;

-- ========================================
-- 완료 메시지
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 자원-일정 통합 마이그레이션 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '생성/수정된 항목:';
  RAISE NOTICE '  ✓ instructor_profiles 테이블 생성';
  RAISE NOTICE '  ✓ classrooms 테이블 통합 (컬럼 추가)';
  RAISE NOTICE '  ✓ schedules.course_round_id NULL 허용';
  RAISE NOTICE '  ✓ RLS 정책 설정';
  RAISE NOTICE '';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '  1. UI에서 강사 프로필 관리 구현';
  RAISE NOTICE '  2. 일정 생성 시 통합 classrooms 사용';
  RAISE NOTICE '  3. 강사 선택 시 프로필 정보 표시';
  RAISE NOTICE '========================================';
END $$;
