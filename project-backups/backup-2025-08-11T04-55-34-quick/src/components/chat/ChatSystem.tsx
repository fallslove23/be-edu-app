import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  PhotoIcon,
  DocumentIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'system';
  attachment?: {
    type: string;
    url: string;
    name: string;
    size: number;
  };
  replyTo?: string;
  reactions?: { [emoji: string]: string[] };
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'course';
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isOnline?: boolean;
  avatar?: string;
}

interface ChatSystemProps {
  onClose?: () => void;
  initialRoomId?: string;
  embedded?: boolean;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ 
  onClose, 
  initialRoomId,
  embedded = false 
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeRoom, setActiveRoom] = useState<string>(initialRoomId || 'general');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // 샘플 채팅방 데이터
  useEffect(() => {
    const sampleRooms: ChatRoom[] = [
      {
        id: 'general',
        name: '전체 공지',
        type: 'group',
        participants: ['user1', 'user2', 'instructor1'],
        unreadCount: 2,
        lastMessage: {
          id: 'msg1',
          text: '내일 시험 일정이 변경되었습니다.',
          senderId: 'instructor1',
          senderName: '김강사',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          type: 'text'
        }
      },
      {
        id: 'course1',
        name: 'BS 영업 기초과정',
        type: 'course',
        participants: ['user1', 'user2', 'user3', 'instructor1'],
        unreadCount: 0,
        lastMessage: {
          id: 'msg2',
          text: '질문 있으시면 언제든지 말씀해주세요!',
          senderId: 'instructor1',
          senderName: '김강사',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'text'
        }
      },
      {
        id: 'direct1',
        name: '박교육생',
        type: 'direct',
        participants: ['user1', 'user2'],
        unreadCount: 1,
        isOnline: true,
        lastMessage: {
          id: 'msg3',
          text: '오늘 과제 같이 할까요?',
          senderId: 'user2',
          senderName: '박교육생',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          type: 'text'
        }
      }
    ];
    setRooms(sampleRooms);

    // 샘플 메시지 데이터
    const sampleMessages: Message[] = [
      {
        id: 'msg1',
        text: '안녕하세요! 새로운 과정이 시작되었습니다.',
        senderId: 'instructor1',
        senderName: '김강사',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        type: 'system'
      },
      {
        id: 'msg2',
        text: '질문이 있습니다. 과제 제출은 언제까지인가요?',
        senderId: 'user2',
        senderName: '박교육생',
        timestamp: new Date(Date.now() - 50 * 60 * 1000),
        type: 'text'
      },
      {
        id: 'msg3',
        text: '과제는 내일까지 제출해주시면 됩니다. 화이팅!',
        senderId: 'instructor1',
        senderName: '김강사',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        type: 'text',
        reactions: { '👍': ['user1', 'user2'], '❤️': ['user1'] }
      }
    ];
    setMessages(sampleMessages);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!message.trim() || !user) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text: message,
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date(),
      type: 'text',
      replyTo: replyingTo?.id
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setReplyingTo(null);

    // 메시지 전송 시뮬레이션 (실제로는 WebSocket으로 전송)
    setTimeout(() => {
      // 타이핑 인디케이터 표시
      setIsTyping(['instructor1']);
      
      setTimeout(() => {
        setIsTyping([]);
        // 자동 응답 (데모용)
        if (newMessage.text.includes('?') || newMessage.text.includes('질문')) {
          const autoReply: Message = {
            id: `reply-${Date.now()}`,
            text: '좋은 질문이네요! 곧 답변드리겠습니다.',
            senderId: 'instructor1',
            senderName: '김강사',
            timestamp: new Date(),
            type: 'text',
            replyTo: newMessage.id
          };
          setMessages(prev => [...prev, autoReply]);
        }
      }, 2000);
    }, 500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    Array.from(files).forEach((file) => {
      const newMessage: Message = {
        id: `file-${Date.now()}-${Math.random()}`,
        text: `파일을 첨부했습니다: ${file.name}`,
        senderId: user.id,
        senderName: user.name,
        timestamp: new Date(),
        type: file.type.startsWith('image/') ? 'image' : 'file',
        attachment: {
          type: file.type,
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size
        }
      };
      setMessages(prev => [...prev, newMessage]);
    });

    event.target.value = '';
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!user) return;

    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions };
        if (reactions[emoji]) {
          const userIndex = reactions[emoji].indexOf(user.id);
          if (userIndex > -1) {
            reactions[emoji].splice(userIndex, 1);
            if (reactions[emoji].length === 0) {
              delete reactions[emoji];
            }
          } else {
            reactions[emoji].push(user.id);
          }
        } else {
          reactions[emoji] = [user.id];
        }
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60 * 1000) return '방금';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}분 전`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}시간 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRoomData = rooms.find(room => room.id === activeRoom);

  const containerClass = embedded 
    ? 'h-full bg-white rounded-lg border border-gray-200'
    : 'fixed inset-0 bg-white z-50';

  return (
    <div className={containerClass}>
      <div className="flex h-full">
        {/* 채팅방 목록 */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                채팅
              </h2>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* 검색 */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="채팅방 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 채팅방 목록 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`p-3 rounded-lg cursor-pointer mb-1 transition-colors ${
                    activeRoom === room.id
                      ? 'bg-blue-100 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="relative">
                        {room.type === 'direct' ? (
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {room.name.charAt(0)}
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white">
                            <UserGroupIcon className="h-5 w-5" />
                          </div>
                        )}
                        {room.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {room.name}
                          </h3>
                          {room.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatTime(room.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        {room.lastMessage && (
                          <p className="text-sm text-gray-600 truncate">
                            {room.lastMessage.text}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {room.unreadCount > 0 && (
                      <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                        {room.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 채팅 메시지 영역 */}
        <div className="flex-1 flex flex-col">
          {/* 채팅방 헤더 */}
          {activeRoomData && (
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    {activeRoomData.name}
                  </h3>
                  {activeRoomData.type === 'course' && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      과정
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    참여자 {activeRoomData.participants.length}명
                  </span>
                  <button className="text-gray-500 hover:text-gray-700">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
              const prevMsg = messages[index - 1];
              const showSender = !prevMsg || prevMsg.senderId !== msg.senderId || 
                                 (msg.timestamp.getTime() - prevMsg.timestamp.getTime()) > 5 * 60 * 1000;

              return (
                <div key={msg.id} className="group">
                  {/* 답장 메시지 표시 */}
                  {msg.replyTo && (
                    <div className="ml-12 mb-2">
                      <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded border-l-2 border-gray-300">
                        답장: {messages.find(m => m.id === msg.replyTo)?.text}
                      </div>
                    </div>
                  )}

                  <div className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md ${msg.senderId === user?.id ? 'order-2' : 'order-1'}`}>
                      {showSender && msg.senderId !== user?.id && (
                        <div className="flex items-center mb-1">
                          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm mr-2">
                            {msg.senderName.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{msg.senderName}</span>
                          <span className="text-xs text-gray-500 ml-2">{formatTime(msg.timestamp)}</span>
                        </div>
                      )}
                      
                      <div className={`p-3 rounded-lg ${
                        msg.type === 'system' 
                          ? 'bg-gray-100 text-center text-gray-600 text-sm'
                          : msg.senderId === user?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                      }`}>
                        {msg.type === 'image' && msg.attachment && (
                          <div className="mb-2">
                            <img
                              src={msg.attachment.url}
                              alt={msg.attachment.name}
                              className="rounded-lg max-w-full h-auto"
                            />
                          </div>
                        )}
                        
                        {msg.type === 'file' && msg.attachment && (
                          <div className="flex items-center p-2 bg-white/20 rounded-lg mb-2">
                            <DocumentIcon className="h-6 w-6 mr-2" />
                            <div>
                              <div className="text-sm font-medium">{msg.attachment.name}</div>
                              <div className="text-xs opacity-75">
                                {(msg.attachment.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-sm break-words">{msg.text}</p>
                      </div>

                      {/* 반응 이모지 */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(msg.reactions).map(([emoji, users]) => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(msg.id, emoji)}
                              className={`text-xs px-2 py-1 rounded-full border ${
                                users.includes(user?.id || '')
                                  ? 'bg-blue-100 border-blue-300'
                                  : 'bg-gray-100 border-gray-300'
                              }`}
                            >
                              {emoji} {users.length}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* 메시지 액션 (호버 시 표시) */}
                      <div className="hidden group-hover:flex items-center space-x-1 mt-1">
                        <button
                          onClick={() => addReaction(msg.id, '👍')}
                          className="text-gray-400 hover:text-gray-600 text-xs p-1"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => addReaction(msg.id, '❤️')}
                          className="text-gray-400 hover:text-gray-600 text-xs p-1"
                        >
                          ❤️
                        </button>
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="text-gray-400 hover:text-gray-600 text-xs p-1"
                        >
                          답장
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 타이핑 인디케이터 */}
            {isTyping.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 답장 표시 */}
          {replyingTo && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{replyingTo.senderName}</span>님에게 답장: {replyingTo.text}
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* 메시지 입력 */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="파일 첨부"
              >
                <DocumentIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="이미지 첨부"
              >
                <PhotoIcon className="h-5 w-5" />
              </button>

              <div className="flex-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="메시지를 입력하세요..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="이모지"
              >
                <FaceSmileIcon className="h-5 w-5" />
              </button>

              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="전송"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSystem;