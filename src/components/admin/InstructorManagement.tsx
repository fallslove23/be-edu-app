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
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';
import { instructorProfileService } from '../../services/instructor-profile.service';
import { subjectService, instructorSubjectService } from '../../services/subject.service';
import { supabase } from '../../services/supabase';
import { InstructorPhotoUpload } from '../common/InstructorPhotoUpload';
import modal from '@/lib/modal';
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

      await modal.success('성공', '강사 계정이 생성되었습니다.');
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

      await modal.success('성공', '강사 정보가 수정되었습니다.');
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

      await modal.success('성공', '프로필이 저장되었습니다.');
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">로딩 중...</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
        <PageHeader
          title="강사 관리"
          description="강사 계정 및 프로필 통합 관리"
          badge="Instructor Management"
        />
        <button
          onClick={openCreateModal}
          className="btn-primary w-full lg:w-auto flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          강사 추가
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* 강사 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  강사 정보
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  담당 과목
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  강의 통계
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  평가
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {instructors.map((instructor) => (
                <tr key={instructor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm">
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
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {instructor.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {instructor.email}
                        </div>
                        {instructor.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <PhoneIcon className="w-3 h-3" />
                            {instructor.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {instructor.subjects && instructor.subjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {instructor.subjects.slice(0, 3).map((is) => (
                          <span
                            key={is.id}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800"
                          >
                            {is.subject.name}
                          </span>
                        ))}
                        {instructor.subjects.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            +{instructor.subjects.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500 italic">과목 없음</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {instructor.stats ? (
                      <div className="text-sm">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {instructor.stats.total_sessions}회 강의
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 font-medium">
                          주평균 {instructor.stats.avg_hours_per_week?.toFixed(1) || 0}시간
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500 italic">통계 없음</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {instructor.profile && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 rounded-lg border border-yellow-100 dark:border-yellow-800">
                          <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {instructor.profile.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
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
                        className="btn-outline py-1.5 px-3 h-auto text-xs"
                        title="상세 정보"
                      >
                        상세보기
                      </button>
                      <button
                        onClick={() => openEditModal(instructor)}
                        className="p-2 h-auto rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="계정 수정"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openProfileModal(instructor)}
                        className="btn-secondary py-1.5 px-3 h-auto text-xs"
                      >
                        {instructor.profile ? '프로필 수정' : '프로필 생성'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {instructors.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-800">
            <div className="bg-gray-50 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="h-10 w-10 text-gray-300 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">강사가 없습니다</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              새로운 강사를 추가하여 교육 과정을 운영해보세요.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-6 btn-primary"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              첫 강사 추가하기
            </button>
          </div>
        )}
      </div>

      {/* 계정 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">강사 계정 생성</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="강사 이름 입력"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="비밀번호 입력"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
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
                계정 생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 계정 수정 모달 */}
      {showEditModal && selectedInstructor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">강사 정보 수정</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedInstructor(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
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
                수정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 생성/수정 모달 */}
      {showProfileModal && selectedInstructor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  프로필 {selectedInstructor.profile ? '수정' : '생성'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                  {selectedInstructor.name} ({selectedInstructor.email})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedInstructor(null);
                  setSelectedSubjects(new Map());
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* 강의 가능 과목 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                    강의 가능 과목 <span className="text-red-500">*</span>
                  </label>
                  {selectedSubjects.size > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                      {selectedSubjects.size}개 선택됨
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                  이 강사가 강의할 수 있는 과목을 선택하세요. 과목은 자원 관리에서 미리 등록되어야 합니다.
                </p>

                {/* 검색 및 필터 */}
                <div className="mb-4 space-y-3">
                  {/* 검색창 */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={subjectSearchTerm}
                      onChange={(e) => setSubjectSearchTerm(e.target.value)}
                      placeholder="과목명 또는 카테고리 검색..."
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium"
                    />
                  </div>

                  {/* 카테고리 필터 */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedCategory === 'all'
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      전체 ({subjects.length})
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category!)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedCategory === category
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        {category} ({subjects.filter(s => s.category === category).length})
                      </button>
                    ))}
                  </div>
                </div>

                {/* 선택된 과목 (상단 고정) */}
                {selectedSubjectsList.length > 0 && (
                  <div className="mb-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="text-sm font-bold text-teal-900 dark:text-teal-100 mb-3 flex items-center">
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      선택된 과목 ({selectedSubjectsList.length}개)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {selectedSubjectsList.map((subject) => (
                        <div
                          key={subject.id}
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-teal-200 dark:border-teal-700 shadow-sm flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center flex-shrink-0">
                              <AcademicCapIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {subject.name}
                              </div>
                              {subject.category && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                                  {subject.category}
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
                            className="ml-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 미선택 과목 목록 */}
                <div>
                  <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between">
                    <span>과목 선택 ({unselectedSubjectsList.length}개)</span>
                    <span className="text-xs text-gray-500 font-normal">터치하여 선택/해제</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50/50 dark:bg-gray-800/50">
                    {unselectedSubjectsList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {unselectedSubjectsList.map((subject) => (
                          <div
                            key={subject.id}
                            onClick={() => toggleSubject(subject.id)}
                            className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-teal-500 dark:hover:border-teal-500 hover:ring-1 hover:ring-teal-500 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 flex items-center justify-center transition-colors">
                                <AcademicCapIcon className="w-4 h-4 text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                                  {subject.name}
                                </div>
                                {subject.category && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {subject.category}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-medium">
                        {subjectSearchTerm || selectedCategory !== 'all'
                          ? '검색 결과가 없습니다.'
                          : '모든 과목이 선택되었습니다.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 강사 사진 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  강사 프로필 사진
                </label>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
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
              </div>

              {/* 소개 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  강사 소개
                </label>
                <textarea
                  value={profileForm.bio || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none transition-all placeholder-gray-400"
                  placeholder="강사님의 경력, 전문 분야, 강의 스타일 등을 소개해주세요&#10;&#10;예시:&#10;- 10년 경력의 BS 영업 전문 강사&#10;- 실무 중심의 체계적인 교육&#10;- 수강생 개별 맞춤 피드백 제공"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {profileForm.bio?.length || 0} / 500자
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedSubjects.size === 0 && (
                  <span className="flex items-center text-amber-600 dark:text-amber-400 font-bold">
                    <XCircleIcon className="w-5 h-5 mr-1" />
                    최소 1개 이상의 과목을 선택해주세요
                  </span>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">강사 상세 정보</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* 기본 정보 섹션 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-5">
                    <div className="flex-shrink-0 h-24 w-24 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-md">
                      {selectedInstructor.profile?.profile_photo_url ? (
                        <img
                          src={selectedInstructor.profile.profile_photo_url}
                          alt={selectedInstructor.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-10 w-10 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedInstructor.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center font-medium">
                        <span className="w-20 inline-block font-bold">이메일</span>
                        {selectedInstructor.email}
                      </div>
                      {selectedInstructor.phone && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center font-medium">
                          <span className="w-20 inline-block font-bold">전화번호</span>
                          {selectedInstructor.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedInstructor.profile && (
                    <div className="flex items-center justify-center md:justify-end gap-4">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 px-5 py-3 rounded-2xl border border-yellow-100 dark:border-yellow-800 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <StarIcon className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedInstructor.profile.rating.toFixed(1)}
                          </div>
                        </div>
                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          평점
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 px-5 py-3 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          {selectedInstructor.profile.total_sessions}
                        </div>
                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          총 강의
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {selectedInstructor.profile?.bio && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">소개</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed font-medium">
                      {selectedInstructor.profile.bio}
                    </p>
                  </div>
                )}
              </div>

              {/* 담당 과목 섹션 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  담당 과목
                </h3>
                {selectedInstructor.subjects && selectedInstructor.subjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedInstructor.subjects.map((is) => (
                      <div
                        key={is.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-700 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {is.subject.name}
                          </div>
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${is.proficiency_level === 'expert' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                            is.proficiency_level === 'intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                            {proficiencyLevelLabels[is.proficiency_level]}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                          {is.subject.category}
                        </div>
                        {is.subject.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 font-medium">
                            {is.subject.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 font-medium">
                    담당 과목이 없습니다
                  </div>
                )}
              </div>

              {/* 강의 통계 섹션 */}
              {selectedInstructor.stats && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    강의 통계
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedInstructor.stats.total_sessions}
                      </div>
                      <div className="text-xs font-bold text-blue-600/70 dark:text-blue-400/70 mt-1">
                        총 강의 횟수
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedInstructor.stats.total_hours.toFixed(1)}h
                      </div>
                      <div className="text-xs font-bold text-green-600/70 dark:text-green-400/70 mt-1">
                        총 강의 시간
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedInstructor.stats.avg_hours_per_week?.toFixed(1) || 0}h
                      </div>
                      <div className="text-xs font-bold text-purple-600/70 dark:text-purple-400/70 mt-1">
                        주평균 시간
                      </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-100 dark:border-orange-800/30">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {selectedInstructor.stats.weeks_taught}
                      </div>
                      <div className="text-xs font-bold text-orange-600/70 dark:text-orange-400/70 mt-1">
                        강의 활동 주간
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center flex-shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedInstructor);
                  }}
                  className="btn-outline"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  계정 수정
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openProfileModal(selectedInstructor);
                  }}
                  className="btn-primary"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  {selectedInstructor.profile ? '프로필 수정' : '프로필 생성'}
                </button>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-outline"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default React.memo(InstructorManagement);
