-- ================================
-- Foreign Key 관계 수정 SQL
-- Supabase JOIN 쿼리 지원을 위한 관계 설정
-- ================================

-- 1. 기존 foreign key 제약조건 확인 및 재생성
-- courses 테이블의 instructor_id와 manager_id 관계 재설정

-- 혹시 기존 제약조건이 있다면 삭제
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_manager_id_fkey;

-- Foreign key 제약조건 재생성
ALTER TABLE public.courses 
ADD CONSTRAINT courses_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES public.users(id);

ALTER TABLE public.courses 
ADD CONSTRAINT courses_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES public.users(id);

-- 2. 다른 테이블들의 foreign key도 확인
ALTER TABLE public.course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_course_id_fkey;
ALTER TABLE public.course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_trainee_id_fkey;

ALTER TABLE public.course_enrollments 
ADD CONSTRAINT course_enrollments_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.course_enrollments 
ADD CONSTRAINT course_enrollments_trainee_id_fkey 
FOREIGN KEY (trainee_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. 기타 테이블들의 foreign key
ALTER TABLE public.course_curriculum DROP CONSTRAINT IF EXISTS course_curriculum_course_id_fkey;
ALTER TABLE public.course_curriculum 
ADD CONSTRAINT course_curriculum_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.course_schedules DROP CONSTRAINT IF EXISTS course_schedules_course_id_fkey;
ALTER TABLE public.course_schedules DROP CONSTRAINT IF EXISTS course_schedules_curriculum_id_fkey;
ALTER TABLE public.course_schedules 
ADD CONSTRAINT course_schedules_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.course_schedules 
ADD CONSTRAINT course_schedules_curriculum_id_fkey 
FOREIGN KEY (curriculum_id) REFERENCES public.course_curriculum(id);

ALTER TABLE public.course_attendance DROP CONSTRAINT IF EXISTS course_attendance_schedule_id_fkey;
ALTER TABLE public.course_attendance DROP CONSTRAINT IF EXISTS course_attendance_trainee_id_fkey;
ALTER TABLE public.course_attendance 
ADD CONSTRAINT course_attendance_schedule_id_fkey 
FOREIGN KEY (schedule_id) REFERENCES public.course_schedules(id) ON DELETE CASCADE;
ALTER TABLE public.course_attendance 
ADD CONSTRAINT course_attendance_trainee_id_fkey 
FOREIGN KEY (trainee_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.notices DROP CONSTRAINT IF EXISTS notices_author_id_fkey;
ALTER TABLE public.notices 
ADD CONSTRAINT notices_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.users(id);

-- 4. 결과 확인
SELECT 'Foreign Key Constraints Fixed' as status;

-- 제약조건 확인
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('courses', 'course_enrollments', 'course_curriculum', 'course_schedules', 'course_attendance', 'notices')
ORDER BY tc.table_name, tc.constraint_name;