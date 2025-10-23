import React, { useState, useRef, useCallback } from 'react';
import {
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface CameraCaptureProps {
  onPhotoCapture: (photo: CapturedPhoto) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface CapturedPhoto {
  id: string;
  file: File;
  dataUrl: string;
  description: string;
  timestamp: Date;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onPhotoCapture,
  onClose,
  isOpen
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('카메라 접근 오류:', error);
      toast.error('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [facingMode]);

  // 카메라 중지
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // 사진 촬영
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // 캔버스 크기를 비디오 크기에 맞춤
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임을 캔버스에 그리기
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 이미지 데이터 생성
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

      const photo: CapturedPhoto = {
        id: `photo_${Date.now()}`,
        file,
        dataUrl,
        description: '',
        timestamp: new Date()
      };

      setCapturedPhoto(photo);
      stopCamera();
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  // 카메라 전환 (전면/후면)
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    stopCamera();
  }, [stopCamera]);

  // 사진 저장
  const savePhoto = useCallback(() => {
    if (!capturedPhoto) return;

    const photoWithDescription = {
      ...capturedPhoto,
      description
    };

    onPhotoCapture(photoWithDescription);
    setCapturedPhoto(null);
    setDescription('');
    onClose();
    toast.success('사진이 저장되었습니다.');
  }, [capturedPhoto, description, onPhotoCapture, onClose]);

  // 사진 재촬영
  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    setDescription('');
    startCamera();
  }, [startCamera]);

  // 컴포넌트 마운트/언마운트 시 카메라 관리
  React.useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedPhoto, startCamera, stopCamera]);

  // 카메라 전환 시 재시작
  React.useEffect(() => {
    if (isOpen && stream) {
      stopCamera();
      startCamera();
    }
  }, [facingMode, isOpen, stream, stopCamera, startCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-4 bg-black/80 text-white">
        <h2 className="text-lg font-semibold">사진 촬영</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 relative">
        {!capturedPhoto ? (
          <>
            {/* 카메라 프리뷰 */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* 로딩 오버레이 */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>카메라를 시작하는 중...</p>
                </div>
              </div>
            )}

            {/* 카메라 컨트롤 */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex justify-center items-center space-x-8">
                {/* 갤러리 버튼 (임시) */}
                <div className="w-12 h-12 border-2 border-white/50 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="w-6 h-6 text-white/50" />
                </div>

                {/* 촬영 버튼 */}
                <button
                  onClick={capturePhoto}
                  disabled={isLoading || !stream}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <div className="w-16 h-16 bg-white border-4 border-gray-300 rounded-full"></div>
                </button>

                {/* 카메라 전환 버튼 */}
                <button
                  onClick={switchCamera}
                  disabled={isLoading}
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50"
                >
                  <ArrowPathIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 촬영된 사진 프리뷰 */}
            <img
              src={capturedPhoto.dataUrl}
              alt="촬영된 사진"
              className="w-full h-full object-cover"
            />

            {/* 사진 설명 입력 오버레이 */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">
                  사진 설명
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="이 사진에 대한 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/90 text-gray-900 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={retakePhoto}
                  className="flex items-center px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                  <TrashIcon className="w-5 h-5 mr-2" />
                  재촬영
                </button>
                <button
                  onClick={savePhoto}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckIcon className="w-5 h-5 mr-2" />
                  저장
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 숨겨진 캔버스 (사진 처리용) */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;