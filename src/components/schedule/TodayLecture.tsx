import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CogIcon,
  BookOpenIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  PhoneIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface LectureInfo {
  id: string;
  courseName: string;
  courseCode: string; // 예: "BS-2025-01"
  session: number; // 몇 차시
  totalSessions: number;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  building?: string;
  instructor: {
    name: string;
    phone?: string;
    email?: string;
  };
  operator: {
    name: string;
    phone?: string;
    email?: string;
  };
  materials: string[];
  topics: string[];
  homework?: string;
  announcement?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  attendanceRequired: boolean;
  evaluationMethod?: string;
}

interface TodayLectureProps {
  date?: string; // YYYY-MM-DD 형식
}

const TodayLecture: React.FC<TodayLectureProps> = ({
  date = new Date().toISOString().split('T')[0]
}) => {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<LectureInfo[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<LectureInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateSampleLectures = (): LectureInfo[] => {
      const today = new Date(date);
      const isToday = date === new Date().toISOString().split('T')[0];

      if (today.getDay() === 0 || today.getDay() === 6) {
        // 주말에는 강의 없음
        return [];
      }

      return [
        {
          id: 'lecture-1',
          courseName: 'BS 신입 영업사원 기초과정',
          courseCode: 'BS-2025-01',
          session: 8,
          totalSessions: 40,
          date,
          startTime: '09:00',
          endTime: '12:00',
          room: '교육실 A',
          building: '본관 3층',
          instructor: {
            name: '김강사',
            phone: '010-1234-5678',
            email: 'instructor@company.com'
          },
          operator: {
            name: '박운영',
            phone: '010-9876-5432',
            email: 'operator@company.com'
          },
          materials: [
            '영업 기초 교재 Ch.3',
            '노트북 (필수)',
            '필기구',
            'A4 용지 10매'
          ],
          topics: [
            '고객 니즈 분석 방법론',
            '질문 기법 실습',
            '경청의 기술',
            '고객 관계 구축 전략'
          ],
          homework: '학습한 질문 기법을 활용하여 실제 고객과의 대화 시나리오 3개 작성',
          announcement: '다음 주 화요일 중간 평가가 있습니다. 1-8차시 내용 복습 바랍니다.',
          status: isToday ? 'scheduled' : 'completed',
          attendanceRequired: true,
          evaluationMethod: '실습 참여도 평가'
        },
        {
          id: 'lecture-2',
          courseName: 'BS 고급 영업 전략과정',
          courseCode: 'BS-2025-02',
          session: 15,
          totalSessions: 32,
          date,
          startTime: '14:00',
          endTime: '17:00',
          room: '교육실 B',
          building: '본관 4층',
          instructor: {
            name: '이전문',
            phone: '010-2468-1357',
            email: 'expert@company.com'
          },
          operator: {
            name: '최관리',
            phone: '010-1357-2468',
            email: 'admin@company.com'
          },
          materials: [
            '고급 영업 전략 교재 Ch.7',
            '태블릿 또는 노트북',
            '계산기',
            '프레젠테이션 자료 (USB)'
          ],
          topics: [
            '대형 거래 협상 전략',
            '가격 정책 수립',
            '경쟁사 분석 방법론',
            '장기 계약 관리'
          ],
          homework: '담당 고객사의 경쟁사 분석 보고서 작성 (A4 3페이지 이내)',
          status: isToday ? 'scheduled' : 'completed',
          attendanceRequired: true,
          evaluationMethod: '프레젠테이션 발표'
        }
      ];
    };

    setLoading(true);
    setTimeout(() => {
      setLectures(generateSampleLectures());
      setLoading(false);
    }, 500);
  }, [date]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300';
      case 'ongoing': return 'text-green-600 bg-green-500/10 dark:bg-green-900/30 dark:text-green-300';
      case 'completed': return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
      case 'cancelled': return 'text-destructive bg-destructive/10 dark:bg-red-900/30 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return '예정';
      case 'ongoing': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return '알 수 없음';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = dateString === today.toISOString().split('T')[0];

    return isToday ? '오늘' : date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-xl h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <span className="ml-2 text-gray-500 dark:text-gray-400">강의 일정을 불러오는 중...</span>
      </div>
    );
  }

  if (lectures.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <CalendarDaysIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {formatDate(date)} 강의 일정이 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {date === new Date().toISOString().split('T')[0] ?
              '오늘은 강의가 없는 날입니다. 복습이나 과제를 진행해보세요.' :
              '해당 날짜에는 예정된 강의가 없습니다.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
              📚 {formatDate(date)} 강의 일정
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              총 {lectures.length}개의 강의가 예정되어 있습니다.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-xl">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 강의 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lectures.map((lecture) => (
          <div
            key={lecture.id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => setSelectedLecture(lecture)}
          >
            {/* 강의 헤더 */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
                    {lecture.courseCode}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${getStatusColor(lecture.status)}`}>
                    {getStatusLabel(lecture.status)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {lecture.courseName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lecture.session}차시 / {lecture.totalSessions}차시
                </p>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                <ChevronRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
            </div>

            {/* 시간 및 장소 */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <ClockIcon className="h-4 w-4 mr-2.5 text-gray-400 dark:text-gray-500" />
                <span className="font-medium">{lecture.startTime} - {lecture.endTime}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPinIcon className="h-4 w-4 mr-2.5 text-gray-400 dark:text-gray-500" />
                <span className="font-medium">{lecture.room} {lecture.building && `(${lecture.building})`}</span>
              </div>
            </div>

            {/* 강사 및 운영자 */}
            <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <UserIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <span className="truncate">강사: <span className="font-medium text-gray-900 dark:text-white">{lecture.instructor.name}</span></span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CogIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <span className="truncate">운영: <span className="font-medium text-gray-900 dark:text-white">{lecture.operator.name}</span></span>
              </div>
            </div>

            {/* 주요 주제 미리보기 */}
            <div className="mb-4">
              <div className="flex items-center text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                <BookOpenIcon className="h-4 w-4 mr-2" />
                오늘의 주제
              </div>
              <div className="space-y-1">
                {lecture.topics.slice(0, 2).map((topic, index) => (
                  <div key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                    <span className="mr-2 text-gray-400">•</span>
                    <span>{topic}</span>
                  </div>
                ))}
                {lecture.topics.length > 2 && (
                  <div className="ml-4 text-xs font-medium text-gray-500 dark:text-gray-500 mt-1">
                    외 {lecture.topics.length - 2}개 주제
                  </div>
                )}
              </div>
            </div>

            {/* 중요 공지사항 */}
            {lecture.announcement && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
                <div className="flex items-start">
                  <ExclamationCircleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>공지:</strong> {lecture.announcement}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 상세 모달 */}
      {selectedLecture && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedLecture(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
                      {selectedLecture.courseCode}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${getStatusColor(selectedLecture.status)}`}>
                      {getStatusLabel(selectedLecture.status)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedLecture.courseName}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {selectedLecture.session}차시 / {selectedLecture.totalSessions}차시
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLecture(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">시간 및 장소</h3>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <ClockIcon className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" />
                      <span className="font-medium">{selectedLecture.startTime} - {selectedLecture.endTime}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <MapPinIcon className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" />
                      <span className="font-medium">{selectedLecture.room} {selectedLecture.building && `(${selectedLecture.building})`}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">담당자 정보</h3>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                    <div>
                      <div className="flex items-center text-sm mb-1 text-gray-900 dark:text-white">
                        <UserIcon className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" />
                        <span className="font-medium">강사: {selectedLecture.instructor.name}</span>
                      </div>
                      {selectedLecture.instructor.phone && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-8">
                          <PhoneIcon className="h-3 w-3 mr-1.5" />
                          {selectedLecture.instructor.phone}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center text-sm mb-1 text-gray-900 dark:text-white">
                        <CogIcon className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" />
                        <span className="font-medium">운영: {selectedLecture.operator.name}</span>
                      </div>
                      {selectedLecture.operator.phone && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-8">
                          <PhoneIcon className="h-3 w-3 mr-1.5" />
                          {selectedLecture.operator.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 학습 내용 */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-4 flex items-center">
                  <BookOpenIcon className="h-5 w-5 mr-2 text-blue-500" />
                  학습 주제
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedLecture.topics.map((topic, index) => (
                    <div key={index} className="flex items-center text-sm p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                      <CheckCircleIcon className="h-5 w-5 mr-3 text-blue-500 dark:text-blue-400" />
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 준비물 */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-4">🎒 준비물</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedLecture.materials.map((material, index) => (
                    <div key={index} className="flex items-center text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-3"></span>
                      <span className="text-gray-700 dark:text-gray-300">{material}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 과제 */}
              {selectedLecture.homework && (
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-4">📝 과제</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{selectedLecture.homework}</p>
                  </div>
                </div>
              )}

              {/* 공지사항 */}
              {selectedLecture.announcement && (
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-4">📢 공지사항</h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">{selectedLecture.announcement}</p>
                  </div>
                </div>
              )}

              {/* 평가 방법 */}
              {selectedLecture.evaluationMethod && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-4">📊 평가 방법</h3>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">{selectedLecture.evaluationMethod}</p>
                  </div>
                </div>
              )}
            </div>
            {/* 모달 하단 버튼 */}
            <div className="sticky bottom-0 p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setSelectedLecture(null)}
                className="btn-secondary"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayLecture;