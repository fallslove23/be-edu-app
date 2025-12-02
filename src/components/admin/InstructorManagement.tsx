'use client';

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
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';
import { instructorProfileService } from '../../services/instructor-profile.service';
import { subjectService, instructorSubjectService } from '../../services/subject.service';
import { supabase } from '../../services/supabase';
import { InstructorPhotoUpload } from '../common/InstructorPhotoUpload';
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

export function InstructorManagement() {
  const [instructors, setInstructors] = useState<InstructorWithProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
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

  // 과목 검색 및 필터 상태
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

      console.log('💾 프로필 저장 시작:', {
        userId: selectedInstructor.id,
        hasProfile: !!selectedInstructor.profile,
        bio: profileForm.bio,
        selectedSubjects: Array.from(selectedSubjects.entries())
      });

      // 1. 프로필 저장
      if (selectedInstructor.profile) {
        console.log('📝 프로필 업데이트 중...');
        await instructorProfileService.update(selectedInstructor.id, {
          bio: profileForm.bio,
        });
        console.log('✅ 프로필 업데이트 완료');
      } else {
        console.log('➕ 프로필 생성 중...');
        await instructorProfileService.create({
          user_id: selectedInstructor.id,
          bio: profileForm.bio,
        });
        console.log('✅ 프로필 생성 완료');
      }

      // 2. 기존 과목 제거
      console.log('🗑️ 기존 과목 제거 중...');
      await instructorSubjectService.removeAllByInstructor(selectedInstructor.id);
      console.log('✅ 기존 과목 제거 완료');

      // 3. 새 과목 추가
      console.log('➕ 새 과목 추가 중...', selectedSubjects.size, '개');
      for (const [subjectId, proficiency] of selectedSubjects.entries()) {
        await instructorSubjectService.assign({
          instructor_id: selectedInstructor.id,
          subject_id: subjectId,
          proficiency_level: proficiency,
        });
      }
      console.log('✅ 새 과목 추가 완료');

      alert('프로필이 저장되었습니다.');
      setShowProfileModal(false);
      setSelectedInstructor(null);
      setSelectedSubjects(new Map());
      await loadData();
      console.log('✅ 프로필 저장 완료');
    } catch (error: any) {
      console.error('❌ 프로필 저장 실패:', error);
      console.error('에러 상세:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      setError(error.message || '프로필 저장에 실패했습니다.');
      alert(`프로필 저장 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  // 과목 토글
  const toggleSubject = (subjectId: string) => {
    const newMap = new Map(selectedSubjects);
    if (newMap.has(subjectId)) {
      newMap.delete(subjectId);
    } else {
      newMap.set(subjectId, 'intermediate'); // 기본값으로 설정 (DB 호환성 유지)
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

    // 검색 및 필터 초기화
    setSubjectSearchTerm('');
    setSelectedCategory('all');

    setShowProfileModal(true);
  };

  // 과목 필터링
  const filteredSubjects = subjects.filter((subject) => {
    // 카테고리 필터
    if (selectedCategory !== 'all' && subject.category !== selectedCategory) {
      return false;
    }

    // 검색어 필터
    if (subjectSearchTerm) {
      const searchLower = subjectSearchTerm.toLowerCase();
      return (
        subject.name.toLowerCase().includes(searchLower) ||
        subject.category?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // 선택된 과목과 미선택 과목 분리
  const selectedSubjectsList = filteredSubjects.filter((s) => selectedSubjects.has(s.id));
  const unselectedSubjectsList = filteredSubjects.filter((s) => !selectedSubjects.has(s.id));

  // 카테고리 목록 추출
  const categories = Array.from(new Set(subjects.map((s) => s.category).filter(Boolean)));;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">강사 관리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            강사 계정 및 프로필 통합 관리
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5" />
          강사 추가
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 dark:bg-red-900/20 border border-destructive/50 dark:border-red-800 rounded-lg">
          <p className="text-sm text-destructive dark:text-red-400">{error}</p>
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
                    <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                      {instructor.profile?.profile_photo_url ? (
                        <img
                          src={instructor.profile.profile_photo_url}
                          alt={instructor.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                      )}
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
                          className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-primary/10 text-primary"
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
                      <StarIcon className="w-5 h-5 text-foreground" />
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
                      onClick={() => {
                        setSelectedInstructor(instructor);
                        setShowDetailModal(true);
                      }}
                      className="btn-outline py-1 h-auto text-sm"
                      title="상세 정보"
                    >
                      상세보기
                    </button>
                    <button
                      onClick={() => openEditModal(instructor)}
                      className="btn-ghost p-2 h-auto"
                      title="계정 수정"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openProfileModal(instructor)}
                      className="btn-secondary py-1 h-auto text-sm"
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
                className="btn-outline"
              >
                취소
              </button>
              <button
                onClick={handleCreateAccount}
                className="btn-primary"
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
                className="btn-outline"
              >
                취소
              </button>
              <button
                onClick={handleUpdateAccount}
                className="btn-primary"
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

                {/* 검색 및 필터 */}
                <div className="mb-4 space-y-3">
                  {/* 검색창 */}
                  <div className="relative">
                    <input
                      type="text"
                      value={subjectSearchTerm}
                      onChange={(e) => setSubjectSearchTerm(e.target.value)}
                      placeholder="과목명 또는 카테고리 검색..."
                      className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* 카테고리 필터 */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === 'all'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      전체 ({subjects.length})
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category!)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        {category} ({subjects.filter(s => s.category === category).length})
                      </button>
                    ))}
                  </div>
                </div>

                {/* 선택된 과목 (상단 고정) */}
                {selectedSubjectsList.length > 0 && (
                  <div className="mb-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      ✓ 선택된 과목 ({selectedSubjectsList.length}개)
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedSubjectsList.map((subject) => (
                        <div
                          key={subject.id}
                          className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-teal-300 dark:border-teal-700"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AcademicCapIcon className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {subject.name}
                                </span>
                                {subject.category && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    📚 {subject.category}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const newMap = new Map(selectedSubjects);
                                newMap.delete(subject.id);
                                setSelectedSubjects(newMap);
                              }}
                              className="ml-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 미선택 과목 목록 */}
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    과목 선택 ({unselectedSubjectsList.length}개)
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    {unselectedSubjectsList.length > 0 ? (
                      unselectedSubjectsList.map((subject) => (
                        <div
                          key={subject.id}
                          onClick={() => toggleSubject(subject.id)}
                          className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-teal-400 dark:hover:border-teal-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {subject.name}
                            </span>
                          </div>
                          {subject.category && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
                              📚 {subject.category}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {subjectSearchTerm || selectedCategory !== 'all'
                          ? '검색 결과가 없습니다.'
                          : '모든 과목이 선택되었습니다.'}
                      </div>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                  💡 <strong>사용 방법:</strong><br />
                  • 검색창이나 카테고리로 과목을 필터링하세요<br />
                  • 과목을 클릭하여 선택하고 숙련도를 설정하세요<br />
                  • 선택된 과목은 상단에 표시되며 X 버튼으로 제거할 수 있습니다
                </p>
              </div>

              {/* 강사 사진 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  강사 프로필 사진
                </label>
                <InstructorPhotoUpload
                  userId={selectedInstructor.id}
                  currentPhotoUrl={selectedInstructor.profile?.profile_photo_url}
                  onUploadSuccess={(photoUrl) => {
                    // 성공 시 프로필 새로고침
                    console.log('✅ 사진 업로드 성공:', photoUrl);
                    loadData();
                  }}
                  onUploadError={(error) => {
                    console.error('❌ 사진 업로드 실패:', error);
                    alert(`사진 업로드 실패: ${error.message}`);
                  }}
                />
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
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
                  className="btn-outline"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={selectedSubjects.size === 0}
                  className="btn-primary"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 강사 상세보기 모달 */}
      {showDetailModal && selectedInstructor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">강사 상세 정보</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 섹션 */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 h-20 w-20 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                      {selectedInstructor.profile?.profile_photo_url ? (
                        <img
                          src={selectedInstructor.profile.profile_photo_url}
                          alt={selectedInstructor.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-12 w-12 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedInstructor.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedInstructor.email}
                      </div>
                      {selectedInstructor.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <PhoneIcon className="w-4 h-4" />
                          {selectedInstructor.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedInstructor.profile && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg">
                        <StarIcon className="w-6 h-6 text-yellow-500" />
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedInstructor.profile.rating.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            평점
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedInstructor.profile.total_sessions}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          총 강의 횟수
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {selectedInstructor.profile?.bio && (
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedInstructor.profile.bio}
                    </p>
                  </div>
                )}
              </div>

              {/* 담당 과목 섹션 */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5" />
                  담당 과목
                </h3>
                {selectedInstructor.subjects && selectedInstructor.subjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedInstructor.subjects.map((is) => (
                      <div
                        key={is.id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {is.subject.name}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${is.proficiency_level === 'expert' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                              is.proficiency_level === 'intermediate' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                            {proficiencyLevelLabels[is.proficiency_level]}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {is.subject.category}
                        </div>
                        {is.subject.description && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {is.subject.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    담당 과목이 없습니다
                  </div>
                )}
              </div>

              {/* 강의 통계 섹션 */}
              {selectedInstructor.stats && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5" />
                    강의 통계
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedInstructor.stats.total_sessions}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        총 강의 횟수
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedInstructor.stats.total_hours.toFixed(1)}h
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        총 강의 시간
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedInstructor.stats.avg_hours_per_week?.toFixed(1) || 0}h
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        주평균 시간
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedInstructor.stats.active_courses}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        진행 중 과정
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedInstructor);
                  }}
                  className="btn-outline"
                >
                  <PencilIcon className="w-4 h-4" />
                  계정 수정
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openProfileModal(selectedInstructor);
                  }}
                  className="btn-primary"
                >
                  <UserIcon className="w-4 h-4" />
                  {selectedInstructor.profile ? '프로필 수정' : '프로필 생성'}
                </button>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-outline"
              >
                <XCircleIcon className="w-4 h-4" />
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default InstructorManagement;
