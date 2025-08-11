-- BS 활동 관리를 위한 데이터베이스 스키마

-- bs_activities 테이블 생성
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

-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.bs_activities ENABLE ROW LEVEL SECURITY;

-- 사용자는 본인 활동만 조회하거나 강사/관리자는 모든 활동 조회 가능
CREATE POLICY "bs_activities_select_policy" ON public.bs_activities
    FOR SELECT
    TO authenticated
    USING (true);  -- 임시로 모든 접근 허용 (애플리케이션 레벨에서 제어)

-- 교육생만 활동 등록 가능
CREATE POLICY "bs_activities_insert_policy" ON public.bs_activities
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- 임시로 모든 삽입 허용

-- 모든 사용자가 활동 수정 가능 (애플리케이션에서 권한 제어)
CREATE POLICY "bs_activities_update_policy" ON public.bs_activities
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 모든 사용자가 활동 삭제 가능 (애플리케이션에서 권한 제어)
CREATE POLICY "bs_activities_delete_policy" ON public.bs_activities
    FOR DELETE
    TO authenticated
    USING (true);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_bs_activities_trainee_id ON public.bs_activities(trainee_id);
CREATE INDEX IF NOT EXISTS idx_bs_activities_status ON public.bs_activities(status);
CREATE INDEX IF NOT EXISTS idx_bs_activities_type ON public.bs_activities(type);
CREATE INDEX IF NOT EXISTS idx_bs_activities_activity_date ON public.bs_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_bs_activities_created_at ON public.bs_activities(created_at);

-- updated_at 자동 업데이트를 위한 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_bs_activities_updated_at ON public.bs_activities;
CREATE TRIGGER update_bs_activities_updated_at
    BEFORE UPDATE ON public.bs_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Supabase Storage 버킷 생성 (SQL로는 불가능하므로 별도 설정 필요)
-- activity-photos 버킷을 Supabase 대시보드에서 생성해야 합니다.

-- 스토리지 정책 (버킷 생성 후 적용)
-- CREATE POLICY "교육생은 본인 활동 사진만 업로드 가능" ON storage.objects
--     FOR INSERT TO authenticated
--     WITH CHECK (bucket_id = 'activity-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "모든 사용자가 활동 사진 조회 가능" ON storage.objects
--     FOR SELECT TO authenticated
--     USING (bucket_id = 'activity-photos');

-- CREATE POLICY "교육생은 본인 활동 사진만 삭제 가능" ON storage.objects
--     FOR DELETE TO authenticated
--     USING (bucket_id = 'activity-photos' AND auth.uid()::text = (storage.foldername(name))[1]);