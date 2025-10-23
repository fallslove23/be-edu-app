import React, { useState, useEffect } from 'react';
import {
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  ServerIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  FolderIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { useNotifications, createBackupCompleteNotification, createRestoreCompleteNotification } from '../../hooks/useNotifications';

interface BackupItem {
  id: string;
  name: string;
  createdAt: string;
  size: string;
  type: 'full' | 'incremental' | 'manual';
  status: 'completed' | 'processing' | 'failed';
  description: string;
  dataTypes: string[];
  version: string;
}

interface BackupConfig {
  autoBackup: boolean;
  backupSchedule: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  includeUserData: boolean;
  includeScores: boolean;
  includeCourses: boolean;
  includeReports: boolean;
  compressionLevel: 'none' | 'standard' | 'high';
  encryptBackups: boolean;
}

const BackupRestoreSystem: React.FC = () => {
  const { addNotification } = useNotifications();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [config, setConfig] = useState<BackupConfig>({
    autoBackup: true,
    backupSchedule: 'daily',
    retentionDays: 30,
    includeUserData: true,
    includeScores: true,
    includeCourses: true,
    includeReports: true,
    compressionLevel: 'standard',
    encryptBackups: true
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'backups' | 'restore' | 'schedule'>('backups');

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = () => {
    setLoading(true);
    
    // 모의 백업 데이터
    setTimeout(() => {
      const mockBackups: BackupItem[] = [
        {
          id: 'backup_20250126_full',
          name: '전체 백업 - 2025-01-26',
          createdAt: '2025-01-26T02:00:00Z',
          size: '156.3 MB',
          type: 'full',
          status: 'completed',
          description: '모든 데이터의 완전한 백업',
          dataTypes: ['사용자', '점수', '과정', '리포트'],
          version: '1.0.0'
        },
        {
          id: 'backup_20250125_inc',
          name: '증분 백업 - 2025-01-25',
          createdAt: '2025-01-25T02:00:00Z',
          size: '23.1 MB',
          type: 'incremental',
          status: 'completed',
          description: '지난 백업 이후 변경된 데이터만 백업',
          dataTypes: ['점수', '사용자'],
          version: '1.0.0'
        },
        {
          id: 'backup_20250124_manual',
          name: '수동 백업 - 중요 업데이트 전',
          createdAt: '2025-01-24T14:30:00Z',
          size: '142.7 MB',
          type: 'manual',
          status: 'completed',
          description: '시스템 업데이트 전 수동 백업',
          dataTypes: ['사용자', '점수', '과정'],
          version: '0.9.8'
        },
        {
          id: 'backup_20250123_full',
          name: '전체 백업 - 2025-01-23',
          createdAt: '2025-01-23T02:00:00Z',
          size: '148.9 MB',
          type: 'full',
          status: 'completed',
          description: '주간 전체 백업',
          dataTypes: ['사용자', '점수', '과정', '리포트'],
          version: '0.9.8'
        },
        {
          id: 'backup_20250122_failed',
          name: '자동 백업 실패',
          createdAt: '2025-01-22T02:00:00Z',
          size: '0 MB',
          type: 'incremental',
          status: 'failed',
          description: '디스크 용량 부족으로 백업 실패',
          dataTypes: [],
          version: '0.9.8'
        }
      ];

      setBackups(mockBackups);
      setLoading(false);
    }, 800);
  };

  const createBackup = async (type: 'full' | 'incremental' | 'manual') => {
    const backupId = `backup_${Date.now()}_${type}`;
    setProcessing(backupId);
    
    try {
      // 새 백업 아이템 추가 (진행 중 상태)
      const newBackup: BackupItem = {
        id: backupId,
        name: `${type === 'full' ? '전체' : type === 'incremental' ? '증분' : '수동'} 백업 - ${new Date().toLocaleDateString('ko-KR')}`,
        createdAt: new Date().toISOString(),
        size: '진행중...',
        type,
        status: 'processing',
        description: '백업을 생성하고 있습니다...',
        dataTypes: getIncludedDataTypes(),
        version: '1.0.0'
      };

      setBackups(prev => [newBackup, ...prev]);

      // 백업 프로세스 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

      // 백업 완료 처리
      const completedBackup: BackupItem = {
        ...newBackup,
        size: `${Math.floor(Math.random() * 100 + 50)}.${Math.floor(Math.random() * 9)} MB`,
        status: 'completed',
        description: '백업이 성공적으로 완료되었습니다.'
      };

      setBackups(prev => 
        prev.map(backup => 
          backup.id === backupId ? completedBackup : backup
        )
      );

      // 성공 알림
      addNotification(createBackupCompleteNotification(completedBackup.name));

    } catch (error) {
      // 실패 처리
      setBackups(prev =>
        prev.map(backup =>
          backup.id === backupId
            ? { ...backup, status: 'failed' as const, description: '백업 생성 중 오류가 발생했습니다.' }
            : backup
        )
      );
    } finally {
      setProcessing(null);
    }
  };

  const restoreBackup = async (backup: BackupItem) => {
    if (!window.confirm(`"${backup.name}" 백업으로 복원하시겠습니까?\n\n현재 데이터는 모두 덮어씌워집니다. 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setProcessing(backup.id);
    
    try {
      // 복원 프로세스 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 2000));
      
      // 성공 알림
      addNotification(createRestoreCompleteNotification(backup.name));
      
      alert('복원이 성공적으로 완료되었습니다. 페이지를 새로고침합니다.');
      window.location.reload();

    } catch (error) {
      alert('복원 중 오류가 발생했습니다. 시스템 관리자에게 문의하세요.');
    } finally {
      setProcessing(null);
    }
  };

  const deleteBackup = (backupId: string) => {
    if (window.confirm('이 백업을 삭제하시겠습니까? 삭제된 백업은 복구할 수 없습니다.')) {
      setBackups(prev => prev.filter(backup => backup.id !== backupId));
    }
  };

  const getIncludedDataTypes = (): string[] => {
    const types: string[] = [];
    if (config.includeUserData) types.push('사용자');
    if (config.includeScores) types.push('점수');
    if (config.includeCourses) types.push('과정');
    if (config.includeReports) types.push('리포트');
    return types;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'processing': return <ClockIcon className="h-4 w-4 animate-spin" />;
      case 'failed': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full': return <ServerIcon className="h-4 w-4 text-blue-600" />;
      case 'incremental': return <DocumentDuplicateIcon className="h-4 w-4 text-green-600" />;
      case 'manual': return <FolderIcon className="h-4 w-4 text-purple-600" />;
      default: return null;
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">백업 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">💾 백업 & 복구 시스템</h1>
            <p className="text-gray-600">
              시스템 데이터를 안전하게 백업하고 필요시 복구할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowConfig(true)}
              className="border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              <span>설정</span>
            </button>
            <button
              onClick={() => createBackup('manual')}
              disabled={processing !== null}
              className={`px-4 py-2 rounded-lg text-white flex items-center space-x-2 ${
                processing !== null
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <CloudArrowUpIcon className="h-4 w-4" />
              <span>수동 백업</span>
            </button>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'backups', label: '백업 목록', icon: CloudArrowUpIcon },
            { key: 'restore', label: '복구 관리', icon: CloudArrowDownIcon },
            { key: 'schedule', label: '스케줄 설정', icon: CalendarDaysIcon }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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

      {/* 백업 목록 탭 */}
      {activeTab === 'backups' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                백업 목록 ({backups.length})
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => createBackup('full')}
                  disabled={processing !== null}
                  className={`px-3 py-1 rounded text-sm ${
                    processing !== null
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  전체 백업
                </button>
                <button
                  onClick={() => createBackup('incremental')}
                  disabled={processing !== null}
                  className={`px-3 py-1 rounded text-sm ${
                    processing !== null
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  증분 백업
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    백업 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    크기
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    데이터 유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{backup.name}</div>
                        <div className="text-sm text-gray-500">{formatDate(backup.createdAt)}</div>
                        <div className="text-xs text-gray-400">{backup.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(backup.type)}
                        <span className="text-sm text-gray-900 capitalize">
                          {backup.type === 'full' ? '전체' :
                           backup.type === 'incremental' ? '증분' : '수동'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {backup.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(backup.status)}`}>
                        {getStatusIcon(backup.status)}
                        <span>
                          {backup.status === 'completed' ? '완료' :
                           backup.status === 'processing' ? '진행중' : '실패'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {backup.dataTypes.map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {backup.status === 'completed' && (
                          <button
                            onClick={() => restoreBackup(backup)}
                            disabled={processing !== null}
                            className={`p-1 rounded ${
                              processing !== null
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title="복구"
                          >
                            <PlayIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          disabled={processing === backup.id}
                          className={`p-1 rounded ${
                            processing === backup.id
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-900'
                          }`}
                          title="삭제"
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

          {backups.length === 0 && (
            <div className="p-12 text-center">
              <CloudArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">백업이 없습니다</h3>
              <p className="text-gray-600 mb-4">
                첫 번째 백업을 생성하여 데이터를 안전하게 보관하세요.
              </p>
              <button
                onClick={() => createBackup('full')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                첫 백업 생성하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 복구 관리 탭 */}
      {activeTab === 'restore' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">복구 가이드</h3>
          
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">주의사항</h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>복구 작업은 현재 데이터를 완전히 덮어씁니다.</li>
                      <li>복구 전에 현재 상태의 백업을 생성하는 것을 권장합니다.</li>
                      <li>복구 작업 중에는 시스템을 사용할 수 없습니다.</li>
                      <li>복구 작업은 되돌릴 수 없습니다.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">복구 절차</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>복구할 백업을 선택합니다.</li>
                  <li>현재 데이터의 백업을 생성합니다 (선택사항).</li>
                  <li>복구 버튼을 클릭합니다.</li>
                  <li>확인 대화상자에서 승인합니다.</li>
                  <li>복구 완료까지 기다립니다.</li>
                </ol>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">복구 시간 예상</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">전체 백업 (150MB):</span>
                    <span className="font-medium">5-8분</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">증분 백업 (30MB):</span>
                    <span className="font-medium">2-3분</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">수동 백업 (100MB):</span>
                    <span className="font-medium">3-5분</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">복구 후 확인사항</h4>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>모든 사용자 계정이 정상적으로 복구되었는지 확인</li>
                      <li>점수 데이터의 무결성 검증</li>
                      <li>과정 정보 및 설정 확인</li>
                      <li>시스템 로그 검토</li>
                      <li>사용자 권한 및 역할 확인</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 스케줄 설정 탭 */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">자동 백업 스케줄</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-medium text-gray-900">자동 백업 활성화</h4>
                <p className="text-sm text-gray-600">정기적인 자동 백업을 실행합니다.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoBackup}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoBackup: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {config.autoBackup && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">백업 주기</label>
                    <select
                      value={config.backupSchedule}
                      onChange={(e) => setConfig(prev => ({ ...prev, backupSchedule: e.target.value as any }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="daily">매일</option>
                      <option value="weekly">매주</option>
                      <option value="monthly">매월</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">보관 기간 (일)</label>
                    <input
                      type="number"
                      min="7"
                      max="365"
                      value={config.retentionDays}
                      onChange={(e) => setConfig(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">백업 포함 데이터</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'includeUserData', label: '사용자 데이터' },
                      { key: 'includeScores', label: '점수 데이터' },
                      { key: 'includeCourses', label: '과정 데이터' },
                      { key: 'includeReports', label: '리포트 데이터' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config[key as keyof BackupConfig] as boolean}
                          onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">압축 수준</label>
                    <select
                      value={config.compressionLevel}
                      onChange={(e) => setConfig(prev => ({ ...prev, compressionLevel: e.target.value as any }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="none">압축 안함 (빠름, 큰 용량)</option>
                      <option value="standard">표준 압축 (균형)</option>
                      <option value="high">고압축 (느림, 작은 용량)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">백업 암호화</h5>
                      <p className="text-xs text-gray-600">백업 파일을 암호화하여 보안을 강화합니다.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.encryptBackups}
                        onChange={(e) => setConfig(prev => ({ ...prev, encryptBackups: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="border-t pt-6">
              <button
                onClick={() => {
                  // 설정 저장 로직
                  alert('백업 설정이 저장되었습니다.');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                설정 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupRestoreSystem;