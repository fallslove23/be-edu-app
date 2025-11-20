import React, { useState, useEffect } from 'react';
import { 
  PhotoIcon, 
  VideoCameraIcon, 
  MusicalNoteIcon,
  DocumentIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import VideoPlayer from './VideoPlayer';
import AudioPlayer from './AudioPlayer';
import ImageViewer from './ImageViewer';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  src: string;
  size?: number;
  duration?: number;
  thumbnail?: string;
  title?: string;
  description?: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface MediaViewerProps {
  files: MediaFile[];
  initialIndex?: number;
  onClose?: () => void;
  onDelete?: (fileId: string) => void;
  onShare?: (fileId: string) => void;
  onLike?: (fileId: string) => void;
  allowDownload?: boolean;
  allowShare?: boolean;
  allowLike?: boolean;
  className?: string;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  files = [],
  initialIndex = 0,
  onClose,
  onDelete,
  onShare,
  onLike,
  allowDownload = true,
  allowShare = false,
  allowLike = false,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInfo, setShowInfo] = useState(false);

  const currentFile = files[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose?.();
          break;
        case 'ArrowLeft':
          previousFile();
          break;
        case 'ArrowRight':
          nextFile();
          break;
        case 'i':
        case 'I':
          setShowInfo(!showInfo);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, showInfo]);

  const nextFile = () => {
    if (files.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % files.length);
    }
  };

  const previousFile = () => {
    if (files.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + files.length) % files.length);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <PhotoIcon className="h-5 w-5" />;
      case 'video':
        return <VideoCameraIcon className="h-5 w-5" />;
      case 'audio':
        return <MusicalNoteIcon className="h-5 w-5" />;
      default:
        return <DocumentIcon className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = currentFile.src;
    link.download = currentFile.name;
    link.click();
  };

  const renderMedia = () => {
    if (!currentFile) return null;

    switch (currentFile.type) {
      case 'image':
        return (
          <ImageViewer
            src={currentFile.src}
            alt={currentFile.name}
            title={currentFile.title}
            caption={currentFile.description}
            className="w-full h-full"
            showControls={false}
            allowFullscreen={false}
          />
        );

      case 'video':
        return (
          <VideoPlayer
            src={currentFile.src}
            title={currentFile.title}
            className="w-full h-full"
            onComplete={() => nextFile()}
          />
        );

      case 'audio':
        return (
          <div className="flex items-center justify-center h-full p-8">
            <AudioPlayer
              src={currentFile.src}
              title={currentFile.title || currentFile.name}
              artist={currentFile.uploadedBy}
              className="max-w-lg w-full"
              onComplete={() => nextFile()}
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <DocumentIcon className="h-24 w-24 mb-4 opacity-50" />
            <p className="text-lg mb-2">{currentFile.name}</p>
            <p className="text-sm text-gray-400 mb-4">미리보기를 사용할 수 없는 파일입니다</p>
            {allowDownload && (
              <button
                onClick={downloadFile}
                className="flex items-center space-x-2 btn-primary"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                <span>다운로드</span>
              </button>
            )}
          </div>
        );
    }
  };

  if (!currentFile) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <p className="text-white">파일이 없습니다</p>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black/95 z-50 ${className}`}>
      {/* 상단 툴바 */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white">
              {getFileIcon(currentFile.type)}
              <span className="text-sm font-medium">{currentFile.name}</span>
            </div>
            
            {files.length > 1 && (
              <div className="text-white text-sm">
                {currentIndex + 1} / {files.length}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title="정보 보기/숨기기"
            >
              ℹ️
            </button>

            {allowLike && (
              <button
                onClick={() => onLike?.(currentFile.id)}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                title="좋아요"
              >
                <HeartIcon className="h-5 w-5" />
              </button>
            )}

            {allowShare && (
              <button
                onClick={() => onShare?.(currentFile.id)}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                title="공유"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
            )}

            {allowDownload && currentFile.type !== 'audio' && (
              <button
                onClick={downloadFile}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title="다운로드"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              title="닫기"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 메인 미디어 영역 */}
      <div className="w-full h-full pt-16 pb-4">
        {renderMedia()}
      </div>

      {/* 네비게이션 화살표 */}
      {files.length > 1 && (
        <>
          <button
            onClick={previousFile}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            title="이전 파일"
          >
            ←
          </button>

          <button
            onClick={nextFile}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            title="다음 파일"
          >
            →
          </button>
        </>
      )}

      {/* 파일 정보 사이드바 */}
      {showInfo && (
        <div className="absolute top-0 right-0 w-80 h-full bg-black/90 p-6 overflow-y-auto">
          <h3 className="text-white text-lg font-medium mb-4">파일 정보</h3>
          
          <div className="space-y-4 text-white">
            <div>
              <label className="text-sm text-gray-400">파일명</label>
              <p className="text-sm">{currentFile.name}</p>
            </div>

            {currentFile.title && (
              <div>
                <label className="text-sm text-gray-400">제목</label>
                <p className="text-sm">{currentFile.title}</p>
              </div>
            )}

            {currentFile.description && (
              <div>
                <label className="text-sm text-gray-400">설명</label>
                <p className="text-sm">{currentFile.description}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400">타입</label>
              <p className="text-sm capitalize">{currentFile.type}</p>
            </div>

            {currentFile.size && (
              <div>
                <label className="text-sm text-gray-400">크기</label>
                <p className="text-sm">{formatFileSize(currentFile.size)}</p>
              </div>
            )}

            {currentFile.duration && (
              <div>
                <label className="text-sm text-gray-400">재생 시간</label>
                <p className="text-sm">{formatDuration(currentFile.duration)}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400">업로드 일시</label>
              <p className="text-sm">{new Date(currentFile.uploadedAt).toLocaleString('ko-KR')}</p>
            </div>

            <div>
              <label className="text-sm text-gray-400">업로드한 사람</label>
              <p className="text-sm">{currentFile.uploadedBy}</p>
            </div>

            {onDelete && (
              <button
                onClick={() => onDelete(currentFile.id)}
                className="btn-danger w-full py-2 px-4 rounded-full transition-colors mt-6"
              >
                파일 삭제
              </button>
            )}
          </div>
        </div>
      )}

      {/* 썸네일 네비게이션 (하단) */}
      {files.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-center space-x-2 overflow-x-auto">
            {files.slice(Math.max(0, currentIndex - 5), currentIndex + 6).map((file, index) => {
              const actualIndex = Math.max(0, currentIndex - 5) + index;
              return (
                <button
                  key={file.id}
                  onClick={() => setCurrentIndex(actualIndex)}
                  className={`flex-shrink-0 w-16 h-16 rounded-full border-2 overflow-hidden transition-all ${
                    actualIndex === currentIndex
                      ? 'border-blue-500 opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-80'
                  }`}
                >
                  {file.thumbnail ? (
                    <img
                      src={file.thumbnail}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 키보드 단축키 안내 */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs p-3 rounded-lg opacity-50 hover:opacity-100 transition-opacity">
        <div>ESC: 닫기 | ← →: 이전/다음 | I: 정보</div>
      </div>
    </div>
  );
};

export default MediaViewer;