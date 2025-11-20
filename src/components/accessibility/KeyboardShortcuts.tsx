import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../styles/accessibility.css';
import {
  CommandLineIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  KeyIcon,
  LightBulbIcon,
  EyeIcon,
  SpeakerWaveIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

// 키보드 단축키 정의
interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  category: 'navigation' | 'editing' | 'accessibility' | 'search' | 'system';
  action: () => void;
  enabled: boolean;
  global?: boolean; // 전역 단축키 여부
}

// 접근성 설정
interface AccessibilitySettings {
  highContrast: boolean;
  largeFont: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicator: boolean;
  colorBlindSupport: boolean;
  audioDescriptions: boolean;
}

// 키보드 단축키 매니저
class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private pressedKeys: Set<string> = new Set();
  private isListening = false;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  start() {
    if (!this.isListening) {
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('keyup', this.handleKeyUp);
      this.isListening = true;
    }
  }

  stop() {
    if (this.isListening) {
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('keyup', this.handleKeyUp);
      this.isListening = false;
      this.pressedKeys.clear();
    }
  }

  addShortcut(shortcut: KeyboardShortcut) {
    const key = this.createShortcutKey(shortcut.keys);
    this.shortcuts.set(key, shortcut);
  }

  removeShortcut(keys: string[]) {
    const key = this.createShortcutKey(keys);
    this.shortcuts.delete(key);
  }

  private createShortcutKey(keys: string[]): string {
    return keys.sort().join('+').toLowerCase();
  }

  private handleKeyDown(event: KeyboardEvent) {
    // 입력 필드에서는 대부분의 단축키 무시
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true';

    // 수정자 키 추가
    if (event.ctrlKey || event.metaKey) this.pressedKeys.add('ctrl');
    if (event.altKey) this.pressedKeys.add('alt');
    if (event.shiftKey) this.pressedKeys.add('shift');

    // 일반 키 추가 (특수 키 처리)
    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'escape') key = 'esc';
    if (key === 'arrowup') key = 'up';
    if (key === 'arrowdown') key = 'down';
    if (key === 'arrowleft') key = 'left';
    if (key === 'arrowright') key = 'right';
    
    this.pressedKeys.add(key);

    // 단축키 매칭 확인
    const shortcutKey = this.createShortcutKey(Array.from(this.pressedKeys));
    const shortcut = this.shortcuts.get(shortcutKey);

    if (shortcut && shortcut.enabled) {
      // 전역 단축키이거나 입력 필드가 아닌 경우에만 실행
      if (shortcut.global || !isInputField) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    // 수정자 키 제거
    if (!event.ctrlKey && !event.metaKey) this.pressedKeys.delete('ctrl');
    if (!event.altKey) this.pressedKeys.delete('alt');
    if (!event.shiftKey) this.pressedKeys.delete('shift');

    // 일반 키 제거
    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'escape') key = 'esc';
    if (key === 'arrowup') key = 'up';
    if (key === 'arrowdown') key = 'down';
    if (key === 'arrowleft') key = 'left';
    if (key === 'arrowright') key = 'right';
    
    this.pressedKeys.delete(key);
  }

  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  updateShortcut(id: string, updates: Partial<KeyboardShortcut>) {
    for (const [key, shortcut] of this.shortcuts.entries()) {
      if (shortcut.id === id) {
        const updatedShortcut = { ...shortcut, ...updates };
        this.shortcuts.set(key, updatedShortcut);
        break;
      }
    }
  }
}

// 단축키 헬프 모달
const ShortcutHelpModal: React.FC<{
  shortcuts: KeyboardShortcut[];
  onClose: () => void;
}> = ({ shortcuts, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { key: 'all', name: '전체' },
    { key: 'navigation', name: '네비게이션' },
    { key: 'editing', name: '편집' },
    { key: 'accessibility', name: '접근성' },
    { key: 'search', name: '검색' },
    { key: 'system', name: '시스템' }
  ];

  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;
    const matchesSearch = shortcut.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shortcut.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && shortcut.enabled;
  });

  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      const displayKey = key === 'ctrl' ? '⌘' : 
                        key === 'alt' ? '⌥' : 
                        key === 'shift' ? '⇧' : 
                        key === 'space' ? 'Space' :
                        key === 'esc' ? 'Esc' :
                        key.charAt(0).toUpperCase() + key.slice(1);
      return displayKey;
    }).join(' + ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <KeyIcon className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold">키보드 단축키</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="단축키 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.key} value={category.key}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 단축키 목록 */}
        <div className="max-h-96 overflow-y-auto p-6">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <KeyIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>검색 조건에 맞는 단축키가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(
                filteredShortcuts.reduce((acc, shortcut) => {
                  if (!acc[shortcut.category]) acc[shortcut.category] = [];
                  acc[shortcut.category].push(shortcut);
                  return acc;
                }, {} as Record<string, KeyboardShortcut[]>)
              ).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white capitalize">
                    {categories.find(c => c.key === category)?.name || category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shortcuts.map(shortcut => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {shortcut.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {shortcut.description}
                          </p>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center space-x-1">
                            {shortcut.keys.map((key, index) => (
                              <div key={key} className="contents">
                                {index > 0 && <span className="text-gray-400">+</span>}
                                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono">
                                  {formatKeys([key])}
                                </kbd>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>총 {filteredShortcuts.length}개의 단축키</span>
            <div className="flex items-center space-x-4">
              <span>⌘ = Ctrl</span>
              <span>⌥ = Alt</span>
              <span>⇧ = Shift</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 접근성 설정 컴포넌트
const AccessibilitySettings: React.FC<{
  settings: AccessibilitySettings;
  onSettingsChange: (settings: AccessibilitySettings) => void;
  onClose: () => void;
}> = ({ settings, onSettingsChange, onClose }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const settingsOptions = [
    {
      key: 'highContrast',
      name: '고대비 모드',
      description: '텍스트와 배경의 대비를 높여 가독성을 개선합니다.',
      icon: EyeIcon
    },
    {
      key: 'largeFont',
      name: '큰 글꼴',
      description: '모든 텍스트의 크기를 확대합니다.',
      icon: AdjustmentsHorizontalIcon
    },
    {
      key: 'reducedMotion',
      name: '모션 줄이기',
      description: '애니메이션과 전환 효과를 최소화합니다.',
      icon: AdjustmentsHorizontalIcon
    },
    {
      key: 'screenReader',
      name: '스크린 리더 지원',
      description: '스크린 리더를 위한 추가 정보를 제공합니다.',
      icon: SpeakerWaveIcon
    },
    {
      key: 'keyboardNavigation',
      name: '키보드 탐색',
      description: '키보드만으로 모든 기능에 접근할 수 있습니다.',
      icon: KeyIcon
    },
    {
      key: 'focusIndicator',
      name: '포커스 표시기',
      description: '현재 선택된 요소를 명확히 표시합니다.',
      icon: LightBulbIcon
    },
    {
      key: 'colorBlindSupport',
      name: '색맹 지원',
      description: '색상 외 다른 방법으로도 정보를 구분할 수 있습니다.',
      icon: EyeIcon
    },
    {
      key: 'audioDescriptions',
      name: '오디오 설명',
      description: '시각적 콘텐츠에 대한 음성 설명을 제공합니다.',
      icon: SpeakerWaveIcon
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <AdjustmentsHorizontalIcon className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold">접근성 설정</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 설정 목록 */}
        <div className="max-h-96 overflow-y-auto p-6">
          <div className="space-y-6">
            {settingsOptions.map(option => {
              const Icon = option.icon;
              return (
                <div key={option.key} className="flex items-start space-x-4">
                  <Icon className="h-6 w-6 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {option.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {option.description}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={localSettings[option.key as keyof AccessibilitySettings] as boolean}
                        onChange={(e) =>
                          setLocalSettings(prev => ({
                            ...prev,
                            [option.key]: e.target.checked
                          }))
                        }
                        className="ml-4 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

// 메인 키보드 단축키 컴포넌트
const KeyboardShortcuts: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeFont: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusIndicator: true,
    colorBlindSupport: false,
    audioDescriptions: false
  });

  const managerRef = useRef<KeyboardShortcutManager | null>(null);

  // 기본 단축키 설정
  useEffect(() => {
    const defaultShortcuts: Omit<KeyboardShortcut, 'action'>[] = [
      // 네비게이션
      {
        id: 'help',
        name: '도움말',
        description: '키보드 단축키 도움말을 표시합니다',
        keys: ['ctrl', 'shift', '?'],
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        id: 'search',
        name: '전역 검색',
        description: '전역 검색 창을 엽니다',
        keys: ['ctrl', 'k'],
        category: 'search',
        enabled: true,
        global: true
      },
      {
        id: 'home',
        name: '홈으로',
        description: '홈 페이지로 이동합니다',
        keys: ['ctrl', 'h'],
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        id: 'dashboard',
        name: '대시보드',
        description: '대시보드로 이동합니다',
        keys: ['ctrl', 'd'],
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        id: 'profile',
        name: '프로필',
        description: '사용자 프로필로 이동합니다',
        keys: ['ctrl', 'p'],
        category: 'navigation',
        enabled: true,
        global: true
      },
      
      // 접근성
      {
        id: 'skip-content',
        name: '콘텐츠로 건너뛰기',
        description: '메인 콘텐츠로 포커스를 이동합니다',
        keys: ['alt', 's'],
        category: 'accessibility',
        enabled: true,
        global: true
      },
      {
        id: 'focus-next',
        name: '다음 요소',
        description: '다음 포커스 가능한 요소로 이동합니다',
        keys: ['tab'],
        category: 'accessibility',
        enabled: true,
        global: true
      },
      {
        id: 'focus-prev',
        name: '이전 요소',
        description: '이전 포커스 가능한 요소로 이동합니다',
        keys: ['shift', 'tab'],
        category: 'accessibility',
        enabled: true,
        global: true
      },
      {
        id: 'accessibility-settings',
        name: '접근성 설정',
        description: '접근성 설정을 엽니다',
        keys: ['ctrl', 'alt', 'a'],
        category: 'accessibility',
        enabled: true,
        global: true
      },

      // 시스템
      {
        id: 'logout',
        name: '로그아웃',
        description: '현재 세션에서 로그아웃합니다',
        keys: ['ctrl', 'shift', 'l'],
        category: 'system',
        enabled: true,
        global: true
      },
      {
        id: 'refresh',
        name: '새로고침',
        description: '페이지를 새로고침합니다',
        keys: ['f5'],
        category: 'system',
        enabled: true,
        global: true
      },
      {
        id: 'close-modal',
        name: '모달 닫기',
        description: '현재 열린 모달을 닫습니다',
        keys: ['esc'],
        category: 'system',
        enabled: true,
        global: true
      }
    ];

    // 액션 함수들을 추가하여 완전한 단축키 생성
    const shortcutsWithActions: KeyboardShortcut[] = defaultShortcuts.map(shortcut => ({
      ...shortcut,
      action: () => {
        switch (shortcut.id) {
          case 'help':
            setShowHelp(true);
            break;
          case 'search':
            // 전역 검색 구현
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
            break;
          case 'home':
            window.location.href = '/';
            break;
          case 'dashboard':
            window.location.href = '/dashboard';
            break;
          case 'profile':
            window.location.href = '/profile';
            break;
          case 'skip-content':
            const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
            if (mainContent) {
              (mainContent as HTMLElement).focus();
              mainContent.scrollIntoView();
            }
            break;
          case 'accessibility-settings':
            setShowAccessibility(true);
            break;
          case 'logout':
            if (confirm('로그아웃하시겠습니까?')) {
              // 로그아웃 로직 구현
              window.location.href = '/logout';
            }
            break;
          case 'refresh':
            window.location.reload();
            break;
          case 'close-modal':
            const modal = document.querySelector('[role="dialog"]');
            if (modal) {
              const closeButton = modal.querySelector('button[aria-label="Close"], button[aria-label="닫기"]');
              if (closeButton) {
                (closeButton as HTMLButtonElement).click();
              }
            }
            break;
          default:
            console.log(`Shortcut ${shortcut.id} triggered`);
        }
      }
    }));

    setShortcuts(shortcutsWithActions);
  }, []);

  // 키보드 매니저 초기화
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new KeyboardShortcutManager();
    }

    const manager = managerRef.current;
    
    // 단축키 등록
    shortcuts.forEach(shortcut => {
      manager.addShortcut(shortcut);
    });

    manager.start();

    return () => {
      manager.stop();
    };
  }, [shortcuts]);

  // 접근성 설정 적용
  useEffect(() => {
    const root = document.documentElement;

    // 고대비 모드
    if (accessibilitySettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // 큰 글꼴
    if (accessibilitySettings.largeFont) {
      root.classList.add('large-font');
    } else {
      root.classList.remove('large-font');
    }

    // 모션 줄이기
    if (accessibilitySettings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // 포커스 표시기
    if (accessibilitySettings.focusIndicator) {
      root.classList.add('focus-indicator');
    } else {
      root.classList.remove('focus-indicator');
    }

    // 색맹 지원
    if (accessibilitySettings.colorBlindSupport) {
      root.classList.add('colorblind-support');
    } else {
      root.classList.remove('colorblind-support');
    }

  }, [accessibilitySettings]);

  // 스크린 리더 지원을 위한 라이브 리전
  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // 단축키 상태 업데이트
  const updateShortcut = useCallback((id: string, updates: Partial<KeyboardShortcut>) => {
    setShortcuts(prev => prev.map(shortcut => 
      shortcut.id === id ? { ...shortcut, ...updates } : shortcut
    ));
    
    if (managerRef.current && updates.enabled !== undefined) {
      managerRef.current.updateShortcut(id, updates);
    }
  }, []);

  return (
    <>

      {/* 스킵 링크 */}
      <a 
        href="#main-content" 
        className="skip-link"
        onFocus={() => announceToScreenReader('메인 콘텐츠로 건너뛰기 링크')}
      >
        메인 콘텐츠로 건너뛰기
      </a>

      {/* 접근성 도구 모음 */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => setShowHelp(true)}
            className="btn-primary"
            title="키보드 단축키 도움말 (Ctrl+Shift+?)"
            aria-label="키보드 단축키 도움말"
          >
            <QuestionMarkCircleIcon className="h-3.5 w-3.5" />
          </button>
          
          <button
            onClick={() => setShowAccessibility(true)}
            className="p-1.5 bg-gray-600/80 text-white rounded-lg shadow-md hover:bg-gray-700/90 transition-all duration-200 backdrop-blur-sm"
            title="접근성 설정 (Ctrl+Alt+A)"
            aria-label="접근성 설정"
          >
            <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 도움말 모달 */}
      {showHelp && (
        <ShortcutHelpModal
          shortcuts={shortcuts}
          onClose={() => setShowHelp(false)}
        />
      )}

      {/* 접근성 설정 모달 */}
      {showAccessibility && (
        <AccessibilitySettings
          settings={accessibilitySettings}
          onSettingsChange={setAccessibilitySettings}
          onClose={() => setShowAccessibility(false)}
        />
      )}

      {/* 스크린 리더를 위한 라이브 리전 */}
      <div 
        id="aria-live-region" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      />
    </>
  );
};

export { KeyboardShortcuts, KeyboardShortcutManager };
export type { KeyboardShortcut, AccessibilitySettings };
export default KeyboardShortcuts;