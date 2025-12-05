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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            공통 코드 관리
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            부서, 직급, 관계 등 시스템에서 사용하는 코드를 관리합니다
          </p>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 코드 그룹 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FolderIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  코드 그룹
                </h3>
              </div>

              <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                {loading && codeGroups.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
                    로딩 중...
                  </div>
                ) : (
                  codeGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedGroup?.id === group.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-50 dark:bg-gray-700/30 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold">{group.name}</div>
                          <div className={`text-xs mt-1 font-mono ${selectedGroup?.id === group.id
                            ? 'text-blue-100'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}>
                            {group.code}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {!group.is_active && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded font-medium">
                              비활성
                            </span>
                          )}
                          {group.is_system && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded font-medium">
                              시스템
                            </span>
                          )}
                        </div>
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* 헤더 */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedGroup.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {selectedGroup.description || '코드 목록'}
                    </p>
                  </div>
                  <button
                    onClick={showAddCodeForm}
                    disabled={showAddForm}
                    className="btn-primary py-2 px-4 text-sm flex items-center"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    코드 추가
                  </button>
                </div>

                {/* 새 코드 추가 폼 */}
                {showAddForm && (
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/30">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            코드 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newCodeForm.code}
                            onChange={(e) => setNewCodeForm({ ...newCodeForm, code: e.target.value.toUpperCase() })}
                            placeholder="예: NEW_DEPT"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            이름 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newCodeForm.name}
                            onChange={(e) => setNewCodeForm({ ...newCodeForm, name: e.target.value })}
                            placeholder="예: 신규부서"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          설명
                        </label>
                        <input
                          type="text"
                          value={newCodeForm.description}
                          onChange={(e) => setNewCodeForm({ ...newCodeForm, description: e.target.value })}
                          placeholder="코드 설명 (선택)"
                          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={addNewCode}
                          className="btn-primary py-2 px-4 text-sm flex items-center"
                        >
                          <CheckIcon className="w-4 h-4 mr-2" />
                          추가
                        </button>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="btn-outline py-2 px-4 text-sm flex items-center"
                        >
                          <XMarkIcon className="w-4 h-4 mr-2" />
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 코드 목록 */}
                <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto bg-gray-50/50 dark:bg-gray-800/50">
                  {loading && codes.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                      로딩 중...
                    </div>
                  ) : codes.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                      코드가 없습니다. 코드를 추가해보세요.
                    </div>
                  ) : (
                    codes.map((code) => (
                      <div
                        key={code.id}
                        className={`p-4 rounded-xl border transition-all ${code.is_active
                          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
                          : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 opacity-75'
                          }`}
                      >
                        {editingCode?.id === code.id ? (
                          // 편집 모드
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                  코드
                                </label>
                                <input
                                  type="text"
                                  value={code.code}
                                  disabled
                                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                  이름 <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                설명
                              </label>
                              <input
                                type="text"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button
                                onClick={saveCode}
                                className="btn-primary py-2 px-4 text-sm flex items-center"
                              >
                                <CheckIcon className="w-4 h-4 mr-2" />
                                저장
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="btn-outline py-2 px-4 text-sm flex items-center"
                              >
                                <XMarkIcon className="w-4 h-4 mr-2" />
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          // 보기 모드
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-bold text-gray-900 dark:text-white text-lg">
                                  {code.name}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-mono border border-gray-200 dark:border-gray-600">
                                  {code.code}
                                </span>
                                {code.is_system && (
                                  <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium border border-blue-100 dark:border-blue-800">
                                    시스템
                                  </span>
                                )}
                                {!code.is_active && (
                                  <span className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg font-medium border border-red-100 dark:border-red-800">
                                    비활성
                                  </span>
                                )}
                              </div>
                              {code.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                  {code.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => startEdit(code)}
                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="수정"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => toggleCodeActive(code)}
                                disabled={code.is_system && code.is_active}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${code.is_active
                                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40'
                                  : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40'
                                  } ${code.is_system && code.is_active ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {code.is_active ? '비활성화' : '활성화'}
                              </button>
                              {!code.is_system && (
                                <button
                                  onClick={() => deleteCode(code)}
                                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="삭제"
                                >
                                  <TrashIcon className="w-5 h-5" />
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <FolderIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  선택된 그룹이 없습니다
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  왼쪽 목록에서 관리할 코드 그룹을 선택해주세요
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
