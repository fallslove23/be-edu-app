import React, { useState } from 'react';
import {
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import type { StudentScore } from '../../types/student.types';

interface ScoreDataManagerProps {
  onImport?: (scores: StudentScore[]) => void;
  onExport?: () => StudentScore[];
  onClose: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

const ScoreDataManager: React.FC<ScoreDataManagerProps> = ({ 
  onImport, 
  onExport,
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Excel 템플릿 다운로드
  const downloadTemplate = () => {
    const templateData = [
      ['Round', 'Course ID', 'Course Display Name', 'Company ID', 'Student Name', 'Theory Score', 'Practical Score', 'BS Activity Score', 'Attitude Score', 'Pass/Fail', 'Remarks'],
      ['1', 'BS-BASIC', 'BS 신입 영업사원 기초과정', 'BS-2025-01', '김교육', '85', '90', '0', '95', 'PASS', '우수한 성과'],
      ['3', 'BS-ADVANCED', 'BS 고급 영업 전략과정', 'BS-2025-03', '김교육', '88', '92', '85', '90', 'PASS', '활동일지 우수'],
      ['2', 'BS-ADVANCED', 'BS 고급 영업 전략과정', 'BS-2025-02', '이학습', '90', '88', '90', '95', 'PASS', '전체적으로 우수']
    ];

    // CSV 형식으로 변환
    const csvContent = templateData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', '점수_입력_템플릿.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV 파일 파싱
  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length !== headers.length) continue;

      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });
      data.push(record);
    }

    return data;
  };

  // 점수 데이터 변환
  const convertToStudentScore = (record: any): StudentScore | null => {
    try {
      return {
        id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        studentId: `student-${record['Student Name']?.replace(/\s+/g, '-').toLowerCase()}`,
        studentName: record['Student Name'] || '',
        round: parseInt(record['Round']) || 1,
        courseId: record['Course ID'] || '',
        courseDisplayName: record['Course Display Name'] || '',
        companyId: record['Company ID'] || '',
        companyName: 'BS 교육원',
        theoryScore: parseInt(record['Theory Score']) || 0,
        practicalScore: parseInt(record['Practical Score']) || 0,
        bsActivityScore: parseInt(record['BS Activity Score']) || 0,
        attitudeScore: parseInt(record['Attitude Score']) || 0,
        overallScore: 0, // 계산됨
        tScore: parseInt(record['Theory Score']) || 0,
        pScore: parseInt(record['Practical Score']) || 0,
        passFail: (record['Pass/Fail'] || 'PENDING') as 'PASS' | 'FAIL' | 'PENDING',
        remarks: record['Remarks'] || '',
        lastUpdated: new Date().toISOString(),
        updatedBy: '시스템 가져오기'
      };
    } catch (error) {
      return null;
    }
  };

  // 종합 점수 계산
  const calculateOverallScore = (score: StudentScore): number => {
    const weights = {
      theory: 0.3,
      practical: 0.4,
      bsActivity: score.courseId === 'BS-ADVANCED' ? 0.2 : 0,
      attitude: 0.1
    };

    let totalWeighted = 0;
    let totalWeight = 0;

    if (score.theoryScore > 0) {
      totalWeighted += score.theoryScore * weights.theory;
      totalWeight += weights.theory;
    }
    if (score.practicalScore > 0) {
      totalWeighted += score.practicalScore * weights.practical;
      totalWeight += weights.practical;
    }
    if (score.bsActivityScore > 0 && weights.bsActivity > 0) {
      totalWeighted += score.bsActivityScore * weights.bsActivity;
      totalWeight += weights.bsActivity;
    }
    if (score.attitudeScore > 0) {
      totalWeighted += score.attitudeScore * weights.attitude;
      totalWeight += weights.attitude;
    }

    return totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 100) / 100 : 0;
  };

  // 파일 가져오기 처리
  const handleFileImport = async (file: File) => {
    setIsProcessing(true);
    setImportResult(null);

    try {
      const content = await file.text();
      const records = parseCSV(content);
      
      const result: ImportResult = {
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: []
      };

      const validScores: StudentScore[] = [];

      records.forEach((record, index) => {
        const score = convertToStudentScore(record);
        
        if (!score) {
          result.failed++;
          result.errors.push(`행 ${index + 2}: 데이터 변환 실패`);
          return;
        }

        // 필수 필드 검증
        if (!score.studentName) {
          result.failed++;
          result.errors.push(`행 ${index + 2}: 학생 이름이 없습니다`);
          return;
        }

        if (!score.courseId) {
          result.failed++;
          result.errors.push(`행 ${index + 2}: 과정 ID가 없습니다`);
          return;
        }

        // 종합 점수 계산
        score.overallScore = calculateOverallScore(score);
        
        // 합격/불합격 자동 판정
        if (score.overallScore > 0) {
          score.passFail = score.overallScore >= 70 ? 'PASS' : 'FAIL';
        }

        validScores.push(score);
        result.success++;
      });

      setImportResult(result);
      
      if (validScores.length > 0 && onImport) {
        onImport(validScores);
      }

    } catch (error) {
      setImportResult({
        success: 0,
        failed: 1,
        duplicates: 0,
        errors: ['파일을 읽는 중 오류가 발생했습니다.']
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        handleFileImport(file);
      } else {
        alert('CSV 파일만 업로드할 수 있습니다.');
      }
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileImport(files[0]);
    }
  };

  // 데이터 내보내기
  const handleExport = () => {
    if (!onExport) return;

    const scores = onExport();
    if (scores.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    // Excel 호환 CSV 생성
    const headers = [
      'Round', 'Course ID', 'Course Display Name', 'Company ID', 'Student Name',
      'Theory Score', 'Practical Score', 'BS Activity Score', 'Attitude Score',
      'Overall Score', 'T Score', 'P Score', 'Pass/Fail', 'Remarks', 'Last Updated'
    ];

    const csvData = [
      headers,
      ...scores.map(score => [
        score.round.toString(),
        score.courseId,
        score.courseDisplayName,
        score.companyId,
        score.studentName,
        score.theoryScore.toString(),
        score.practicalScore.toString(),
        score.bsActivityScore.toString(),
        score.attitudeScore.toString(),
        score.overallScore.toString(),
        score.tScore.toString(),
        score.pScore.toString(),
        score.passFail,
        score.remarks,
        new Date(score.lastUpdated).toLocaleDateString('ko-KR')
      ])
    ];

    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const filename = `점수_데이터_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">점수 데이터 관리</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DocumentArrowUpIcon className="h-4 w-4 inline mr-2" />
              가져오기
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DocumentArrowDownIcon className="h-4 w-4 inline mr-2" />
              내보내기
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* 가져오기 탭 */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">CSV 파일 가져오기</h4>
                <p className="text-gray-600 mb-4">
                  Excel에서 작성한 점수 데이터를 CSV 파일로 저장 후 업로드하세요.
                </p>
              </div>

              {/* 템플릿 다운로드 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-blue-900">Excel 템플릿</h5>
                    <p className="text-blue-700 text-sm mt-1">
                      표준화된 Excel 템플릿을 다운로드하여 점수 데이터를 입력하세요.
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <TableCellsIcon className="h-4 w-4" />
                    <span>템플릿 다운로드</span>
                  </button>
                </div>
              </div>

              {/* 파일 업로드 영역 */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h5 className="text-lg font-medium text-gray-900 mb-2">CSV 파일 업로드</h5>
                <p className="text-gray-600 mb-4">
                  파일을 여기로 끌어다 놓거나 클릭하여 선택하세요
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 cursor-pointer inline-flex items-center space-x-2"
                >
                  <span>파일 선택</span>
                </label>
              </div>

              {/* 처리 중 표시 */}
              {isProcessing && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-yellow-600 animate-spin mr-3" />
                    <span className="text-yellow-800">파일을 처리하는 중...</span>
                  </div>
                </div>
              )}

              {/* 가져오기 결과 */}
              {importResult && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">처리 결과</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                        <div className="text-sm text-gray-600">성공</div>
                      </div>
                      <div className="text-center">
                        <XCircleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                        <div className="text-sm text-gray-600">실패</div>
                      </div>
                      <div className="text-center">
                        <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                        <div className="text-sm text-gray-600">중복</div>
                      </div>
                    </div>
                  </div>

                  {/* 오류 목록 */}
                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="font-medium text-red-900 mb-2">오류 목록</h5>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-700">
                            • {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 사용법 안내 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                  <InformationCircleIcon className="h-5 w-5 mr-2" />
                  사용법
                </h5>
                <ul className="text-sm text-gray-600 space-y-1 list-disc ml-5">
                  <li>Excel 템플릿을 다운로드하여 점수 데이터를 입력하세요</li>
                  <li>Excel에서 "다른 이름으로 저장" → "CSV UTF-8" 형식으로 저장하세요</li>
                  <li>저장된 CSV 파일을 업로드하면 자동으로 점수가 계산됩니다</li>
                  <li>BS Basic 과정은 활동일지 점수를 0으로, Advanced 과정은 실제 점수를 입력하세요</li>
                </ul>
              </div>
            </div>
          )}

          {/* 내보내기 탭 */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">점수 데이터 내보내기</h4>
                <p className="text-gray-600 mb-4">
                  현재 시스템의 점수 데이터를 Excel 호환 CSV 파일로 내보냅니다.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <DocumentArrowDownIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h5 className="text-lg font-medium text-green-900 mb-2">전체 점수 데이터 내보내기</h5>
                <p className="text-green-700 mb-4">
                  모든 교육생의 점수 데이터를 Excel에서 열 수 있는 CSV 파일로 저장합니다.
                </p>
                <button
                  onClick={handleExport}
                  className="btn-success px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  <span>CSV 파일 다운로드</span>
                </button>
              </div>

              {/* 내보내기 안내 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                  <InformationCircleIcon className="h-5 w-5 mr-2" />
                  포함되는 데이터
                </h5>
                <ul className="text-sm text-gray-600 space-y-1 list-disc ml-5">
                  <li>차수, 과정 ID, 과정명, 교육생 정보</li>
                  <li>이론/실기/BS활동/태도 점수</li>
                  <li>종합점수, T Score, P Score</li>
                  <li>합격/불합격 여부 및 비고사항</li>
                  <li>최종 업데이트 날짜</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreDataManager;