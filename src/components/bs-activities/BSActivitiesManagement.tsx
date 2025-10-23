import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StudentActivityInput from './StudentActivityInput';
import InstructorActivityReview from './InstructorActivityReview';
import { BSActivityService } from '../../services/bs-activity.service';
import {
  CreateBSActivityData,
  ActivityFeedback
} from '../../types/bs-activity.types';
import toast from 'react-hot-toast';

const BSActivitiesManagement: React.FC = () => {
  const { user } = useAuth();

  // 사용자 역할에 따라 다른 화면 렌더링
  const isStudent = user?.role === 'trainee' || user?.role === 'student';
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin' || user?.role === 'manager';

  // 교육생용 활동 제출 핸들러
  const handleStudentSubmit = async (data: CreateBSActivityData) => {
    try {
      await BSActivityService.createActivity(data);
      toast.success(
        data.submission_status === 'submitted'
          ? '활동이 성공적으로 제출되었습니다.'
          : '활동이 임시 저장되었습니다.'
      );
    } catch (error) {
      console.error('Activity submission error:', error);
      throw error;
    }
  };

  // 강사용 피드백 제공 핸들러
  const handleProvideFeedback = async (activityId: string, feedback: ActivityFeedback) => {
    try {
      await BSActivityService.addFeedback(
        activityId,
        feedback.comment,
        feedback.score,
        feedback.reviewer_id,
        feedback.reviewer_name
      );
      toast.success('피드백이 성공적으로 제출되었습니다.');
    } catch (error) {
      console.error('Feedback submission error:', error);
      throw error;
    }
  };

  // 우수 사례 마킹 핸들러
  const handleMarkAsBestPractice = async (activityId: string, isBestPractice: boolean) => {
    try {
      await BSActivityService.markAsBestPractice(activityId, isBestPractice);
      toast.success(
        isBestPractice
          ? '우수 사례로 등록되었습니다.'
          : '우수 사례에서 제거되었습니다.'
      );
    } catch (error) {
      console.error('Best practice marking error:', error);
      throw error;
    }
  };

  // 교육생 화면
  if (isStudent) {
    return (
      <StudentActivityInput
        traineeId={user?.id || 'default-trainee-id'}
        courseId="current-course-id" // 실제로는 현재 수강중인 과정 ID를 가져와야 함
        onSubmit={handleStudentSubmit}
      />
    );
  }

  // 강사/관리자 화면
  if (isInstructor) {
    return (
      <InstructorActivityReview
        courseId="current-course-id" // 실제로는 선택한 과정 ID를 가져와야 함
        onProvideFeedback={handleProvideFeedback}
        onMarkAsBestPractice={handleMarkAsBestPractice}
      />
    );
  }

  // 역할이 명확하지 않은 경우 기본 화면
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">BS 활동 관리</h2>
        <p className="text-gray-600 mb-6">
          BS 활동 관리 페이지에 접근하려면 로그인이 필요합니다.
        </p>
        <p className="text-sm text-gray-500">
          교육생: 활동 입력 및 관리<br />
          강사/관리자: 활동 검토 및 피드백
        </p>
      </div>
    </div>
  );
};

export default BSActivitiesManagement;
