import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { InstructorPhotoUpload } from '../common/InstructorPhotoUpload';
import { instructorProfileService } from '../../services/instructor-profile.service';

const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    department: user.department || '',
    position: user.position || '',
  });

  // 강사 프로필 사진 로드
  useEffect(() => {
    if (user.role === 'instructor') {
      loadInstructorPhoto();
    }
  }, [user.role, user.id]);

  const loadInstructorPhoto = async () => {
    try {
      const profile = await instructorProfileService.getByUserId(user.id);
      if (profile?.profile_photo_url) {
        setProfilePhotoUrl(profile.profile_photo_url);
      }
    } catch (error) {
      console.error('Failed to load instructor photo:', error);
    }
  };

  const handleSave = () => {
    // TODO: API 호출로 저장
    console.log('저장:', formData);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold">
              {profilePhotoUrl && user.role === 'instructor' ? (
                <img
                  src={profilePhotoUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              <p className="text-muted-foreground">{user.employee_id}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
          >
            {isEditing ? '취소' : '✏️ 수정'}
          </button>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span>
          기본 정보
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                이름
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-foreground"
                />
              ) : (
                <p className="text-foreground">{user.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                사원번호
              </label>
              <p className="text-foreground">{user.employee_id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                이메일
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-foreground"
                />
              ) : (
                <p className="text-foreground">{user.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                연락처
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-foreground"
                />
              ) : (
                <p className="text-foreground">{user.phone || '-'}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                부서
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-foreground"
                />
              ) : (
                <p className="text-foreground">{user.department || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                직급
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-foreground"
                />
              ) : (
                <p className="text-foreground">{user.position || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
            >
              저장
            </button>
          </div>
        )}
      </div>

      {/* 강사 프로필 사진 (강사만 표시) */}
      {user.role === 'instructor' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="text-xl">📸</span>
            프로필 사진
          </h2>
          <InstructorPhotoUpload
            userId={user.id}
            currentPhotoUrl={profilePhotoUrl}
            onUploadSuccess={(photoUrl) => {
              console.log('✅ 사진 업로드 성공:', photoUrl);
              setProfilePhotoUrl(photoUrl);
            }}
            onUploadError={(error) => {
              console.error('❌ 사진 업로드 실패:', error);
              alert(`사진 업로드 실패: ${error.message}`);
            }}
          />
        </div>
      )}

      {/* 계정 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-xl">🔐</span>
          계정 정보
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                역할
              </label>
              <p className="text-foreground">
                {user.role === 'admin' ? '👑 관리자' : user.role === 'instructor' ? '👨‍🏫 강사' : '🎓 교육생'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                계정 상태
              </label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:bg-green-900 dark:text-green-200">
                ● 활성
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              입사일
            </label>
            <p className="text-foreground">
              {user.hire_date ? new Date(user.hire_date).toLocaleDateString('ko-KR') : '-'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              마지막 로그인
            </label>
            <p className="text-foreground">
              {user.last_login ? new Date(user.last_login).toLocaleString('ko-KR') : '-'}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline rounded-full">
            비밀번호 변경
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
