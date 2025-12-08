import React from 'react';
import {
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
import { DetailLayout, DetailSection } from '../common/DetailLayout';

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
    <DetailLayout
      title="사용자 상세 정보"
      description={`${user.name}님의 정보를 확인하고 관리합니다.`}
      onBack={onBack}
      actions={
        <button
          onClick={() => onEdit(user)}
          className="btn-primary"
        >
          <Pencil className="h-4 w-4 mr-2" />
          정보 수정
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기본 정보 */}
        <DetailSection
          title="기본 정보"
          gradientLine
          className="lg:col-span-1"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            <div className="flex-shrink-0">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center shadow-inner border border-indigo-100 dark:border-indigo-800">
                <UserIcon className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${user.status === 'active' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                    user.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
                      'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                  }`}>
                  {userStatusLabels[user.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-2">사번: {user.employee_id}</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                  user.role === 'manager' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                  {roleLabels[user.role]}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
              <Mail className="h-5 w-5 mr-3 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">이메일</div>
                <div className="text-gray-900 dark:text-white font-medium">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
              <Phone className="h-5 w-5 mr-3 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">전화번호</div>
                <div className="text-gray-900 dark:text-white font-medium">{user.phone}</div>
              </div>
            </div>
          </div>
        </DetailSection>

        {/* 회사 정보 */}
        <DetailSection
          title="회사 정보"
          gradientLine
          className="lg:col-span-1"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">부서</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white ml-6">{user.department}</div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">직급</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white ml-6">{user.position}</div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">입사일</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white ml-6">{formatDate(user.hire_date)}</div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">근속 기간</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white ml-6">
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
        </DetailSection>

        {/* 비상 연락처 (교육생만) */}
        {
          user.role === 'trainee' && user.emergency_contact && (
            <DetailSection
              title="비상 연락처"
              icon={<AlertCircle className="h-5 w-5" />}
              className="lg:col-span-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                  <label className="block text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">이름</label>
                  <div className="text-gray-900 dark:text-white font-bold text-lg">{user.emergency_contact.name}</div>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                  <label className="block text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">관계</label>
                  <div className="text-gray-900 dark:text-white font-bold text-lg">{user.emergency_contact.relationship}</div>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                  <label className="block text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">전화번호</label>
                  <div className="flex items-center text-gray-900 dark:text-white font-bold text-lg">
                    <Phone className="h-4 w-4 mr-2 text-orange-500" />
                    <span>{user.emergency_contact.phone}</span>
                  </div>
                </div>
              </div>
            </DetailSection>
          )
        }

        {/* 시스템 정보 */}
        <DetailSection
          title="시스템 정보"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">등록일</label>
              <div className="text-gray-900 dark:text-white font-medium">{formatDateTime(user.created_at)}</div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">최근 수정일</label>
              <div className="text-gray-900 dark:text-white font-medium">{formatDateTime(user.updated_at)}</div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">마지막 접속</label>
              <div className="text-gray-900 dark:text-white font-medium">
                {user.last_login ? formatDateTime(user.last_login) : '미접속'}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">권한</label>
              <div className="flex flex-wrap gap-1">
                {user.permissions && user.permissions.length > 0
                  ? user.permissions.map(p => (
                    <span key={p} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                      {p}
                    </span>
                  ))
                  : <span className="text-gray-500 text-sm">기본 권한</span>
                }
              </div>
            </div>
          </div>
        </DetailSection>
      </div >
    </DetailLayout >
  );
};

export default UserDetail;