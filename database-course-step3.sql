-- 3단계: 인덱스 생성

-- courses 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_manager_id ON public.courses(manager_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_dates ON public.courses(start_date, end_date);

-- course_enrollments 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_trainee_id ON public.course_enrollments(trainee_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.course_enrollments(status);

-- course_curriculum 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_curriculum_course_id ON public.course_curriculum(course_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_order ON public.course_curriculum(course_id, order_index);

-- course_schedules 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_schedules_course_id ON public.course_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.course_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_instructor ON public.course_schedules(instructor_id);

-- course_attendance 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_attendance_schedule_id ON public.course_attendance(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_trainee_id ON public.course_attendance(trainee_id);