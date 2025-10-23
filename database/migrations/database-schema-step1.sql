-- 1단계: bs_activities 테이블 생성
CREATE TABLE IF NOT EXISTS public.bs_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trainee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('customer_visit', 'phone_call', 'proposal', 'meeting', 'training', 'other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    customer_name TEXT,
    customer_company TEXT,
    activity_date DATE NOT NULL,
    duration_minutes INTEGER,
    location TEXT,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    instructor_feedback TEXT,
    instructor_id UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);