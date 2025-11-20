-- ====================================================================
-- 강사 사진 저장소 설정 (Supabase Storage)
-- ====================================================================

-- 1. Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('instructor-photos', 'instructor-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS 정책: 인증된 사용자만 업로드 가능 (본인 폴더에만)
CREATE POLICY "Instructors can upload own photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'instructor-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. RLS 정책: 모든 사용자가 조회 가능 (public)
CREATE POLICY "Anyone can view instructor photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'instructor-photos');

-- 4. RLS 정책: 본인만 삭제/업데이트 가능
CREATE POLICY "Instructors can delete own photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'instructor-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Instructors can update own photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'instructor-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. 파일 크기 제한 (5MB)
-- Note: 실제 파일 크기 제한은 Supabase Dashboard에서 설정
-- Bucket Settings → Maximum file size: 5242880 bytes (5MB)

COMMENT ON TABLE storage.objects IS '파일 저장소 - 강사 프로필 사진 포함';
