-- =====================================================
-- 기존 데이터 마이그레이션 스크립트
-- =====================================================
-- 목적: DEFAULT_COURSE_TEMPLATES 데이터를 template_curriculum으로 이동
-- 작성일: 2025-01-19
-- =====================================================

-- =====================================================
-- STEP 1: BS Basic 템플릿 커리큘럼 데이터 삽입
-- =====================================================

-- BS Basic 템플릿 ID 확인 및 생성
DO $$
DECLARE
  bs_basic_id UUID;
BEGIN
  -- 기존 BS Basic 템플릿 조회
  SELECT id INTO bs_basic_id FROM course_templates WHERE code = 'BS-BASIC' OR name = 'BS Basic';

  -- 없으면 생성
  IF bs_basic_id IS NULL THEN
    INSERT INTO course_templates (
      id, code, name, description, category,
      duration_days, total_hours, duration_weeks,
      difficulty_level, is_active,
      requirements, objectives
    ) VALUES (
      '11111111-1111-1111-1111-111111111111'::UUID,
      'BS-BASIC',
      'BS Basic',
      'BS 기초 과정 - 영업의 기본기를 다지는 3일 집중 과정',
      'basic',
      3,  -- duration_days
      24, -- total_hours
      1,  -- duration_weeks (기존 호환)
      'beginner',
      true,
      ARRAY['영업 경험 무관', '적극적인 학습 의지'],
      ARRAY[
        '영업의 기본 개념과 프로세스 이해',
        '고객 니즈 파악 및 분석 능력 습득',
        '효과적인 프레젠테이션 기법 학습',
        '실전 협상 스킬 습득'
      ]
    )
    ON CONFLICT (id) DO UPDATE SET
      duration_days = 3,
      total_hours = 24,
      requirements = ARRAY['영업 경험 무관', '적극적인 학습 의지'],
      objectives = ARRAY[
        '영업의 기본 개념과 프로세스 이해',
        '고객 니즈 파악 및 분석 능력 습득',
        '효과적인 프레젠테이션 기법 학습',
        '실전 협상 스킬 습득'
      ];

    bs_basic_id := '11111111-1111-1111-1111-111111111111'::UUID;
  END IF;

  -- template_curriculum 데이터 삽입
  INSERT INTO template_curriculum (
    template_id, day, order_index, subject, subject_type, description,
    duration_hours, recommended_start_time, recommended_end_time,
    learning_objectives, topics
  ) VALUES
  -- 1일차
  (
    bs_basic_id, 1, 1,
    '영업 기초 이론',
    'lecture',
    '영업의 기본 개념, 프로세스, 그리고 성공적인 영업인의 마인드셋을 학습합니다.',
    3.0,
    '09:00'::TIME,
    '12:00'::TIME,
    ARRAY['영업의 정의와 중요성 이해', '영업 프로세스 단계별 이해', '고객 중심 사고방식 습득'],
    ARRAY['영업이란 무엇인가', '영업 프로세스 5단계', '성공하는 영업인의 특징', '고객 관점의 이해']
  ),
  (
    bs_basic_id, 1, 2,
    '고객 니즈 분석',
    'practice',
    '고객의 명시적/잠재적 니즈를 파악하고 분석하는 기법을 실습합니다.',
    2.5,
    '13:00'::TIME,
    '15:30'::TIME,
    ARRAY['고객 니즈 파악 질문 기법', '적극적 경청 스킬', 'SPIN 질문 기법 활용'],
    ARRAY['명시적 니즈 vs 잠재적 니즈', 'SPIN 질문 기법', '효과적인 질문 설계', '경청의 중요성']
  ),
  (
    bs_basic_id, 1, 3,
    '실습: 고객 인터뷰',
    'practice',
    '롤플레잉을 통해 실제 고객 인터뷰를 연습합니다.',
    2.5,
    '15:30'::TIME,
    '18:00'::TIME,
    ARRAY['실전 질문 기법 적용', '고객 반응 분석', '피드백 수용 및 개선'],
    ARRAY['롤플레잉 시나리오', '1:1 코칭', '동료 피드백']
  ),

  -- 2일차
  (
    bs_basic_id, 2, 1,
    '솔루션 제안 기법',
    'lecture',
    '고객 니즈에 맞는 효과적인 솔루션 제안 방법을 학습합니다.',
    3.0,
    '09:00'::TIME,
    '12:00'::TIME,
    ARRAY['가치 제안 설계', '차별화 포인트 강조', 'FAB 기법 활용'],
    ARRAY['Features vs Benefits', 'FAB 기법', '가치 제안 설계', '경쟁사 대비 차별화']
  ),
  (
    bs_basic_id, 2, 2,
    '프레젠테이션 스킬',
    'lecture',
    '설득력 있는 프레젠테이션 기법과 스토리텔링을 학습합니다.',
    2.5,
    '13:00'::TIME,
    '15:30'::TIME,
    ARRAY['논리적 구조 설계', '스토리텔링 기법', '시각자료 활용'],
    ARRAY['프레젠테이션 구조', '오프닝 기법', '스토리텔링', '클로징 기법']
  ),
  (
    bs_basic_id, 2, 3,
    '실습: 제안 프레젠테이션',
    'presentation',
    '실제 제안 프레젠테이션을 수행하고 피드백을 받습니다.',
    2.5,
    '15:30'::TIME,
    '18:00'::TIME,
    ARRAY['프레젠테이션 실전 연습', '즉각적인 피드백 수용', '개선점 파악'],
    ARRAY['개인별 프레젠테이션', '강사 코칭', '동료 평가']
  ),

  -- 3일차
  (
    bs_basic_id, 3, 1,
    '협상 기초 이론',
    'lecture',
    '윈-윈 협상의 기본 원칙과 전략을 학습합니다.',
    3.0,
    '09:00'::TIME,
    '12:00'::TIME,
    ARRAY['협상의 기본 원칙', '협상 전략 수립', 'BATNA 개념 이해'],
    ARRAY['협상이란 무엇인가', '윈-윈 협상', 'BATNA/ZOPA', '협상 준비']
  ),
  (
    bs_basic_id, 3, 2,
    '실전 협상 시뮬레이션',
    'practice',
    '다양한 시나리오로 협상을 실습합니다.',
    3.0,
    '13:00'::TIME,
    '16:00'::TIME,
    ARRAY['협상 전략 실전 적용', '반론 처리 기법', '합의점 도출'],
    ARRAY['협상 시나리오', '역할 연기', '전략 적용', '피드백']
  ),
  (
    bs_basic_id, 3, 3,
    '종합 평가 및 수료',
    'evaluation',
    '전체 과정에 대한 종합 평가와 수료식을 진행합니다.',
    1.0,
    '16:00'::TIME,
    '17:00'::TIME,
    ARRAY['학습 내용 정리', '실무 적용 계획 수립', '수료 인증'],
    ARRAY['종합 평가', '액션 플랜', '수료증 수여', '네트워킹']
  )
  ON CONFLICT (template_id, day, order_index) DO UPDATE SET
    subject = EXCLUDED.subject,
    description = EXCLUDED.description,
    learning_objectives = EXCLUDED.learning_objectives,
    topics = EXCLUDED.topics;

  RAISE NOTICE '✅ BS Basic 템플릿 커리큘럼 데이터 삽입 완료';
END $$;

-- =====================================================
-- STEP 2: BS Advanced 템플릿 커리큘럼 데이터 삽입
-- =====================================================

DO $$
DECLARE
  bs_advanced_id UUID;
BEGIN
  -- 기존 BS Advanced 템플릿 조회
  SELECT id INTO bs_advanced_id FROM course_templates WHERE code = 'BS-ADVANCED' OR name = 'BS Advanced';

  -- 없으면 생성
  IF bs_advanced_id IS NULL THEN
    INSERT INTO course_templates (
      id, code, name, description, category,
      duration_days, total_hours, duration_weeks,
      difficulty_level, is_active,
      requirements, objectives
    ) VALUES (
      '22222222-2222-2222-2222-222222222222'::UUID,
      'BS-ADVANCED',
      'BS Advanced',
      'BS 심화 과정 - 전략적 영업과 고급 협상 기법을 익히는 5일 심화 과정',
      'advanced',
      5,  -- duration_days
      40, -- total_hours
      1,  -- duration_weeks
      'advanced',
      true,
      ARRAY['BS Basic 과정 수료 또는 2년 이상 영업 경험', '고급 영업 기법 학습 의지'],
      ARRAY[
        '전략적 영업 기획 능력 배양',
        '고급 협상 기법 습득',
        '대형 프로젝트 영업 역량 강화',
        '관계 기반 영업 전략 수립'
      ]
    )
    ON CONFLICT (id) DO UPDATE SET
      duration_days = 5,
      total_hours = 40,
      requirements = ARRAY['BS Basic 과정 수료 또는 2년 이상 영업 경험', '고급 영업 기법 학습 의지'],
      objectives = ARRAY[
        '전략적 영업 기획 능력 배양',
        '고급 협상 기법 습득',
        '대형 프로젝트 영업 역량 강화',
        '관계 기반 영업 전략 수립'
      ];

    bs_advanced_id := '22222222-2222-2222-2222-222222222222'::UUID;
  END IF;

  -- template_curriculum 데이터 삽입
  INSERT INTO template_curriculum (
    template_id, day, order_index, subject, subject_type, description,
    duration_hours, recommended_start_time, recommended_end_time,
    learning_objectives, topics
  ) VALUES
  -- 1일차: 전략적 영업 기획
  (
    bs_advanced_id, 1, 1,
    '전략적 영업 기획',
    'lecture',
    '시장 분석부터 영업 전략 수립까지의 전 과정을 학습합니다.',
    4.0,
    '09:00'::TIME,
    '13:00'::TIME,
    ARRAY['시장 분석 방법론', '영업 전략 수립 프레임워크', '목표 설정 기법'],
    ARRAY['SWOT 분석', 'STP 전략', '영업 목표 설정', 'KPI 설계']
  ),
  (
    bs_advanced_id, 1, 2,
    '대형 프로젝트 영업',
    'lecture',
    '복잡한 B2B 프로젝트 영업의 특성과 전략을 학습합니다.',
    4.0,
    '14:00'::TIME,
    '18:00'::TIME,
    ARRAY['프로젝트 영업 프로세스', '의사결정자 파악', 'RFP 대응 전략'],
    ARRAY['프로젝트 영업 특징', 'DMU 분석', 'RFP/RFI 이해', '제안서 작성']
  ),

  -- 2일차: 고급 협상 기법
  (
    bs_advanced_id, 2, 1,
    '고급 협상 이론',
    'lecture',
    '협상의 심화 이론과 전략적 접근법을 학습합니다.',
    4.0,
    '09:00'::TIME,
    '13:00'::TIME,
    ARRAY['협상 파워 분석', '다자간 협상', '국제 협상 문화'],
    ARRAY['협상 파워', '협상 스타일', '문화적 차이', '복잡한 협상']
  ),
  (
    bs_advanced_id, 2, 2,
    '어려운 협상 시나리오',
    'practice',
    '까다로운 협상 상황을 시뮬레이션하고 대응 전략을 연습합니다.',
    4.0,
    '14:00'::TIME,
    '18:00'::TIME,
    ARRAY['어려운 상대 대응', '교착 상태 타개', '양보 전략'],
    ARRAY['하드볼 협상', '교착 상태', '양보 관리', '최종 제안']
  ),

  -- 3일차: 관계 기반 영업
  (
    bs_advanced_id, 3, 1,
    '관계 구축 전략',
    'lecture',
    '장기적 관점의 고객 관계 관리 전략을 학습합니다.',
    4.0,
    '09:00'::TIME,
    '13:00'::TIME,
    ARRAY['신뢰 구축 방법', '네트워킹 전략', 'CRM 활용'],
    ARRAY['관계의 단계', '신뢰 구축', '네트워킹', 'CRM 전략']
  ),
  (
    bs_advanced_id, 3, 2,
    '핵심 고객 관리',
    'practice',
    'Key Account Management 기법을 학습하고 실습합니다.',
    4.0,
    '14:00'::TIME,
    '18:00'::TIME,
    ARRAY['KAM 전략 수립', '고객 세분화', '맞춤형 서비스'],
    ARRAY['KAM이란', '고객 포트폴리오', '맞춤 전략', '성과 측정']
  ),

  -- 4일차: 디지털 영업 & 데이터 활용
  (
    bs_advanced_id, 4, 1,
    '디지털 영업 트렌드',
    'lecture',
    '최신 디지털 영업 도구와 방법론을 학습합니다.',
    4.0,
    '09:00'::TIME,
    '13:00'::TIME,
    ARRAY['온라인 영업 채널', '소셜 셀링', '마케팅 자동화'],
    ARRAY['디지털 전환', '소셜 미디어', '콘텐츠 마케팅', '자동화 도구']
  ),
  (
    bs_advanced_id, 4, 2,
    '데이터 기반 의사결정',
    'practice',
    '영업 데이터 분석과 인사이트 도출 방법을 실습합니다.',
    4.0,
    '14:00'::TIME,
    '18:00'::TIME,
    ARRAY['영업 데이터 분석', '예측 모델링', '대시보드 활용'],
    ARRAY['데이터 수집', '분석 기법', '예측 분석', '의사결정']
  ),

  -- 5일차: 종합 실습 & 평가
  (
    bs_advanced_id, 5, 1,
    '종합 프로젝트',
    'practice',
    '실제 사례를 기반으로 한 종합 프로젝트를 수행합니다.',
    6.0,
    '09:00'::TIME,
    '15:00'::TIME,
    ARRAY['전략 수립', '실행 계획', '발표 및 피드백'],
    ARRAY['팀 프로젝트', '전략 개발', '프레젠테이션', '피어 리뷰']
  ),
  (
    bs_advanced_id, 5, 2,
    '최종 평가 및 수료',
    'evaluation',
    '전체 과정에 대한 최종 평가와 수료식을 진행합니다.',
    2.0,
    '15:00'::TIME,
    '17:00'::TIME,
    ARRAY['학습 성과 평가', '실무 적용 계획', '수료 인증'],
    ARRAY['최종 시험', '액션 플랜', '수료증', '네트워킹']
  )
  ON CONFLICT (template_id, day, order_index) DO UPDATE SET
    subject = EXCLUDED.subject,
    description = EXCLUDED.description,
    learning_objectives = EXCLUDED.learning_objectives,
    topics = EXCLUDED.topics;

  RAISE NOTICE '✅ BS Advanced 템플릿 커리큘럼 데이터 삽입 완료';
