-- users 테이블 RLS 정책 수정

-- 기존 정책들 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;

-- 새로운 정책들 생성

-- 1. 모든 인증된 사용자가 사용자 정보 조회 가능
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. 인증된 사용자가 자신의 사용자 정보 생성 가능 (자동 가입용)
CREATE POLICY "users_insert_self_policy" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 3. 앱 관리자가 모든 사용자 생성 가능
CREATE POLICY "admin_insert_users_policy" ON public.users
    FOR INSERT
    TO authenticated  
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'app_admin'
        ) OR auth.uid() = id  -- 자신의 계정 생성도 허용
    );

-- 4. 사용자가 자신의 정보 수정 가능
CREATE POLICY "users_update_self_policy" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5. 앱 관리자가 모든 사용자 정보 수정 가능
CREATE POLICY "admin_update_users_policy" ON public.users
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'app_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'app_admin'
        )
    );

-- 6. 앱 관리자만 사용자 삭제 가능
CREATE POLICY "admin_delete_users_policy" ON public.users
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'app_admin'
        )
    );