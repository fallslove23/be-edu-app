-- 2단계: RLS 정책 설정
ALTER TABLE public.bs_activities ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 활동 조회 가능
CREATE POLICY "bs_activities_select_policy" ON public.bs_activities
    FOR SELECT
    TO authenticated
    USING (true);

-- 모든 인증된 사용자가 활동 등록 가능
CREATE POLICY "bs_activities_insert_policy" ON public.bs_activities
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 모든 인증된 사용자가 활동 수정 가능
CREATE POLICY "bs_activities_update_policy" ON public.bs_activities
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 모든 인증된 사용자가 활동 삭제 가능
CREATE POLICY "bs_activities_delete_policy" ON public.bs_activities
    FOR DELETE
    TO authenticated
    USING (true);