-- 4단계: 트리거 및 함수 생성

-- courses 테이블 updated_at 트리거
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 과정 등록 시 current_trainees 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_course_trainee_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.courses 
        SET current_trainees = current_trainees + 1 
        WHERE id = NEW.course_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.courses 
        SET current_trainees = current_trainees - 1 
        WHERE id = OLD.course_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 과정 등록/해제 시 current_trainees 자동 업데이트 트리거
CREATE TRIGGER course_enrollment_count_trigger
    AFTER INSERT OR DELETE ON public.course_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_course_trainee_count();