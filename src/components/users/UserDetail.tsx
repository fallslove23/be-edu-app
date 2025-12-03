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
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">사용자 상세 정보</h1>
              <p className="text-gray-500 mt-1">{user.name}님의 정보를 확인합니다.</p>
            </div>
          </div>
          <button
            onClick={() => onEdit(user)}
            className="px-6 py-3 btn-primary rounded-xl font-bold hover:shadow-xl transition-all flex items-center"
          >
            <Pencil className="h-5 w-5 mr-2" />
            수정
          </button>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <span className="w-1 h-6 bg-blue-600 rounded-full mr-3"></span>
          기본 정보
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-20 w-20">
                <div className="h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
                  <UserIcon className="h-10 w-10 text-blue-600" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500 mt-1 font-mono">사번: {user.employee_id}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <Mail className="h-5 w-5 mr-3 text-gray-400" />
                <span className="text-gray-700 font-medium">{user.email}</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <Phone className="h-5 w-5 mr-3 text-gray-400" />
                <span className="text-gray-700 font-medium">{user.phone}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">상태</label>
              <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl border ${user.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                user.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  user.status === 'suspended' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                {userStatusLabels[user.status]}
              </span>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">역할</label>
              <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
                user.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                  user.role === 'operator' ? 'bg-orange-100 text-orange-700' :
                    user.role === 'instructor' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                }`}>
                {roleLabels[user.role]}
              </span>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">최근 접속</label>
              <div className="flex items-center text-gray-700 bg-gray-50 px-4 py-2 rounded-xl inline-block">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">{user.last_login ? formatDateTime(user.last_login) : '미접속'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 회사 정보 */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <span className="w-1 h-6 bg-blue-600 rounded-full mr-3"></span>
          회사 정보
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">부서</label>
            <div className="flex items-center text-gray-900">
              <Building2 className="h-5 w-5 mr-2 text-blue-500" />
              <span className="font-bold text-lg">{user.department}</span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">직급</label>
            <div className="text-gray-900 font-bold text-lg">{user.position}</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">입사일</label>
            <div className="flex items-center text-gray-900">
              <CalendarDays className="h-5 w-5 mr-2 text-blue-500" />
              <span className="font-bold text-lg">{formatDate(user.hire_date)}</span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">재직 기간</label>
            <div className="text-gray-900 font-bold text-lg">
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
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <AlertCircle className="h-6 w-6 mr-2 text-orange-500" />
            비상 연락처
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <label className="block text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">이름</label>
              <div className="text-gray-900 font-bold text-lg">{user.emergency_contact.name}</div>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <label className="block text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">관계</label>
              <div className="text-gray-900 font-bold text-lg">{user.emergency_contact.relationship}</div>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <label className="block text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">전화번호</label>
              <div className="flex items-center text-gray-900 font-bold text-lg">
                <Phone className="h-5 w-5 mr-2 text-orange-500" />
                <span>{user.emergency_contact.phone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 시스템 정보 */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <span className="w-1 h-6 bg-gray-400 rounded-full mr-3"></span>
          시스템 정보
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="flex justify-between py-3 border-b border-gray-100">
            <label className="font-medium text-gray-500">등록일</label>
            <div className="text-gray-900 font-medium">{formatDateTime(user.created_at)}</div>
          </div>

          <div className="flex justify-between py-3 border-b border-gray-100">
            <label className="font-medium text-gray-500">최근 수정일</label>
            <div className="text-gray-900 font-medium">{formatDateTime(user.updated_at)}</div>
          </div>

          <div className="flex justify-between py-3 border-b border-gray-100">
            <label className="font-medium text-gray-500">사용자 ID</label>
            <div className="text-gray-500 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{user.id}</div>
          </div>

          <div className="flex justify-between py-3 border-b border-gray-100">
            <label className="font-medium text-gray-500">권한</label>
            <div className="text-gray-900 font-medium">
              {user.permissions && user.permissions.length > 0
                ? user.permissions.join(', ')
                : '기본 권한'
              }
            </div>
          </div>
        </div>
      </div>

      {/* 액션 영역 */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 sticky bottom-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            목록으로
          </button>
          <button
            onClick={() => onEdit(user)}
            className="px-8 py-3 btn-primary rounded-xl font-bold hover:shadow-xl transition-all flex items-center"
          >
            <Pencil className="h-5 w-5 mr-2" />
            정보 수정
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;