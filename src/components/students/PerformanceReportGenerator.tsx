import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ChartBarIcon,
  PrinterIcon,
  ShareIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  TrophyIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import type { StudentScore, StudentStatistics } from '../../types/student.types';
import { useNotifications, createReportGeneratedNotification } from '../../hooks/useNotifications';

interface PerformanceReportGeneratorProps {
  onClose: () => void;
}

interface ReportConfig {
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts: boolean;
  includeIndividualScores: boolean;
  includeStatistics: boolean;
  includeCounselingData: boolean;
  groupBy: 'course' | 'session' | 'department' | 'overall';
  format: 'pdf' | 'excel' | 'html';
}

interface ReportSection {
  id: string;
  title: string;
  enabled: boolean;
  description: string;
}

const PerformanceReportGenerator: React.FC<PerformanceReportGeneratorProps> = ({ onClose }) => {
  const { addNotification } = useNotifications();
  const [config, setConfig] = useState<ReportConfig>({
    title: `BS 교육 성과 리포트 - ${new Date().toLocaleDateString('ko-KR')}`,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    includeCharts: true,
    includeIndividualScores: true,
    includeStatistics: true,
    includeCounselingData: false,
    groupBy: 'course',
    format: 'pdf'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');

  const reportSections: ReportSection[] = [
    {
      id: 'overview',
      title: '전체 개요',
      enabled: true,
      description: '교육 과정별 참여 인원, 완료율, 평균 점수 등 전반적인 현황'
    },
    {
      id: 'performance',
      title: '성과 분석',
      enabled: config.includeStatistics,
      description: '점수 분포, 향상도, 목표 달성률 등 성과 지표'
    },
    {
      id: 'charts',
      title: '시각화 차트',
      enabled: config.includeCharts,
      description: '성과 트렌드, 분포도, 비교 차트 등'
    },
    {
      id: 'individual',
      title: '개별 점수',
      enabled: config.includeIndividualScores,
      description: '교육생별 상세 점수 및 평가 내역'
    },
    {
      id: 'counseling',
      title: '상담 현황',
      enabled: config.includeCounselingData,
      description: '상담 기록, 만족도, 개선 계획 등'
    },
    {
      id: 'recommendations',
      title: '개선 권고',
      enabled: true,
      description: '데이터 기반 개선 제안 및 액션 아이템'
    }
  ];

  useEffect(() => {
    // 미리보기 데이터 생성
    const generatePreviewData = () => {
      const sampleData = {
        overview: {
          totalStudents: 145,
          activeStudents: 112,
          completionRate: 87.5,
          averageScore: 84.2,
          courses: [
            { name: 'BS 기초과정 1차', students: 48, avgScore: 83.5, completionRate: 93.8 },
            { name: 'BS 고급과정 2차', students: 35, avgScore: 86.1, completionRate: 94.3 },
            { name: 'BS 기초과정 3차', students: 28, avgScore: 82.7, completionRate: 85.7 }
          ]
        },
        performance: {
          scoreDistribution: {
            'A (90-100)': 28,
            'B (80-89)': 52,
            'C (70-79)': 31,
            'D (60-69)': 6,
            'F (<60)': 3
          },
          trends: [
            { month: '2024-11', avgScore: 81.2 },
            { month: '2024-12', avgScore: 82.8 },
            { month: '2025-01', avgScore: 84.2 }
          ]
        },
        recommendations: [
          '실습 비중을 늘려 실무 적용 능력 향상 필요',
          'BS Advanced 과정 활동일지 작성 지도 강화',
          '개별 맞춤형 상담을 통한 학습 동기 부여'
        ]
      };
      setPreviewData(sampleData);
    };

    generatePreviewData();
  }, [config]);

  const handleConfigChange = (key: keyof ReportConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // 실제 리포트 생성 로직
      await new Promise(resolve => setTimeout(resolve, 3000)); // 시뮬레이션
      
      // 리포트 다운로드
      const reportContent = generateReportContent();
      
      if (config.format === 'html') {
        downloadHtmlReport(reportContent);
      } else if (config.format === 'excel') {
        downloadExcelReport(reportContent);
      } else {
        downloadPdfReport(reportContent);
      }

      // 성공 알림 추가
      addNotification(createReportGeneratedNotification(config.title));
      
    } catch (error) {
      alert('리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportContent = () => {
    const sections = reportSections.filter(section => section.enabled);
    
    return {
      title: config.title,
      dateRange: config.dateRange,
      generatedAt: new Date().toISOString(),
      sections: sections.map(section => ({
        id: section.id,
        title: section.title,
        content: generateSectionContent(section.id)
      }))
    };
  };

  const generateSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'overview':
        return previewData?.overview || {};
      case 'performance':
        return previewData?.performance || {};
      case 'recommendations':
        return previewData?.recommendations || [];
      default:
        return {};
    }
  };

  const downloadHtmlReport = (content: any) => {
    const html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.title}</title>
        <style>
          body { font-family: 'Malgun Gothic', sans-serif; margin: 40px; line-height: 1.6; }
          .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .title { color: #1f2937; font-size: 28px; font-weight: bold; }
          .subtitle { color: #6b7280; font-size: 14px; margin-top: 10px; }
          .section { margin: 30px 0; }
          .section-title { color: #1f2937; font-size: 20px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #2563eb; padding-left: 15px; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
          .stat-card { background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
          .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .table th { background: #f9fafb; font-weight: bold; color: #374151; }
          .recommendations { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; }
          .recommendation-item { margin: 10px 0; padding-left: 20px; position: relative; }
          .recommendation-item::before { content: "•"; color: #f59e0b; position: absolute; left: 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${content.title}</div>
          <div class="subtitle">
            기간: ${content.dateRange.start} ~ ${content.dateRange.end} | 
            생성일: ${new Date(content.generatedAt).toLocaleDateString('ko-KR')}
          </div>
        </div>

        ${content.sections.map((section: any) => `
          <div class="section">
            <div class="section-title">${section.title}</div>
            ${generateHtmlSectionContent(section)}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${config.title.replace(/\s+/g, '_')}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateHtmlSectionContent = (section: any) => {
    switch (section.id) {
      case 'overview':
        return `
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${section.content.totalStudents}</div>
              <div class="stat-label">전체 교육생</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${section.content.activeStudents}</div>
              <div class="stat-label">활성 교육생</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${section.content.completionRate}%</div>
              <div class="stat-label">수료율</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${section.content.averageScore}</div>
              <div class="stat-label">평균 점수</div>
            </div>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>과정명</th>
                <th>참여 인원</th>
                <th>평균 점수</th>
                <th>수료율</th>
              </tr>
            </thead>
            <tbody>
              ${section.content.courses?.map((course: any) => `
                <tr>
                  <td>${course.name}</td>
                  <td>${course.students}명</td>
                  <td>${course.avgScore}점</td>
                  <td>${course.completionRate}%</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
        `;
      case 'recommendations':
        return `
          <div class="recommendations">
            ${section.content.map((item: string) => `
              <div class="recommendation-item">${item}</div>
            `).join('')}
          </div>
        `;
      default:
        return '<p>데이터를 준비하는 중입니다...</p>';
    }
  };

  const downloadExcelReport = (content: any) => {
    // Excel 형식으로 변환 (CSV로 대체)
    const csvData = [
      ['BS 교육 성과 리포트'],
      ['생성일', new Date().toLocaleDateString('ko-KR')],
      ['기간', `${content.dateRange.start} ~ ${content.dateRange.end}`],
      [],
      ['전체 현황'],
      ['구분', '값'],
      ['전체 교육생', previewData?.overview?.totalStudents || 0],
      ['활성 교육생', previewData?.overview?.activeStudents || 0],
      ['평균 점수', previewData?.overview?.averageScore || 0],
      [],
      ['과정별 현황'],
      ['과정명', '참여인원', '평균점수', '수료율'],
      ...(previewData?.overview?.courses?.map((course: any) => [
        course.name, course.students, course.avgScore, `${course.completionRate}%`
      ]) || [])
    ];

    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${config.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPdfReport = (content: any) => {
    // PDF 생성은 복잡하므로 HTML 버전으로 대체하고 사용자가 인쇄하도록 안내
    downloadHtmlReport(content);
    alert('HTML 파일이 다운로드되었습니다. 브라우저에서 열어 PDF로 인쇄할 수 있습니다.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">📊 성과 리포트 생성기</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Cog6ToothIcon className="h-4 w-4 inline mr-2" />
              리포트 설정
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DocumentTextIcon className="h-4 w-4 inline mr-2" />
              미리보기
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* 설정 탭 */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* 기본 설정 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">기본 설정</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">리포트 제목</label>
                    <input
                      type="text"
                      value={config.title}
                      onChange={(e) => handleConfigChange('title', e.target.value)}
                      className="w-full border border-gray-300 rounded-full px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">출력 형식</label>
                    <select
                      value={config.format}
                      onChange={(e) => handleConfigChange('format', e.target.value)}
                      className="w-full border border-gray-300 rounded-full px-3 py-2"
                    >
                      <option value="html">HTML (웹)</option>
                      <option value="excel">Excel (CSV)</option>
                      <option value="pdf">PDF (HTML→인쇄)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시작 날짜</label>
                    <input
                      type="date"
                      value={config.dateRange.start}
                      onChange={(e) => handleConfigChange('dateRange', { ...config.dateRange, start: e.target.value })}
                      className="w-full border border-gray-300 rounded-full px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">종료 날짜</label>
                    <input
                      type="date"
                      value={config.dateRange.end}
                      onChange={(e) => handleConfigChange('dateRange', { ...config.dateRange, end: e.target.value })}
                      className="w-full border border-gray-300 rounded-full px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* 그룹화 설정 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">데이터 그룹화</h4>
                <select
                  value={config.groupBy}
                  onChange={(e) => handleConfigChange('groupBy', e.target.value)}
                  className="w-full border border-gray-300 rounded-full px-3 py-2"
                >
                  <option value="overall">전체 통합</option>
                  <option value="course">과정별</option>
                  <option value="session">차수별</option>
                  <option value="department">부서별</option>
                </select>
              </div>

              {/* 포함 섹션 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">포함할 섹션</h4>
                <div className="space-y-3">
                  {reportSections.map((section) => (
                    <div key={section.id} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={section.id}
                        checked={section.enabled}
                        onChange={(e) => {
                          const key = section.id === 'performance' ? 'includeStatistics' :
                                     section.id === 'charts' ? 'includeCharts' :
                                     section.id === 'individual' ? 'includeIndividualScores' :
                                     section.id === 'counseling' ? 'includeCounselingData' : null;
                          if (key) {
                            handleConfigChange(key, e.target.checked);
                          }
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor={section.id} className="text-sm font-medium text-gray-900">
                          {section.title}
                        </label>
                        <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 미리보기 탭 */}
          {activeTab === 'preview' && previewData && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">{config.title}</h4>
                <p className="text-blue-700 text-sm">
                  기간: {config.dateRange.start} ~ {config.dateRange.end}
                </p>
              </div>

              {/* 전체 개요 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h5 className="text-lg font-medium text-gray-900 mb-4">전체 개요</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{previewData.overview.totalStudents}</div>
                    <div className="text-sm text-gray-600">전체 교육생</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{previewData.overview.activeStudents}</div>
                    <div className="text-sm text-gray-600">활성 교육생</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{previewData.overview.completionRate}%</div>
                    <div className="text-sm text-gray-600">수료율</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{previewData.overview.averageScore}</div>
                    <div className="text-sm text-gray-600">평균 점수</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h6 className="font-medium text-gray-900 mb-3">과정별 현황</h6>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">과정명</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">참여인원</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">평균점수</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">수료율</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {previewData.overview.courses.map((course: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{course.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{course.students}명</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{course.avgScore}점</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{course.completionRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 개선 권고사항 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h5 className="text-lg font-medium text-gray-900 mb-4">개선 권고사항</h5>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  {previewData.recommendations.map((item: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2 mb-2 last:mb-0">
                      <span className="text-foreground font-bold">•</span>
                      <span className="text-yellow-800 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className={`px-6 py-2 rounded-full text-white flex items-center space-x-2 ${
              isGenerating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'btn-primary'
            }`}
          >
            {isGenerating ? (
              <>
                <ClockIcon className="h-4 w-4 animate-spin" />
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>리포트 생성</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceReportGenerator;