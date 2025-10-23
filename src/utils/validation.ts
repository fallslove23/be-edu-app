/**
 * 데이터 유효성 검사 유틸리티
 * BS 학습 관리 시스템의 모든 데이터 입력에 대한 검증 로직
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScoreValidationRules {
  min: number;
  max: number;
  required: boolean;
  decimals?: number;
}

export interface StudentValidationRules {
  nameMinLength: number;
  nameMaxLength: number;
  emailRequired: boolean;
  phoneRequired: boolean;
}

// 기본 검증 규칙
export const DEFAULT_SCORE_RULES: ScoreValidationRules = {
  min: 0,
  max: 100,
  required: true,
  decimals: 1
};

export const DEFAULT_STUDENT_RULES: StudentValidationRules = {
  nameMinLength: 2,
  nameMaxLength: 50,
  emailRequired: false,
  phoneRequired: false
};

/**
 * 점수 데이터 유효성 검사
 */
export const validateScore = (
  score: number | string | null | undefined,
  rules: ScoreValidationRules = DEFAULT_SCORE_RULES
): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // null/undefined 체크
  if (score === null || score === undefined || score === '') {
    if (rules.required) {
      result.errors.push('점수는 필수 입력 항목입니다.');
      result.isValid = false;
    }
    return result;
  }

  // 숫자 변환
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  
  // 숫자 유효성 체크
  if (isNaN(numScore)) {
    result.errors.push('유효한 숫자를 입력해주세요.');
    result.isValid = false;
    return result;
  }

  // 범위 체크
  if (numScore < rules.min) {
    result.errors.push(`점수는 ${rules.min}점 이상이어야 합니다.`);
    result.isValid = false;
  }

  if (numScore > rules.max) {
    result.errors.push(`점수는 ${rules.max}점 이하여야 합니다.`);
    result.isValid = false;
  }

  // 소수점 체크
  if (rules.decimals !== undefined) {
    const decimalPlaces = (numScore.toString().split('.')[1] || '').length;
    if (decimalPlaces > rules.decimals) {
      result.warnings.push(`소수점 ${rules.decimals}자리까지만 입력 가능합니다.`);
    }
  }

  // 경고 사항
  if (numScore < 60) {
    result.warnings.push('낮은 점수입니다. 추가 지도가 필요할 수 있습니다.');
  }

  return result;
};

/**
 * 교육생 이름 유효성 검사
 */
export const validateStudentName = (
  name: string | null | undefined,
  rules: StudentValidationRules = DEFAULT_STUDENT_RULES
): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!name || name.trim() === '') {
    result.errors.push('교육생 이름은 필수 입력 항목입니다.');
    result.isValid = false;
    return result;
  }

  const trimmedName = name.trim();

  if (trimmedName.length < rules.nameMinLength) {
    result.errors.push(`이름은 최소 ${rules.nameMinLength}자 이상이어야 합니다.`);
    result.isValid = false;
  }

  if (trimmedName.length > rules.nameMaxLength) {
    result.errors.push(`이름은 최대 ${rules.nameMaxLength}자까지 입력 가능합니다.`);
    result.isValid = false;
  }

  // 특수문자 체크 (한글, 영문, 숫자, 공백만 허용)
  const nameRegex = /^[가-힣a-zA-Z0-9\s]+$/;
  if (!nameRegex.test(trimmedName)) {
    result.errors.push('이름에는 한글, 영문, 숫자, 공백만 사용할 수 있습니다.');
    result.isValid = false;
  }

  return result;
};

/**
 * 이메일 유효성 검사
 */
export const validateEmail = (email: string | null | undefined, required: boolean = false): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!email || email.trim() === '') {
    if (required) {
      result.errors.push('이메일은 필수 입력 항목입니다.');
      result.isValid = false;
    }
    return result;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    result.errors.push('올바른 이메일 형식을 입력해주세요.');
    result.isValid = false;
  }

  return result;
};

/**
 * 전화번호 유효성 검사
 */
export const validatePhone = (phone: string | null | undefined, required: boolean = false): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!phone || phone.trim() === '') {
    if (required) {
      result.errors.push('전화번호는 필수 입력 항목입니다.');
      result.isValid = false;
    }
    return result;
  }

  // 전화번호 정규화 (숫자만 추출)
  const normalizedPhone = phone.replace(/[^0-9]/g, '');
  
  if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
    result.errors.push('올바른 전화번호 형식을 입력해주세요. (10-11자리 숫자)');
    result.isValid = false;
  }

  return result;
};

/**
 * CSV 데이터 유효성 검사
 */
export const validateCsvData = (data: any[]): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!Array.isArray(data) || data.length === 0) {
    result.errors.push('CSV 데이터가 비어있습니다.');
    result.isValid = false;
    return result;
  }

  // 필수 컬럼 체크
  const requiredColumns = ['Round', 'Course ID', 'Student Name', 'Theory Score', 'Practical Score'];
  const headers = Object.keys(data[0] || {});
  
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    result.errors.push(`필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}`);
    result.isValid = false;
  }

  // 데이터 행 검증
  let validRows = 0;
  let invalidRows = 0;

  data.forEach((row, index) => {
    const rowIndex = index + 1; // 1-based index for user display
    let rowValid = true;

    // 이름 검증
    const nameValidation = validateStudentName(row['Student Name']);
    if (!nameValidation.isValid) {
      result.errors.push(`${rowIndex}행: ${nameValidation.errors.join(', ')}`);
      rowValid = false;
    }

    // 점수 검증
    const theoryValidation = validateScore(row['Theory Score']);
    if (!theoryValidation.isValid) {
      result.errors.push(`${rowIndex}행 이론점수: ${theoryValidation.errors.join(', ')}`);
      rowValid = false;
    }

    const practicalValidation = validateScore(row['Practical Score']);
    if (!practicalValidation.isValid) {
      result.errors.push(`${rowIndex}행 실기점수: ${practicalValidation.errors.join(', ')}`);
      rowValid = false;
    }

    if (rowValid) {
      validRows++;
    } else {
      invalidRows++;
    }
  });

  if (invalidRows > 0) {
    result.warnings.push(`총 ${data.length}행 중 ${validRows}행 유효, ${invalidRows}행 오류`);
    if (validRows === 0) {
      result.isValid = false;
    }
  }

  return result;
};

/**
 * 일괄 점수 검증
 */
export const validateScoresBatch = (scores: { [key: string]: any }): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const scoreFields = ['theoryScore', 'practicalScore', 'bsActivityScore', 'attitudeScore'];
  
  scoreFields.forEach(field => {
    if (scores[field] !== undefined && scores[field] !== null && scores[field] !== '') {
      const validation = validateScore(scores[field]);
      if (!validation.isValid) {
        result.errors.push(`${field}: ${validation.errors.join(', ')}`);
        result.isValid = false;
      }
      if (validation.warnings.length > 0) {
        result.warnings.push(`${field}: ${validation.warnings.join(', ')}`);
      }
    }
  });

  return result;
};

/**
 * 날짜 유효성 검사
 */
export const validateDateRange = (startDate: string, endDate: string): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!startDate || !endDate) {
    result.errors.push('시작일과 종료일을 모두 입력해주세요.');
    result.isValid = false;
    return result;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    result.errors.push('올바른 날짜 형식을 입력해주세요.');
    result.isValid = false;
    return result;
  }

  if (start >= end) {
    result.errors.push('시작일은 종료일보다 빨라야 합니다.');
    result.isValid = false;
  }

  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 365) {
    result.warnings.push('날짜 범위가 1년을 초과합니다. 성능에 영향을 줄 수 있습니다.');
  }

  return result;
};

/**
 * 파일 유효성 검사
 */
export const validateFile = (file: File, allowedTypes: string[] = ['text/csv'], maxSize: number = 5 * 1024 * 1024): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!file) {
    result.errors.push('파일을 선택해주세요.');
    result.isValid = false;
    return result;
  }

  // 파일 타입 체크
  if (!allowedTypes.includes(file.type)) {
    result.errors.push(`허용되지 않은 파일 형식입니다. 허용 형식: ${allowedTypes.join(', ')}`);
    result.isValid = false;
  }

  // 파일 크기 체크
  if (file.size > maxSize) {
    result.errors.push(`파일 크기가 너무 큽니다. 최대 ${(maxSize / 1024 / 1024).toFixed(1)}MB까지 업로드 가능합니다.`);
    result.isValid = false;
  }

  // 경고사항
  if (file.size > 1024 * 1024) { // 1MB 이상
    result.warnings.push('큰 파일은 처리에 시간이 걸릴 수 있습니다.');
  }

  return result;
};

/**
 * 보안 검사 - XSS 방지
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // HTML 태그 제거
    .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
    .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
    .trim();
};

/**
 * 종합 데이터 검증
 */
export const validateCompleteData = (data: any): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // 필수 필드 체크
  const requiredFields = ['studentName', 'courseId', 'round'];
  requiredFields.forEach(field => {
    if (!data[field]) {
      result.errors.push(`${field}는 필수 입력 항목입니다.`);
      result.isValid = false;
    }
  });

  // 각 필드별 상세 검증
  if (data.studentName) {
    const nameValidation = validateStudentName(data.studentName);
    if (!nameValidation.isValid) {
      result.errors.push(...nameValidation.errors);
      result.isValid = false;
    }
    result.warnings.push(...nameValidation.warnings);
  }

  if (data.email) {
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      result.errors.push(...emailValidation.errors);
      result.isValid = false;
    }
  }

  // 점수 검증
  const scoreValidation = validateScoresBatch(data);
  if (!scoreValidation.isValid) {
    result.errors.push(...scoreValidation.errors);
    result.isValid = false;
  }
  result.warnings.push(...scoreValidation.warnings);

  return result;
};