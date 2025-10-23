import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  CameraIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

interface MobileCameraProps {
  onCapture: (imageData: string, imageFile: File) => void;
  onClose: () => void;
  isRequired?: boolean;
  maxPhotos?: number;
  capturedImages?: string[];
}

const MobileCamera: React.FC<MobileCameraProps> = ({
  onCapture,
  onClose,
  isRequired = true,
  maxPhotos = 5,
  capturedImages = []
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // 카메라 스트림 시작
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // 기존 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('카메라 접근 실패:', err);
      let errorMessage = '카메라에 접근할 수 없습니다.';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = '카메라를 찾을 수 없습니다. 기기에 카메라가 있는지 확인해주세요.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = '이 브라우저에서는 카메라를 지원하지 않습니다.';
        }
      }
      
      setError(errorMessage);
      setIsStreaming(false);
    }
  }, [facingMode]);

  // 사진 촬영
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas context를 가져올 수 없습니다.');
      }

      // 캔버스 크기를 비디오 크기에 맞춤
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 비디오 프레임을 캔버스에 그리기
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 이미지 데이터 추출 (JPEG, 품질 0.9)
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(imageData);

      // File 객체 생성
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `activity-photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          // 부모 컴포넌트에 전달
          onCapture(imageData, file);
        }
      }, 'image/jpeg', 0.9);

    } catch (err) {
      console.error('사진 촬영 실패:', err);
      setError('사진 촬영에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsCapturing(false);
    }
  }, [isStreaming, onCapture]);

  // 카메라 전환 (전면/후면)
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // 사진 재촬영
  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startCamera();
  }, [startCamera]);

  // 사진 확인 및 저장
  const confirmPhoto = useCallback(() => {
    onClose();
  }, [onClose]);

  // 컴포넌트 마운트 시 카메라 시작
  useEffect(() => {
    startCamera();
    
    // 컴포넌트 언마운트 시 스트림 정리
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // 카메라 권한 요청 안내
  const renderPermissionGuide = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <DevicePhoneMobileIcon className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">카메라 권한이 필요합니다</h3>
      <p className="text-gray-600 mb-6">
        활동일지 작성을 위해 현장 사진 촬영이 필요합니다.
        브라우저에서 카메라 권한을 허용해주세요.
      </p>
      <button
        onClick={startCamera}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
      >
        <CameraIcon className="h-5 w-5" />
        <span>카메라 켜기</span>
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-black bg-opacity-75 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CameraIcon className="h-6 w-6" />
          <div>
            <h2 className="font-medium">현장 사진 촬영</h2>
            <p className="text-sm text-gray-300">
              {isRequired ? '필수' : '선택'} • {capturedImages.length}/{maxPhotos}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* 카메라 뷰 */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {error ? (
          <div className="text-center p-6">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <p className="text-white text-center mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        ) : capturedPhoto ? (
          // 촬영된 사진 미리보기
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={capturedPhoto}
              alt="촬영된 사진"
              className="max-w-full max-h-full object-contain"
            />
            
            {/* 사진 확인 오버레이 */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 text-center">
                <CheckIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">사진이 촬영되었습니다</h3>
                <p className="text-gray-600 mb-4">이 사진을 사용하시겠습니까?</p>
                <div className="flex space-x-3">
                  <button
                    onClick={retakePhoto}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    다시 촬영
                  </button>
                  <button
                    onClick={confirmPhoto}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    사용하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : !isStreaming ? (
          renderPermissionGuide()
        ) : (
          // 카메라 스트림
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            
            {/* 촬영 가이드 오버레이 */}
            <div className="absolute inset-0 pointer-events-none">
              {/* 촬영 프레임 가이드 */}
              <div className="absolute inset-4 border-2 border-white border-opacity-50 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
              </div>
              
              {/* 촬영 안내 텍스트 */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                <p className="text-sm text-center">
                  현장 활동 사진을 촬영해주세요
                  {isRequired && <span className="text-red-400"> (필수)</span>}
                </p>
              </div>
            </div>
          </>
        )}

        {/* 숨겨진 캔버스 */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* 하단 컨트롤 */}
      {isStreaming && !capturedPhoto && (
        <div className="bg-black bg-opacity-75 p-6">
          <div className="flex items-center justify-center space-x-8">
            {/* 갤러리 버튼 (기존 사진들) */}
            <button
              onClick={() => {/* 갤러리 열기 */}}
              className="p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
              disabled={capturedImages.length === 0}
            >
              <PhotoIcon className="h-6 w-6 text-white" />
            </button>

            {/* 촬영 버튼 */}
            <button
              onClick={capturePhoto}
              disabled={isCapturing || capturedImages.length >= maxPhotos}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${
                isCapturing || capturedImages.length >= maxPhotos
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-100 active:scale-95'
              } transition-all`}
            >
              {isCapturing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              ) : (
                <div className="w-16 h-16 bg-red-500 rounded-full"></div>
              )}
            </button>

            {/* 카메라 전환 버튼 */}
            <button
              onClick={switchCamera}
              className="p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
            >
              <ArrowPathIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          
          {/* 촬영 제한 안내 */}
          {capturedImages.length >= maxPhotos && (
            <div className="mt-4 text-center">
              <p className="text-yellow-400 text-sm">
                최대 {maxPhotos}장까지 촬영할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileCamera;