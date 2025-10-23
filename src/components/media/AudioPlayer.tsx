import React, { useState, useRef, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  autoplay?: boolean;
  loop?: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  className?: string;
}

interface AudioVisualizationProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

const AudioVisualization: React.FC<AudioVisualizationProps> = ({ audioRef, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!audioRef.current || !canvasRef.current) return;

    const audio = audioRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // 간단한 시각화 (실제로는 Web Audio API 사용)
    const animate = () => {
      if (!isPlaying) return;

      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / 20;
      const barCount = 20;

      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.random() * canvas.height * 0.8;
        const x = i * barWidth;
        const y = canvas.height - barHeight;

        ctx.fillStyle = `hsl(${220 + i * 10}, 70%, 60%)`;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioRef, isPlaying]);

  return (
    <canvas 
      ref={canvasRef}
      width={300}
      height={100}
      className="w-full h-24 rounded-lg bg-gray-800"
    />
  );
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title = '오디오 파일',
  artist,
  autoplay = false,
  loop = false,
  onProgress,
  onComplete,
  className = ''
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooped, setIsLooped] = useState(loop);
  const [buffered, setBuffered] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => setLoading(true);
    const handleCanPlay = () => setLoading(false);
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      const current = audio.currentTime;
      setCurrentTime(current);
      onProgress?.(current, audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (!isLooped) {
        onComplete?.();
      }
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / audio.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('progress', handleProgress);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('progress', handleProgress);
    };
  }, [onProgress, onComplete, isLooped]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio play error:', error);
    }
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleLoop = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = !isLooped;
    setIsLooped(!isLooped);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoplay}
        loop={isLooped}
        preload="metadata"
      />

      {/* 헤더 정보 */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
        {artist && (
          <p className="text-sm text-gray-600">{artist}</p>
        )}
      </div>

      {/* 시각화 */}
      <div className="mb-6">
        <AudioVisualization audioRef={audioRef} isPlaying={isPlaying} />
      </div>

      {/* 진행률 바 */}
      <div className="mb-6">
        <div 
          ref={progressRef}
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer relative"
          onClick={handleProgressClick}
        >
          {/* 버퍼링 진행률 */}
          <div
            className="h-full bg-gray-300 rounded-full absolute"
            style={{ width: `${buffered}%` }}
          />
          
          {/* 재생 진행률 */}
          <div
            className="h-full bg-blue-500 rounded-full relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 w-4 h-4 bg-blue-500 rounded-full transform -translate-y-1/2 translate-x-2 shadow-lg" />
          </div>
        </div>
        
        {/* 시간 정보 */}
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={() => skip(-10)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          title="10초 뒤로"
        >
          <BackwardIcon className="h-6 w-6" />
        </button>

        <button
          onClick={togglePlay}
          disabled={loading}
          className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50"
          title={isPlaying ? '일시정지' : '재생'}
        >
          {loading ? (
            <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
          ) : isPlaying ? (
            <PauseIcon className="h-6 w-6" />
          ) : (
            <PlayIcon className="h-6 w-6 ml-0.5" />
          )}
        </button>

        <button
          onClick={() => skip(10)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          title="10초 앞으로"
        >
          <ForwardIcon className="h-6 w-6" />
        </button>
      </div>

      {/* 하단 컨트롤 */}
      <div className="flex items-center justify-between">
        {/* 볼륨 컨트롤 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted || volume === 0 ? (
              <SpeakerXMarkIcon className="h-5 w-5" />
            ) : (
              <SpeakerWaveIcon className="h-5 w-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            title="볼륨"
          />
          <span className="text-sm text-gray-600 w-8">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>

        {/* 반복 재생 */}
        <button
          onClick={toggleLoop}
          className={`p-2 rounded-full transition-colors ${
            isLooped 
              ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title={isLooped ? '반복 재생 해제' : '반복 재생'}
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;