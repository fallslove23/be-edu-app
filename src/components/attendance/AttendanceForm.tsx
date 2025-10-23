import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CourseService } from '../../services/course.services';
import type { Course, CourseSchedule, CourseAttendance } from '../../services/course.services';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface AttendanceFormProps {
  schedule: CourseSchedule | null;
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (attendance: CourseAttendance[]) => void;
}

interface TraineeAttendance {
  id: string;
  trainee_id: string;
  trainee_name: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  check_time?: string;
  notes?: string;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  schedule,
  course,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [trainees, setTrainees] = useState<TraineeAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 수강생 목록 로드
  useEffect(() => {
    if (isOpen && course && schedule) {
      loadTrainees();
    }
  }, [isOpen, course, schedule]);

  const loadTrainees = async () => {
    if (!course || !schedule) return;

    try {
      setLoading(true);
      setError(null);
      
      // 임시 목업 데이터 (실제로는 CourseService에서 수강생 목록을 가져올 예정)
      const mockTrainees: TraineeAttendance[] = [
        {
          id: '1',
          trainee_id: 'trainee1',
          trainee_name: '김교육생',
          status: 'present'
        },
        {
          id: '2',
          trainee_id: 'trainee2',
          trainee_name: '이학습자',
          status: 'present'
        },
        {
          id: '3',
          trainee_id: 'trainee3',
          trainee_name: '박신입',
          status: 'late'
        },
        {
          id: '4',
          trainee_id: 'trainee4',
          trainee_name: '최수강생',
          status: 'absent'
        },
        {
          id: '5',
          trainee_id: 'trainee5',
          trainee_name: '정참여자',
          status: 'excused'
        }
      ];

      setTrainees(mockTrainees);
    } catch (error) {
      console.error('Failed to load trainees:', error);
      setError('수강생 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 출석 상태 변경
  const handleStatusChange = (traineeId: string, status: TraineeAttendance['status']) => {
    setTrainees(prev => prev.map(trainee => 
      trainee.trainee_id === traineeId 
        ? { 
            ...trainee, 
            status,
            check_time: status === 'present' || status === 'late' ? new Date().toISOString() : undefined
          }
        : trainee
    ));
  };

  // 메모 변경
  const handleNotesChange = (traineeId: string, notes: string) => {
    setTrainees(prev => prev.map(trainee => 
      trainee.trainee_id === traineeId 
        ? { ...trainee, notes }
        : trainee
    ));
  };

  // 출석 저장
  const handleSubmit = async () => {
    if (!schedule || !course) return;

    try {
      setSaving(true);

      // 출석 데이터 변환
      const attendanceData: CourseAttendance[] = trainees.map(trainee => ({
        id: `${schedule.id}_${trainee.trainee_id}`,
        schedule_id: schedule.id,
        trainee_id: trainee.trainee_id,
        trainee_name: trainee.trainee_name,
        status: trainee.status,
        check_time: trainee.check_time || new Date().toISOString(),
        recorded_at: new Date().toISOString(),
        notes: trainee.notes,
        checked_by: 'current_user', // 실제로는 현재 로그인한 사용자 ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // TODO: 실제 API 호출
      console.log('Saving attendance data:', attendanceData);
      
      toast.success('출석이 성공적으로 저장되었습니다.');
      onSubmit(attendanceData);
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast.error('출석 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 출석 상태별 색상 클래스
  const getStatusClass = (status: TraineeAttendance['status']) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (status) {
      case 'present':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'late':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'absent':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'excused':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // 출석 상태 레이블
  const getStatusLabel = (status: TraineeAttendance['status']) => {
    switch (status) {
      case 'present':
        return '출석';
      case 'late':
        return '지각';
      case 'absent':
        return '결석';
      case 'excused':
        return '사유';
      default:
        return '미확인';
    }
  };

  // 출석 통계
  const getAttendanceStats = () => {
    const stats = trainees.reduce((acc, trainee) => {
      acc[trainee.status] = (acc[trainee.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      present: stats.present || 0,
      late: stats.late || 0,
      absent: stats.absent || 0,
      excused: stats.excused || 0,
      total: trainees.length
    };
  };

  if (!isOpen || !schedule || !course) return null;

  const stats = getAttendanceStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">출석 체크</h2>
            <p className="text-sm text-gray-600 mt-1">
              {course.name} - {schedule.title}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {format(parseISO(schedule.scheduled_date), 'yyyy년 MM월 dd일 (E)', { locale: ko })} •{' '}
              {schedule.start_time} - {schedule.end_time}
              {schedule.location && ` • ${schedule.location}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 출석 통계 */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              <div className="text-sm text-gray-600">출석</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
              <div className="text-sm text-gray-600">지각</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              <div className="text-sm text-gray-600">결석</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.excused}</div>
              <div className="text-sm text-gray-600">사유</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">총인원</div>
            </div>
          </div>
        </div>

        {/* 수강생 목록 */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">수강생 목록을 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-red-300" />
              <p>{error}</p>
              <button
                onClick={loadTrainees}
                className="mt-4 bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {trainees.map((trainee, index) => (
                <div key={trainee.trainee_id} className="p-6">
                  <div className="flex items-center justify-between">
                    {/* 수강생 정보 */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{trainee.trainee_name}</h4>
                        <p className="text-sm text-gray-600">ID: {trainee.trainee_id}</p>
                      </div>
                    </div>

                    {/* 출석 상태 선택 */}
                    <div className="flex items-center space-x-2">
                      {(['present', 'late', 'absent', 'excused'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(trainee.trainee_id, status)}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            trainee.status === status
                              ? getStatusClass(status)
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {getStatusLabel(status)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 메모 입력 */}
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="메모 (선택사항)"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={trainee.notes || ''}
                      onChange={(e) => handleNotesChange(trainee.trainee_id, e.target.value)}
                    />
                  </div>

                  {/* 체크 시간 */}
                  {trainee.check_time && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      체크 시간: {format(parseISO(trainee.check_time), 'HH:mm:ss')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary disabled:opacity-50"
              disabled={saving}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving || loading}
            >
              {saving ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  저장 중...
                </div>
              ) : (
                '출석 저장'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceForm;