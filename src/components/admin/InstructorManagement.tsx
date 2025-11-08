/**
 * 강사 통합 관리 컴포넌트 (간소화)
 * - 강사 계정 생성, 조회, 수정
 * - 강사 프로필 관리 (과목, 소개)
 */

import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  PlusIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
  StarIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { instructorProfileService } from '../../services/instructor-profile.service';
import { subjectService, instructorSubjectService } from '../../services/subject.service';
import { supabase } from '../../services/supabase';
import type {
  InstructorProfile,
  Subject,
  InstructorSubject,
  InstructorTeachingStats,
} from '../../types/integrated-schedule.types';
import { proficiencyLevelLabels } from '../../types/integrated-schedule.types';

interface InstructorWithProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile?: InstructorProfile;
  subjects?: (InstructorSubject & { subject: Subject })[];
  stats?: InstructorTeachingStats;
}

interface UserForm {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface ProfileForm {
  user_id: string;
  bio?: string;
}

export default function InstructorManagement() {
  const [instructors, setInstructors] = useState<InstructorWithProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorWithProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 계정 폼 상태
  const [userForm, setUserForm] = useState<UserForm>({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  // 프로필 폼 상태
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    user_id: '',
    bio: '',
  });

  // 과목 선택 상태
  const [selectedSubjects, setSelectedSubjects] = useState<Map<string, 'beginner' | 'intermediate' | 'expert'>>(new Map());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 모든 강사 조회
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .eq('role', 'instructor')
        .order('name');

      if (usersError) throw usersError;

      // 모든 강사 프로필 조회
      const profiles = await instructorProfileService.getAll();

      // 모든 과목 조회
      const allSubjects = await subjectService.getAll();
      setSubjects(allSubjects);

      // 강사별 과목 및 통계 조회
      const instructorsWithData: InstructorWithProfile[] = await Promise.all(
        (users || []).map(async (user) => {
          const profile = profiles.find((p) => p.user_id === user.id);

          // 강사 과목 조회
          const instructorSubjects = await instructorSubjectService.getByInstructor(user.id);

          // 강의 통계 조회
          const { data: stats } = await supabase
            .from('instructor_teaching_stats')
            .select('*')
            .eq('instructor_id', user.id)
            .single();

          return {
            ...user,
            profile,
            subjects: instructorSubjects,
            stats: stats || undefined,
          };
        })
      );

      setInstructors(instructorsWithData);
    } catch (error) {
      console.error('Failed to load instructors:', error);
      setError('강사 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 계정 생성
  const handleCreateAccount = async () => {
    try {
      setError(null);

      // 1. 사용자 계정 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('사용자 생성 실패');
      }

      // 2. users 테이블에 강사 정보 저장
      const { error: userError } = await supabase.from('users').insert([
        {
          id: authData.user.id,
          email: userForm.email,
          name: userForm.name,
          phone: userForm.phone,
          role: 'instructor',
        },
      ]);

      if (userError) throw userError;

      alert('강사 계정이 생성되었습니다.');
      setShowCreateModal(false);
      setUserForm({ name: '', email: '', password: '', phone: '' });
      await loadData();
    } catch (error: any) {
      console.error('Failed to create instructor account:', error);
      setError(error.message || '강사 계정 생성에 실패했습니다.');
    }
  };

  // 계정 수정
  const handleUpdateAccount = async () => {
    if (!selectedInstructor) return;

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
        })
        .eq('id', selectedInstructor.id);

      if (updateError) throw updateError;

      alert('강사 정보가 수정되었습니다.');
      setShowEditModal(false);
      setSelectedInstructor(null);
      await loadData();
    } catch (error: any) {
      console.error('Failed to update instructor:', error);
      setError(error.message || '강사 정보 수정에 실패했습니다.');
    }
  };

  // 프로필 생성/수정
  const handleSaveProfile = async () => {
    if (!selectedInstructor) return;

    try {
      setError(null);

      // 1. 프로필 저장
      if (selectedInstructor.profile) {
        await instructorProfileService.update(selectedInstructor.profile.id, {
          bio: profileForm.bio,
        });
      } else {
        await instructorProfileService.create({
          user_id: selectedInstructor.id,
          bio: profileForm.bio,
        });
      }

      // 2. 기존 과목 제거
      await instructorSubjectService.removeAllByInstructor(selectedInstructor.id);

      // 3. 새 과목 추가
      for (const [subjectId, proficiency] of selectedSubjects.entries()) {
        await instructorSubjectService.assign({
          instructor_id: selectedInstructor.id,
          subject_id: subjectId,
          proficiency_level: proficiency,
        });
      }

      alert('프로필이 저장되었습니다.');
      setShowProfileModal(false);
      setSelectedInstructor(null);
      setSelectedSubjects(new Map());
      await loadData();
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      setError(error.message || '프로필 저장에 실패했습니다.');
    }
  };

  // 과목 토글
  const toggleSubject = (subjectId: string, proficiency: 'beginner' | 'intermediate' | 'expert') => {
    const newMap = new Map(selectedSubjects);
    if (newMap.has(subjectId)) {
      newMap.delete(subjectId);
    } else {
      newMap.set(subjectId, proficiency);
    }
    setSelectedSubjects(newMap);
  };

  // 생성 모달 열기
  const openCreateModal = () => {
    setUserForm({ name: '', email: '', password: '', phone: '' });
    setShowCreateModal(true);
  };

  // 수정 모달 열기
  const openEditModal = (instructor: InstructorWithProfile) => {
    setSelectedInstructor(instructor);
    setUserForm({
      name: instructor.name,
      email: instructor.email,
      password: '',
      phone: instructor.phone || '',
    });
    setShowEditModal(true);
  };

  // 프로필 수정 모달 열기
  const openProfileModal = (instructor: InstructorWithProfile) => {
    setSelectedInstructor(instructor);
    setProfileForm({
      user_id: instructor.id,
      bio: instructor.profile?.bio || '',
    });

    // 현재 과목 설정
    const subjectMap = new Map();
    (instructor.subjects || []).forEach((is) => {
      subjectMap.set(is.subject_id, is.proficiency_level);
    });
    setSelectedSubjects(subjectMap);

    setShowProfileModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">강사 관리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            강사 계정 및 프로필 통합 관리
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <PlusIcon className="w-5 h-5" />
          강사 추가
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 강사 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                강사 정보
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                담당 과목
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                강의 통계
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                평가
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {instructors.map((instructor) => (
              <tr key={instructor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {instructor.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {instructor.email}
                      </div>
                      {instructor.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <PhoneIcon className="w-3 h-3" />
                          {instructor.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {instructor.subjects && instructor.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {instructor.subjects.slice(0, 3).map((is) => (
                        <span
                          key={is.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300"
                        >
                          {is.subject.name}
                        </span>
                      ))}
                      {instructor.subjects.length > 3 && (
                        <span className="text-xs text-gray-500">+{instructor.subjects.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">과목 없음</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {instructor.stats ? (
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-white">
                        {instructor.stats.total_sessions}회 강의
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        주평균 {instructor.stats.avg_hours_per_week?.toFixed(1) || 0}시간
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">통계 없음</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {instructor.profile && (
                    <div className="flex items-center gap-2">
                      <StarIcon className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {instructor.profile.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({instructor.profile.total_sessions}회)
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(instructor)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
                      title="계정 수정"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openProfileModal(instructor)}
                      className="px-3 py-1 text-sm bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded hover:bg-teal-200 dark:hover:bg-teal-800"
                    >
                      {instructor.profile ? '프로필 수정' : '프로필 생성'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {instructors.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">강사가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              새로운 강사를 추가해주세요.
            </p>
          </div>
        )}
      </div>

      {/* 계정 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">강사 계정 생성</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이름 *
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이메일 *
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  비밀번호 *
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleCreateAccount}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 계정 수정 모달 */}
      {showEditModal && selectedInstructor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">강사 정보 수정</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이름 *
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이메일 *
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedInstructor(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleUpdateAccount}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 생성/수정 모달 */}
      {showProfileModal && selectedInstructor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  프로필 {selectedInstructor.profile ? '수정' : '생성'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedInstructor.name} ({selectedInstructor.email})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedInstructor(null);
                  setSelectedSubjects(new Map());
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* 강의 가능 과목 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    강의 가능 과목 *
                  </label>
                  {selectedSubjects.size > 0 && (
                    <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                      {selectedSubjects.size}개 선택됨
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  이 강사가 강의할 수 있는 과목을 선택하세요. 과목은 자원 관리에서 미리 등록되어야 합니다.
                </p>

                {/* 선택된 과목 요약 */}
                {selectedSubjects.size > 0 && (
                  <div className="mb-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">선택된 과목</div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(selectedSubjects.entries()).map(([subjectId, proficiency]) => {
                        const subject = subjects.find(s => s.id === subjectId);
                        if (!subject) return null;
                        return (
                          <div
                            key={subjectId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 rounded-md border border-teal-300 dark:border-teal-700"
                          >
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              {subject.name}
                            </span>
                            <span className="text-xs text-teal-600 dark:text-teal-400">
                              ({proficiency === 'beginner' ? '초급' : proficiency === 'intermediate' ? '중급' : '전문가'})
                            </span>
                            <button
                              onClick={() => {
                                const newMap = new Map(selectedSubjects);
                                newMap.delete(subjectId);
                                setSelectedSubjects(newMap);
                              }}
                              className="ml-1 text-gray-400 hover:text-red-600"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {subjects.map((subject) => {
                    const proficiency = selectedSubjects.get(subject.id);
                    const isSelected = selectedSubjects.has(subject.id);

                    return (
                      <div
                        key={subject.id}
                        onClick={() => {
                          if (isSelected) {
                            const newMap = new Map(selectedSubjects);
                            newMap.delete(subject.id);
                            setSelectedSubjects(newMap);
                          } else {
                            toggleSubject(subject.id, 'intermediate');
                          }
                        }}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-sm'
                            : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AcademicCapIcon className={`w-5 h-5 ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                              {subject.name}
                            </span>
                          </div>
                          {isSelected && (
                            <CheckCircleIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          )}
                        </div>
                        {subject.category && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            📚 {subject.category}
                          </div>
                        )}
                        {isSelected && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <select
                              value={proficiency || 'intermediate'}
                              onChange={(e) =>
                                toggleSubject(subject.id, e.target.value as 'beginner' | 'intermediate' | 'expert')
                              }
                              className="w-full text-xs px-2 py-1.5 border border-teal-300 dark:border-teal-700 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                            >
                              <option value="beginner">⭐ 초급</option>
                              <option value="intermediate">⭐⭐ 중급</option>
                              <option value="expert">⭐⭐⭐ 전문가</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                  💡 과목 카드를 클릭하여 선택하고, 숙련도를 설정하세요. 다시 클릭하면 선택이 해제됩니다.
                </p>
              </div>

              {/* 소개 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  강사 소개
                </label>
                <textarea
                  value={profileForm.bio || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="강사님의 경력, 전문 분야, 강의 스타일 등을 소개해주세요&#10;&#10;예시:&#10;- 10년 경력의 BS 영업 전문 강사&#10;- 실무 중심의 체계적인 교육&#10;- 수강생 개별 맞춤 피드백 제공"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {profileForm.bio?.length || 0} / 500자
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedSubjects.size === 0 && (
                  <span className="text-amber-600 dark:text-amber-400">⚠️ 최소 1개 이상의 과목을 선택해주세요</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setSelectedInstructor(null);
                    setSelectedSubjects(new Map());
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={selectedSubjects.size === 0}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
