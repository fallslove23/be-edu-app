import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ExcelJS from 'exceljs';
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import type { Trainee } from '../../types/trainee.types';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (trainees: Partial<Trainee>[]) => Promise<void>;
}

interface ExcelRowData {
  이름: string;
  이메일: string;
  전화번호: string;
  사번: string;
  부서: string;
  직급?: string;
  입사일?: string;
  비상연락처_이름?: string;
  비상연락처_관계?: string;
  비상연락처_전화?: string;
}

interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [uploadData, setUploadData] = useState<Partial<Trainee>[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'processing'>('upload');

  // 템플릿 다운로드 함수
  const downloadTemplate = useCallback(async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('교육생목록');

    // 헤더 추가
    worksheet.columns = [
      { header: '이름', key: '이름', width: 10 },
      { header: '이메일', key: '이메일', width: 25 },
      { header: '전화번호', key: '전화번호', width: 15 },
      { header: '사번', key: '사번', width: 12 },
      { header: '부서', key: '부서', width: 15 },
      { header: '직급', key: '직급', width: 10 },
      { header: '입사일', key: '입사일', width: 12 },
      { header: '비상연락처_이름', key: '비상연락처_이름', width: 12 },
      { header: '비상연락처_관계', key: '비상연락처_관계', width: 10 },
      { header: '비상연락처_전화', key: '비상연락처_전화', width: 15 },
    ];

    // 샘플 데이터 추가
    worksheet.addRow({
      '이름': '김영희',
      '이메일': 'kim.younghee@company.com',
      '전화번호': '010-1234-5678',
      '사번': 'EMP001',
      '부서': '영업팀',
      '직급': '주임',
      '입사일': '2023-03-15',
      '비상연락처_이름': '김부모',
      '비상연락처_관계': '부모',
      '비상연락처_전화': '010-9876-5432'
    });
    worksheet.addRow({
      '이름': '박철수',
      '이메일': 'park.chulsoo@company.com',
      '전화번호': '010-2345-6789',
      '사번': 'EMP002',
      '부서': '마케팅팀',
      '직급': '대리',
      '입사일': '2022-08-20',
      '비상연락처_이름': '박배우자',
      '비상연락처_관계': '배우자',
      '비상연락처_전화': '010-8765-4321'
    });

    // 파일 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '교육생_업로드_템플릿.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  }, []);

  // 데이터 검증 함수
  const validateData = useCallback((data: ExcelRowData[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^01[0-9]-\d{3,4}-\d{4}$/;

    data.forEach((row, index) => {
      const rowNumber = index + 2; // 엑셀 행 번호 (헤더 포함)

      // 필수 필드 검증
      if (!row.이름?.trim()) {
        errors.push({ row: rowNumber, field: '이름', value: row.이름, message: '이름은 필수입니다' });
      }
      
      if (!row.이메일?.trim()) {
        errors.push({ row: rowNumber, field: '이메일', value: row.이메일, message: '이메일은 필수입니다' });
      } else if (!emailPattern.test(row.이메일.trim())) {
        errors.push({ row: rowNumber, field: '이메일', value: row.이메일, message: '올바른 이메일 형식이 아닙니다' });
      }

      if (!row.전화번호?.trim()) {
        errors.push({ row: rowNumber, field: '전화번호', value: row.전화번호, message: '전화번호는 필수입니다' });
      } else if (!phonePattern.test(row.전화번호.trim())) {
        errors.push({ row: rowNumber, field: '전화번호', value: row.전화번호, message: '전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)' });
      }

      if (!row.사번?.trim()) {
        errors.push({ row: rowNumber, field: '사번', value: row.사번, message: '사번은 필수입니다' });
      }

      if (!row.부서?.trim()) {
        errors.push({ row: rowNumber, field: '부서', value: row.부서, message: '부서는 필수입니다' });
      }

      // 입사일 검증 (선택사항이지만 있으면 형식 확인)
      if (row.입사일 && row.입사일.trim()) {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(row.입사일.trim())) {
          errors.push({ row: rowNumber, field: '입사일', value: row.입사일, message: '입사일 형식이 올바르지 않습니다 (YYYY-MM-DD)' });
        }
      }

      // 비상연락처 전화번호 검증 (있으면)
      if (row.비상연락처_전화 && row.비상연락처_전화.trim() && !phonePattern.test(row.비상연락처_전화.trim())) {
        errors.push({ row: rowNumber, field: '비상연락처_전화', value: row.비상연락처_전화, message: '비상연락처 전화번호 형식이 올바르지 않습니다' });
      }
    });

    return errors;
  }, []);

  // 엑셀 데이터를 Trainee 형식으로 변환
  const convertToTraineeData = useCallback((data: ExcelRowData[]): Partial<Trainee>[] => {
    return data.map(row => ({
      name: row.이름?.trim() || '',
      email: row.이메일?.trim() || '',
      phone: row.전화번호?.trim() || '',
      employee_id: row.사번?.trim() || '',
      department: row.부서?.trim() || '',
      position: row.직급?.trim() || '',
      hire_date: row.입사일?.trim() || '',
      status: 'active' as const,
      enrolled_courses: [],
      emergency_contact: (row.비상연락처_이름 || row.비상연락처_관계 || row.비상연락처_전화) ? {
        name: row.비상연락처_이름?.trim() || '',
        relationship: row.비상연락처_관계?.trim() || '',
        phone: row.비상연락처_전화?.trim() || ''
      } : undefined
    }));
  }, []);

  // 파일 드롭 처리
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    try {
      setIsProcessing(true);

      const data = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);

      const worksheet = workbook.worksheets[0];
      const jsonData: ExcelRowData[] = [];

      // 첫 번째 행(헤더)을 제외하고 데이터 읽기
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // 헤더 스킵

        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = worksheet.getRow(1).getCell(colNumber).value as string;
          rowData[header] = cell.value;
        });
        jsonData.push(rowData);
      });

      if (jsonData.length === 0) {
        toast.error('파일에 데이터가 없습니다.');
        return;
      }

      // 데이터 검증
      const errors = validateData(jsonData);
      setValidationErrors(errors);

      if (errors.length > 0) {
        toast.error(`${errors.length}개의 검증 오류가 발견되었습니다.`);
        setCurrentStep('review');
        return;
      }

      // 데이터 변환
      const traineeData = convertToTraineeData(jsonData);
      setUploadData(traineeData);
      setCurrentStep('review');

      toast.success(`${traineeData.length}명의 교육생 데이터를 성공적으로 읽어왔습니다.`);

    } catch (error) {
      console.error('파일 처리 중 오류:', error);
      toast.error('파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, [validateData, convertToTraineeData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: isProcessing
  });

  // 업로드 실행
  const handleUpload = async () => {
    if (uploadData.length === 0) return;

    try {
      setIsProcessing(true);
      setCurrentStep('processing');
      
      await onUpload(uploadData);
      
      toast.success(`${uploadData.length}명의 교육생이 성공적으로 등록되었습니다.`);
      handleClose();
      
    } catch (error) {
      console.error('업로드 중 오류:', error);
      toast.error('업로드 중 오류가 발생했습니다.');
      setCurrentStep('review');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setUploadData([]);
    setValidationErrors([]);
    setCurrentStep('upload');
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            교육생 대량 업로드
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isProcessing}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* 템플릿 다운로드 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <DocumentCheckIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900">템플릿 다운로드</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      먼저 템플릿을 다운로드하여 올바른 형식으로 데이터를 준비해주세요.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="mt-2 inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-full text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      템플릿 다운로드
                    </button>
                  </div>
                </div>
              </div>

              {/* 파일 업로드 영역 */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-full p-8 text-center transition-colors ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <input {...getInputProps()} />
                <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {isProcessing ? (
                  <div className="space-y-2">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-lg animate-spin mx-auto"></div>
                    <p className="text-sm text-gray-600">파일 처리 중...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">
                      {isDragActive ? '파일을 여기에 놓아주세요' : '엑셀 파일을 드래그하거나 클릭하여 선택하세요'}
                    </p>
                    <p className="text-sm text-gray-500">
                      지원 형식: .xlsx, .xls, .csv
                    </p>
                  </div>
                )}
              </div>

              {/* 필드 안내 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">필수 필드</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>• 이름</div>
                  <div>• 이메일</div>
                  <div>• 전화번호 (010-0000-0000 형식)</div>
                  <div>• 사번</div>
                  <div>• 부서</div>
                </div>
                <h4 className="text-sm font-medium text-gray-900 mt-4 mb-3">선택 필드</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>• 직급</div>
                  <div>• 입사일 (YYYY-MM-DD 형식)</div>
                  <div>• 비상연락처 정보</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="space-y-6">
              {/* 검증 결과 */}
              {validationErrors.length > 0 ? (
                <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-destructive">
                        {validationErrors.length}개의 오류가 발견되었습니다
                      </h3>
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        {validationErrors.map((error, index) => (
                          <div key={index} className="text-sm text-destructive py-1">
                            {error.row}행 - {error.field}: {error.message}
                            {error.value && ` (입력값: "${error.value}")`}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-green-900">
                        검증 완료
                      </h3>
                      <p className="text-sm text-green-700">
                        {uploadData.length}명의 교육생 데이터가 업로드 준비되었습니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 미리보기 */}
              {uploadData.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">데이터 미리보기</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">전화번호</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">부서</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">직급</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {uploadData.slice(0, 10).map((trainee, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-gray-900">{trainee.name}</td>
                              <td className="px-4 py-2 text-gray-900">{trainee.email}</td>
                              <td className="px-4 py-2 text-gray-900">{trainee.phone}</td>
                              <td className="px-4 py-2 text-gray-900">{trainee.department}</td>
                              <td className="px-4 py-2 text-gray-900">{trainee.position}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {uploadData.length > 10 && (
                      <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 text-center">
                        ... 외 {uploadData.length - 10}명 더
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-lg animate-spin mb-4"></div>
              <p className="text-lg font-medium text-gray-900 mb-2">교육생 등록 중...</p>
              <p className="text-sm text-gray-600">잠시만 기다려주세요.</p>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        {currentStep !== 'processing' && (
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-full hover:bg-gray-200"
              disabled={isProcessing}
            >
              취소
            </button>

            <div className="flex space-x-3">
              {currentStep === 'review' && (
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50"
                  disabled={isProcessing}
                >
                  다시 선택
                </button>
              )}
              
              {currentStep === 'review' && validationErrors.length === 0 && (
                <button
                  onClick={handleUpload}
                  className="btn-primary"
                  disabled={isProcessing || uploadData.length === 0}
                >
                  {uploadData.length}명 업로드
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadModal;