'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Upload,
  FileDown,
  User as UserIcon,
  Phone,
  Mail,
  Building2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import type { User, UserRole, UserStatus } from '../../types/auth.types';
import { roleLabels, userStatusLabels } from '../../types/auth.types';
import UserForm from './UserForm';
import UserDetail from './UserDetail';
import BulkImportModal from './BulkImportModal';
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';
import { UserService, CreateUserData, UpdateUserData } from '../../services/user.services';

type ViewType = 'list' | 'form' | 'detail';

const UserManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<UserRole | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supabase에서 사용자 로드
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await UserService.getUsers();
      setUsers(data || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터링 로직
  useEffect(() => {
    let filtered = users;

    // 역할 탭 필터
    if (activeTab !== 'all') {
      filtered = filtered.filter(user => user.role === activeTab);
    }

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [users, activeTab, searchTerm, statusFilter]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setCurrentView('form');
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setCurrentView('form');
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setCurrentView('detail');
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      setError(null);

      if (selectedUser) {
        // 수정
        const updateData: UpdateUserData = {
          name: userData.name,
          phone: userData.phone,
          department: userData.department,
          employee_id: userData.employee_id,
          position: userData.position,
          hire_date: userData.hire_date,
          status: userData.status
        };

        await UserService.updateUser(selectedUser.id, updateData);
        alert('사용자 정보가 수정되었습니다.');
      } else {
        // 새 사용자 생성
        if (!userData.email || !userData.name || !userData.role) {
          throw new Error('이메일, 이름, 역할은 필수입니다.');
        }

        const createData: CreateUserData = {
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          department: userData.department,
          employee_id: userData.employee_id,
          position: userData.position,
          hire_date: userData.hire_date,
          status: userData.status || 'active'
        };

        await UserService.createUser(createData);
        alert('사용자가 생성되었습니다.');
      }

      setCurrentView('list');
      await loadUsers();
    } catch (err: any) {
      console.error('Failed to save user:', err);
      setError(err.message || '사용자 저장에 실패했습니다.');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`${user.name} 사용자를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      setError(null);
      await UserService.deleteUser(user.id);
      alert('사용자가 삭제되었습니다.');
      await loadUsers();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setError(err.message || '사용자 삭제에 실패했습니다.');
    }
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedUser(null);
  };

  const handleBulkImport = async (importedUsers: User[]) => {
    try {
      setError(null);

      // UserService를 사용한 일괄 생성
      const createDataList: CreateUserData[] = importedUsers.map(user => ({
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        department: user.department,
        employee_id: user.employee_id,
        position: user.position,
        hire_date: user.hire_date,
        status: user.status || 'active'
      }));

      const results = await UserService.createBulkUsers(createDataList);

      alert(`${results.success.length}명의 사용자가 추가되었습니다.${results.failed.length > 0 ? `\n실패: ${results.failed.length}명` : ''}`);
      setShowImportModal(false);
      await loadUsers();
    } catch (err: any) {
      console.error('Failed to import users:', err);
      setError(err.message || '일괄 불러오기에 실패했습니다.');
    }
  };

  // 역할별 사용자 수 계산
  const getRoleCount = (role: UserRole): number => {
    return users.filter(u => u.role === role).length;
  };

  const tabs = [
    { key: 'all' as const, label: '전체', count: users.length },
    { key: 'admin' as const, label: '관리자', count: getRoleCount('admin') },
    { key: 'manager' as const, label: '조직장', count: getRoleCount('manager') },
    { key: 'operator' as const, label: '운영', count: getRoleCount('operator') },
    { key: 'instructor' as const, label: '강사', count: getRoleCount('instructor') },
    { key: 'trainee' as const, label: '교육생', count: getRoleCount('trainee') }
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {currentView === 'form' ? (
        <UserForm
          user={selectedUser}
          onBack={handleBack}
          onSave={handleSaveUser}
        />
      ) : currentView === 'detail' && selectedUser ? (
        <UserDetail
          user={selectedUser}
          onBack={handleBack}
          onEdit={handleEditUser}
        />
      ) : (
        <div className="space-y-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          )}

          {/* 헤더 */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
            <PageHeader
              title="사용자 관리"
              description="시스템 사용자를 역할별로 관리합니다."
              badge="System Administration"
            />
            <div className="flex space-x-3 w-full lg:w-auto">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex-1 lg:flex-none btn-outline flex items-center justify-center space-x-2"
              >
                <Upload className="w-5 h-5" />
                <span>일괄 불러오기</span>
              </button>
              <button
                onClick={handleCreateUser}
                className="flex-1 lg:flex-none btn-primary flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>사용자 추가</span>
              </button>
            </div>
          </div>

          {/* 역할별 탭 메뉴 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="border-b border-gray-100 dark:border-gray-700">
              <nav className="-mb-px flex overflow-x-auto px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${activeTab === tab.key
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    {tab.label}
                    <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tab.key
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 검색 입력 */}
              <div className="flex-1 relative">
                <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름, 이메일, 사번, 부서 검색..."
                  className="pl-12 pr-4 py-3 w-full border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                {/* 상태 필터 */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
                    className="w-full md:w-48 appearance-none border border-gray-200 dark:border-gray-600 rounded-xl pl-4 pr-10 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="all">모든 상태</option>
                    {(Object.keys(userStatusLabels) as UserStatus[]).map(status => (
                      <option key={status} value={status}>{userStatusLabels[status]}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* 엑셀 내보내기 버튼 */}
                <button className="btn-outline flex items-center justify-center space-x-2 whitespace-nowrap">
                  <FileDown className="h-5 w-5" />
                  <span className="hidden sm:inline">엑셀 내보내기</span>
                </button>
              </div>

              {/* 결과 카운트 */}
              <div className="flex items-center justify-center px-6 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl min-w-[100px]">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  총 <span className="text-blue-600 dark:text-blue-400 font-bold text-lg ml-1">{filteredUsers.length}</span>명
                </span>
              </div>
            </div>
          </div>

          {/* 사용자 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      사용자 정보
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      역할/부서
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      최근 접속
                    </th>
                    <th className="px-8 py-5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <UserIcon className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg ${user.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                            user.role === 'manager' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                              user.role === 'operator' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                                user.role === 'instructor' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            }`}>
                            {roleLabels[user.role]}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <Building2 className="h-3 w-3 mr-1 text-gray-400" />
                          {user.department} <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> {user.position}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 font-mono">ID: {user.employee_id}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${user.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                          user.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' :
                            user.status === 'suspended' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                              'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                          }`}>
                          {user.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {user.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {user.status === 'suspended' && <XCircle className="w-3 h-3 mr-1" />}
                          {userStatusLabels[user.status]}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.last_login ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(user.last_login).toLocaleDateString('ko-KR')}</span>
                            <span className="text-xs text-gray-400">{new Date(user.last_login).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">미접속</span>
                        )}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="btn-outline py-1.5 px-3 h-auto text-xs"
                          >
                            상세보기
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="btn-secondary py-1.5 px-3 h-auto text-xs"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500 hover:shadow-sm transition-all"
                            title="사용자 삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-20 bg-white dark:bg-gray-800">
                <div className="bg-gray-50 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-gray-300 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">사용자가 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">새 사용자를 추가하거나 검색 조건을 변경해보세요.</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-20 bg-white dark:bg-gray-800">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">데이터를 불러오는 중...</p>
              </div>
            )}
          </div>

          {/* 일괄 불러오기 모달 */}
          <BulkImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleBulkImport}
          />
        </div>
      )}
    </PageContainer>
  );
};

export default React.memo(UserManagement);