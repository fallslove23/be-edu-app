-- users 테이블에 phone 컬럼 추가
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. phone 컬럼이 존재하는지 확인
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'phone';

-- 2. phone 컬럼 추가 (존재하지 않는 경우)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.users ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'phone 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'phone 컬럼이 이미 존재합니다.';
    END IF;
END
$$;

-- 3. department, employee_id 컬럼도 확인하고 추가
DO $$
BEGIN
    -- department 컬럼 확인 및 추가
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'department'
    ) THEN
        ALTER TABLE public.users ADD COLUMN department VARCHAR(100);
        RAISE NOTICE 'department 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'department 컬럼이 이미 존재합니다.';
    END IF;
    
    -- employee_id 컬럼 확인 및 추가
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'employee_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN employee_id VARCHAR(50);
        RAISE NOTICE 'employee_id 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'employee_id 컬럼이 이미 존재합니다.';
    END IF;
END
$$;

-- 4. 최종 users 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 5. 성공 메시지
SELECT '✅ users 테이블에 필요한 컬럼들이 추가되었습니다!' as result;