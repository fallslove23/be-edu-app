'use client';

import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import type { User, UserRole, UserStatus } from '../../types/auth.types';
import { roleLabels, userStatusLabels } from '../../types/auth.types';
import UserForm from './UserForm';
import UserDetail from './UserDetail';
import BulkImportModal from './BulkImportModal';
import { PageContainer } from '../common/PageContainer';
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

  // 기존 Mock data 제거
  /*
  useEffect(() => {
    const mockUsers: User[] = [
      // 관리자
      {
        id: '1',
        name: '김관리',
        email: 'admin@company.com',
        phone: '010-1111-1111',
        employee_id: 'ADMIN001',
        role: 'admin',
        department: 'IT팀',
        position: '팀장',
        hire_date: '2020-01-01',
        status: 'active',
        created_at: '2024-01-01T09:00:00Z',
        updated_at: '2024-01-01T09:00:00Z',
        last_login: '2024-08-11T09:00:00Z'
      },
      // 조직장
      {
        id: '2',
        name: '박조직',
        email: 'manager@company.com',
        phone: '010-2222-2222',
        employee_id: 'MGR001',
        role: 'manager',
        department: '영업본부',
        position: '본부장',
        hire_date: '2019-03-01',
        status: 'active',
        created_at: '2024-01-02T09:00:00Z',
        updated_at: '2024-01-02T09:00:00Z',
        last_login: '2024-08-10T16:30:00Z'
      },
      // 운영
      {
        id: '3',
        name: '이운영',
        email: 'operator@company.com',
        phone: '010-3333-3333',
        employee_id: 'OPR001',
        role: 'operator',
        department: '교육운영팀',
        position: '주임',
        hire_date: '2021-06-15',
        status: 'active',
        created_at: '2024-01-03T09:00:00Z',
        updated_at: '2024-01-03T09:00:00Z',
        last_login: '2024-08-11T08:45:00Z'
      },
      // 강사
      {
        id: '4',
        name: '최강사',
        email: 'instructor1@company.com',
        phone: '010-4444-4444',
        employee_id: 'INS001',
        role: 'instructor',
        department: '교육팀',
        position: '수석강사',
        hire_date: '2018-09-01',
        status: 'active',
        created_at: '2024-01-04T09:00:00Z',
        updated_at: '2024-01-04T09:00:00Z',
        last_login: '2024-08-10T17:20:00Z'
      },
      {
        id: '5',
        name: '정강사',
        email: 'instructor2@company.com',
        phone: '010-5555-5555',
        employee_id: 'INS002',
        role: 'instructor',
        department: '교육팀',
        position: '선임강사',
        hire_date: '2020-02-01',
        status: 'active',
        created_at: '2024-01-05T09:00:00Z',
        updated_at: '2024-01-05T09:00:00Z',
        last_login: '2024-08-09T14:10:00Z'
      },
      // 교육생
      {
        id: '6',
        name: '김교육',
        email: 'trainee1@company.com',
        phone: '010-6666-6666',
        employee_id: 'TRN001',
        role: 'trainee',
        department: '영업1팀',
        position: '사원',
        hire_date: '2024-01-15',
        status: 'active',
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z',
        last_login: '2024-08-11T07:30:00Z',
        emergency_contact: {
          name: '김부모',
          relationship: '부모',
          phone: '010-9999-9999'
        }
      },
      {
        id: '7',
        name: '박신입',
        email: 'trainee2@company.com',
        phone: '010-7777-7777',
        employee_id: 'TRN002',
        role: 'trainee',
        department: '영업2팀',
        position: '사원',
        hire_date: '2024-02-01',
        status: 'pending',
        created_at: '2024-02-01T09:00:00Z',
        updated_at: '2024-02-01T09:00:00Z'
      }
    ];

    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  }, []);
  */

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
    if (!confirm(`${user.name} 사용자를 삭제하시겠습니까?\\n\\n이 작업은 되돌릴 수 없습니다.`)) {
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

      alert(`${results.success.length}명의 사용자가 추가되었습니다.${results.failed.length > 0 ? `\\n실패: ${results.failed.length}명` : ''}`);
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
          <div className="text-gray-500">로딩 중...</div>
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
        <>
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* 헤더 */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center">
                  <UsersIcon className="h-6 w-6 mr-2 text-primary" />
                  사용자 관리
                </h1>
                <p className="text-muted-foreground mt-1">시스템 사용자를 역할별로 관리합니다.</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="btn-outline"
                >
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  <span>일괄 불러오기</span>
                </button>
                <button
                  onClick={handleCreateUser}
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>사용자 추가</span>
                </button>
              </div>
            </div>
          </div>

          {/* 역할별 탭 메뉴 */}
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="border-b border-border">
              <nav className="-mb-px flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                      }`}
                  >
                    {tab.label}
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === tab.key
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                      }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex flex-col md:flex-row gap-3">
              {/* 검색 입력 */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="이름, 이메일, 사번, 부서 검색..."
                  className="pl-10 pr-4 py-2.5 w-full border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* 상태 필터 */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
                className="w-full md:w-48 border border-border rounded-lg px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">모든 상태</option>
                {(Object.keys(userStatusLabels) as UserStatus[]).map(status => (
                  <option key={status} value={status}>{userStatusLabels[status]}</option>
                ))}
              </select>

              {/* 엑셀 내보내기 버튼 */}
              <button className="btn-outline">
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>엑셀 내보내기</span>
              </button>

              {/* 결과 카운트 */}
              <div className="flex items-center px-4 py-2 bg-muted/50 border border-border rounded-lg">
                <FunnelIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  총 <span className="text-primary font-semibold">{filteredUsers.length}</span>명
                </span>
              </div>
            </div>
          </div>

          {/* 사용자 목록 */}
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      사용자 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      역할/부서
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      최근 접속
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">{user.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <EnvelopeIcon className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              {user.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-destructive/10 text-destructive' :
                            user.role === 'manager' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' :
                              user.role === 'operator' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                                user.role === 'instructor' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                  'bg-primary/10 text-primary'
                            }`}>
                            {roleLabels[user.role]}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                          {user.department} / {user.position}
                        </div>
                        <div className="text-xs text-muted-foreground">사번: {user.employee_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          user.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                            user.status === 'suspended' ? 'bg-destructive/10 text-destructive' :
                              'bg-muted text-muted-foreground'
                          }`}>
                          {userStatusLabels[user.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString('ko-KR') : '미접속'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="btn-primary px-3 py-1.5 text-xs h-auto min-h-0"
                          >
                            상세보기
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="btn-outline px-3 py-1.5 text-xs h-auto min-h-0"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="사용자 삭제"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-12">
                <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">사용자가 없습니다</h3>
                <p className="mt-1 text-sm text-muted-foreground">새 사용자를 추가해보세요.</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            )}
          </div>

          {/* 일괄 불러오기 모달 */}
          <BulkImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleBulkImport}
          />
        </>
      )}
    </PageContainer>
  );
};

export default UserManagement;