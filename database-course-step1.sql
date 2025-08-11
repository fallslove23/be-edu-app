-- 1단계: 테이블 생성

-- 1. courses 테이블 (교육 과정)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES public.users(id),
    manager_id UUID REFERENCES public.users(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_trainees INTEGER DEFAULT 20,
    current_trainees INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. course_enrollments 테이블 (과정 등록/배정)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    trainee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    completion_date DATE,
    final_score INTEGER CHECK (final_score >= 0 AND final_score <= 100),
    UNIQUE(course_id, trainee_id)
);

-- 3. course_curriculum 테이블 (커리큘럼)
CREATE TABLE IF NOT EXISTS public.course_curriculum (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration_hours INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. course_schedules 테이블 (수업 일정)
CREATE TABLE IF NOT EXISTS public.course_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    curriculum_id UUID REFERENCES public.course_curriculum(id),
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    instructor_id UUID REFERENCES public.users(id),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. course_attendance 테이블 (출석 관리)
CREATE TABLE IF NOT EXISTS public.course_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id UUID NOT NULL REFERENCES public.course_schedules(id) ON DELETE CASCADE,
    trainee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID REFERENCES public.users(id),
    UNIQUE(schedule_id, trainee_id)
);