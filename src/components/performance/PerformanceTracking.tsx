import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Download,
  User,
  FileBarChart,
  GraduationCap,
  Trophy,
  CalendarDays,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  ClipboardList,
  BookOpen
} from 'lucide-react';

interface DailyProgress {
  day: number;
  date: string;
  planned_topics: string[];
  completed_topics: string[];
  attendance_count: number;
  total_students: number;
  completion_rate: number;
  notes?: string;
}

interface CourseProgress {
  id: string;
  course_name: string;
  session_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  current_day: number;
  daily_progress: DailyProgress[];
  overall_completion: number;
  students: StudentProgress[];
}

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  daily_attendance: boolean[];
  daily_completion: number[];
  overall_progress: number;
  status: 'on_track' | 'behind' | 'ahead' | 'at_risk';
  last_activity: string;
}

interface TraineePerformance {
  id: string;
  name: string;
  course: string;
  attendance_rate: number;
  exam_average: number;
  progress: number;
  status: 'excellent' | 'good' | 'average' | 'needs_improvement';
  last_activity: string;
}

const PerformanceTracking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily-progress' | 'overview' | 'individual' | 'reports'>('daily-progress');
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [courseProgressData, setCourseProgressData] = useState<CourseProgress[]>([]);

  // 목업 진도 추적 데이터
  useEffect(() => {
    const mockCourseProgress: CourseProgress[] = [
      {
        id: 'course-1',
        course_name: 'BS 영업 기초과정',
        session_name: '2024년 2차',
        start_date: '2024-08-01',
        end_date: '2024-08-15',
        total_days: 15,
        current_day: 8,
        overall_completion: 53,
        daily_progress: [
          {
            day: 1,
            date: '2024-08-01',
            planned_topics: ['오리엔테이션', '영업의 이해', '기본 개념'],
            completed_topics: ['오리엔테이션', '영업의 이해'],
            attendance_count: 24,
            total_students: 25,
            completion_rate: 67,
            notes: '첫날 오리엔테이션 진행'
          },
          {
            day: 2,
            date: '2024-08-02',
            planned_topics: ['고객 발굴', '영업 프로세스', '실습'],
            completed_topics: ['고객 발굴', '영업 프로세스', '실습'],
            attendance_count: 25,
            total_students: 25,
            completion_rate: 100,
            notes: '모든 학습 목표 달성'
          },
          {
            day: 3,
            date: '2024-08-05',
            planned_topics: ['고객 니즈 분석', '질문 기법'],
            completed_topics: ['고객 니즈 분석'],
            attendance_count: 23,
            total_students: 25,
            completion_rate: 50,
            notes: '시간 부족으로 질문 기법은 다음 차시로 이월'
          },
          {
            day: 4,
            date: '2024-08-06',
            planned_topics: ['질문 기법', '상품 설명법'],
            completed_topics: ['질문 기법', '상품 설명법'],
            attendance_count: 24,
            total_students: 25,
            completion_rate: 100
          },
          {
            day: 5,
            date: '2024-08-07',
            planned_topics: ['이의제기 처리', '성공사례 분석'],
            completed_topics: ['이의제기 처리'],
            attendance_count: 22,
            total_students: 25,
            completion_rate: 50,
            notes: '결석자 2명, 조기 퇴근 1명'
          },
          {
            day: 6,
            date: '2024-08-08',
            planned_topics: ['계약 체결 기법', '사후 관리'],
            completed_topics: ['계약 체결 기법', '사후 관리'],
            attendance_count: 25,
            total_students: 25,
            completion_rate: 100
          },
          {
            day: 7,
            date: '2024-08-09',
            planned_topics: ['실전 시뮬레이션', '피드백'],
            completed_topics: ['실전 시뮬레이션'],
            attendance_count: 24,
            total_students: 25,
            completion_rate: 50,
            notes: '시뮬레이션 완료, 개별 피드백 예정'
          },
          {
            day: 8,
            date: '2024-08-12',
            planned_topics: ['개별 피드백', '개선 계획 수립'],
            completed_topics: ['개별 피드백'],
            attendance_count: 25,
            total_students: 25,
            completion_rate: 50,
            notes: '현재 진행 중'
          }
        ],
        students: [
          {
            id: 'student-1',
            name: '김민수',
            email: 'kim@example.com',
            daily_attendance: [true, true, true, true, false, true, true, true],
            daily_completion: [70, 100, 50, 100, 0, 100, 80, 60],
            overall_progress: 78,
            status: 'on_track',
            last_activity: '2024-08-12'
          },
          {
            id: 'student-2',
            name: '이영희',
            email: 'lee@example.com',
            daily_attendance: [true, true, true, true, true, true, true, true],
            daily_completion: [80, 100, 60, 100, 70, 100, 90, 80],
            overall_progress: 85,
            status: 'ahead',
            last_activity: '2024-08-12'
          },
          {
            id: 'student-3',
            name: '박정우',
            email: 'park@example.com',
            daily_attendance: [true, true, false, true, false, true, false, true],
            daily_completion: [60, 90, 0, 80, 0, 90, 0, 50],
            overall_progress: 46,
            status: 'at_risk',
            last_activity: '2024-08-12'
          }
        ]
      }
    ];
    setCourseProgressData(mockCourseProgress);
  }, []);

  // 목업 데이터
  const performanceData: TraineePerformance[] = [
    { id: '1', name: '김민수', course: 'BS 영업 기초과정', attendance_rate: 95, exam_average: 85, progress: 90, status: 'excellent', last_activity: '2024-08-08' },
    { id: '2', name: '이영희', course: 'BS 고급 영업 전략', attendance_rate: 88, exam_average: 92, progress: 85, status: 'excellent', last_activity: '2024-08-07' },
    { id: '3', name: '박정우', course: 'BS 영업 기초과정', attendance_rate: 92, exam_average: 78, progress: 82, status: 'good', last_activity: '2024-08-08' },
    { id: '4', name: '최수현', course: 'BS 고객 관리 시스템', attendance_rate: 85, exam_average: 88, progress: 78, status: 'good', last_activity: '2024-08-06' },
    { id: '5', name: '정다은', course: 'BS 영업 기초과정', attendance_rate: 76, exam_average: 65, progress: 60, status: 'needs_improvement', last_activity: '2024-08-05' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500/10 text-green-700';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      case 'needs_improvement': return 'bg-destructive/10 text-destructive';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return '우수';
      case 'good': return '양호';
      case 'average': return '보통';
      case 'needs_improvement': return '개선 필요';
      default: return '미분류';
    }
  };

  const overallStats = {
    total_trainees: performanceData.length,
    excellent: performanceData.filter(p => p.status === 'excellent').length,
    good: performanceData.filter(p => p.status === 'good').length,
    needs_improvement: performanceData.filter(p => p.status === 'needs_improvement').length,
    avg_attendance: Math.round(performanceData.reduce((sum, p) => sum + p.attendance_rate, 0) / performanceData.length),
    avg_exam_score: Math.round(performanceData.reduce((sum, p) => sum + p.exam_average, 0) / performanceData.length),
    avg_progress: Math.round(performanceData.reduce((sum, p) => sum + p.progress, 0) / performanceData.length)
  };

  return (
    <div className="space-y-6">
      {/* 탭 메뉴 */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scroll-touch">
          <nav className="-mb-px flex">
            {[
              { key: 'daily-progress', label: '일차별 진도', icon: CalendarDays },
              { key: 'overview', label: '전체 현황', icon: BarChart2 },
              { key: 'individual', label: '개별 성과', icon: User },
              { key: 'reports', label: '상세 리포트', icon: FileBarChart }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 sm:px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 flex items-center whitespace-nowrap min-w-[120px] justify-center ${activeTab === tab.key
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <div className={`mr-2 p-1 rounded-md ${activeTab === tab.key ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-transparent'}`}>
                  <tab.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${activeTab === tab.key ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500'}`} />
                </div>
                <span className="text-xs sm:text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* 일차별 진도 탭 */}
          {activeTab === 'daily-progress' && (
            <div className="space-y-6">
              {courseProgressData.map((course) => (
                <div key={course.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  {/* 과정 헤더 */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{course.course_name}</h3>
                      <p className="text-sm text-gray-600">{course.session_name} • {course.start_date} ~ {course.end_date}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-700">{course.current_day}/{course.total_days}일차</div>
                      <div className="text-sm text-gray-600">전체 진도 {course.overall_completion}%</div>
                    </div>
                  </div>

                  {/* 진도 현황 */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">전체 진도율</span>
                      <span className="text-sm text-gray-600">{course.overall_completion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-lg h-2">
                      <div
                        className="bg-gray-600 h-2 rounded-lg transition-all duration-300"
                        style={{ width: `${course.overall_completion}%` }}
                      />
                    </div>
                  </div>

                  {/* 일차별 진도 그리드 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {course.daily_progress.map((day) => {
                      const attendanceRate = Math.round((day.attendance_count / day.total_students) * 100);
                      const isCurrentDay = day.day === course.current_day;
                      const isCompleted = day.completion_rate === 100;
                      const isBehind = day.completion_rate < 80 && day.day < course.current_day;

                      return (
                        <div
                          key={day.day}
                          className={`border rounded-md p-4 transition-all shadow-sm ${isCurrentDay ? 'border-gray-500 bg-gray-50' :
                            isCompleted ? 'border-gray-300 bg-white' :
                              isBehind ? 'border-red-200 bg-red-50' :
                                'border-gray-200 bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-semibold ${isCurrentDay ? 'text-gray-700' :
                                isCompleted ? 'text-gray-600' :
                                  isBehind ? 'text-destructive' :
                                    'text-gray-500'
                                }`}>
                                {day.day}일차
                              </span>
                              {isCurrentDay && <Clock className="h-4 w-4 text-gray-600" />}
                              {isCompleted && <CheckCircle className="h-4 w-4 text-gray-600" />}
                              {isBehind && <AlertTriangle className="h-4 w-4 text-destructive" />}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${day.completion_rate >= 80 ? 'bg-gray-100 text-gray-700' :
                              day.completion_rate >= 50 ? 'bg-yellow-100 text-orange-700' :
                                'bg-destructive/10 text-destructive'
                              }`}>
                              {day.completion_rate}%
                            </span>
                          </div>

                          <div className="text-xs text-gray-600 mb-2">{day.date}</div>

                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">계획된 주제 ({day.planned_topics.length}개)</div>
                              <div className="text-xs text-gray-700">
                                {day.planned_topics.slice(0, 2).join(', ')}
                                {day.planned_topics.length > 2 && ` 외 ${day.planned_topics.length - 2}개`}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-500 mb-1">완료된 주제 ({day.completed_topics.length}개)</div>
                              <div className="text-xs text-gray-700">
                                {day.completed_topics.slice(0, 2).join(', ')}
                                {day.completed_topics.length > 2 && ` 외 ${day.completed_topics.length - 2}개`}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">출석률</span>
                              <span className={`font-medium ${attendanceRate >= 90 ? 'text-gray-700' :
                                attendanceRate >= 80 ? 'text-foreground' :
                                  'text-destructive'
                                }`}>
                                {day.attendance_count}/{day.total_students} ({attendanceRate}%)
                              </span>
                            </div>

                            {day.notes && (
                              <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                                <div className="flex items-start text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                  <span>{day.notes}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* 예정된 일차들 */}
                    {Array.from({ length: course.total_days - course.daily_progress.length }, (_, i) => {
                      const dayNumber = course.daily_progress.length + i + 1;
                      return (
                        <div key={`future-${dayNumber}`} className="border border-gray-200 rounded-md p-4 bg-gray-50 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-400">{dayNumber}일차</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-500">예정</span>
                          </div>
                          <div className="text-xs text-gray-400">미정</div>
                          <div className="mt-2 text-xs text-gray-500">강의 계획 수립 예정</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 학생별 진도 요약 */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">학생별 진도 현황</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {course.students.slice(0, 6).map((student) => {
                        const attendanceRate = Math.round((student.daily_attendance.filter(Boolean).length / student.daily_attendance.length) * 100);

                        return (
                          <div key={student.id} className="bg-gray-50 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{student.name}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${student.status === 'ahead' ? 'bg-gray-100 text-gray-700' :
                                student.status === 'on_track' ? 'bg-gray-100 text-gray-600' :
                                  student.status === 'behind' ? 'bg-yellow-100 text-orange-700' :
                                    'bg-destructive/10 text-destructive'
                                }`}>
                                {student.status === 'ahead' ? '앞서감' :
                                  student.status === 'on_track' ? '정상' :
                                    student.status === 'behind' ? '지연' : '위험'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mb-2">진도 {student.overall_progress}% • 출석 {attendanceRate}%</div>
                            <div className="w-full bg-gray-200 rounded-lg h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${student.overall_progress >= 80 ? 'bg-gray-600' :
                                  student.overall_progress >= 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                style={{ width: `${student.overall_progress}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {course.students.length > 6 && (
                        <div className="bg-gray-100 rounded p-3 flex items-center justify-center">
                          <span className="text-sm text-gray-600">외 {course.students.length - 6}명</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 전체 현황 탭 */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 주요 지표 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-700">{overallStats.total_trainees}</div>
                  <div className="text-sm text-gray-600">총 수강생</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-700">{overallStats.avg_attendance}%</div>
                  <div className="text-sm text-gray-600">평균 출석률</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-700">{overallStats.avg_exam_score}</div>
                  <div className="text-sm text-gray-600">평균 시험 점수</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-700">{overallStats.avg_progress}%</div>
                  <div className="text-sm text-gray-600">평균 진도율</div>
                </div>
              </div>

              {/* 성과 분포 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">성과 등급 분포</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                      <span className="text-gray-800 font-medium">우수 ({overallStats.excellent}명)</span>
                      <span className="text-gray-700">{Math.round((overallStats.excellent / overallStats.total_trainees) * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                      <span className="text-gray-800 font-medium">양호 ({overallStats.good}명)</span>
                      <span className="text-gray-700">{Math.round((overallStats.good / overallStats.total_trainees) * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                      <span className="text-gray-800 font-medium">개선 필요 ({overallStats.needs_improvement}명)</span>
                      <span className="text-gray-700">{Math.round((overallStats.needs_improvement / overallStats.total_trainees) * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">과정별 평균 성과</h3>
                  <div className="space-y-3">
                    {['BS 영업 기초과정', 'BS 고급 영업 전략', 'BS 고객 관리 시스템'].map((course) => {
                      const courseStudents = performanceData.filter(p => p.course === course);
                      const avgScore = courseStudents.length > 0
                        ? Math.round(courseStudents.reduce((sum, p) => sum + p.exam_average, 0) / courseStudents.length)
                        : 0;

                      return (
                        <div key={course} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{course}</span>
                            <span className="text-gray-600">{avgScore}점</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-lg h-2">
                            <div
                              className="bg-gray-600 h-2 rounded-lg"
                              style={{ width: `${avgScore}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 개선 권장사항 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                  <ClipboardList className="w-5 h-5 mr-2 text-primary" />
                  개선 권장사항
                </h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <div>• {overallStats.needs_improvement}명의 수강생이 개선이 필요한 상태입니다.</div>
                  <div>• 평균 출석률이 {overallStats.avg_attendance}%입니다. 85% 이상 유지를 권장합니다.</div>
                  <div>• 개별 맞춤 지도가 필요한 수강생에게 추가 지원을 제공하세요.</div>
                </div>
              </div>
            </div>
          )}

          {/* 개별 성과 탭 */}
          {activeTab === 'individual' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">개별 수강생 성과</h3>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="수강생 검색..."
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                  <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500">
                    <option value="">전체 상태</option>
                    <option value="excellent">우수</option>
                    <option value="good">양호</option>
                    <option value="needs_improvement">개선 필요</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수강생</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">과정</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">출석률</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시험 평균</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">진도율</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최근 활동</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {performanceData.map((trainee) => (
                      <tr key={trainee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{trainee.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{trainee.course}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{trainee.attendance_rate}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{trainee.exam_average}점</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{trainee.progress}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trainee.status)}`}>
                            {getStatusLabel(trainee.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{trainee.last_activity}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 상세 리포트 탭 */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">상세 성과 리포트</h3>

              {/* 리포트 템플릿 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <BarChart2 className="w-4 h-4 mr-2 text-primary" />
                    종합 성과 리포트
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">전체 수강생의 출석, 시험, 진도 현황을 종합한 리포트</p>
                  <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors text-sm">
                    리포트 생성
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                    개별 수강생 리포트
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">특정 수강생의 상세한 학습 성과 분석 리포트</p>
                  <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors text-sm">
                    리포트 생성
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-primary" />
                    과정별 분석 리포트
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">과정별 수강생 성과 비교 및 분석 리포트</p>
                  <button className="w-full bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors text-sm">
                    리포트 생성
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2">⚠️ 개선 필요 수강생 리포트</h4>
                  <p className="text-sm text-gray-600 mb-4">추가 지원이 필요한 수강생 현황 및 권장사항</p>
                  <button className="w-full bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors text-sm">
                    리포트 생성
                  </button>
                </div>
              </div>

              {/* 리포트 히스토리 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">최근 생성된 리포트</h4>
                <div className="space-y-3">
                  {[
                    { name: '8월 종합 성과 리포트', date: '2024-08-01', type: '종합 리포트', size: '2.3MB' },
                    { name: '과정별 분석 리포트 (7월)', date: '2024-07-31', type: '과정별 리포트', size: '1.8MB' },
                    { name: '개선 필요 수강생 리포트', date: '2024-07-28', type: '개별 리포트', size: '945KB' }
                  ].map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{report.name}</div>
                        <div className="text-sm text-gray-600">{report.type} • {report.date} • {report.size}</div>
                      </div>
                      <button className="text-gray-600 hover:text-gray-700 text-sm font-medium rounded-full">
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceTracking;