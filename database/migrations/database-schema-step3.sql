-- 3단계: 인덱스 및 트리거 생성
CREATE INDEX IF NOT EXISTS idx_bs_activities_trainee_id ON public.bs_activities(trainee_id);
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