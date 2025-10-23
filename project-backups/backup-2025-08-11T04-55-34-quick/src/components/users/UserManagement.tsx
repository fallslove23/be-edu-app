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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import type { User, UserRole, UserStatus } from '../../types/auth.types';
import { roleLabels, userStatusLabels } from '../../types/auth.types';
import UserForm from './UserForm';
import UserDetail from './UserDetail';
import BulkImportModal from './BulkImportModal';

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

  // Mock data
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

  const handleSaveUser = (userData: Partial<User>) => {
    if (selectedUser) {
      // 수정
      const updatedUsers = users.map(u =>
        u.id === selectedUser.id ? { ...u, ...userData, updated_at: new Date().toISOString() } : u
      );
      setUsers(updatedUsers);
    } else {
      // 새 사용자 생성
      const newUser: User = {
        ...userData as User,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setUsers([...users, newUser]);
    }
    setCurrentView('list');
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedUser(null);
  };

  const handleBulkImport = (importedUsers: User[]) => {
    setUsers([...users, ...importedUsers]);
    setShowImportModal(false);
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

  if (currentView === 'form') {
    return (
      <UserForm
        user={selectedUser}
        onBack={handleBack}
        onSave={handleSaveUser}
      />
    );
  }

  if (currentView === 'detail' && selectedUser) {
    return (
      <UserDetail
        user={selectedUser}
        onBack={handleBack}
        onEdit={handleEditUser}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UsersIcon className="h-6 w-6 mr-2" />
              사용자 관리
            </h1>
            <p className="text-gray-600">시스템 사용자를 역할별로 관리합니다.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              일괄 불러오기
            </button>
            <button
              onClick={handleCreateUser}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              사용자 추가
            </button>
          </div>
        </div>
      </div>

      {/* 역할별 탭 메뉴 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="이름, 이메일, 사번, 부서 검색..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">모든 상태</option>
            {(Object.keys(userStatusLabels) as UserStatus[]).map(status => (
              <option key={status} value={status}>{userStatusLabels[status]}</option>
            ))}
          </select>

          <button className="border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors flex items-center justify-center">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            엑셀 내보내기
          </button>

          <div className="flex items-center text-sm text-gray-500">
            <FunnelIcon className="h-4 w-4 mr-1" />
            총 {filteredUsers.length}명
          </div>
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할/부서
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최근 접속
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <EnvelopeIcon className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <PhoneIcon className="h-3 w-3 mr-1" />
                          {user.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'operator' ? 'bg-yellow-100 text-yellow-800' :
                        user.role === 'instructor' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {roleLabels[user.role]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                      {user.department} / {user.position}
                    </div>
                    <div className="text-xs text-gray-400">사번: {user.employee_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {userStatusLabels[user.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString('ko-KR') : '미접속'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      상세보기
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">사용자가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">새 사용자를 추가해보세요.</p>
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
  );
};

export default UserManagement;