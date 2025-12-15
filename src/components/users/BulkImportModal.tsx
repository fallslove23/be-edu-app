import React, { useState, useRef } from 'react';
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import type { User, UserRole, UserStatus } from '../../types/auth.types';
import { roleLabels, userStatusLabels } from '../../types/auth.types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (users: User[]) => void;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [importType, setImportType] = useState<'excel' | 'google'>('excel');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [validUsers, setValidUsers] = useState<User[]>([]);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 엑셀 파일 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // 실제로는 SheetJS 라이브러리 사용
      // 여기서는 모의 데이터로 시연
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockData = [
        ['이름', '이메일', '전화번호', '사번', '역할', '부서', '직급', '입사일', '상태'],
        ['홍길동', 'hong@company.com', '010-1234-5678', '20240001', 'trainee', '영업팀', '사원', '2024-03-01', 'active'],
        ['김철수', 'kim@company.com', '010-2345-6789', '20220001', 'instructor', '교육팀', '강사', '2022-01-15', 'active'],
        ['이영희', 'lee@company.com', '010-3456-7890', '20200001', 'manager', '영업본부', '팀장', '2020-06-01', 'active'],
      ];

      processCsvData(mockData);
    } catch (error) {
      console.error('파일 처리 실패:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 구글 스프레드시트 처리
  const handleGoogleSheetImport = async () => {
    if (!googleSheetUrl) return;

    setIsProcessing(true);

    try {
      // 실제로는 Google Sheets API 사용
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockData = [
        ['이름', '이메일', '전화번호', '사번', '역할', '부서', '직급', '입사일', '상태'],
        ['박구글', 'park@company.com', '010-4567-8901', 'EMP004', 'operator', '운영팀', '주임', '2023-09-01', 'active'],
        ['최스프레드', 'choi@company.com', '010-5678-9012', 'EMP005', 'trainee', '마케팅팀', '사원', '2024-01-01', 'pending'],
      ];

      processCsvData(mockData);
    } catch (error) {
      console.error('구글 시트 처리 실패:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // CSV 데이터 처리 및 유효성 검사
  const processCsvData = (data: any[][]) => {
    const [headers, ...rows] = data;
    const newErrors: ImportError[] = [];
    const newValidUsers: User[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // 헤더 제외
      const user: Partial<User> = {};

      // 필수 필드 매핑
      const [name, email, phone, employee_id, role, department, position, hire_date, status] = row;

      // 유효성 검사
      if (!name || name.trim() === '') {
        newErrors.push({ row: rowNumber, field: '이름', message: '이름은 필수입니다.' });
      } else {
        user.name = name.trim();
      }

      if (!email || !email.includes('@')) {
        newErrors.push({ row: rowNumber, field: '이메일', message: '올바른 이메일 형식이 아닙니다.' });
      } else {
        user.email = email.trim();
      }

      if (!phone || !phone.match(/^010-\d{4}-\d{4}$/)) {
        newErrors.push({ row: rowNumber, field: '전화번호', message: '올바른 전화번호 형식이 아닙니다. (010-0000-0000)' });
      } else {
        user.phone = phone;
      }

      if (!employee_id) {
        newErrors.push({ row: rowNumber, field: '사번', message: '사번은 필수입니다.' });
      } else {
        user.employee_id = employee_id;
      }

      if (!role || !Object.keys(roleLabels).includes(role)) {
        newErrors.push({ row: rowNumber, field: '역할', message: `올바른 역할이 아닙니다. (${Object.keys(roleLabels).join(', ')})` });
      } else {
        user.role = role as UserRole;
      }

      if (!department) {
        newErrors.push({ row: rowNumber, field: '부서', message: '부서는 필수입니다.' });
      } else {
        user.department = department;
      }

      if (!position) {
        newErrors.push({ row: rowNumber, field: '직급', message: '직급은 필수입니다.' });
      } else {
        user.position = position;
      }

      if (!hire_date || !hire_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        newErrors.push({ row: rowNumber, field: '입사일', message: '올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)' });
      } else {
        user.hire_date = hire_date;
      }

      if (!status || !Object.keys(userStatusLabels).includes(status)) {
        user.status = 'active' as UserStatus; // 기본값
      } else {
        user.status = status as UserStatus;
      }

      // 에러가 없는 행만 유효 사용자로 추가
      if (newErrors.filter(e => e.row === rowNumber).length === 0) {
        newValidUsers.push({
          ...user as User,
          id: `import_${Date.now()}_${index}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });

    setParsedData(rows);
    setErrors(newErrors);
    setValidUsers(newValidUsers);
  };

  const handleImport = () => {
    onImport(validUsers);
  };

  const downloadTemplate = () => {
    const template = [
      ['이름', '이메일', '전화번호', '사번', '역할', '부서', '직급', '입사일', '상태'],
      ['홍길동', 'hong@example.com', '010-1234-5678', '20240001', 'trainee', '영업팀', '사원', '2024-01-01', 'active'],
      ['김강사', 'kim@example.com', '010-2345-6789', '20220001', 'instructor', '교육팀', '강사', '2022-01-01', 'active']
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full border border-gray-100 dark:border-gray-700">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                사용자 일괄 불러오기
              </h3>

              {/* 가져오기 방식 선택 */}
              <div className="mb-6">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setImportType('excel')}
                    className={`flex items-center px-4 py-2 rounded-xl border transition-all ${importType === 'excel'
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-medium'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                  >
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    엑셀/CSV 파일
                  </button>
                  <button
                    onClick={() => setImportType('google')}
                    className={`flex items-center px-4 py-2 rounded-xl border transition-all ${importType === 'google'
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 font-medium'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                  >
                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                    구글 스프레드시트
                  </button>
                </div>
              </div>

              {/* 템플릿 다운로드 */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">템플릿 다운로드</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">올바른 형식으로 데이터를 준비하세요.</p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="btn-primary flex items-center"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    템플릿 다운로드
                  </button>
                </div>
              </div>

              {/* 파일 업로드 또는 구글 시트 URL */}
              {importType === 'excel' ? (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    엑셀/CSV 파일 선택
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 transition-all cursor-pointer"
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    구글 스프레드시트 URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={googleSheetUrl}
                      onChange={(e) => setGoogleSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      onClick={handleGoogleSheetImport}
                      disabled={!googleSheetUrl || isProcessing}
                      className="btn-success whitespace-nowrap"
                    >
                      가져오기
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    구글 스프레드시트는 "링크가 있는 모든 사용자"로 공유 설정해주세요.
                  </p>
                </div>
              )}

              {/* 로딩 상태 */}
              {isProcessing && (
                <div className="mb-6 flex items-center justify-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300 font-medium">데이터를 처리하고 있습니다...</span>
                </div>
              )}

              {/* 검증 결과 */}
              {(validUsers.length > 0 || errors.length > 0) && !isProcessing && (
                <div className="mb-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                        <span className="text-sm font-bold text-green-800 dark:text-green-200">
                          유효한 사용자: {validUsers.length}명
                        </span>
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                        <span className="text-sm font-bold text-red-800 dark:text-red-200">
                          오류: {errors.length}개
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 오류 목록 */}
                  {errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-red-800 dark:text-red-300 mb-2">검증 오류</h4>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                        {errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-700 dark:text-red-400 flex items-start">
                            <span className="font-mono text-xs bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded mr-2 mt-0.5">
                              {error.row}행
                            </span>
                            <span>
                              <span className="font-bold">{error.field}:</span> {error.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 유효한 사용자 미리보기 */}
                  {validUsers.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/50 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-green-800 dark:text-green-300 mb-2">가져올 사용자 미리보기</h4>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                        {validUsers.slice(0, 5).map((user, index) => (
                          <div key={index} className="text-sm text-green-700 dark:text-green-400 flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                            {user.name} <span className="text-green-600/70 dark:text-green-500/70 mx-1">({roleLabels[user.role]})</span> - {user.department}
                          </div>
                        ))}
                        {validUsers.length > 5 && (
                          <div className="text-sm text-green-600 dark:text-green-500 pl-3.5 pt-1">...외 {validUsers.length - 5}명</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="btn-outline"
                >
                  취소
                </button>
                <button
                  onClick={handleImport}
                  disabled={validUsers.length === 0}
                  className="btn-primary"
                >
                  {validUsers.length}명 가져오기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;