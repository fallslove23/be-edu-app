import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// 조직 구조 인터페이스
interface Department {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  type: 'division' | 'team' | 'group';
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 과정 시리즈 인터페이스
interface CourseSeries {
  id: string;
  name: string;
  code: string; // BS, SS 등
  description: string;
  targetDepartments: string[]; // department IDs
  levels: CourseLevel[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CourseLevel {
  id: string;
  name: string;
  code: string; // Basic, Advanced, Final, Intensive
  description: string;
  order: number;
  defaultSessions: number;
  defaultDuration: number; // 분
  defaultMaxStudents: number;
  defaultObjectives: string[];
  defaultPrerequisites: string[];
  scheduleType: 'regular' | 'biennial' | 'irregular';
}

interface OrganizationEditorProps {
  onClose: () => void;
}

const OrganizationEditor: React.FC<OrganizationEditorProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'departments' | 'courses'>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courseSeries, setCourseSeries] = useState<CourseSeries[]>([]);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingSeries, setEditingSeries] = useState<CourseSeries | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 샘플 데이터 로드
  useEffect(() => {
    const loadSampleData = () => {
      const sampleDepartments: Department[] = [
        {
          id: 'dept-1',
          name: '영업본부',
          code: 'SALES',
          type: 'division',
          description: '전사 영업 업무 총괄',
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
        },
        {
          id: 'dept-2',
          name: '영업팀',
          code: 'SALES_TEAM',
          parentId: 'dept-1',
          type: 'team',
          description: '직접 영업 담당',
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
        },
        {
          id: 'dept-3',
          name: 'PS팀',
          code: 'PS_TEAM',
          parentId: 'dept-1',
          type: 'team',
          description: '고객 지원 및 사후관리',
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
        },
        {
          id: 'dept-4',
          name: '기술지원본부',
          code: 'TECH_SUPPORT',
          type: 'division',
          description: '기술 지원 업무 총괄',
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
        },
        {
          id: 'dept-5',
          name: '기술지원팀',
          code: 'TECH_TEAM',
          parentId: 'dept-4',
          type: 'team',
          description: '고객 기술 지원',
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
        }
      ];

      const sampleCourseSeries: CourseSeries[] = [
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
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
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
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
        }
      ];

      setDepartments(sampleDepartments);
      setCourseSeries(sampleCourseSeries);
      setLoading(false);
    };

    setTimeout(loadSampleData, 500);
  }, []);

  // 부서 관련 함수들
  const handleAddDepartment = () => {
    const newDepartment: Department = {
      id: `dept-${Date.now()}`,
      name: '',
      code: '',
      type: 'team',
      description: '',
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setEditingDepartment(newDepartment);
  };

  const handleSaveDepartment = (department: Department) => {
    if (departments.find(d => d.id === department.id)) {
      // 수정
      setDepartments(prev => prev.map(d =>
        d.id === department.id
          ? { ...department, updatedAt: new Date().toISOString().split('T')[0] }
          : d
      ));
    } else {
      // 추가
      setDepartments(prev => [...prev, department]);
    }
    setEditingDepartment(null);
  };

  const handleDeleteDepartment = (departmentId: string) => {
    if (confirm('이 부서를 삭제하시겠습니까? 하위 부서가 있을 경우 함께 삭제됩니다.')) {
      const getChildDepartments = (parentId: string): string[] => {
        const children = departments.filter(d => d.parentId === parentId);
        let allChildren = children.map(c => c.id);
        children.forEach(child => {
          allChildren = [...allChildren, ...getChildDepartments(child.id)];
        });
        return allChildren;
      };

      const toDelete = [departmentId, ...getChildDepartments(departmentId)];
      setDepartments(prev => prev.filter(d => !toDelete.includes(d.id)));
    }
  };

  // 과정 시리즈 관련 함수들
  const handleAddCourseSeries = () => {
    const newSeries: CourseSeries = {
      id: `series-${Date.now()}`,
      name: '',
      code: '',
      description: '',
      targetDepartments: [],
      levels: [],
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setEditingSeries(newSeries);
  };

  const handleSaveCourseSeries = (series: CourseSeries) => {
    if (courseSeries.find(s => s.id === series.id)) {
      // 수정
      setCourseSeries(prev => prev.map(s =>
        s.id === series.id
          ? { ...series, updatedAt: new Date().toISOString().split('T')[0] }
          : s
      ));
    } else {
      // 추가
      setCourseSeries(prev => [...prev, series]);
    }
    setEditingSeries(null);
  };

  const handleDeleteCourseSeries = (seriesId: string) => {
    if (confirm('이 과정 시리즈를 삭제하시겠습니까?')) {
      setCourseSeries(prev => prev.filter(s => s.id !== seriesId));
    }
  };

  const toggleSeriesExpansion = (seriesId: string) => {
    setExpandedSeries(prev =>
      prev.includes(seriesId)
        ? prev.filter(id => id !== seriesId)
        : [...prev, seriesId]
    );
  };

  // 부서 트리 렌더링
  const renderDepartmentTree = (parentId?: string, level = 0) => {
    const children = departments.filter(d => d.parentId === parentId);

    return children.map(department => (
      <div key={department.id} style={{ marginLeft: `${level * 24}px` }}>
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg mb-2 bg-white">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${department.type === 'division' ? 'bg-blue-100' :
                department.type === 'team' ? 'bg-green-500/10' : 'bg-yellow-100'
              }`}>
              <BuildingOfficeIcon className={`h-4 w-4 ${department.type === 'division' ? 'text-blue-600' :
                  department.type === 'team' ? 'text-green-600' : 'text-orange-600'
                }`} />
            </div>
            <div>
              <div className="font-medium text-gray-900">{department.name}</div>
              <div className="text-sm text-gray-600">{department.code}</div>
              {department.description && (
                <div className="text-xs text-gray-500">{department.description}</div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${department.type === 'division' ? 'bg-blue-100 text-blue-700' :
                department.type === 'team' ? 'bg-green-500/10 text-green-700' : 'bg-yellow-100 text-orange-700'
              }`}>
              {department.type === 'division' ? '본부' :
                department.type === 'team' ? '팀' : '그룹'}
            </span>

            <button
              onClick={() => setEditingDepartment(department)}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="편집"
            >
              <PencilIcon className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleDeleteDepartment(department.id)}
              className="p-1 text-destructive hover:bg-destructive/10 rounded"
              title="삭제"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 하위 부서 렌더링 */}
        {renderDepartmentTree(department.id, level + 1)}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div className="mt-4 text-center">조직 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">조직 및 과정 관리</h2>
              <p className="text-sm text-gray-600">조직 구조와 과정 체계를 관리합니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'departments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <BuildingOfficeIcon className="h-4 w-4 inline mr-2" />
            조직 구조
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'courses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <AcademicCapIcon className="h-4 w-4 inline mr-2" />
            과정 체계
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'departments' && (
            <div className="space-y-6">
              {/* 부서 관리 헤더 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">조직 구조 관리</h3>
                  <p className="text-sm text-gray-600">부서 및 팀 구조를 관리합니다</p>
                </div>
                <button
                  onClick={handleAddDepartment}
                  className="btn-primary px-4 py-2 rounded-full flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>부서 추가</span>
                </button>
              </div>

              {/* 부서 목록 */}
              <div className="space-y-2">
                {departments.filter(d => !d.parentId).length === 0 ? (
                  <div className="text-center py-12">
                    <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 부서가 없습니다</h3>
                    <p className="text-gray-600">새 부서를 추가해보세요.</p>
                  </div>
                ) : (
                  renderDepartmentTree()
                )}
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="space-y-6">
              {/* 과정 관리 헤더 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">과정 체계 관리</h3>
                  <p className="text-sm text-gray-600">교육 과정 시리즈와 레벨을 관리합니다</p>
                </div>
                <button
                  onClick={handleAddCourseSeries}
                  className="btn-primary px-4 py-2 rounded-full flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>과정 시리즈 추가</span>
                </button>
              </div>

              {/* 과정 시리즈 목록 */}
              <div className="space-y-4">
                {courseSeries.length === 0 ? (
                  <div className="text-center py-12">
                    <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 과정이 없습니다</h3>
                    <p className="text-gray-600">새 과정 시리즈를 추가해보세요.</p>
                  </div>
                ) : (
                  courseSeries.map(series => (
                    <div key={series.id} className="border border-gray-200 rounded-lg">
                      {/* 시리즈 헤더 */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleSeriesExpansion(series.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {expandedSeries.includes(series.id) ? (
                                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{series.name} ({series.code})</div>
                              <div className="text-sm text-gray-600">{series.description}</div>
                              <div className="text-xs text-gray-500">
                                대상: {series.targetDepartments.map(deptId =>
                                  departments.find(d => d.id === deptId)?.name
                                ).filter(Boolean).join(', ')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-700">
                              {series.levels.length}개 레벨
                            </span>

                            <button
                              onClick={() => setEditingSeries(series)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="편집"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteCourseSeries(series.id)}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded"
                              title="삭제"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 레벨 목록 (펼쳐진 경우) */}
                      {expandedSeries.includes(series.id) && (
                        <div className="p-4 bg-gray-50">
                          <div className="space-y-3">
                            {series.levels
                              .sort((a, b) => a.order - b.order)
                              .map(level => (
                                <div key={level.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {level.name} ({level.code})
                                      </div>
                                      <div className="text-sm text-gray-600">{level.description}</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {level.defaultSessions}회차 × {Math.floor(level.defaultDuration / 60)}시간
                                        {level.defaultDuration % 60 > 0 && ` ${level.defaultDuration % 60}분`}
                                        | 최대 {level.defaultMaxStudents}명
                                        {level.scheduleType === 'biennial' && ' | 2년 주기'}
                                      </div>
                                    </div>

                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${level.scheduleType === 'biennial' ? 'bg-orange-500/10 text-orange-700' :
                                        level.scheduleType === 'irregular' ? 'bg-yellow-100 text-orange-700' :
                                          'bg-blue-100 text-blue-700'
                                      }`}>
                                      {level.scheduleType === 'biennial' ? '2년주기' :
                                        level.scheduleType === 'irregular' ? '비정기' : '정기'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 부서 편집 모달 */}
      {editingDepartment && (
        <DepartmentEditor
          department={editingDepartment}
          departments={departments}
          onSave={handleSaveDepartment}
          onCancel={() => setEditingDepartment(null)}
        />
      )}

      {/* 과정 시리즈 편집 모달 */}
      {editingSeries && (
        <CourseSeriesEditor
          series={editingSeries}
          departments={departments}
          onSave={handleSaveCourseSeries}
          onCancel={() => setEditingSeries(null)}
        />
      )}
    </div>
  );
};

// 부서 편집 컴포넌트
interface DepartmentEditorProps {
  department: Department;
  departments: Department[];
  onSave: (department: Department) => void;
  onCancel: () => void;
}

const DepartmentEditor: React.FC<DepartmentEditorProps> = ({
  department,
  departments,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Department>(department);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('부서명과 부서코드는 필수입니다.');
      return;
    }
    onSave(formData);
  };

  const availableParents = departments.filter(d =>
    d.id !== formData.id &&
    d.type !== 'team' &&
    !isDescendant(d.id, formData.id, departments)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {department.id.startsWith('dept-') && departments.find(d => d.id === department.id)
            ? '부서 수정' : '부서 추가'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              부서명 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 영업팀"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              부서코드 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: SALES_TEAM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              부서 유형
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Department['type'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="division">본부</option>
              <option value="team">팀</option>
              <option value="group">그룹</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상위 부서
            </label>
            <select
              value={formData.parentId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">없음 (최상위)</option>
              {availableParents.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="부서의 역할과 업무를 설명해주세요"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              활성 상태
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 과정 시리즈 편집 컴포넌트
interface CourseSeriesEditorProps {
  series: CourseSeries;
  departments: Department[];
  onSave: (series: CourseSeries) => void;
  onCancel: () => void;
}

const CourseSeriesEditor: React.FC<CourseSeriesEditorProps> = ({
  series,
  departments,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<CourseSeries>(series);
  const [editingLevel, setEditingLevel] = useState<CourseLevel | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('시리즈명과 시리즈코드는 필수입니다.');
      return;
    }
    onSave(formData);
  };

  const handleAddLevel = () => {
    const newLevel: CourseLevel = {
      id: `level-${Date.now()}`,
      name: '',
      code: '',
      description: '',
      order: formData.levels.length + 1,
      defaultSessions: 20,
      defaultDuration: 180,
      defaultMaxStudents: 30,
      defaultObjectives: [''],
      defaultPrerequisites: [''],
      scheduleType: 'regular'
    };
    setEditingLevel(newLevel);
  };

  const handleSaveLevel = (level: CourseLevel) => {
    if (formData.levels.find(l => l.id === level.id)) {
      // 수정
      setFormData(prev => ({
        ...prev,
        levels: prev.levels.map(l => l.id === level.id ? level : l)
      }));
    } else {
      // 추가
      setFormData(prev => ({
        ...prev,
        levels: [...prev.levels, level]
      }));
    }
    setEditingLevel(null);
  };

  const handleDeleteLevel = (levelId: string) => {
    if (confirm('이 레벨을 삭제하시겠습니까?')) {
      setFormData(prev => ({
        ...prev,
        levels: prev.levels.filter(l => l.id !== levelId)
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            {series.id.startsWith('series-') && series.name
              ? '과정 시리즈 수정' : '과정 시리즈 추가'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시리즈명 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: Business Skills"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시리즈코드 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: BS"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="과정 시리즈의 목적과 내용을 설명해주세요"
            />
          </div>

          {/* 대상 부서 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대상 부서
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {departments.map(dept => (
                <label key={dept.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.targetDepartments.includes(dept.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          targetDepartments: [...prev.targetDepartments, dept.id]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          targetDepartments: prev.targetDepartments.filter(id => id !== dept.id)
                        }));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span>{dept.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 레벨 관리 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                과정 레벨
              </label>
              <button
                type="button"
                onClick={handleAddLevel}
                className="btn-success text-sm px-3 py-1 rounded-full flex items-center space-x-1"
              >
                <PlusIcon className="h-3 w-3" />
                <span>레벨 추가</span>
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {formData.levels
                .sort((a, b) => a.order - b.order)
                .map(level => (
                  <div key={level.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        {level.name} ({level.code})
                      </div>
                      <div className="text-sm text-gray-600">{level.description}</div>
                      <div className="text-xs text-gray-500">
                        {level.defaultSessions}회차 × {Math.floor(level.defaultDuration / 60)}시간
                        {level.defaultDuration % 60 > 0 && ` ${level.defaultDuration % 60}분`}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingLevel(level)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="편집"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLevel(level.id)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
                        title="삭제"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="seriesIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="seriesIsActive" className="ml-2 block text-sm text-gray-900">
              활성 상태
            </label>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              저장
            </button>
          </div>
        </form>

        {/* 레벨 편집 모달 */}
        {editingLevel && (
          <CourseLevelEditor
            level={editingLevel}
            onSave={handleSaveLevel}
            onCancel={() => setEditingLevel(null)}
          />
        )}
      </div>
    </div>
  );
};

// 과정 레벨 편집 컴포넌트
interface CourseLevelEditorProps {
  level: CourseLevel;
  onSave: (level: CourseLevel) => void;
  onCancel: () => void;
}

const CourseLevelEditor: React.FC<CourseLevelEditorProps> = ({
  level,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<CourseLevel>(level);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('레벨명과 레벨코드는 필수입니다.');
      return;
    }
    onSave(formData);
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...formData.defaultObjectives];
    newObjectives[index] = value;
    setFormData(prev => ({ ...prev, defaultObjectives: newObjectives }));
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      defaultObjectives: [...prev.defaultObjectives, '']
    }));
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      defaultObjectives: prev.defaultObjectives.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-70 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-bold text-gray-900">
            레벨 {level.name ? '수정' : '추가'}
          </h4>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                레벨명 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: Basic"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                레벨코드 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: BASIC"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                순서
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기본 회차
              </label>
              <input
                type="number"
                value={formData.defaultSessions}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultSessions: parseInt(e.target.value) || 1 }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기본 시간(분)
              </label>
              <select
                value={formData.defaultDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultDuration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={90}>90분</option>
                <option value={120}>120분</option>
                <option value={180}>180분</option>
                <option value={240}>240분</option>
                <option value={300}>300분</option>
                <option value={480}>480분</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기본 정원
              </label>
              <input
                type="number"
                value={formData.defaultMaxStudents}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultMaxStudents: parseInt(e.target.value) || 1 }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              일정 유형
            </label>
            <select
              value={formData.scheduleType}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduleType: e.target.value as CourseLevel['scheduleType'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="regular">정기</option>
              <option value="biennial">2년 주기</option>
              <option value="irregular">비정기</option>
            </select>
          </div>

          {/* 기본 학습 목표 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기본 학습 목표
            </label>
            {formData.defaultObjectives.map((objective, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`목표 ${index + 1}`}
                />
                {formData.defaultObjectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-full"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addObjective}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              + 목표 추가
            </button>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 유틸리티 함수: 순환 참조 방지
function isDescendant(parentId: string, childId: string, departments: Department[]): boolean {
  const findDescendants = (id: string): string[] => {
    const children = departments.filter(d => d.parentId === id);
    let descendants = children.map(c => c.id);
    children.forEach(child => {
      descendants = [...descendants, ...findDescendants(child.id)];
    });
    return descendants;
  };

  return findDescendants(childId).includes(parentId);
}

export default OrganizationEditor;