import React, { useState, useEffect } from 'react';
import {
  CloudArrowUpIcon,
  FolderIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import FileUploadZone from './FileUploadZone';
import FileList from './FileList';
import { FileManager as FileManagerUtil, FileInfo } from '../../utils/fileManager';
import { useAuth } from '../../contexts/AuthContext';

interface FileManagerProps {
  courseId?: string;
  courseName?: string;
  category?: 'course_material' | 'assignment' | 'profile' | 'certificate' | 'other';
  showUpload?: boolean;
  showStats?: boolean;
}

const FileManager: React.FC<FileManagerProps> = ({
  courseId,
  courseName,
  category = 'other',
  showUpload = true,
  showStats = true
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'list' | 'stats'>('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [storageStats, setStorageStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    userUsage: 0,
    userQuota: 0
  });
  const [recentUploads, setRecentUploads] = useState<FileInfo[]>([]);
  const [cleanupStats, setCleanupStats] = useState<{ removedFiles: number; freedSpace: number } | null>(null);

  const loadStorageStats = async () => {
    if (!user) return;

    try {
      // 사용자 파일 목록 조회
      const userFiles = await FileManagerUtil.getFiles({ uploadedBy: user.id });
      const totalSize = userFiles.reduce((sum, file) => sum + file.size, 0);
      
      // 사용자 할당량 확인
      const quotaCheck = await FileManagerUtil.checkUserQuota(user.id, user.role, 0);
      
      setStorageStats({
        totalFiles: userFiles.length,
        totalSize,
        userUsage: quotaCheck.currentUsage,
        userQuota: quotaCheck.quota
      });

      // 최근 업로드 파일 (최근 5개)
      const recentFiles = userFiles
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 5);
      setRecentUploads(recentFiles);
    } catch (error) {
      console.error('스토리지 통계 로드 실패:', error);
    }
  };

  const handleUploadComplete = (files: FileInfo[]) => {
    console.log('업로드 완료:', files);
    setRefreshTrigger(prev => prev + 1);
    loadStorageStats();
  };

  const handleFileDelete = (file: FileInfo) => {
    console.log('파일 삭제:', file);
    setRefreshTrigger(prev => prev + 1);
    loadStorageStats();
  };

  const handleCleanup = async () => {
    if (!user || user.role !== 'admin') {
      alert('관리자만 정리 작업을 수행할 수 있습니다.');
      return;
    }

    if (confirm('사용하지 않는 파일들을 정리하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        const result = await FileManagerUtil.cleanupStorage();
        setCleanupStats(result);
        loadStorageStats();
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('정리 작업 실패:', error);
        alert('정리 작업에 실패했습니다.');
      }
    }
  };

  useEffect(() => {
    loadStorageStats();
  }, [user]);

  const usagePercentage = storageStats.userQuota > 0 
    ? Math.round((storageStats.userUsage / storageStats.userQuota) * 100) 
    : 0;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FolderIcon className="h-8 w-8 mr-3 text-blue-600" />
              파일 관리
            </h1>
            <p className="text-gray-600 mt-1">
              {courseName ? `${courseName} 과정의 파일들을 관리합니다` : '파일 업로드 및 관리'}
            </p>
          </div>
          
          {showStats && (
            <div className="text-right">
              <div className="text-sm text-gray-600">사용 중인 용량</div>
              <div className="text-lg font-semibold">
                {FileManagerUtil.formatFileSize(storageStats.userUsage * 1024 * 1024)} / {storageStats.userQuota}MB
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(usagePercentage)}`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{usagePercentage}% 사용</div>
            </div>
          )}
        </div>
      </div>

      {/* 정리 작업 결과 알림 */}
      {cleanupStats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">정리 작업 완료</h3>
              <p className="text-sm text-green-700 mt-1">
                {cleanupStats.removedFiles}개 파일을 삭제하여 {FileManagerUtil.formatFileSize(cleanupStats.freedSpace)}의 공간을 확보했습니다.
              </p>
            </div>
            <button 
              onClick={() => setCleanupStats(null)}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 용량 경고 */}
      {usagePercentage >= 90 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">용량 부족 경고</h3>
              <p className="text-sm text-red-700 mt-1">
                할당된 용량의 {usagePercentage}%를 사용 중입니다. 불필요한 파일을 삭제해주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FolderIcon className="h-5 w-5 inline mr-2" />
              파일 목록
            </button>
            
            {showUpload && (
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CloudArrowUpIcon className="h-5 w-5 inline mr-2" />
                파일 업로드
              </button>
            )}
            
            {showStats && (
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ChartBarIcon className="h-5 w-5 inline mr-2" />
                통계
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'list' && (
            <FileList
              category={category !== 'other' ? category : undefined}
              courseId={courseId}
              onFileDelete={handleFileDelete}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'upload' && showUpload && (
            <div className="space-y-6">
              <FileUploadZone
                category={category}
                courseName={courseName}
                courseId={courseId}
                onUploadComplete={handleUploadComplete}
                maxFiles={10}
              />
              
              {/* 최근 업로드 */}
              {recentUploads.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">최근 업로드</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentUploads.map((file) => (
                      <div key={file.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{FileManagerUtil.getFileIcon(file.name)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {FileManagerUtil.formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && showStats && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">저장소 통계</h3>
              
              {/* 전체 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center">
                    <FolderIcon className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-900">총 파일 수</p>
                      <p className="text-2xl font-bold text-blue-900">{storageStats.totalFiles}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-900">사용 용량</p>
                      <p className="text-2xl font-bold text-green-900">
                        {FileManagerUtil.formatFileSize(storageStats.totalSize)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-center">
                    <Cog6ToothIcon className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-900">사용률</p>
                      <p className="text-2xl font-bold text-purple-900">{usagePercentage}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 카테고리별 통계 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">카테고리별 파일 분포</h4>
                <div className="space-y-3">
                  {[
                    { name: '강의 자료', key: 'course_material', count: Math.floor(storageStats.totalFiles * 0.4) },
                    { name: '과제', key: 'assignment', count: Math.floor(storageStats.totalFiles * 0.3) },
                    { name: '인증서', key: 'certificate', count: Math.floor(storageStats.totalFiles * 0.1) },
                    { name: '기타', key: 'other', count: Math.floor(storageStats.totalFiles * 0.2) }
                  ].map((cat) => (
                    <div key={cat.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{cat.name}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ 
                              width: `${storageStats.totalFiles > 0 ? (cat.count / storageStats.totalFiles) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {cat.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 관리 작업 (관리자만) */}
              {user?.role === 'admin' && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">저장소 관리</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">자동 정리</h5>
                        <p className="text-sm text-gray-600">30일 이상 된 미사용 파일들을 삭제합니다</p>
                      </div>
                      <button
                        onClick={handleCleanup}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        정리 실행
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileManager;