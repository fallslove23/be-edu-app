import React, { useState, useEffect } from 'react';
import { Save, Bell, AlertCircle } from 'lucide-react';
import { notificationDBService, NotificationPreference } from '../../services/notification-db.service';
import { useAuth } from '../../contexts/AuthContext';

const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [preferences, setPreferences] = useState<Partial<NotificationPreference>>({
    course_start_enabled: true,
    course_update_enabled: true,
    conflict_enabled: true,
    course_confirmed_enabled: true,
    session_change_enabled: true,
    days_before_start: 3
  });

  // 기존 설정 로드
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const data = await notificationDBService.getPreferences(user.id);
        if (data) {
          setPreferences({
            course_start_enabled: data.course_start_enabled,
            course_update_enabled: data.course_update_enabled,
            conflict_enabled: data.conflict_enabled,
            course_confirmed_enabled: data.course_confirmed_enabled,
            session_change_enabled: data.session_change_enabled,
            days_before_start: data.days_before_start
          });
        }
      } catch (error) {
        console.error('알림 설정 로드 실패:', error);
        setMessage({ type: 'error', text: '알림 설정을 불러오는데 실패했습니다.' });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.id]);

  // 설정 저장
  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setMessage(null);

    try {
      await notificationDBService.savePreferences(user.id, preferences);
      setMessage({ type: 'success', text: '알림 설정이 저장되었습니다.' });
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      setMessage({ type: 'error', text: '알림 설정 저장에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  // 설정 변경
  const handleChange = (key: keyof NotificationPreference, value: boolean | number) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* 헤더 */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">알림 설정</h2>
          </div>
          <p className="text-gray-600 mt-2">
            원하는 알림을 선택하고 설정하세요.
          </p>
        </div>

        {/* 알림 메시지 */}
        {message && (
          <div
            className={`mx-6 mt-6 p-4 rounded-full flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-500/10 text-green-700 border border-green-200'
                : 'bg-destructive/10 text-destructive border border-destructive/50'
            }`}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{message.text}</p>
          </div>
        )}

        {/* 설정 항목 */}
        <div className="p-6 space-y-6">
          {/* 과정 시작 알림 */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <h3 className="font-semibold text-gray-900">과정 시작 알림</h3>
                <p className="text-sm text-gray-600">
                  등록한 과정의 시작일이 다가오면 알림을 받습니다.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.course_start_enabled}
                onChange={(e) => handleChange('course_start_enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            {preferences.course_start_enabled && (
              <div className="ml-4 pl-4 border-l-2 border-gray-200">
                <label className="block text-sm text-gray-700 mb-2">
                  알림 받을 시기 (며칠 전)
                </label>
                <select
                  value={preferences.days_before_start}
                  onChange={(e) => handleChange('days_before_start', parseInt(e.target.value))}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1일 전</option>
                  <option value={3}>3일 전</option>
                  <option value={7}>7일 전</option>
                  <option value={14}>14일 전</option>
                </select>
              </div>
            )}
          </div>

          {/* 과정 변경 알림 */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <h3 className="font-semibold text-gray-900">과정 변경 알림</h3>
                <p className="text-sm text-gray-600">
                  등록한 과정의 정보가 변경되면 알림을 받습니다.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.course_update_enabled}
                onChange={(e) => handleChange('course_update_enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>

          {/* 일정 충돌 알림 */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <h3 className="font-semibold text-gray-900">일정 충돌 감지 알림</h3>
                <p className="text-sm text-gray-600">
                  강의실이나 강사 일정 충돌이 감지되면 알림을 받습니다.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.conflict_enabled}
                onChange={(e) => handleChange('conflict_enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>

          {/* 과정 확정 알림 */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <h3 className="font-semibold text-gray-900">과정 확정 알림</h3>
                <p className="text-sm text-gray-600">
                  과정이 확정되면 알림을 받습니다.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.course_confirmed_enabled}
                onChange={(e) => handleChange('course_confirmed_enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>

          {/* 일정 변경 알림 */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <h3 className="font-semibold text-gray-900">일정 변경 알림</h3>
                <p className="text-sm text-gray-600">
                  과정의 세부 일정이 변경되면 알림을 받습니다.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.session_change_enabled}
                onChange={(e) => handleChange('session_change_enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* 푸터 */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              알림은 브라우저 알림 권한이 허용된 경우 실시간으로 표시됩니다.
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? '저장 중...' : '설정 저장'}
            </button>
          </div>
        </div>
      </div>

      {/* 브라우저 알림 권한 요청 */}
      {typeof window !== 'undefined' && Notification.permission === 'default' && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 mb-1">
                브라우저 알림 권한이 필요합니다
              </h4>
              <p className="text-sm text-yellow-800 mb-3">
                실시간 알림을 받으려면 브라우저 알림 권한을 허용해주세요.
              </p>
              <button
                onClick={() => {
                  Notification.requestPermission().then((permission) => {
                    if (permission === 'granted') {
                      setMessage({
                        type: 'success',
                        text: '브라우저 알림 권한이 허용되었습니다.'
                      });
                    }
                  });
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 text-sm font-medium"
              >
                알림 권한 허용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