END $$;

-- =====================================================
-- STEP 3: 기존 course_rounds 데이터 정리
-- =====================================================

-- round_name, round_code 자동 생성
UPDATE course_rounds
SET
  round_name = COALESCE(round_name, title),
  round_code = COALESCE(round_code, 'ROUND-' || id::TEXT),
  course_name = COALESCE(course_name,
    (SELECT name FROM course_templates WHERE id = course_rounds.template_id)
  )
WHERE round_name IS NULL OR round_code IS NULL OR course_name IS NULL;

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ 기존 데이터 마이그레이션 완료';
  RAISE NOTICE '';
  RAISE NOTICE '📊 마이그레이션된 데이터:';
  RAISE NOTICE '  - BS Basic: 9개 커리큘럼 항목 (3일, 24시간)';
  RAISE NOTICE '  - BS Advanced: 10개 커리큘럼 항목 (5일, 40시간)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ 참고사항:';
  RAISE NOTICE '  - 새로 생성되는 course_rounds는 자동으로 curriculum_items가 생성됩니다';
  RAISE NOTICE '  - 기존 course_rounds는 수동으로 curriculum_items 연결이 필요할 수 있습니다';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 다음 단계:';
  RAISE NOTICE '  - TypeScript 타입 정의 업데이트';
  RAISE NOTICE '  - 서비스 레이어 리팩토링';
  RAISE NOTICE '  - UI 컴포넌트 업데이트';
END $$;
