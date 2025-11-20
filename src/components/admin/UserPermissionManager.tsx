import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import ValidatedInput from '../common/ValidatedInput';
import { ValidationResult } from '../../utils/validation';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'read' | 'write' | 'delete' | 'admin';
  resource: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

const UserPermissionManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // 모의 데이터 로딩
    setTimeout(() => {
      const mockPermissions: Permission[] = [
        { id: 'users.read', name: '사용자 조회', description: '사용자 목록 및 상세 정보 조회', category: 'read', resource: 'users' },
        { id: 'users.write', name: '사용자 편집', description: '사용자 정보 생성 및 수정', category: 'write', resource: 'users' },
        { id: 'users.delete', name: '사용자 삭제', description: '사용자 계정 삭제', category: 'delete', resource: 'users' },
        { id: 'students.read', name: '교육생 조회', description: '교육생 목록 및 상세 정보 조회', category: 'read', resource: 'students' },
        { id: 'students.write', name: '교육생 편집', description: '교육생 정보 생성 및 수정', category: 'write', resource: 'students' },
        { id: 'scores.read', name: '점수 조회', description: '점수 정보 조회', category: 'read', resource: 'scores' },
        { id: 'scores.write', name: '점수 편집', description: '점수 입력 및 수정', category: 'write', resource: 'scores' },
        { id: 'reports.read', name: '리포트 조회', description: '리포트 생성 및 조회', category: 'read', resource: 'reports' },
        { id: 'system.admin', name: '시스템 관리', description: '시스템 설정 및 전체 관리', category: 'admin', resource: 'system' }
      ];

      const mockRoles: Role[] = [
        {
          id: 'admin',
          name: '관리자',
          description: '시스템 전체 관리 권한',
          permissions: mockPermissions.map(p => p.id),
          isSystem: true,
          userCount: 2
        },
        {
          id: 'instructor',
          name: '강사',
          description: '교육 및 점수 관리 권한',
          permissions: ['students.read', 'students.write', 'scores.read', 'scores.write', 'reports.read'],
          isSystem: true,
          userCount: 5
        },
        {
          id: 'operator',
          name: '운영자',
          description: '교육생 관리 및 조회 권한',
          permissions: ['students.read', 'students.write', 'scores.read', 'reports.read'],
          isSystem: false,
          userCount: 3
        },
        {
          id: 'viewer',
          name: '조회자',
          description: '조회 전용 권한',
          permissions: ['students.read', 'scores.read', 'reports.read'],
          isSystem: false,
          userCount: 8
        }
      ];

      const mockUsers: User[] = [
        {
          id: 'user1',
          name: '김관리',
          email: 'admin@bs-edu.com',
          roles: ['admin'],
          isActive: true,
          lastLogin: '2025-01-26T10:30:00Z',
          createdAt: '2024-12-01T09:00:00Z'
        },
        {
          id: 'user2',
          name: '이강사',
          email: 'instructor@bs-edu.com',
          roles: ['instructor'],
          isActive: true,
          lastLogin: '2025-01-26T14:20:00Z',
          createdAt: '2024-12-15T09:00:00Z'
        },
        {
          id: 'user3',
          name: '박운영',
          email: 'operator@bs-edu.com',
          roles: ['operator'],
          isActive: true,
          lastLogin: '2025-01-25T16:45:00Z',
          createdAt: '2025-01-01T09:00:00Z'
        },
        {
          id: 'user4',
          name: '최조회',
          email: 'viewer@bs-edu.com',
          roles: ['viewer'],
          isActive: false,
          lastLogin: '2025-01-20T11:15:00Z',
          createdAt: '2025-01-10T09:00:00Z'
        }
      ];

      setPermissions(mockPermissions);
      setRoles(mockRoles);
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  };

  const handleUserStatusToggle = (userId: string) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, isActive: !user.isActive }
          : user
      )
    );
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  const handleRoleChange = (userId: string, newRoles: string[]) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, roles: newRoles }
          : user
      )
    );
  };

  const getRoleName = (roleId: string): string => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || roleId;
  };

  const getPermissionName = (permissionId: string): string => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission?.name || permissionId;
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'write': return 'bg-green-500/10 text-green-700';
      case 'delete': return 'bg-destructive/10 text-destructive';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">권한 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">🔐 권한 관리 시스템</h1>
            <p className="text-gray-600">
              사용자 권한과 역할을 관리하여 시스템 보안을 강화하세요.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setSelectedUser(null);
                setIsEditing(true);
                setShowModal(true);
              }}
              className="btn-primary px-4 py-2 rounded-full flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>새 사용자</span>
            </button>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'users', label: '사용자 관리', icon: UserGroupIcon },
            { key: 'roles', label: '역할 관리', icon: ShieldCheckIcon },
            { key: 'permissions', label: '권한 관리', icon: KeyIcon }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 rounded-full ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 사용자 관리 탭 */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              사용자 목록 ({users.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    역할
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최근 로그인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((roleId) => (
                          <span
                            key={roleId}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {getRoleName(roleId)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleUserStatusToggle(user.id)}
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-500/10 text-green-700 hover:bg-green-200'
                            : 'bg-destructive/10 text-destructive hover:bg-red-200'
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <LockOpenIcon className="h-3 w-3" />
                            <span>활성</span>
                          </>
                        ) : (
                          <>
                            <LockClosedIcon className="h-3 w-3" />
                            <span>비활성</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.lastLogin ? formatDate(user.lastLogin) : '로그인 기록 없음'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditing(true);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="편집"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-destructive hover:text-destructive"
                        title="삭제"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 역할 관리 탭 */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              역할 목록 ({roles.length})
            </h3>
            <button
              onClick={() => {
                setSelectedRole(null);
                setIsEditing(true);
                setShowModal(true);
              }}
              className="btn-success px-4 py-2 rounded-full flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>새 역할</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {roles.map((role) => (
              <div
                key={role.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-medium text-gray-900">{role.name}</h4>
                  </div>
                  {role.isSystem && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      시스템
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4">{role.description}</p>

                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                    권한 ({role.permissions.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permId) => (
                      <span
                        key={permId}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {getPermissionName(permId)}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        +{role.permissions.length - 3}개
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {role.userCount}명 사용 중
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedRole(role);
                        setIsEditing(true);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="편집"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {!role.isSystem && (
                      <button
                        onClick={() => {
                          if (window.confirm('정말로 이 역할을 삭제하시겠습니까?')) {
                            setRoles(prev => prev.filter(r => r.id !== role.id));
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                        title="삭제"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 권한 관리 탭 */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              권한 목록 ({permissions.length})
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {['read', 'write', 'delete', 'admin'].map((category) => {
                const categoryPermissions = permissions.filter(p => p.category === category);
                
                return (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                      {category === 'read' && '조회 권한'}
                      {category === 'write' && '편집 권한'}
                      {category === 'delete' && '삭제 권한'}
                      {category === 'admin' && '관리자 권한'}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryPermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {permission.name}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(permission.category)}`}>
                              {permission.resource}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{permission.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 편집 모달 (사용자/역할) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedUser ? (isEditing ? '사용자 편집' : '사용자 상세') : '새 사용자 추가'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedUser(null);
                    setSelectedRole(null);
                    setIsEditing(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* 사용자 편집 폼 */}
              {(selectedUser || !selectedRole) && (
                <div className="space-y-4">
                  <ValidatedInput
                    type="studentName"
                    value={selectedUser?.name || ''}
                    onChange={(value, validation) => {
                      // Handle user name change
                    }}
                    label="사용자 이름"
                    placeholder="이름을 입력하세요"
                    required
                  />

                  <ValidatedInput
                    type="email"
                    value={selectedUser?.email || ''}
                    onChange={(value, validation) => {
                      // Handle email change
                    }}
                    label="이메일"
                    placeholder="email@example.com"
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      역할 할당
                    </label>
                    <div className="space-y-2">
                      {roles.map((role) => (
                        <label key={role.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedUser?.roles.includes(role.id) || false}
                            onChange={(e) => {
                              if (selectedUser) {
                                const newRoles = e.target.checked
                                  ? [...selectedUser.roles, role.id]
                                  : selectedUser.roles.filter(r => r !== role.id);
                                handleRoleChange(selectedUser.id, newRoles);
                              }
                            }}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <span className="text-sm font-medium text-gray-900">{role.name}</span>
                            <p className="text-xs text-gray-500">{role.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                  setSelectedRole(null);
                  setIsEditing(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => {
                  // 저장 로직
                  setShowModal(false);
                  setSelectedUser(null);
                  setSelectedRole(null);
                  setIsEditing(false);
                }}
                className="btn-primary"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPermissionManager;