import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  FunnelIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CourseEnrollmentService } from '../../services/course-enrollment.service';
import type {
  TraineeSearchFilter,
  TraineeSearchResult
} from '../../types/course-enrollment.types';
import type { Course } from '../../types/course.types';
import toast from 'react-hot-toast';

interface TraineeSelectorProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onEnrollTrainees: (traineeIds: string[]) => void;
  excludeEnrolledTrainees?: boolean;
}

const TraineeSelector: React.FC<TraineeSelectorProps> = ({
  course,
  isOpen,
  onClose,
  onEnrollTrainees,
  excludeEnrolledTrainees = true
}) => {
  const [searchResult, setSearchResult] = useState<TraineeSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTrainees, setSelectedTrainees] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState<TraineeSearchFilter>({
    search_term: '',
    department: '',
    sort_by: 'name',
    sort_order: 'asc',
    page: 1,
    limit: 20,
    exclude_enrolled_in_course: excludeEnrolledTrainees ? course.id : undefined
  });
  const [showFilters, setShowFilters] = useState(false);

  // 부서 목록 (실제로는 API에서 조회)
  const departments = [
    '영업1팀', '영업2팀', '영업3팀',
    '마케팅팀', '기획팀', '인사팀',
    '재무팀', '개발팀', 'CS팀'
  ];

  // 교육생 검색
  const searchTrainees = async (resetPage = false) => {
    try {
      setLoading(true);

      const filter = resetPage
        ? { ...searchFilter, page: 1 }
        : searchFilter;

      const result = await CourseEnrollmentService.searchAvailableTrainees(filter);
      setSearchResult(result);

      if (resetPage) {
        setSearchFilter(prev => ({ ...prev, page: 1 }));
      }

    } catch (error) {
      console.error('Failed to search trainees:', error);
      toast.error('교육생 검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 및 필터 변경 시 검색
  useEffect(() => {
    if (isOpen) {
      searchTrainees(true);
    }
  }, [isOpen, searchFilter.search_term, searchFilter.department, searchFilter.sort_by, searchFilter.sort_order]);

  // 페이지 변경 시 검색
  useEffect(() => {
    if (isOpen && (searchFilter.page || 1) > 1) {
      searchTrainees();
    }
  }, [searchFilter.page]);

  // 검색어 변경 핸들러 (디바운싱)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        searchTrainees(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchFilter.search_term]);

  // 교육생 선택/해제
  const toggleTraineeSelection = (traineeId: string) => {
    const newSelected = new Set(selectedTrainees);
    if (newSelected.has(traineeId)) {
      newSelected.delete(traineeId);
    } else {
      newSelected.add(traineeId);
    }
    setSelectedTrainees(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (!searchResult?.trainees) return;

    const eligibleTrainees = searchResult.trainees.filter(t => t.is_eligible);
    const allEligibleSelected = eligibleTrainees.every(t => selectedTrainees.has(t.id));

    const newSelected = new Set(selectedTrainees);
    if (allEligibleSelected) {
      eligibleTrainees.forEach(t => newSelected.delete(t.id));
    } else {
      eligibleTrainees.forEach(t => newSelected.add(t.id));
    }
    setSelectedTrainees(newSelected);
  };

  // 배정 가능한 인원 계산
  const availableSpots = course.max_trainees - course.current_trainees;
  const selectedCount = selectedTrainees.size;
  const willExceedCapacity = selectedCount > availableSpots;

  // 배정 실행
  const handleEnrollment = () => {
    if (selectedCount === 0) {
      toast.error('배정할 교육생을 선택해주세요.');
      return;
    }

    onEnrollTrainees(Array.from(selectedTrainees));
    handleClose();
  };

  // 모달 닫기
  const handleClose = () => {
    setSelectedTrainees(new Set());
    setSearchFilter({
      search_term: '',
      department: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: 20,
      exclude_enrolled_in_course: excludeEnrolledTrainees ? course.id : undefined
    });
    onClose();
  };

  // 페이지 이동
  const goToPage = (page: number) => {
    setSearchFilter(prev => ({ ...prev, page }));
  };

  if (!isOpen) return null;

  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">교육생 배정</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {course.name} - 현재 {course.current_trainees}/{course.max_trainees}명
              ({availableSpots}자리 남음)
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 검색 및 필터 */}
        {/* 검색 및 필터 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          <div className="flex flex-col space-y-4">
            {/* 검색바 */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="이름, 이메일, 사번으로 검색..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base"
                value={searchFilter.search_term}
                onChange={(e) => setSearchFilter(prev => ({ ...prev, search_term: e.target.value }))}
              />
            </div>

            {/* 필터 토글 */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                상세 필터
                {showFilters ? (
                  <ChevronUpIcon className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>

              {/* 선택된 교육생 정보 */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedCount}명</span> 선택됨
                {willExceedCapacity && (
                  <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                    (정원 {availableSpots - selectedCount}명 초과)
                  </span>
                )}
              </div>
            </div>

            {/* 확장 필터 */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">부서</label>
                  <select
                    value={searchFilter.department}
                    onChange={(e) => setSearchFilter(prev => ({ ...prev, department: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">전체 부서</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">정렬 기준</label>
                  <select
                    value={searchFilter.sort_by}
                    onChange={(e) => setSearchFilter(prev => ({ ...prev, sort_by: e.target.value as any }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="name">이름</option>
                    <option value="department">부서</option>
                    <option value="created_at">입사일</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">정렬 순서</label>
                  <select
                    value={searchFilter.sort_order}
                    onChange={(e) => setSearchFilter(prev => ({ ...prev, sort_order: e.target.value as 'asc' | 'desc' }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="asc">오름차순</option>
                    <option value="desc">내림차순</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 교육생 목록 */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800" style={{ maxHeight: '400px' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">교육생을 검색하는 중...</span>
            </div>
          ) : !searchResult || searchResult.trainees.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>검색 결과가 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 전체 선택 헤더 */}
              <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={searchResult.trainees.filter(t => t.is_eligible).every(t => selectedTrainees.has(t.id))}
                      onChange={() => { }} // onClick으로 처리
                      className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 mr-2 bg-white dark:bg-gray-700"
                    />
                    전체 선택 (배정 가능: {searchResult.trainees.filter(t => t.is_eligible).length}명)
                  </button>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    총 {searchResult.total_count}명
                  </div>
                </div>
              </div>

              {/* 교육생 목록 */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {searchResult.trainees.map((trainee) => (
                  <div
                    key={trainee.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!trainee.is_eligible ? 'opacity-50' : ''
                      } ${selectedTrainees.has(trainee.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTrainees.has(trainee.id)}
                        onChange={() => toggleTraineeSelection(trainee.id)}
                        disabled={!trainee.is_eligible}
                        className="h-5 w-5 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 mr-4 bg-white dark:bg-gray-700"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">{trainee.name}</h4>
                              {trainee.department && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                  {trainee.department}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              {trainee.email} {trainee.employee_id && `• ${trainee.employee_id}`}
                            </div>
                            <div className="flex flex-wrap items-center mt-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                              <span>수강 중: <span className="text-gray-900 dark:text-gray-200 font-medium">{trainee.current_enrollments}</span>개</span>
                              <span>완료: <span className="text-gray-900 dark:text-gray-200 font-medium">{trainee.completed_courses}</span>개</span>
                              {trainee.average_score && (
                                <span>평균: <span className="text-gray-900 dark:text-gray-200 font-medium">{trainee.average_score}</span>점</span>
                              )}
                            </div>
                          </div>

                          <div className="text-left sm:text-right flex-shrink-0">
                            {!trainee.is_eligible && trainee.eligibility_reason && (
                              <div className="flex items-center text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                                <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                {trainee.eligibility_reason}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {searchResult.total_count > (searchFilter.limit || 20) && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => goToPage((searchFilter.page || 1) - 1)}
                      disabled={!searchResult.has_previous}
                      className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      이전
                    </button>

                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {searchFilter.page || 1} / {Math.ceil(searchResult.total_count / (searchFilter.limit || 20))} 페이지
                    </span>

                    <button
                      onClick={() => goToPage((searchFilter.page || 1) + 1)}
                      disabled={!searchResult.has_next}
                      className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 액션 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          {willExceedCapacity && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <div className="flex items-center">
                <InformationCircleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  선택한 인원이 정원을 {selectedCount - availableSpots}명 초과합니다.
                  초과 인원은 대기자 목록에 추가됩니다.
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleEnrollment}
              disabled={selectedCount === 0 || loading}
              className="btn-base btn-primary"
            >
              <UserPlusIcon className="h-5 w-5 mr-1.5" />
              {selectedCount}명 배정하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraineeSelector;