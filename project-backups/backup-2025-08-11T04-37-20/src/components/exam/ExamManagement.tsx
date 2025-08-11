import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { CourseService } from '../../services/course.services';
import type { Course } from '../../services/course.services';
import ExamForm from './ExamForm';
import ExamTaking from './ExamTaking';
import ExamResults from './ExamResults';

type ViewType = 'list' | 'form' | 'taking' | 'results';

interface Exam {
  id: string;
  title: string;
  course_name: string;
  description?: string;
  duration_minutes: number;
  total_questions: number;
  passing_score: number;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  created_at: string;
}

const ExamManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 초기 데이터 로드
  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      // 과정 데이터 로드
      const courseService = new CourseService();
      const coursesData = await courseService.getCourses();
      setCourses(coursesData);

      // 목업 데이터
      const mockExams: Exam[] = [
        {
          id: '1',
          title: '영업 기초 이론 평가',
          course_name: 'BS 영업 기초과정',
          description: '영업의 기본 개념과 프로세스에 대한 이해도를 평가하는 시험입니다.',
          duration_minutes: 60,
          total_questions: 30,
          passing_score: 70,
          status: 'active',
          created_at: '2024-08-15T10:00:00Z'
        },
        {
          id: '2',
          title: '고급 영업 전략 종합 평가',
          course_name: 'BS 고급 영업 전략',
          description: '고급 영업 전략과 실무 적용에 대한 종합적인 평가입니다.',
          duration_minutes: 90,
          total_questions: 25,
          passing_score: 75,
          status: 'scheduled',
          created_at: '2024-08-20T14:30:00Z'
        },
        {
          id: '3',
          title: 'CRM 활용 능력 평가',
          course_name: 'BS 고객 관리 시스템',
          description: 'CRM 시스템 활용법과 고객 관리 전략에 대한 실무 평가입니다.',
          duration_minutes: 45,
          total_questions: 20,
          passing_score: 80,
          status: 'completed',
          created_at: '2024-08-18T11:15:00Z'
        }
      ];
      
      setExams(mockExams);
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  // 검색 필터링
  const filteredExams = exams.filter(exam => {
    if (!searchTerm) return true;
    return exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           exam.course_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 시험 통계 요약
  const examStats = {
    total: exams.length,
    active: exams.filter(e => e.status === 'active').length,
    scheduled: exams.filter(e => e.status === 'scheduled').length,
    completed: exams.filter(e => e.status === 'completed').length
  };

  // 핸들러 함수들
  const handleExamSave = (examData: Partial<Exam>) => {
    console.log('시험 저장:', examData);
    // 실제로는 API를 통해 저장
    loadExams(); // 목록 새로고침
    setCurrentView('list');
  };

  const handleExamEdit = (exam: Exam) => {
    setSelectedExam(exam);
    setCurrentView('form');
  };

  const handleExamTake = (exam: Exam) => {
    setSelectedExam(exam);
    setCurrentView('taking');
  };

  const handleExamResults = (exam: Exam) => {
    setSelectedExam(exam);
    setCurrentView('results');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedExam(null);
  };

  // 뷰별 렌더링
  if (currentView === 'form') {
    return (
      <ExamForm
        exam={selectedExam}
        courses={courses}
        onBack={handleBackToList}
        onSave={handleExamSave}
      />
    );
  }

  if (currentView === 'taking' && selectedExam) {
    return (
      <ExamTaking
        exam={selectedExam}
        onBack={handleBackToList}
        onSubmit={(results) => {
          console.log('시험 제출:', results);
          setCurrentView('results');
        }}
      />
    );
  }

  if (currentView === 'results' && selectedExam) {
    return (
      <ExamResults
        exam={selectedExam}
        onBack={handleBackToList}
        onRetake={() => setCurrentView('taking')}
      />
    );
  }

  // 기본 목록 뷰
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <AcademicCapIcon className="h-8 w-8 mr-3 text-blue-600" />
              이론 평가 관리
            </h1>
            <p className="mt-2 text-gray-600">
              수강생들의 이론 시험을 생성하고 관리하세요.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('form')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            새 시험 생성
          </button>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{examStats.total}</div>
            <div className="text-sm text-gray-600">전체 시험</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{examStats.active}</div>
            <div className="text-sm text-gray-600">진행중</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{examStats.scheduled}</div>
            <div className="text-sm text-gray-600">예정됨</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{examStats.completed}</div>
            <div className="text-sm text-gray-600">완료됨</div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="시험명, 과정명으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">{filteredExams.length}개 시험</span>
          </div>
        </div>
      </div>

      {/* 시험 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">시험 목록</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">시험 목록을 불러오는 중...</span>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-1">
                      {exam.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{exam.course_name}</p>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    exam.status === 'active' ? 'bg-green-100 text-green-800' :
                    exam.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    exam.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {exam.status === 'active' ? '진행중' :
                     exam.status === 'scheduled' ? '예정' :
                     exam.status === 'completed' ? '완료' : '준비중'}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>⏱️ {exam.duration_minutes}분</span>
                    <span className="mx-2">•</span>
                    <span>📝 {exam.total_questions}문항</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    🎯 합격점: {exam.passing_score}점
                  </div>
                </div>

                {exam.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {exam.description}
                  </p>
                )}

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleExamTake(exam)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    시험 응시
                  </button>
                  <button 
                    onClick={() => handleExamEdit(exam)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    편집
                  </button>
                  <button 
                    onClick={() => handleExamResults(exam)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    결과
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamManagement;