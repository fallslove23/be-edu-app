'use client';

/**
 * 과목 관리 컴포넌트
 * - 과목 조회, 등록, 수정, 삭제
 * - 카테고리별 분류
 */

import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';
import modal from '@/lib/modal';
import { subjectService, instructorSubjectService } from '../../services/subject.service';
import type { Subject, SubjectCreate } from '../../types/integrated-schedule.types';

const CATEGORIES = ['이론', '실습', '세미나', '기타'];

export function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [instructorCounts, setInstructorCounts] = useState<Map<string, number>>(new Map());

  // 폼 상태
  const [form, setForm] = useState<SubjectCreate>({
    name: '',
    description: '',
    category: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subjectService.getAll();
      setSubjects(data);

      // 각 과목별 강사 수 조회
      const counts = new Map<string, number>();
      for (const subject of data) {
        const instructors = await instructorSubjectService.getBySubject(subject.id);
        counts.set(subject.id, instructors.length);
      }
      setInstructorCounts(counts);
    } catch (error: any) {
      console.error('Failed to load subjects:', error);
      setError('과목 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 과목 생성
  const handleCreate = async () => {
    try {
      setError(null);
      await subjectService.create(form);
      await modal.success('성공', '과목이 생성되었습니다.');
      setShowCreateModal(false);
      setForm({ name: '', description: '', category: '' });
      await loadData();
    } catch (error: any) {
      console.error('Failed to create subject:', error);
      setError(error.message || '과목 생성에 실패했습니다.');
    }
  };

  // 과목 수정
  const handleUpdate = async () => {
    if (!selectedSubject) return;

    try {
      setError(null);
      await subjectService.update(selectedSubject.id, form);
      await modal.success('성공', '과목이 수정되었습니다.');
      setShowEditModal(false);
      setSelectedSubject(null);
      await loadData();
    } catch (error: any) {
      console.error('Failed to update subject:', error);
      setError(error.message || '과목 수정에 실패했습니다.');
    }
  };

  // 과목 삭제
  const handleDelete = async (id: string, name: string) => {
    if (!(await modal.confirmDelete(`"${name}" 과목`))) return;

    try {
      setError(null);
      await subjectService.delete(id);
      await modal.success('성공', '과목이 삭제되었습니다.');
      await loadData();
    } catch (error: any) {
      console.error('Failed to delete subject:', error);
      setError(error.message || '과목 삭제에 실패했습니다.');
    }
  };

  // 생성 모달 열기
  const openCreateModal = () => {
    setForm({ name: '', description: '', category: '' });
    setShowCreateModal(true);
  };

  // 수정 모달 열기
  const openEditModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setForm({
      name: subject.name,
      description: subject.description || '',
      category: subject.category || '',
    });
    setShowEditModal(true);
  };

  // 필터링된 과목 목록
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || subject.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // 카테고리별 그룹화
  const groupedByCategory = filteredSubjects.reduce((acc, subject) => {
    const category = subject.category || '기타';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">과목 관리</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                강의 과목 등록 및 관리
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              과목 추가
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="과목 검색..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">전체 카테고리</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 과목 목록 (카테고리별) */}
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([category, categorySubjects]) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  <span className="w-1 h-5 bg-blue-500 rounded-full mr-3"></span>
                  {category} <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">({categorySubjects.length})</span>
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {categorySubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                        <AcademicCapIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {subject.name}
                        </div>
                        {subject.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {subject.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800/50">
                        <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
                          {instructorCounts.get(subject.id) || 0}명
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(subject)}
                        className="btn-ghost p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                        title="수정"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id, subject.name)}
                        className="btn-ghost p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                        title="삭제"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredSubjects.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <AcademicCapIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                과목이 없습니다
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                새로운 과목을 추가해주세요.
              </p>
            </div>
          )}
        </div>

        {/* 생성 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">과목 추가</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    과목명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="예: BS 영업"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    카테고리
                  </label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                    >
                      <option value="">선택</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    설명
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="과목 설명을 입력해주세요"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-outline"
                >
                  취소
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.name}
                  className="btn-primary"
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 수정 모달 */}
        {showEditModal && selectedSubject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">과목 수정</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedSubject(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    과목명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    카테고리
                  </label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                    >
                      <option value="">선택</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    설명
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedSubject(null);
                  }}
                  className="btn-outline"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={!form.name}
                  className="btn-primary"
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default SubjectManagement;
