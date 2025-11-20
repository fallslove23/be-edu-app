import React, { useState, useRef } from 'react';
import {
  DocumentTextIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  Cog6ToothIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ReportSection {
  id: string;
  type: 'overview' | 'chart' | 'table' | 'text' | 'image';
  title: string;
  data?: any;
  content?: string;
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  enabled: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  category: 'student' | 'course' | 'exam' | 'performance' | 'custom';
}

interface ReportFilters {
  dateRange: {
    start: string;
    end: string;
  };
  categories: string[];
  departments: string[];
  users: string[];
}

const ReportGenerator: React.FC = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [customSections, setCustomSections] = useState<ReportSection[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    categories: [],
    departments: [],
    users: []
  });
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'student-performance',
      name: '학생 성과 리포트',
      description: '개별 학생의 학습 성과와 진도를 분석합니다',
      category: 'student',
      sections: [
        {
          id: 's1',
          type: 'overview',
          title: '학습 현황 개요',
          enabled: true
        },
        {
          id: 's2',
          type: 'chart',
          title: '성적 추이',
          chartType: 'line',
          enabled: true
        },
        {
          id: 's3',
          type: 'chart',
          title: '과목별 성과',
          chartType: 'bar',
          enabled: true
        },
        {
          id: 's4',
          type: 'table',
          title: '시험 결과 상세',
          enabled: true
        }
      ]
    },
    {
      id: 'course-analysis',
      name: '과정 분석 리포트',
      description: '과정별 참여도와 성과를 분석합니다',
      category: 'course',
      sections: [
        {
          id: 'c1',
          type: 'overview',
          title: '과정 개요',
          enabled: true
        },
        {
          id: 'c2',
          type: 'chart',
          title: '참여율 분석',
          chartType: 'pie',
          enabled: true
        },
        {
          id: 'c3',
          type: 'chart',
          title: '진도율 현황',
          chartType: 'bar',
          enabled: true
        },
        {
          id: 'c4',
          type: 'table',
          title: '학생별 성과',
          enabled: true
        }
      ]
    },
    {
      id: 'exam-summary',
      name: '시험 결과 요약',
      description: '시험 결과와 통계를 종합적으로 분석합니다',
      category: 'exam',
      sections: [
        {
          id: 'e1',
          type: 'overview',
          title: '시험 개요',
          enabled: true
        },
        {
          id: 'e2',
          type: 'chart',
          title: '점수 분포',
          chartType: 'bar',
          enabled: true
        },
        {
          id: 'e3',
          type: 'chart',
          title: '문제별 정답률',
          chartType: 'line',
          enabled: true
        },
        {
          id: 'e4',
          type: 'table',
          title: '상세 결과',
          enabled: true
        }
      ]
    }
  ];

  const generateSampleData = (type: string) => {
    switch (type) {
      case 'bar':
        return Array.from({ length: 6 }, (_, i) => ({
          name: `과목${i + 1}`,
          value: Math.floor(Math.random() * 40) + 60
        }));
      
      case 'line':
        return Array.from({ length: 12 }, (_, i) => ({
          name: `${i + 1}월`,
          value: Math.floor(Math.random() * 20) + 75
        }));
      
      case 'pie':
        return [
          { name: '완료', value: 65 },
          { name: '진행중', value: 25 },
          { name: '미시작', value: 10 }
        ];
      
      default:
        return [];
    }
  };

  const addCustomSection = () => {
    const newSection: ReportSection = {
      id: `custom-${Date.now()}`,
      type: 'text',
      title: '새 섹션',
      content: '',
      enabled: true
    };
    setCustomSections([...customSections, newSection]);
  };

  const updateCustomSection = (id: string, updates: Partial<ReportSection>) => {
    setCustomSections(prev => 
      prev.map(section => 
        section.id === id ? { ...section, ...updates } : section
      )
    );
  };

  const removeCustomSection = (id: string) => {
    setCustomSections(prev => prev.filter(section => section.id !== id));
  };

  const toggleSectionEnabled = (sectionId: string, isTemplate: boolean = true) => {
    if (isTemplate && selectedTemplate) {
      const updatedTemplate = {
        ...selectedTemplate,
        sections: selectedTemplate.sections.map(section =>
          section.id === sectionId
            ? { ...section, enabled: !section.enabled }
            : section
        )
      };
      setSelectedTemplate(updatedTemplate);
    } else {
      updateCustomSection(sectionId, { enabled: !customSections.find(s => s.id === sectionId)?.enabled });
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    
    // 실제로는 API 호출하여 데이터 생성
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setGenerating(false);
    setPreview(true);
  };

  const downloadReport = (format: 'pdf' | 'xlsx' | 'docx') => {
    // 실제로는 해당 형식으로 다운로드 처리
    console.log(`Downloading report as ${format}`);
  };

  const printReport = () => {
    window.print();
  };

  const renderChart = (section: ReportSection) => {
    const data = generateSampleData(section.chartType || 'bar');

    switch (section.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b'][index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div>지원되지 않는 차트 타입</div>;
    }
  };

  const renderSection = (section: ReportSection) => {
    if (!section.enabled) return null;

    return (
      <div key={section.id} className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{section.title}</h3>
        
        {section.type === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">85%</div>
              <div className="text-sm text-gray-600">평균 성취도</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">42</div>
              <div className="text-sm text-gray-600">완료한 학습자</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">8</div>
              <div className="text-sm text-gray-600">진행 중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">95%</div>
              <div className="text-sm text-gray-600">출석률</div>
            </div>
          </div>
        )}

        {section.type === 'chart' && renderChart(section)}

        {section.type === 'table' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">점수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등급</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      학생{i + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.floor(Math.random() * 20) + 80}점
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {['A', 'B', 'C'][Math.floor(Math.random() * 3)]}등급
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-lg bg-green-500/10 text-green-700">
                        완료
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section.type === 'text' && (
          <div>
            <textarea
              value={section.content || ''}
              onChange={(e) => updateCustomSection(section.id, { content: e.target.value })}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-vertical"
              placeholder="내용을 입력하세요..."
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">커스텀 리포트 생성기</h1>
        <p className="text-gray-600">원하는 데이터와 차트를 조합하여 맞춤형 리포트를 생성하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 설정 패널 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 템플릿 선택 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">리포트 템플릿</h3>
            <div className="space-y-3">
              {reportTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 rounded-full border cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{template.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 필터 설정 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">데이터 필터</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="border border-gray-300 rounded-full px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="border border-gray-300 rounded-full px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">부서</label>
                <select
                  multiple
                  className="w-full border border-gray-300 rounded-full px-3 py-2 text-sm"
                >
                  <option value="sales">영업팀</option>
                  <option value="marketing">마케팅팀</option>
                  <option value="hr">인사팀</option>
                </select>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              onClick={generateReport}
              disabled={!selectedTemplate || generating}
              className="btn-primary w-full py-2 px-4 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {generating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-lg h-4 w-4 border-b-2 border-white mr-2"></div>
                  생성 중...
                </div>
              ) : (
                '리포트 생성'
              )}
            </button>

            {preview && (
              <div className="space-y-2">
                <button
                  onClick={() => downloadReport('pdf')}
                  className="btn-success w-full py-2 px-4 rounded-full font-medium flex items-center justify-center"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  PDF 다운로드
                </button>
                
                <button
                  onClick={printReport}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-full font-medium flex items-center justify-center"
                >
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  인쇄
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 리포트 미리보기/편집 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* 미리보기 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedTemplate ? `${selectedTemplate.name} 미리보기` : '템플릿을 선택하세요'}
              </h3>
              
              {selectedTemplate && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={addCustomSection}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="섹션 추가"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="text-gray-600 hover:text-gray-700 p-1"
                    title="설정"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* 미리보기 내용 */}
            <div ref={printRef} className="p-6">
              {selectedTemplate ? (
                <div>
                  {/* 리포트 헤더 */}
                  <div className="text-center mb-8 pb-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedTemplate.name}
                    </h1>
                    <p className="text-gray-600">
                      생성일: {new Date().toLocaleDateString('ko-KR')} | 
                      기간: {filters.dateRange.start} ~ {filters.dateRange.end}
                    </p>
                  </div>

                  {/* 섹션 목록 */}
                  <div className="space-y-4 mb-6">
                    <h4 className="font-medium text-gray-900">포함된 섹션</h4>
                    {selectedTemplate.sections.map((section) => (
                      <div key={section.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{section.title}</span>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={section.enabled}
                            onChange={() => toggleSectionEnabled(section.id)}
                            className="rounded border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-600">포함</span>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* 템플릿 섹션 렌더링 */}
                  {selectedTemplate.sections.map(renderSection)}

                  {/* 커스텀 섹션 렌더링 */}
                  {customSections.map((section) => (
                    <div key={section.id} className="relative">
                      {renderSection(section)}
                      <button
                        onClick={() => removeCustomSection(section.id)}
                        className="absolute top-2 right-2 text-destructive hover:text-destructive"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">리포트 템플릿을 선택하세요</h3>
                  <p className="text-gray-600">왼쪽 패널에서 원하는 리포트 템플릿을 선택하여 시작하세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;