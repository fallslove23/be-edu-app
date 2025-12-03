/**
 * 자원 선택 컴포넌트
 * - 실시간 가용성 체크
 * - 충돌 감지 및 경고
 * - 스마트 추천
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  SparklesIcon,
  UserIcon,
  BuildingOffice2Icon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { integratedResourceService } from '@/services/integrated-resource.service';
import type { ResourceAvailability, ResourceRecommendation } from '@/services/integrated-resource.service';

interface ResourceSelectorProps {
  // 세션 정보
  sessionDate: string;
  startTime: string;
  endTime: string;
  subjectId?: string;

  // 선택된 자원
  selectedInstructorId?: string;
  selectedClassroomId?: string;

  // 콜백
  onInstructorChange: (instructorId: string) => void;
  onClassroomChange: (classroomId: string) => void;

  // 옵션
  excludeSessionId?: string;
  showRecommendations?: boolean;
}

export function ResourceSelector({
  sessionDate,
  startTime,
  endTime,
  subjectId,
  selectedInstructorId,
  selectedClassroomId,
  onInstructorChange,
  onClassroomChange,
  excludeSessionId,
  showRecommendations = true,
}: ResourceSelectorProps) {
  const [instructorAvailability, setInstructorAvailability] = useState<ResourceAvailability[]>([]);
  const [classroomAvailability, setClassroomAvailability] = useState<ResourceAvailability[]>([]);
  const [recommendations, setRecommendations] = useState<ResourceRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInstructorConflicts, setShowInstructorConflicts] = useState(false);
  const [showClassroomConflicts, setShowClassroomConflicts] = useState(false);

  // 가용성 체크
  useEffect(() => {
    if (!sessionDate || !startTime || !endTime) return;

    const checkAvailability = async () => {
      setLoading(true);
      try {
        // 강사 가용성 체크
        const instructors = await integratedResourceService.checkResourceAvailability(
          sessionDate,
          startTime,
          endTime,
          'instructor',
          excludeSessionId
        );
        setInstructorAvailability(instructors);

        // 강의실 가용성 체크
        const classrooms = await integratedResourceService.checkResourceAvailability(
          sessionDate,
          startTime,
          endTime,
          'classroom',
          excludeSessionId
        );
        setClassroomAvailability(classrooms);

        // 추천 가져오기
        if (showRecommendations && subjectId) {
          const recs = await integratedResourceService.recommendResources(
            subjectId,
            sessionDate,
            startTime,
            endTime
          );
          setRecommendations(recs);
        }
      } catch (error) {
        console.error('자원 가용성 체크 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, [sessionDate, startTime, endTime, subjectId, excludeSessionId, showRecommendations]);

  // 가용성 상태 아이콘
  const getAvailabilityIcon = (resource: ResourceAvailability) => {
    if (resource.isAvailable) {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    } else if (resource.conflicts && resource.conflicts.length > 0) {
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    }
    return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
  };

  // 선택된 강사의 충돌 정보
  const selectedInstructorConflicts = instructorAvailability.find(
    (i) => i.id === selectedInstructorId
  )?.conflicts;

  // 선택된 강의실의 충돌 정보
  const selectedClassroomConflicts = classroomAvailability.find(
    (c) => c.id === selectedClassroomId
  )?.conflicts;

  return (
    <div className="space-y-6">
      {/* 로딩 상태 */}
      {loading && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            자원 가용성을 확인하고 있습니다...
          </p>
        </div>
      )}

      {/* 추천 섹션 */}
      {showRecommendations && recommendations && !loading && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-purple-900 dark:text-purple-300">
              스마트 추천
            </h3>
          </div>

          {recommendations.instructors.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-purple-800 dark:text-purple-300 mb-2">
                👨‍🏫 추천 강사 (경험 기반):
              </p>
              <div className="space-y-1">
                {recommendations.instructors.slice(0, 3).map((instructor) => (
                  <button
                    key={instructor.id}
                    onClick={() => onInstructorChange(instructor.id)}
                    className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-gray-800 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <span className="font-medium">{instructor.name}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      - {instructor.reason}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {recommendations.classrooms.length > 0 && (
            <div>
              <p className="text-sm text-purple-800 dark:text-purple-300 mb-2">
                🏢 사용 가능한 강의실:
              </p>
              <div className="flex flex-wrap gap-2">
                {recommendations.classrooms.slice(0, 5).map((classroom) => (
                  <button
                    key={classroom.id}
                    onClick={() => onClassroomChange(classroom.id)}
                    className="px-3 py-1 text-sm bg-white dark:bg-gray-800 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    {classroom.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 강사 선택 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            강사 선택
          </label>
        </div>

        <div className="space-y-2">
          {instructorAvailability.map((instructor) => (
            <div
              key={instructor.id}
              className={`p-3 border rounded-xl transition-all cursor-pointer ${selectedInstructorId === instructor.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              onClick={() => onInstructorChange(instructor.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getAvailabilityIcon(instructor)}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {instructor.name}
                    </div>
                    {!instructor.isAvailable && instructor.conflicts && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {instructor.conflicts.length}개 일정과 충돌
                      </div>
                    )}
                    {instructor.isAvailable && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        사용 가능
                      </div>
                    )}
                  </div>
                </div>

                {!instructor.isAvailable && instructor.conflicts && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInstructorConflicts(instructor.id === selectedInstructorId ? !showInstructorConflicts : true);
                      onInstructorChange(instructor.id);
                    }}
                    className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    충돌 보기
                  </button>
                )}
              </div>

              {/* 충돌 상세 정보 */}
              {selectedInstructorId === instructor.id &&
                showInstructorConflicts &&
                instructor.conflicts && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">
                      충돌하는 일정:
                    </p>
                    <ul className="space-y-1">
                      {instructor.conflicts.map((conflict, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-red-800 dark:text-red-400"
                        >
                          • {conflict.course_name} ({conflict.start_time} ~ {conflict.end_time})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* 선택된 강사의 충돌 경고 */}
        {selectedInstructorConflicts && selectedInstructorConflicts.length > 0 && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-300">
                <p className="font-medium mb-1">⚠️ 일정 충돌 경고</p>
                <p>
                  선택한 강사는 이 시간에 다른 일정이 있습니다. 그래도 배정하시겠습니까?
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 강의실 선택 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BuildingOffice2Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            강의실 선택
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {classroomAvailability.map((classroom) => (
            <div
              key={classroom.id}
              className={`p-3 border rounded-xl transition-all cursor-pointer ${selectedClassroomId === classroom.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              onClick={() => onClassroomChange(classroom.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAvailabilityIcon(classroom)}
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {classroom.name}
                    </div>
                    {!classroom.isAvailable && classroom.conflicts && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        사용 중
                      </div>
                    )}
                    {classroom.isAvailable && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        사용 가능
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 충돌 상세 정보 */}
              {selectedClassroomId === classroom.id &&
                showClassroomConflicts &&
                classroom.conflicts && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <p className="text-xs font-medium text-red-900 dark:text-red-300 mb-1">
                      충돌하는 일정:
                    </p>
                    <ul className="space-y-1">
                      {classroom.conflicts.map((conflict, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-red-800 dark:text-red-400"
                        >
                          • {conflict.course_name} ({conflict.start_time} ~ {conflict.end_time})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* 선택된 강의실의 충돌 경고 */}
        {selectedClassroomConflicts && selectedClassroomConflicts.length > 0 && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-300">
                <p className="font-medium mb-1">⚠️ 강의실 충돌 경고</p>
                <p>
                  선택한 강의실은 이 시간에 다른 일정이 있습니다. 그래도 배정하시겠습니까?
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
