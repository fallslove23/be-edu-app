import React from 'react';
import {
  ArrowLeft,
  Pencil,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { User } from '../../types/auth.types';
import { roleLabels, userStatusLabels } from '../../types/auth.types';

interface UserDetailProps {
  user: User;
  onBack: () => void;
  onEdit: (user: User) => void;
}

const UserDetail: React.FC<UserDetailProps> = ({ user, onBack, onEdit }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">사용자 상세 정보</h1>
              <p className="text-gray-600">{user.name}님의 정보를 확인합니다.</p>
            </div>
          </div>
          <button
            onClick={() => onEdit(user)}
            className="btn-primary"
          >
            <Pencil className="h-4 w-4 mr-2" />
            수정
          </button>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-16 w-16">
                <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500">사번: {user.employee_id}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <Mail className="h-4 w-4 mr-3 text-gray-400" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Phone className="h-4 w-4 mr-3 text-gray-400" />
                <span>{user.phone}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">상태</label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${user.status === 'active' ? 'bg-green-500/10 text-green-700' :
                user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  user.status === 'suspended' ? 'bg-destructive/10 text-destructive' :
                    'bg-gray-100 text-gray-800'
                }`}>
                {userStatusLabels[user.status]}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">역할</label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${user.role === 'admin' ? 'bg-destructive/10 text-destructive' :
                user.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                  user.role === 'operator' ? 'bg-yellow-100 text-yellow-800' :
                    user.role === 'instructor' ? 'bg-green-500/10 text-green-700' :
                      'bg-blue-100 text-blue-800'
                }`}>
                {roleLabels[user.role]}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">최근 접속</label>
              <div className="flex items-center text-gray-700">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span>{user.last_login ? formatDateTime(user.last_login) : '미접속'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 회사 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">회사 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">부서</label>
            <div className="flex items-center text-gray-900">
              <Building2 className="h-4 w-4 mr-2 text-gray-400" />
              <span className="font-medium">{user.department}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">직급</label>
            <div className="text-gray-900 font-medium">{user.position}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">입사일</label>
            <div className="flex items-center text-gray-900">
              <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
              <span>{formatDate(user.hire_date)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">재직 기간</label>
            <div className="text-gray-900">
              {(() => {
                const hireDate = new Date(user.hire_date);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - hireDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const years = Math.floor(diffDays / 365);
                const months = Math.floor((diffDays % 365) / 30);
                return `${years > 0 ? `${years}년 ` : ''}${months}개월`;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 비상 연락처 (교육생만) */}
      {user.role === 'trainee' && user.emergency_contact && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
            비상 연락처
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">이름</label>
              <div className="text-gray-900 font-medium">{user.emergency_contact.name}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">관계</label>
              <div className="text-gray-900">{user.emergency_contact.relationship}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">전화번호</label>
              <div className="flex items-center text-gray-900">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <span>{user.emergency_contact.phone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 시스템 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">시스템 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">등록일</label>
            <div className="text-gray-700">{formatDateTime(user.created_at)}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">최근 수정일</label>
            <div className="text-gray-700">{formatDateTime(user.updated_at)}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">사용자 ID</label>
            <div className="text-gray-700 font-mono text-xs">{user.id}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">권한</label>
            <div className="text-gray-700">
              {user.permissions && user.permissions.length > 0
                ? user.permissions.join(', ')
                : '기본 권한'
              }
            </div>
          </div>
        </div>
      </div>

      {/* 액션 영역 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="btn-secondary"
          >
            목록으로
          </button>
          <button
            onClick={() => onEdit(user)}
            className="btn-primary"
          >
            <Pencil className="h-4 w-4 mr-2" />
            정보 수정
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;