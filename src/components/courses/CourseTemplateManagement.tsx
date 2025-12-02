import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  BuildingOfficeIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import CourseWizard from './CourseWizard';
import EducationTargetManager from './EducationTargetManager';
import OfflineCourseWizard from './OfflineCourseWizard';
import { PageContainer } from '../common/PageContainer';

// 과정 템플릿 (정책에 따른 고정 과정)
interface CourseTemplate {
  id: string;
  name: string;
  code: string; // BS-BASIC, BS-ADVANCED 등
  category: 'mandatory' | 'optional' | 'leadership';
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  department: 'sales' | 'marketing' | 'management' | 'technical' | 'all';
  description: string;
  objectives: string[];
  totalSessions: number;
  sessionDuration: number; // 분
  maxStudents: number;
  targetAudience: string[]; // ['신입사원', '영업팀', '팀장급']
  prerequisites?: string[];
  isActive: boolean;
  lastUpdated: string;
  policyVersion: string; // 2025v1.0
}

// 차수 운영 계획
interface SessionPlan {
  id: string;
  templateId: string;
  sessionNumber: number; // 1차, 2차, 3차...
  year: number;
  quarter: number;
  plannedStartDate: string;
  plannedEndDate: string;
  targetStudentCount: number;
  status: 'planned' | 'recruiting' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  instructorId?: string;
  managerId?: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

const CourseTemplateManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = ['admin', 'manager'].includes(user?.role || '');

  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [sessionPlans, setSessionPlans] = useState<SessionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<CourseTemplate | null>(null);
  const [currentView, setCurrentView] = useState<'templates' | 'sessions' | 'create-session'>('templates');
  const [showWizard, setShowWizard] = useState(false);
  const [showTargetManager, setShowTargetManager] = useState(false);
  const [showOfflineWizard, setShowOfflineWizard] = useState(false);
  const [courseSeries, setCourseSeries] = useState<any[]>([]);
  const [existingCourses, setExistingCourses] = useState<any[]>([]);

  // 샘플 데이터 생성
  useEffect(() => {
    const generateSampleData = () => {
      const sampleTemplates: CourseTemplate[] = [
        {
          id: 'template-1',
          name: 'BS 신입사원 기초 영업교육',
          code: 'BS-BASIC-SALES',
          category: 'mandatory',
          level: 'basic',
          department: 'sales',
          description: '신입 영업사원을 위한 기본 영업 스킬 및 고객 응대 교육과정입니다.',
          objectives: [
            '기본 영업 프로세스 이해',
            '고객 응대 스킬 습득',
            '제품 지식 학습',
            '영업 도구 활용법 숙지'
          ],
          totalSessions: 20,
          sessionDuration: 180,
          maxStudents: 30,
          targetAudience: ['신입사원', '영업팀 신규입사자'],
          prerequisites: ['입사 오리엔테이션 완료'],
          isActive: true,
          lastUpdated: '2025-01-01',
          policyVersion: '2025v1.0'
        },
        {
          id: 'template-2',
          name: 'BS 고급 영업 전략과정',
          code: 'BS-ADVANCED-SALES',
          category: 'mandatory',
          level: 'advanced',
          department: 'sales',
          description: '경력 영업사원을 위한 고급 영업 전략 및 협상 기법 교육과정입니다.',
          objectives: [
            '고급 영업 전략 수립',
            '협상 기법 마스터',
            '대형 고객 관리',
            '팀 리더십 스킬'
          ],
          totalSessions: 16,
          sessionDuration: 240,
          maxStudents: 20,
          targetAudience: ['경력 3년 이상 영업사원', '팀장급'],
          prerequisites: ['BS 기초 영업교육 수료'],
          isActive: true,
          lastUpdated: '2025-01-01',
          policyVersion: '2025v1.0'
        },
        {
          id: 'template-3',
          name: 'BS 리더십 개발과정',
          code: 'BS-LEADERSHIP',
          category: 'mandatory',
          level: 'intermediate',
          department: 'management',
          description: '팀장급 이상을 위한 리더십 역량 개발 및 팀 관리 교육과정입니다.',
          objectives: [
            '리더십 스타일 개발',
            '팀 관리 스킬',
            '의사결정 능력 향상',
            '조직 내 소통 강화'
          ],
          totalSessions: 12,
          sessionDuration: 300,
          maxStudents: 15,
          targetAudience: ['팀장급', '부서장급', '승진 예정자'],
          isActive: true,
          lastUpdated: '2025-01-01',
          policyVersion: '2025v1.0'
        }
      ];

      const sampleSessionPlans: SessionPlan[] = [
        {
          id: 'session-1',
          templateId: 'template-1',
          sessionNumber: 1,
          year: 2025,
          quarter: 1,
          plannedStartDate: '2025-02-01',
          plannedEndDate: '2025-02-28',
          targetStudentCount: 25,
          status: 'recruiting',
          createdAt: '2025-01-15'
        },
        {
          id: 'session-2',
          templateId: 'template-1',
          sessionNumber: 2,
          year: 2025,
          quarter: 2,
          plannedStartDate: '2025-05-01',
          plannedEndDate: '2025-05-31',
          targetStudentCount: 30,
          status: 'planned',
          createdAt: '2025-01-15'
        },
        {
          id: 'session-3',
          templateId: 'template-2',
          sessionNumber: 1,
          year: 2025,
          quarter: 1,
          plannedStartDate: '2025-03-01',
          plannedEndDate: '2025-03-31',
          targetStudentCount: 18,
          status: 'recruiting',
          createdAt: '2025-01-15'
        }
      ];

      // 샘플 과정 시리즈 데이터
      const sampleCourseSeries = [
        {
          id: 'series-1',
          name: 'Business Skills',
          code: 'BS',
          description: '영업직군 대상 비즈니스 스킬 교육',
          targetDepartments: ['dept-1', 'dept-2', 'dept-3'],
          levels: [
            {
              id: 'level-1',
              name: 'Basic',
              code: 'BASIC',
              description: '신입/기초 과정',
              order: 1,
              defaultSessions: 20,
              defaultDuration: 180,
              defaultMaxStudents: 30,
              defaultObjectives: [
                '기본 영업 프로세스 이해',
                '고객 응대 스킬 습득',
                '제품 지식 학습',
                '영업 도구 활용법 숙지'
              ],
              defaultPrerequisites: ['신입사원 오리엔테이션 완료'],
              scheduleType: 'regular'
            },
            {
              id: 'level-2',
              name: 'Advanced',
              code: 'ADVANCED',
              description: '고급/심화 과정',
              order: 2,
              defaultSessions: 16,
              defaultDuration: 240,
              defaultMaxStudents: 20,
              defaultObjectives: [
                '고급 영업 전략 수립',
                '협상 기법 마스터',
                '대형 고객 관리',
                '팀 리더십 스킬'
              ],
              defaultPrerequisites: ['BS Basic 과정 수료'],
              scheduleType: 'regular'
            },
            {
              id: 'level-3',
              name: 'Intensive',
              code: 'INTENSIVE',
              description: '집체교육 (2년 주기)',
              order: 3,
              defaultSessions: 40,
              defaultDuration: 480,
              defaultMaxStudents: 50,
              defaultObjectives: [
                '전사 영업 역량 강화',
                '조직 문화 통합',
                '리더십 및 협업 스킬',
                '최신 영업 트렌드 학습'
              ],
              defaultPrerequisites: ['재직 중인 전 영업사원'],
              scheduleType: 'biennial'
            }
          ],
          isActive: true
        },
        {
          id: 'series-2',
          name: 'Support Skills',
          code: 'SS',
          description: '기술지원직군 대상 전문 스킬 교육',
          targetDepartments: ['dept-4', 'dept-5'],
          levels: [
            {
              id: 'level-4',
              name: 'Basic',
              code: 'BASIC',
              description: '기술지원 기초 과정',
              order: 1,
              defaultSessions: 24,
              defaultDuration: 180,
              defaultMaxStudents: 25,
              defaultObjectives: [
                '기술지원 기본 프로세스 이해',
                '고객 기술 문의 응대',
                '제품 기술 지식 습득',
                '문제 해결 방법론 학습'
              ],
              defaultPrerequisites: ['기술지원팀 신규 입사자'],
              scheduleType: 'regular'
            },
            {
              id: 'level-5',
              name: 'Advanced',
              code: 'ADVANCED',
              description: '고급 기술지원 과정',
              order: 2,
              defaultSessions: 20,
              defaultDuration: 240,
              defaultMaxStudents: 20,
              defaultObjectives: [
                '고급 기술지원 스킬',
                '복잡한 기술 문제 해결',
                '고객사 기술 컨설팅',
                '기술 문서 작성 및 관리'
              ],
              defaultPrerequisites: ['SS Basic 과정 수료'],
              scheduleType: 'regular'
            },
            {
              id: 'level-6',
              name: 'Final',
              code: 'FINAL',
              description: '전문가 수준 과정',
              order: 3,
              defaultSessions: 16,
              defaultDuration: 300,
              defaultMaxStudents: 15,
              defaultObjectives: [
                '전문가 수준 기술지원',
                '기술 팀 리더십',
                '신기술 도입 및 평가',
                '기술지원 프로세스 개선'
              ],
              defaultPrerequisites: ['SS Advanced 과정 수료', '경력 3년 이상'],
              scheduleType: 'regular'
            }
          ],
          isActive: true
        }
      ];

      setTemplates(sampleTemplates);
      setSessionPlans(sampleSessionPlans);
      setCourseSeries(sampleCourseSeries);
      setLoading(false);
    };

    setTimeout(generateSampleData, 500);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory && template.isActive;
  });

  const getTemplateSessionPlans = (templateId: string) => {
    return sessionPlans.filter(plan => plan.templateId === templateId);
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'mandatory': '필수',
      'optional': '선택',
      'leadership': '리더십'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getLevelLabel = (level: string) => {
    const labels = {
      'basic': '기초',
      'intermediate': '중급',
      'advanced': '고급',
      'expert': '전문가'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getDepartmentLabel = (department: string) => {
    const labels = {
      'sales': '영업',
      'marketing': '마케팅',
      'management': '관리',
      'technical': '기술',
      'all': '전사'
    };
    return labels[department as keyof typeof labels] || department;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-gray-100 text-gray-700';
      case 'recruiting': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-green-500/10 text-green-700';
      case 'ongoing': return 'bg-yellow-100 text-orange-700';
      case 'completed': return 'bg-purple-100 text-purple-700';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'planned': '계획됨',
      'recruiting': '교육생 모집중',
      'confirmed': '확정',
      'ongoing': '진행중',
      'completed': '완료',
      'cancelled': '취소'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  // 오프라인 과정 생성 핸들러
  const handleOfflineCourseSave = async (courseData: any) => {
    try {
      // 실제 과정 데이터 저장 로직
      console.log('새 오프라인 집체교육 과정 생성:', courseData);
      
      // 기존 과정 목록에 추가
      setExistingCourses(prev => [courseData, ...prev]);
      
      // 마법사 닫기
      setShowOfflineWizard(false);
      
      alert('새로운 오프라인 집체교육 과정이 성공적으로 개설되었습니다!');
    } catch (error) {
      console.error('과정 개설 실패:', error);
      throw error;
    }
  };

  // 마법사를 통한 과정 생성
  const handleWizardSave = async (courseData: any) => {
    try {
      // 새로운 과정 템플릿 생성
      const newTemplate: CourseTemplate = {
        id: `template-${Date.now()}`,
        name: courseData.name,
        code: courseData.code,
        category: courseData.series === 'BS' ? 'mandatory' : 'mandatory',
        level: courseData.level.toLowerCase() as 'basic' | 'intermediate' | 'advanced' | 'expert',
        department: courseData.series === 'BS' ? 'sales' : 'technical',
        description: courseData.description,
        objectives: courseData.objectives,
        totalSessions: courseData.totalSessions,
        sessionDuration: courseData.sessionDuration,
        maxStudents: courseData.maxStudents,
        targetAudience: courseData.series === 'BS' 
          ? ['영업팀', 'PS팀'] 
          : ['기술지원팀'],
        prerequisites: courseData.prerequisites,
        isActive: true,
        lastUpdated: new Date().toISOString().split('T')[0],
        policyVersion: '2025v1.0'
      };

      // 템플릿 목록에 추가
      setTemplates(prev => [newTemplate, ...prev]);
      
      // 마법사 닫기
      setShowWizard(false);
      
      alert('새로운 교육과정이 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('과정 생성 실패:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">과정 템플릿을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <PageContainer>
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
              <AcademicCapIcon className="h-7 w-7 text-blue-600" />
              <span>교육 과정 운영 관리</span>
            </h1>
            <p className="text-gray-600">
              교육과정 템플릿을 관리하고 차수별 교육 계획을 수립하세요.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {isManager && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTargetManager(true)}
                  className="btn-primary px-4 py-2 rounded-full flex items-center space-x-2"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  <span>교육과정 체계 관리</span>
                </button>
                <button
                  onClick={() => setShowOfflineWizard(true)}
                  className="btn-success px-4 py-2 rounded-full flex items-center space-x-2"
                >
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>새 과정 개설</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="과정명, 과정코드로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 sm:w-64 border-2 border-gray-200 rounded-lg px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="all">모든 카테고리</option>
            <option value="mandatory">필수</option>
            <option value="optional">선택</option>
            <option value="leadership">리더십</option>
          </select>
        </div>
      </div>

      {/* 템플릿 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            교육과정 템플릿 ({filteredTemplates.length})
          </h3>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="p-12 text-center">
            <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">템플릿이 없습니다</h3>
            <p className="text-gray-600">
              {searchQuery || categoryFilter !== 'all'
                ? '검색 조건에 맞는 템플릿이 없습니다.'
                : '등록된 교육과정 템플릿이 없습니다.'
              }
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTemplates.map((template) => {
                const sessionPlans = getTemplateSessionPlans(template.id);
                const activeSession = sessionPlans.find(p => ['recruiting', 'confirmed', 'ongoing'].includes(p.status));
                
                return (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    {/* 헤더 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-blue-600">{template.code}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-700`}>
                            {getCategoryLabel(template.category)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getDepartmentLabel(template.department)} · {getLevelLabel(template.level)}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                      </div>
                    </div>

                    {/* 상세 정보 */}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex justify-between">
                        <span>교육 구성:</span>
                        <span className="font-medium">{template.totalSessions}회차 × {formatDuration(template.sessionDuration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>정원:</span>
                        <span className="font-medium">{template.maxStudents}명</span>
                      </div>
                      <div className="flex justify-between">
                        <span>대상:</span>
                        <span className="font-medium">{template.targetAudience.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>연간 계획:</span>
                        <span className="font-medium">{sessionPlans.length}차수</span>
                      </div>
                    </div>

                    {/* 현재 상태 */}
                    {activeSession && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-blue-900">
                              {activeSession.year}년 {activeSession.sessionNumber}차 진행중
                            </div>
                            <div className="text-xs text-blue-700">
                              {activeSession.plannedStartDate} ~ {activeSession.plannedEndDate}
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activeSession.status)}`}>
                            {getStatusLabel(activeSession.status)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedTemplate(template)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="상세보기"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        {isAdmin && (
                          <button
                            onClick={() => setShowTargetManager(true)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="조직/과정 체계 관리"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        정책 {template.policyVersion}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>


      {/* 템플릿 상세 모달 */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600">{selectedTemplate.code}</p>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ExclamationTriangleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 기본 정보 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">기본 정보</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">분류:</span>
                      <span className="ml-2 font-medium">{getCategoryLabel(selectedTemplate.category)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">난이도:</span>
                      <span className="ml-2 font-medium">{getLevelLabel(selectedTemplate.level)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">대상 부서:</span>
                      <span className="ml-2 font-medium">{getDepartmentLabel(selectedTemplate.department)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">정원:</span>
                      <span className="ml-2 font-medium">{selectedTemplate.maxStudents}명</span>
                    </div>
                    <div>
                      <span className="text-gray-600">총 회차:</span>
                      <span className="ml-2 font-medium">{selectedTemplate.totalSessions}회</span>
                    </div>
                    <div>
                      <span className="text-gray-600">회차당 시간:</span>
                      <span className="ml-2 font-medium">{formatDuration(selectedTemplate.sessionDuration)}</span>
                    </div>
                  </div>
                </div>

                {/* 설명 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">과정 설명</h4>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </div>

                {/* 학습 목표 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">학습 목표</h4>
                  <ul className="space-y-1">
                    {selectedTemplate.objectives.map((objective, index) => (
                      <li key={index} className="text-sm text-gray-600">• {objective}</li>
                    ))}
                  </ul>
                </div>

                {/* 대상자 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">교육 대상</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.targetAudience.map((audience, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                      >
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 수강 요건 */}
                {selectedTemplate.prerequisites && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">수강 요건</h4>
                    <ul className="space-y-1">
                      {selectedTemplate.prerequisites.map((prerequisite, index) => (
                        <li key={index} className="text-sm text-gray-600">• {prerequisite}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 교육과정 체계 관리 모달 */}
      {showTargetManager && (
        <EducationTargetManager
          onClose={() => setShowTargetManager(false)}
        />
      )}

      {/* 과정 생성 마법사 */}
      {showWizard && (
        <CourseWizard
          onSave={handleWizardSave}
          onCancel={() => setShowWizard(false)}
          availableSeries={courseSeries}
          existingCourses={templates}
        />
      )}

      {/* 오프라인 집체교육 과정 개설 마법사 */}
      {showOfflineWizard && (
        <OfflineCourseWizard
          onSave={handleOfflineCourseSave}
          onCancel={() => setShowOfflineWizard(false)}
          availableSeries={courseSeries}
          existingCourses={existingCourses}
        />
      )}
    </PageContainer>
  );
};

export default CourseTemplateManagement;