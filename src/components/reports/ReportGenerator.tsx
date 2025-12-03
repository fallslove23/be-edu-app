import React, { useState, useRef } from 'react';
import {
  FileText,
  BarChart2,
  CalendarDays,
  Users,
  GraduationCap,
  ClipboardCheck,
  Download,
  Printer,
  Settings,
  Plus,
  X
} from 'lucide-react';
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
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
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
      <div key={section.id} className="mb-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{section.title}</h3>

        {section.type === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">85%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">평균 성취도</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">42</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">완료한 학습자</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">8</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">진행 중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">95%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">출석률</div>
            </div>
          </div>
        )}

        {section.type === 'chart' && renderChart(section)}

        {section.type === 'table' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">점수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">등급</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      학생{i + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {Math.floor(Math.random() * 20) + 80}점
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {['A', 'B', 'C'][Math.floor(Math.random() * 3)]}등급
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-lg bg-green-500/10 text-green-700 dark:text-green-400">
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
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-vertical bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="내용을 입력하세요..."
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F2F4F6] dark:bg-gray-900 p-4 sm:p-6 pb-24 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl mr-4">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            커스텀 리포트 생성기
          </h1>
          <p className="text-gray-600 dark:text-gray-400">원하는 데이터와 차트를 조합하여 맞춤형 리포트를 생성하세요.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 설정 패널 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 템플릿 선택 */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">리포트 템플릿</h3>
              <div className="space-y-3">
                {reportTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="font-bold text-gray-900 dark:text-white">{template.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 필터 설정 */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">데이터 필터</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">기간</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">부서</label>
                  <select
                    multiple
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="sales">영업팀</option>
                    <option value="marketing">마케팅팀</option>
                    <option value="hr">인사팀</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <button
                onClick={generateReport}
                disabled={!selectedTemplate || generating}
                className="w-full btn-primary py-3 px-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed mb-3 transition-colors"
              >
                {generating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center transition-colors shadow-lg shadow-green-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF 다운로드
                  </button>

                  <button
                    onClick={printReport}
                    className="w-full bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center transition-colors"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    인쇄
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 리포트 미리보기/편집 */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* 미리보기 헤더 */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/30">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedTemplate ? `${selectedTemplate.name} 미리보기` : '템플릿을 선택하세요'}
                </h3>

                {selectedTemplate && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={addCustomSection}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                      title="섹션 추가"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    <button
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      title="설정"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 미리보기 내용 */}
              <div ref={printRef} className="p-8 min-h-[600px]">
                {selectedTemplate ? (
                  <div>
                    {/* 리포트 헤더 */}
                    <div className="text-center mb-10 pb-8 border-b border-gray-100 dark:border-gray-700">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        {selectedTemplate.name}
                      </h1>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        생성일: {new Date().toLocaleDateString('ko-KR')} |
                        기간: {filters.dateRange.start} ~ {filters.dateRange.end}
                      </p>
                    </div>

                    {/* 섹션 목록 */}
                    <div className="space-y-4 mb-8 bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-6">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">포함된 섹션</h4>
                      {selectedTemplate.sections.map((section) => (
                        <div key={section.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{section.title}</span>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={section.enabled}
                              onChange={() => toggleSectionEnabled(section.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-medium">포함</span>
                          </label>
                        </div>
                      ))}
                    </div>

                    {/* 템플릿 섹션 렌더링 */}
                    {selectedTemplate.sections.map(renderSection)}

                    {/* 커스텀 섹션 렌더링 */}
                    {customSections.map((section) => (
                      <div key={section.id} className="relative group">
                        {renderSection(section)}
                        <button
                          onClick={() => removeCustomSection(section.id)}
                          className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm border border-gray-100 dark:border-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                    <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
                      <FileText className="h-10 w-10 text-gray-300 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">리포트 템플릿을 선택하세요</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">왼쪽 패널에서 원하는 리포트 템플릿을 선택하여 시작하세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;