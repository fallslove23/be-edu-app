/**
 * 공통 코드 관리 컴포넌트
 * 관리자가 부서, 직급, 관계 등의 마스터 데이터를 관리할 수 있는 UI
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';
import {
  CommonCodeService,
  CommonCodeGroup,
  CommonCode,
  CreateCodeData,
  UpdateCodeData
} from '../../services/common-code.service';

export function CommonCodeManagement() {
  const [codeGroups, setCodeGroups] = useState<CommonCodeGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CommonCodeGroup | null>(null);
  const [codes, setCodes] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 편집 상태
  const [editingCode, setEditingCode] = useState<CommonCode | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    sort_order: 0
  });

  // 새 코드 추가 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCodeForm, setNewCodeForm] = useState({
    code: '',
    name: '',
    description: '',
    sort_order: 0
  });

  // 초기 로드
  useEffect(() => {
    loadCodeGroups();
  }, []);

  // 그룹 선택 시 코드 목록 로드
  useEffect(() => {
    if (selectedGroup) {
      loadCodes(selectedGroup.code);
    }
  }, [selectedGroup]);

  // 코드 그룹 목록 조회
  const loadCodeGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const groups = await CommonCodeService.getCodeGroups(false); // 비활성 포함
      setCodeGroups(groups);

      // 첫 번째 그룹 자동 선택
      if (groups.length > 0 && !selectedGroup) {
        setSelectedGroup(groups[0]);
      }
    } catch (err: any) {
      console.error('코드 그룹 조회 실패:', err);
      setError('코드 그룹을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 코드 목록 조회
  const loadCodes = async (groupCode: string) => {
    try {
      setLoading(true);
      setError(null);
      const codeList = await CommonCodeService.getCodesByGroup(groupCode, false); // 비활성 포함
      setCodes(codeList);
    } catch (err: any) {
      console.error('코드 목록 조회 실패:', err);
      setError('코드 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 코드 편집 시작
  const startEdit = (code: CommonCode) => {
    setEditingCode(code);
    setEditForm({
      name: code.name,
      description: code.description || '',
      sort_order: code.sort_order
    });
    setShowAddForm(false);
  };

  // 코드 편집 취소
  const cancelEdit = () => {
    setEditingCode(null);
    setEditForm({ name: '', description: '', sort_order: 0 });
  };

  // 코드 저장
  const saveCode = async () => {
    if (!editingCode) return;

    try {
      setError(null);
      const updateData: UpdateCodeData = {
        name: editForm.name,
        description: editForm.description || undefined,
        sort_order: editForm.sort_order
      };

      await CommonCodeService.updateCode(editingCode.id, updateData);

      // 목록 새로고침
      if (selectedGroup) {
        await loadCodes(selectedGroup.code);
      }

      cancelEdit();
      alert('코드가 수정되었습니다.');
    } catch (err: any) {
      console.error('코드 수정 실패:', err);
      setError(err.message || '코드 수정에 실패했습니다.');
    }
  };

  // 새 코드 추가 폼 표시
  const showAddCodeForm = () => {
    setShowAddForm(true);
    setEditingCode(null);
    setNewCodeForm({
      code: '',
      name: '',
      description: '',
      sort_order: codes.length + 1
    });
  };

  // 새 코드 추가
  const addNewCode = async () => {
    if (!selectedGroup) return;
    if (!newCodeForm.code || !newCodeForm.name) {
      alert('코드와 이름은 필수입니다.');
      return;
    }

    try {
      setError(null);
      const createData: CreateCodeData = {
        group_id: selectedGroup.id,
        code: newCodeForm.code,
        name: newCodeForm.name,
        description: newCodeForm.description || undefined,
        sort_order: newCodeForm.sort_order
      };

      await CommonCodeService.createCode(createData);

      // 목록 새로고침
      await loadCodes(selectedGroup.code);

      setShowAddForm(false);
      setNewCodeForm({ code: '', name: '', description: '', sort_order: 0 });
      alert('코드가 추가되었습니다.');
    } catch (err: any) {
      console.error('코드 추가 실패:', err);
      setError(err.message || '코드 추가에 실패했습니다.');
    }
  };

  // 코드 삭제 (비활성화)
  const deleteCode = async (code: CommonCode) => {
    if (code.is_system) {
      alert('시스템 코드는 삭제할 수 없습니다.');
      return;
    }

    if (!confirm(`'${code.name}' 코드를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setError(null);
      await CommonCodeService.deleteCode(code.id);

      // 목록 새로고침
      if (selectedGroup) {
        await loadCodes(selectedGroup.code);
      }

      alert('코드가 삭제되었습니다.');
    } catch (err: any) {
      console.error('코드 삭제 실패:', err);
      setError(err.message || '코드 삭제에 실패했습니다.');
    }
  };

  // 코드 활성화/비활성화 토글
  const toggleCodeActive = async (code: CommonCode) => {
    if (code.is_system && code.is_active) {
      alert('시스템 코드는 비활성화할 수 없습니다.');
      return;
    }

    try {
      setError(null);
      await CommonCodeService.updateCode(code.id, {
        is_active: !code.is_active
      });

      // 목록 새로고침
      if (selectedGroup) {
        await loadCodes(selectedGroup.code);
      }
    } catch (err: any) {
      console.error('코드 상태 변경 실패:', err);
      setError(err.message || '코드 상태 변경에 실패했습니다.');
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            공통 코드 관리
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            부서, 직급, 관계 등 시스템에서 사용하는 코드를 관리합니다
          </p>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 코드 그룹 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FolderIcon className="w-5 h-5" />
                  코드 그룹
                </h3>
              </div>

              <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                {loading && codeGroups.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    로딩 중...
                  </div>
                ) : (
                  codeGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedGroup?.id === group.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{group.name}</div>
                          <div className={`text-xs mt-1 ${selectedGroup?.id === group.id
                            ? 'text-white/80'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}>
                            {group.code}
                          </div>
                        </div>
                        {!group.is_active && (
                          <span className="text-xs px-2 py-1 bg-gray-300 dark:bg-gray-600 rounded">
                            비활성
                          </span>
                        )}
                        {group.is_system && (
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            시스템
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 코드 목록 및 관리 */}
          <div className="lg:col-span-2">
            {selectedGroup ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                {/* 헤더 */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedGroup.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedGroup.description || '코드 목록'}
                    </p>
                  </div>
                  <button
                    onClick={showAddCodeForm}
                    disabled={showAddForm}
                    className="btn-primary py-1 px-3 text-sm flex items-center"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    코드 추가
                  </button>
                </div>

                {/* 새 코드 추가 폼 */}
                {showAddForm && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            코드 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newCodeForm.code}
                            onChange={(e) => setNewCodeForm({ ...newCodeForm, code: e.target.value.toUpperCase() })}
                            placeholder="예: NEW_DEPT"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            이름 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newCodeForm.name}
                            onChange={(e) => setNewCodeForm({ ...newCodeForm, name: e.target.value })}
                            placeholder="예: 신규부서"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          설명
                        </label>
                        <input
                          type="text"
                          value={newCodeForm.description}
                          onChange={(e) => setNewCodeForm({ ...newCodeForm, description: e.target.value })}
                          placeholder="코드 설명 (선택)"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={addNewCode}
                          className="btn-primary py-1 px-3 text-sm flex items-center"
                        >
                          <CheckIcon className="w-4 h-4 mr-1" />
                          추가
                        </button>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="btn-outline py-1 px-3 text-sm flex items-center"
                        >
                          <XMarkIcon className="w-4 h-4 mr-1" />
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 코드 목록 */}
                <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                  {loading && codes.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      로딩 중...
                    </div>
                  ) : codes.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      코드가 없습니다. 코드를 추가해보세요.
                    </div>
                  ) : (
                    codes.map((code) => (
                      <div
                        key={code.id}
                        className={`p-4 rounded-lg border ${code.is_active
                          ? 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-60'
                          }`}
                      >
                        {editingCode?.id === code.id ? (
                          // 편집 모드
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  코드
                                </label>
                                <input
                                  type="text"
                                  value={code.code}
                                  disabled
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  이름 <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                설명
                              </label>
                              <input
                                type="text"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={saveCode}
                                className="btn-primary py-1 px-3 text-sm flex items-center"
                              >
                                <CheckIcon className="w-4 h-4 mr-1" />
                                저장
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="btn-outline py-1 px-3 text-sm flex items-center"
                              >
                                <XMarkIcon className="w-4 h-4 mr-1" />
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          // 보기 모드
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {code.name}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                                  {code.code}
                                </span>
                                {code.is_system && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                    시스템
                                  </span>
                                )}
                                {!code.is_active && (
                                  <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                                    비활성
                                  </span>
                                )}
                              </div>
                              {code.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {code.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEdit(code)}
                                className="btn-ghost p-1"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleCodeActive(code)}
                                disabled={code.is_system && code.is_active}
                                className="btn-outline py-1 px-2 text-xs"
                              >
                                {code.is_active ? '비활성화' : '활성화'}
                              </button>
                              {!code.is_system && (
                                <button
                                  onClick={() => deleteCode(code)}
                                  className="btn-ghost p-1 text-destructive hover:text-destructive"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  왼쪽에서 코드 그룹을 선택해주세요
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
