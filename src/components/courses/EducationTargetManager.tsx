import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// 직군 정보
interface JobCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 과정 시리즈
interface CourseSeries {
  id: string;
  name: string;
  code: string;
  description: string;
  targetJobCategories: string[]; // 대상 직군 ID 배열
  levels: CourseLevel[];
  isActive: boolean;
}

// 과정 레벨
interface CourseLevel {
  id: string;
  name: string;
  code: string;
  description: string;
  order: number;
  defaultSessions: number;
  defaultDuration: number;
  defaultMaxStudents: number;
  defaultObjectives: string[];
  defaultPrerequisites: string[];
  scheduleType: 'regular' | 'biennial';
}

interface EducationTargetManagerProps {
  onClose: () => void;
}

const EducationTargetManager: React.FC<EducationTargetManagerProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'jobCategories' | 'courseSeries'>('jobCategories');
  
  // 직군 관리
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [editingJobCategory, setEditingJobCategory] = useState<string | null>(null);
  const [newJobCategory, setNewJobCategory] = useState({ name: '', code: '', description: '' });
  const [showAddJobCategory, setShowAddJobCategory] = useState(false);
  
  // 과정 시리즈 관리
  const [courseSeries, setCourseSeries] = useState<CourseSeries[]>([]);
  const [editingSeries, setEditingSeries] = useState<string | null>(null);
  const [showAddSeries, setShowAddSeries] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    const sampleJobCategories: JobCategory[] = [
      {
        id: 'job-1',
        name: '영업',
        code: 'SALES',
        description: '제품 판매 및 고객 관리',
        isActive: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      },
      {
        id: 'job-2',
        name: 'PS (Pre-Sales)',
        code: 'PS',
        description: '사전 영업 지원 및 기술 컨설팅',
        isActive: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      },
      {
        id: 'job-3',
        name: 'TS (Technical Support)',
        code: 'TS',
        description: '기술 지원 및 문제 해결',
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
        targetJobCategories: ['job-1', 'job-2'],
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
          }
        ],
        isActive: true
      },
      {
        id: 'series-2',
        name: 'Support Skills',
        code: 'SS',
        description: '기술지원직군 대상 전문 스킬 교육',
        targetJobCategories: ['job-3'],
        levels: [
          {
            id: 'level-3',
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
          }
        ],
        isActive: true
      }
    ];

    setJobCategories(sampleJobCategories);
    setCourseSeries(sampleCourseSeries);
  }, []);

  // 직군 추가
  const handleAddJobCategory = () => {
    if (!newJobCategory.name || !newJobCategory.code) {
      alert('직군명과 코드를 입력해주세요.');
      return;
    }

    const isDuplicateCode = jobCategories.some(cat => 
      cat.code.toUpperCase() === newJobCategory.code.toUpperCase()
    );

    if (isDuplicateCode) {
      alert('이미 존재하는 직군 코드입니다.');
      return;
    }

    const newCategory: JobCategory = {
      id: `job-${Date.now()}`,
      name: newJobCategory.name,
      code: newJobCategory.code.toUpperCase(),
      description: newJobCategory.description,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setJobCategories(prev => [...prev, newCategory]);
    setNewJobCategory({ name: '', code: '', description: '' });
    setShowAddJobCategory(false);
  };

  // 직군 수정
  const handleUpdateJobCategory = (id: string, updates: Partial<JobCategory>) => {
    setJobCategories(prev => prev.map(cat => 
      cat.id === id 
        ? { ...cat, ...updates, updatedAt: new Date().toISOString() }
        : cat
    ));
    setEditingJobCategory(null);
  };

  // 직군 삭제 (연관된 과정 시리즈 확인)
  const handleDeleteJobCategory = (id: string) => {
    const relatedSeries = courseSeries.filter(series => 
      series.targetJobCategories.includes(id)
    );

    if (relatedSeries.length > 0) {
      alert(`이 직군을 대상으로 하는 과정이 있어 삭제할 수 없습니다:\n${relatedSeries.map(s => s.name).join(', ')}`);
      return;
    }

    if (confirm('정말로 이 직군을 삭제하시겠습니까?')) {
      setJobCategories(prev => prev.filter(cat => cat.id !== id));
    }
  };

  // 과정 시리즈 추가
  const handleAddCourseSeries = () => {
    const newSeries: CourseSeries = {
      id: `series-${Date.now()}`,
      name: '새 과정 시리즈',
      code: 'NEW',
      description: '새로운 교육과정 시리즈입니다.',
      targetJobCategories: [],
      levels: [],
      isActive: true
    };

    setCourseSeries(prev => [...prev, newSeries]);
    setEditingSeries(newSeries.id);
  };

  // 과정 시리즈 삭제
  const handleDeleteCourseSeries = (id: string) => {
    if (confirm('정말로 이 과정 시리즈를 삭제하시겠습니까?')) {
      setCourseSeries(prev => prev.filter(series => series.id !== id));
      setEditingSeries(null);
    }
  };

  // 직군 탭 렌더링
  const renderJobCategoriesTab = () => (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">교육 대상 직군 관리</h3>
          <p className="text-sm text-gray-600 mt-1">
            교육과정의 대상이 되는 직군을 관리합니다.
          </p>
        </div>
        <button
          onClick={() => setShowAddJobCategory(true)}
          className="btn-primary px-4 py-2 rounded-full flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>직군 추가</span>
        </button>
      </div>

      {/* 직군 추가 폼 */}
      {showAddJobCategory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">새 직군 추가</h4>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                직군명 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={newJobCategory.name}
                onChange={(e) => setNewJobCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="예: 마케팅"
                className="w-full px-3 py-2 border border-blue-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                직군 코드 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={newJobCategory.code}
                onChange={(e) => setNewJobCategory(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="예: MKT"
                className="w-full px-3 py-2 border border-blue-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                설명
              </label>
              <input
                type="text"
                value={newJobCategory.description}
                onChange={(e) => setNewJobCategory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="직군 설명"
                className="w-full px-3 py-2 border border-blue-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowAddJobCategory(false);
                setNewJobCategory({ name: '', code: '', description: '' });
              }}
              className="px-3 py-2 border border-blue-300 text-blue-700 rounded-full hover:bg-blue-100"
            >
              취소
            </button>
            <button
              onClick={handleAddJobCategory}
              className="btn-primary"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* 직군 목록 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">등록된 직군 ({jobCategories.length}개)</h4>
        </div>
        
        <div className="divide-y divide-gray-200">
          {jobCategories.map((category) => (
            <div key={category.id} className="p-6">
              {editingJobCategory === category.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">직군명</label>
                      <input
                        type="text"
                        defaultValue={category.name}
                        onBlur={(e) => handleUpdateJobCategory(category.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">코드</label>
                      <input
                        type="text"
                        defaultValue={category.code}
                        onBlur={(e) => handleUpdateJobCategory(category.id, { code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                      <input
                        type="text"
                        defaultValue={category.description}
                        onBlur={(e) => handleUpdateJobCategory(category.id, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingJobCategory(null)}
                      className="p-2 text-green-600 hover:bg-green-500/10 rounded"
                      title="완료"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <UserGroupIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{category.name}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {category.code}
                          </span>
                          {!category.isActive && (
                            <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded">
                              비활성
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          생성: {new Date(category.createdAt).toLocaleDateString('ko-KR')}
                          {category.updatedAt !== category.createdAt && (
                            <span> | 수정: {new Date(category.updatedAt).toLocaleDateString('ko-KR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingJobCategory(category.id)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                      title="편집"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteJobCategory(category.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded"
                      title="삭제"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {jobCategories.length === 0 && (
            <div className="p-12 text-center">
              <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 직군이 없습니다</h3>
              <p className="text-gray-600 mb-4">
                교육 대상이 되는 직군을 추가해주세요.
              </p>
              <button
                onClick={() => setShowAddJobCategory(true)}
                className="btn-primary px-4 py-2 rounded-full"
              >
                첫 직군 추가하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 과정 시리즈 탭 렌더링
  const renderCourseSeriesTab = () => (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">교육과정 시리즈 관리</h3>
          <p className="text-sm text-gray-600 mt-1">
            직군별 교육과정 시리즈와 레벨을 관리합니다.
          </p>
        </div>
        <button
          onClick={handleAddCourseSeries}
          className="btn-success px-4 py-2 rounded-full flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>시리즈 추가</span>
        </button>
      </div>

      {/* 과정 시리즈 목록 */}
      <div className="space-y-4">
        {courseSeries.map((series) => (
          <div key={series.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <AcademicCapIcon className="h-5 w-5 text-green-600" />
                  <span>{series.name} ({series.code})</span>
                </h4>
                <p className="text-sm text-gray-600 mt-1">{series.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>대상 직군: {
                    series.targetJobCategories.map(jobId => 
                      jobCategories.find(cat => cat.id === jobId)?.name
                    ).filter(Boolean).join(', ') || '미설정'
                  }</span>
                  <span>레벨: {series.levels.length}개</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingSeries(editingSeries === series.id ? null : series.id)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                  title="편집"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteCourseSeries(series.id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded"
                  title="삭제"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 시리즈 편집 폼 */}
            {editingSeries === series.id && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">시리즈명</label>
                    <input
                      type="text"
                      defaultValue={series.name}
                      onBlur={(e) => {
                        setCourseSeries(prev => prev.map(s => 
                          s.id === series.id ? { ...s, name: e.target.value } : s
                        ));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">코드</label>
                    <input
                      type="text"
                      defaultValue={series.code}
                      onBlur={(e) => {
                        setCourseSeries(prev => prev.map(s => 
                          s.id === series.id ? { ...s, code: e.target.value.toUpperCase() } : s
                        ));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    defaultValue={series.description}
                    onBlur={(e) => {
                      setCourseSeries(prev => prev.map(s => 
                        s.id === series.id ? { ...s, description: e.target.value } : s
                      ));
                    }}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">대상 직군</label>
                  <div className="space-y-2">
                    {jobCategories.map(category => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={series.targetJobCategories.includes(category.id)}
                          onChange={(e) => {
                            const newTargets = e.target.checked
                              ? [...series.targetJobCategories, category.id]
                              : series.targetJobCategories.filter(id => id !== category.id);
                            
                            setCourseSeries(prev => prev.map(s => 
                              s.id === series.id ? { ...s, targetJobCategories: newTargets } : s
                            ));
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {category.name} ({category.code})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 레벨 목록 */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h5 className="font-medium text-gray-900 mb-3">과정 레벨</h5>
              <div className="space-y-2">
                {series.levels.sort((a, b) => a.order - b.order).map((level) => (
                  <div key={level.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div>
                      <span className="font-medium text-sm">{level.name} ({level.code})</span>
                      <span className="text-gray-600 text-sm ml-2">- {level.description}</span>
                      <div className="text-xs text-gray-500 mt-1">
                        {level.defaultSessions}회차 · {level.defaultDuration}분 · 정원 {level.defaultMaxStudents}명 
                        {level.scheduleType === 'biennial' && ' · 격년'}
                      </div>
                    </div>
                  </div>
                ))}
                
                {series.levels.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    등록된 레벨이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {courseSeries.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 과정 시리즈가 없습니다</h3>
            <p className="text-gray-600 mb-4">
              교육과정 시리즈를 추가해주세요.
            </p>
            <button
              onClick={handleAddCourseSeries}
              className="btn-success px-4 py-2 rounded-full"
            >
              첫 시리즈 추가하기
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">교육과정 체계 관리</h2>
              <p className="text-sm text-gray-600">교육 대상 직군과 과정 시리즈를 관리합니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('jobCategories')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'jobCategories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              교육 대상 직군
            </button>
            <button
              onClick={() => setActiveTab('courseSeries')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'courseSeries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              교육과정 시리즈
            </button>
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-6">
          {activeTab === 'jobCategories' && renderJobCategoriesTab()}
          {activeTab === 'courseSeries' && renderCourseSeriesTab()}
        </div>
      </div>
    </div>
  );
};

export default EducationTargetManager;