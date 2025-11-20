import React, { useState, useRef } from 'react';
import {
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

interface ExcelScheduleImporterProps {
  onImport: (scheduleData: any[]) => Promise<void>;
  onClose: () => void;
}

interface ScheduleRow {
  일차: number;
  날짜: string;
  시작시간: string;
  종료시간: string;
  교육주제: string;
  강사명: string;
  보조강사?: string;
  운영담당자?: string;
  강의실: string;
  비고?: string;
}

const ExcelScheduleImporter: React.FC<ExcelScheduleImporterProps> = ({
  onImport,
  onClose
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedData, setUploadedData] = useState<ScheduleRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 엑셀 템플릿 다운로드 데이터
  const generateTemplate = () => {
    const templateData = [
      {
        '일차': 1,
        '날짜': '2025-02-03',
        '시작시간': '09:00',
        '종료시간': '12:00',
        '교육주제': 'BS 기초 - 영업 프로세스 이해',
        '강사명': '김강사',
        '보조강사': '이보조',
        '운영담당자': '박운영',
        '강의실': '교육실 A',
        '비고': '신입사원 대상'
      },
      {
        '일차': 1,
        '날짜': '2025-02-03',
        '시작시간': '13:00',
        '종료시간': '17:00',
        '교육주제': 'BS 기초 - 고객 응대 스킬',
        '강사명': '이강사',
        '보조강사': '최보조',
        '운영담당자': '박운영',
        '강의실': '교육실 A',
        '비고': ''
      },
      {
        '일차': 2,
        '날짜': '2025-02-04',
        '시작시간': '09:00',
        '종료시간': '12:00',
        '교육주제': 'BS 기초 - 제품 지식 학습',
        '강사명': '박강사',
        '보조강사': '',
        '운영담당자': '박운영',
        '강의실': '교육실 A',
        '비고': '실습 포함'
      }
    ];

    return templateData;
  };

  // 템플릿 다운로드
  const downloadTemplate = () => {
    const templateData = generateTemplate();
    const headers = Object.keys(templateData[0]);
    
    // CSV 형식으로 생성
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => 
        headers.map(header => `"${row[header as keyof typeof row]}"`).join(',')
      )
    ].join('\n');

    // BOM 추가 (한글 깨짐 방지)
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'BS교육_일정_템플릿.csv';
    link.click();
  };

  // 드래그 앤 드롭 핸들러
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // 파일 처리
  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      alert('CSV 또는 Excel 파일만 업로드 가능합니다.');
      return;
    }

    setIsProcessing(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const validatedData = validateData(rows);
      
      if (validatedData.length > 0) {
        setUploadedData(validatedData);
      }
    } catch (error) {
      console.error('파일 처리 오류:', error);
      alert('파일을 읽는 중 오류가 발생했습니다.');
    }
    setIsProcessing(false);
  };

  // CSV 파싱
  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row);
    }

    return rows;
  };

  // 데이터 검증
  const validateData = (rows: any[]): ScheduleRow[] => {
    const errors: string[] = [];
    const validRows: ScheduleRow[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // 헤더 제외
      
      // 필수 필드 검증
      if (!row['일차']) {
        errors.push(`${rowNumber}행: 일차가 누락되었습니다.`);
      }
      if (!row['날짜']) {
        errors.push(`${rowNumber}행: 날짜가 누락되었습니다.`);
      }
      if (!row['시작시간']) {
        errors.push(`${rowNumber}행: 시작시간이 누락되었습니다.`);
      }
      if (!row['종료시간']) {
        errors.push(`${rowNumber}행: 종료시간이 누락되었습니다.`);
      }
      if (!row['교육주제']) {
        errors.push(`${rowNumber}행: 교육주제가 누락되었습니다.`);
      }
      if (!row['강사명']) {
        errors.push(`${rowNumber}행: 강사명이 누락되었습니다.`);
      }
      if (!row['운영담당자']) {
        errors.push(`${rowNumber}행: 운영담당자가 누락되었습니다.`);
      }

      // 날짜 형식 검증
      if (row['날짜'] && !row['날짜'].match(/^\d{4}-\d{2}-\d{2}$/)) {
        errors.push(`${rowNumber}행: 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)`);
      }

      // 시간 형식 검증
      if (row['시작시간'] && !row['시작시간'].match(/^\d{2}:\d{2}$/)) {
        errors.push(`${rowNumber}행: 시작시간 형식이 올바르지 않습니다. (HH:MM)`);
      }
      if (row['종료시간'] && !row['종료시간'].match(/^\d{2}:\d{2}$/)) {
        errors.push(`${rowNumber}행: 종료시간 형식이 올바르지 않습니다. (HH:MM)`);
      }

      // 일차 숫자 검증
      if (row['일차'] && isNaN(parseInt(row['일차']))) {
        errors.push(`${rowNumber}행: 일차는 숫자여야 합니다.`);
      }

      // 에러가 없으면 유효한 행으로 추가
      if (errors.length === 0) {
        validRows.push({
          일차: parseInt(row['일차']),
          날짜: row['날짜'],
          시작시간: row['시작시간'],
          종료시간: row['종료시간'],
          교육주제: row['교육주제'],
          강사명: row['강사명'],
          보조강사: row['보조강사'] || '',
          운영담당자: row['운영담당자'],
          강의실: row['강의실'] || '',
          비고: row['비고'] || ''
        });
      }
    });

    setValidationErrors(errors);
    return validRows;
  };

  // 데이터 가져오기
  const handleImportData = async () => {
    if (uploadedData.length === 0) {
      alert('가져올 데이터가 없습니다.');
      return;
    }

    try {
      await onImport(uploadedData);
      alert(`${uploadedData.length}개의 일정이 성공적으로 가져와졌습니다.`);
      onClose();
    } catch (error) {
      console.error('일정 가져오기 실패:', error);
      alert('일정 가져오기 중 오류가 발생했습니다.');
    }
  };

  // SS교육연구소 과정 플래너 연동
  const openCoursePlanner = () => {
    window.open('https://studio--eduscheduler-nrx9o.us-central1.hosted.app', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">일정 가져오기</h2>
              <p className="text-sm text-gray-600">엑셀 파일로 교육 일정을 일괄 등록하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* SS교육연구소 과정 플래너 연동 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <LinkIcon className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="font-medium text-purple-900">SS교육연구소 과정 플래너</h3>
                  <p className="text-sm text-purple-700">전문적인 교육 일정 계획 도구를 활용하세요</p>
                </div>
              </div>
              <button
                onClick={openCoursePlanner}
                className="btn-purple flex items-center space-x-2"
              >
                <LinkIcon className="h-4 w-4" />
                <span>플래너 열기</span>
              </button>
            </div>
          </div>

          {/* 템플릿 다운로드 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DocumentArrowDownIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">1단계: 템플릿 다운로드</h3>
                  <p className="text-sm text-blue-700">표준 양식을 다운로드하여 데이터를 입력하세요</p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="btn-primary px-4 py-2 rounded-full flex items-center space-x-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>템플릿 다운로드</span>
              </button>
            </div>
          </div>

          {/* 템플릿 가이드 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <InformationCircleIcon className="h-5 w-5 text-gray-600 mr-2" />
              입력 가이드
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">필수 입력 항목:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>일차:</strong> 숫자 (1, 2, 3, ...)</li>
                  <li>• <strong>날짜:</strong> YYYY-MM-DD 형식</li>
                  <li>• <strong>시작시간:</strong> HH:MM 형식 (예: 09:00)</li>
                  <li>• <strong>종료시간:</strong> HH:MM 형식 (예: 12:00)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">입력 예시:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>교육주제:</strong> BS 기초 - 영업 프로세스 이해</li>
                  <li>• <strong>강사명:</strong> 김강사 (필수)</li>
                  <li>• <strong>보조강사:</strong> 이보조 (선택, 없으면 빈칸)</li>
                  <li>• <strong>운영담당자:</strong> 박운영 (필수)</li>
                  <li>• <strong>강의실:</strong> 교육실 A, 온라인</li>
                  <li>• <strong>비고:</strong> 실습 포함, 신입사원 대상</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 파일 업로드 영역 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <DocumentArrowUpIcon className="h-5 w-5 text-gray-600 mr-2" />
              2단계: 파일 업로드
            </h3>
            
            <div
              className={`border-2 border-dashed rounded-full p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  파일을 여기에 드래그하거나 클릭하여 선택하세요
                </p>
                <p className="text-sm text-gray-600">
                  지원 형식: CSV, Excel (.xlsx, .xls)
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full"
                >
                  파일 선택
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* 처리 중 표시 */}
          {isProcessing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">파일을 처리하는 중...</p>
            </div>
          )}

          {/* 검증 오류 표시 */}
          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-destructive">데이터 검증 오류</h3>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 업로드된 데이터 미리보기 */}
          {uploadedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  3단계: 데이터 확인 ({uploadedData.length}개 일정)
                </h3>
                <button
                  onClick={handleImportData}
                  className="btn-success px-6 py-2 rounded-full"
                >
                  일정 가져오기
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일차</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">교육주제</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">강사</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보조강사</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">운영담당자</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">강의실</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {uploadedData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-3 text-sm text-gray-900">{row.일차}</td>
                          <td className="px-3 py-3 text-sm text-gray-900">{row.날짜}</td>
                          <td className="px-3 py-3 text-sm text-gray-900">{row.시작시간}-{row.종료시간}</td>
                          <td className="px-3 py-3 text-sm text-gray-900 max-w-xs truncate" title={row.교육주제}>{row.교육주제}</td>
                          <td className="px-3 py-3 text-sm text-gray-900">{row.강사명}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{row.보조강사 || '-'}</td>
                          <td className="px-3 py-3 text-sm text-gray-900">{row.운영담당자}</td>
                          <td className="px-3 py-3 text-sm text-gray-900">{row.강의실}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {uploadedData.length > 10 && (
                    <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-600">
                      ... 외 {uploadedData.length - 10}개 더
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelScheduleImporter;