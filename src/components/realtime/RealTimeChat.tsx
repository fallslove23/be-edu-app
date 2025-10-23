import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  PhotoIcon,
  DocumentIcon,
  EllipsisVerticalIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// 메시지 타입 정의
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string; // 답장 대상 메시지 ID
  reactions?: {
    emoji: string;
    users: string[];
  }[];
}

// 채팅방 타입 정의
interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'course' | 'public';
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  description?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 사용자 타입 정의
interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
  role?: string;
}

// 타이핑 상태
interface TypingStatus {
  userId: string;
  userName: string;
  roomId: string;
  timestamp: Date;
}

// 메시지 컴포넌트
const MessageBubble: React.FC<{
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ message, isOwn, showAvatar, onReact, onReply, onEdit, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  const emojis = ['👍', '❤️', '😊', '😮', '😢', '😡'];

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return <CheckIcon className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckIcon className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckIcon className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 아바타 (상대방 메시지) */}
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            {message.senderAvatar ? (
              <img src={message.senderAvatar} alt={message.senderName} className="w-8 h-8 rounded-full" />
            ) : (
              <span className="text-xs font-medium text-gray-600">
                {message.senderName.charAt(0)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'mr-3' : 'ml-0'}`}>
        {/* 발신자 이름 (상대방 메시지) */}
        {!isOwn && showAvatar && (
          <div className="text-xs text-gray-500 mb-1 ml-1">{message.senderName}</div>
        )}

        <div className="relative">
          {/* 메시지 버블 */}
          <div
            className={`rounded-lg px-4 py-2 ${
              isOwn
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            } ${message.type === 'system' ? 'bg-yellow-100 text-yellow-800 text-center' : ''}`}
          >
            {/* 답장 표시 */}
            {message.replyTo && (
              <div className="text-xs opacity-75 border-l-2 border-white/30 pl-2 mb-2">
                답장: "원본 메시지 내용..."
              </div>
            )}

            {/* 메시지 내용 */}
            {message.type === 'text' && (
              <p className="break-words">{message.content}</p>
            )}
            
            {message.type === 'image' && (
              <div>
                <img
                  src={message.content}
                  alt="이미지"
                  className="max-w-full h-auto rounded cursor-pointer"
                  onClick={() => window.open(message.content)}
                />
              </div>
            )}
            
            {message.type === 'file' && (
              <div className="flex items-center space-x-2">
                <DocumentIcon className="w-5 h-5" />
                <span className="text-sm">{message.content}</span>
              </div>
            )}

            {/* 시간 및 상태 */}
            <div className={`flex items-center justify-end space-x-1 mt-1 ${
              isOwn ? 'text-white/70' : 'text-gray-500'
            }`}>
              <span className="text-xs">
                {message.timestamp.toLocaleTimeString('ko-KR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
              {message.edited && <span className="text-xs">(편집됨)</span>}
              {isOwn && getStatusIcon()}
            </div>
          </div>

          {/* 반응 */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex space-x-1 mt-1">
              {message.reactions.map((reaction, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-1 text-xs flex items-center space-x-1 cursor-pointer hover:bg-gray-50"
                  onClick={() => onReact(reaction.emoji)}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.users.length}</span>
                </div>
              ))}
            </div>
          )}

          {/* 액션 버튼 */}
          {showActions && (
            <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-2 py-1`}>
              <button
                onClick={() => setShowEmojis(!showEmojis)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="반응"
              >
                <FaceSmileIcon className="w-4 h-4" />
              </button>
              <button
                onClick={onReply}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="답장"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
              </button>
              {isOwn && (
                <>
                  <button
                    onClick={onEdit}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="편집"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-500"
                    title="삭제"
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>
          )}

          {/* 이모지 선택 */}
          {showEmojis && (
            <div className="absolute top-8 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 flex space-x-1">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(emoji);
                    setShowEmojis(false);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 채팅방 목록 아이템
const ChatRoomItem: React.FC<{
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
}> = ({ room, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
        isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
      }`}
    >
      <div className="relative">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          {room.avatar ? (
            <img src={room.avatar} alt={room.name} className="w-10 h-10 rounded-full" />
          ) : (
            <span className="text-sm font-medium text-gray-600">
              {room.name.charAt(0)}
            </span>
          )}
        </div>
        {room.type === 'group' && (
          <UserGroupIcon className="w-4 h-4 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {room.name}
          </h3>
          {room.lastMessage && (
            <span className="text-xs text-gray-500">
              {room.lastMessage.timestamp.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 truncate">
            {room.lastMessage?.content || '메시지가 없습니다'}
          </p>
          {room.unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {room.unreadCount > 99 ? '99+' : room.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Supabase 기반 채팅 컴포넌트 (무료 요금제 지원)
const RealTimeChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<{ [roomId: string]: ChatMessage[] }>({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState<TypingStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // 현재 사용자 ID (실제 환경에서는 인증 시스템에서 가져옴)
  const currentUserId = 'current-user';

  // 초기 데이터 로드
  useEffect(() => {
    // 모의 채팅방 데이터
    const mockRooms: ChatRoom[] = [
      {
        id: 'room1',
        name: '영업1팀',
        type: 'group',
        participants: ['user1', 'user2', 'user3'],
        unreadCount: 3,
        description: '영업1팀 채팅방',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'room2',
        name: '김강사',
        type: 'direct',
        participants: ['current-user', 'instructor1'],
        unreadCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'room3',
        name: 'React 기초 과정',
        type: 'course',
        participants: ['current-user', 'instructor1', 'student1', 'student2'],
        unreadCount: 0,
        description: 'React 기초 과정 Q&A',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 모의 메시지 데이터
    const mockMessages: { [roomId: string]: ChatMessage[] } = {
      room1: [
        {
          id: 'msg1',
          senderId: 'user1',
          senderName: '홍길동',
          content: '안녕하세요! 오늘 회의 시간이 언제인가요?',
          type: 'text',
          timestamp: new Date(Date.now() - 3600000),
          status: 'read'
        },
        {
          id: 'msg2',
          senderId: 'current-user',
          senderName: '현재사용자',
          content: '오후 2시에 시작합니다.',
          type: 'text',
          timestamp: new Date(Date.now() - 1800000),
          status: 'read'
        },
        {
          id: 'msg3',
          senderId: 'user2',
          senderName: '김영희',
          content: '네, 참석하겠습니다!',
          type: 'text',
          timestamp: new Date(Date.now() - 900000),
          status: 'delivered',
          reactions: [
            { emoji: '👍', users: ['current-user', 'user1'] }
          ]
        }
      ],
      room2: [
        {
          id: 'msg4',
          senderId: 'instructor1',
          senderName: '김강사',
          content: '과제 제출 기한이 내일까지입니다.',
          type: 'text',
          timestamp: new Date(Date.now() - 7200000),
          status: 'read'
        }
      ]
    };

    setRooms(mockRooms);
    setMessages(mockMessages);
    
    // 첫 번째 방 활성화
    if (mockRooms.length > 0) {
      setActiveRoom(mockRooms[0].id);
    }
  }, []);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoom]);

  // 메시지 전송
  const sendMessage = useCallback(() => {
    if (!currentMessage.trim() || !activeRoom) return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: currentUserId,
      senderName: '현재사용자',
      content: currentMessage,
      type: 'text',
      timestamp: new Date(),
      status: 'sending',
      replyTo: replyTo?.id
    };

    setMessages(prev => ({
      ...prev,
      [activeRoom]: [...(prev[activeRoom] || []), newMessage]
    }));

    setCurrentMessage('');
    setReplyTo(null);

    // 메시지 상태 업데이트 시뮬레이션
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [activeRoom]: prev[activeRoom].map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      }));
    }, 500);

    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [activeRoom]: prev[activeRoom].map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
        )
      }));
    }, 1000);
  }, [currentMessage, activeRoom, replyTo]);

  // 타이핑 상태 업데이트
  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 타이핑 중 상태 전송 (실제 환경에서는 웹소켓으로)
    
    typingTimeoutRef.current = setTimeout(() => {
      // 타이핑 중지 상태 전송
    }, 2000);
  }, []);

  // 파일 업로드
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeRoom) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: currentUserId,
        senderName: '현재사용자',
        content: reader.result as string,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        timestamp: new Date(),
        status: 'sending'
      };

      setMessages(prev => ({
        ...prev,
        [activeRoom]: [...(prev[activeRoom] || []), newMessage]
      }));
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  // 메시지 반응 추가
  const handleReaction = (messageId: string, emoji: string) => {
    if (!activeRoom) return;

    setMessages(prev => ({
      ...prev,
      [activeRoom]: prev[activeRoom].map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          const existingReaction = reactions.find(r => r.emoji === emoji);
          
          if (existingReaction) {
            if (existingReaction.users.includes(currentUserId)) {
              // 반응 제거
              existingReaction.users = existingReaction.users.filter(u => u !== currentUserId);
              if (existingReaction.users.length === 0) {
                return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) };
              }
            } else {
              // 반응 추가
              existingReaction.users.push(currentUserId);
            }
          } else {
            // 새 반응 추가
            reactions.push({ emoji, users: [currentUserId] });
          }
          
          return { ...msg, reactions: [...reactions] };
        }
        return msg;
      })
    }));
  };

  const activeRoomData = rooms.find(room => room.id === activeRoom);
  const activeMessages = activeRoom ? messages[activeRoom] || [] : [];
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) {
    // 채팅 플로팅 버튼
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
          {rooms.reduce((total, room) => total + room.unreadCount, 0) > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {rooms.reduce((total, room) => total + room.unreadCount, 0)}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium">채팅</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 채팅방 목록 */}
        <div className="w-32 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* 검색 */}
          <div className="p-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 방 목록 */}
          <div className="flex-1 overflow-y-auto">
            {filteredRooms.map(room => (
              <div key={room.id} className="border-b border-gray-100 dark:border-gray-700">
                <ChatRoomItem
                  room={room}
                  isActive={activeRoom === room.id}
                  onClick={() => setActiveRoom(room.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 flex flex-col">
          {activeRoomData ? (
            <>
              {/* 채팅방 헤더 */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-sm">{activeRoomData.name}</h4>
                <p className="text-xs text-gray-500">
                  {activeRoomData.participants.length}명 참여
                </p>
              </div>

              {/* 메시지 영역 */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {activeMessages.map((message, index) => {
                  const isOwn = message.senderId === currentUserId;
                  const showAvatar = !isOwn && (
                    index === 0 || 
                    activeMessages[index - 1].senderId !== message.senderId ||
                    new Date(message.timestamp).getTime() - new Date(activeMessages[index - 1].timestamp).getTime() > 300000
                  );

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      onReact={(emoji) => handleReaction(message.id, emoji)}
                      onReply={() => setReplyTo(message)}
                      onEdit={() => setEditingMessage(message)}
                      onDelete={() => {
                        setMessages(prev => ({
                          ...prev,
                          [activeRoom!]: prev[activeRoom!].filter(m => m.id !== message.id)
                        }));
                      }}
                    />
                  );
                })}
                
                {/* 타이핑 표시 */}
                {isTyping.filter(t => t.roomId === activeRoom).length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>
                      {isTyping.filter(t => t.roomId === activeRoom).map(t => t.userName).join(', ')}이(가) 입력 중...
                    </span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* 답장 표시 */}
              {replyTo && (
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">{replyTo.senderName}</span>에게 답장
                      <p className="text-gray-500 truncate">{replyTo.content}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)}>
                      <XMarkIcon className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* 입력 영역 */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <PhotoIcon className="h-4 w-4" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => {
                        setCurrentMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="메시지를 입력하세요..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim()}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>채팅방을 선택하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { RealTimeChat };
export type { ChatMessage, ChatRoom, ChatUser, TypingStatus };
export default RealTimeChat;