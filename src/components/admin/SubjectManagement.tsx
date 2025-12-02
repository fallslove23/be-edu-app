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
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';
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
      alert('과목이 생성되었습니다.');
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
      alert('과목이 수정되었습니다.');
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
    if (!confirm(`"${name}" 과목을 삭제하시겠습니까?`)) return;

    try {
      setError(null);
      await subjectService.delete(id);
      alert('과목이 삭제되었습니다.');
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
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">과목 관리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            강의 과목 등록 및 관리
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5" />
          과목 추가
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 dark:bg-red-900/20 border border-destructive/50 dark:border-red-800 rounded-lg">
          <p className="text-sm text-destructive dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="과목 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {category} ({categorySubjects.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {categorySubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <AcademicCapIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {subject.name}
                      </div>
                      {subject.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {subject.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                      <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                        {instructorCounts.get(subject.id) || 0}명
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openEditModal(subject)}
                      className="btn-ghost p-2 rounded-full"
                      title="수정"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id, subject.name)}
                      className="btn-ghost p-2 rounded-full hover:text-destructive dark:hover:text-red-400"
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
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              과목이 없습니다
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              새로운 과목을 추가해주세요.
            </p>
          </div>
        )}
      </div>

      {/* 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">과목 추가</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  과목명 *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="예: BS 영업"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  카테고리
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">선택</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="과목 설명을 입력해주세요"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">과목 수정</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  과목명 *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  카테고리
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">선택</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
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
    </PageContainer>
  );
}

export default SubjectManagement;
