import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  LinkIcon,
  CloudIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Google Calendar API 타입 정의
interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
    displayName?: string;
  }>;
  creator?: {
    email: string;
    displayName?: string;
  };
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
  hangoutLink?: string;
  recurringEventId?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  attendees: string[];
  type: 'lecture' | 'exam' | 'meeting' | 'other';
  courseId?: string;
  instructorId?: string;
  isGoogleEvent: boolean;
  googleEventId?: string;
  syncStatus: 'synced' | 'pending' | 'error' | 'local';
}

const GoogleCalendarIntegration: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [calendarView, setCalendarView] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    lastSync?: Date;
    error?: string;
  }>({
    connected: false
  });

  // 샘플 일정 데이터
  useEffect(() => {
    const sampleEvents: CalendarEvent[] = [
      {
        id: 'event-1',
        title: 'BS 신입사원 교육 - 1일차',
        description: '신입사원 오리엔테이션 및 회사 소개',
        startDate: '2025-01-28T09:00:00',
        endDate: '2025-01-28T18:00:00',
        location: '교육장 A',
        attendees: ['김교육', '이학습', '박교육'],
        type: 'lecture',
        courseId: 'BS-2025-01',
        instructorId: 'instructor-1',
        isGoogleEvent: true,
        googleEventId: 'google-event-1',
        syncStatus: 'synced'
      },
      {
        id: 'event-2',
        title: 'BS 신입사원 교육 - 필기시험',
        description: 'BS 과정 이론 평가',
        startDate: '2025-01-30T14:00:00',
        endDate: '2025-01-30T16:00:00',
        location: '시험장 B',
        attendees: ['김교육', '이학습', '박교육'],
        type: 'exam',
        courseId: 'BS-2025-01',
        instructorId: 'instructor-1',
        isGoogleEvent: false,
        syncStatus: 'pending'
      },
      {
        id: 'event-3',
        title: '강사 회의',
        description: '2월 교육 과정 계획 논의',
        startDate: '2025-01-29T15:00:00',
        endDate: '2025-01-29T17:00:00',
        location: '회의실 1',
        attendees: ['박강사', '김강사', '이강사'],
        type: 'meeting',
        isGoogleEvent: true,
        googleEventId: 'google-event-2',
        syncStatus: 'synced'
      }
    ];

    setEvents(sampleEvents);
  }, []);

  // Google Calendar 연결
  const connectToGoogleCalendar = async () => {
    setIsConnecting(true);
    
    try {
      // 실제 환경에서는 Google Calendar API 연결
      // const gapi = await import('gapi-script');
      // await gapi.load('auth2', initGoogleAuth);
      
      // 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      setConnectionStatus({
        connected: true,
        lastSync: new Date()
      });
      
      // 연결 후 자동 동기화
      await syncWithGoogleCalendar();
    } catch (error) {
      console.error('Google Calendar 연결 실패:', error);
      setConnectionStatus({
        connected: false,
        error: '연결에 실패했습니다. 다시 시도해주세요.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Google Calendar와 동기화
  const syncWithGoogleCalendar = async () => {
    if (!isConnected) return;
    
    setIsSyncing(true);
    
    try {
      // 실제 환경에서는 Google Calendar API 호출
      // const response = await gapi.client.calendar.events.list({
      //   calendarId: 'primary',
      //   timeMin: new Date().toISOString(),
      //   maxResults: 100,
      //   singleEvents: true,
      //   orderBy: 'startTime'
      // });
      
      // 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 로컬 이벤트를 Google Calendar에 업로드
      const pendingEvents = events.filter(event => event.syncStatus === 'pending');
      
      for (const event of pendingEvents) {
        await uploadEventToGoogle(event);
      }
      
      setConnectionStatus({
        connected: true,
        lastSync: new Date()
      });
      
      // 동기화 상태 업데이트
      setEvents(prev => prev.map(event => 
        event.syncStatus === 'pending' 
          ? { ...event, syncStatus: 'synced' as const, isGoogleEvent: true }
          : event
      ));
      
    } catch (error) {
      console.error('동기화 실패:', error);
      setConnectionStatus(prev => ({
        ...prev,
        error: '동기화에 실패했습니다.'
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Calendar에 이벤트 업로드
  const uploadEventToGoogle = async (event: CalendarEvent) => {
    // 실제 환경에서는 Google Calendar API 호출
    // const googleEvent: GoogleCalendarEvent = {
    //   summary: event.title,
    //   description: event.description,
    //   start: {
    //     dateTime: event.startDate,
    //     timeZone: 'Asia/Seoul'
    //   },
    //   end: {
    //     dateTime: event.endDate,
    //     timeZone: 'Asia/Seoul'
    //   },
    //   location: event.location,
    //   attendees: event.attendees.map(email => ({ email }))
    // };
    
    // await gapi.client.calendar.events.insert({
    //   calendarId: 'primary',
    //   resource: googleEvent
    // });
    
    console.log('Google Calendar에 업로드:', event.title);
  };

  // 새 이벤트 생성
  const handleCreateEvent = (eventData: Partial<CalendarEvent>) => {
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: eventData.title || '',
      description: eventData.description,
      startDate: eventData.startDate || '',
      endDate: eventData.endDate || '',
      location: eventData.location,
      attendees: eventData.attendees || [],
      type: eventData.type || 'other',
      courseId: eventData.courseId,
      instructorId: eventData.instructorId,
      isGoogleEvent: false,
      syncStatus: isConnected ? 'pending' : 'local'
    };

    setEvents(prev => [...prev, newEvent]);
    setShowEventForm(false);
    
    // 연결된 경우 자동 동기화
    if (isConnected) {
      syncWithGoogleCalendar();
    }
  };

  // 이벤트 수정
  const handleUpdateEvent = (eventData: Partial<CalendarEvent>) => {
    if (!editingEvent) return;

    const updatedEvent = {
      ...editingEvent,
      ...eventData,
      syncStatus: editingEvent.isGoogleEvent ? 'pending' as const : editingEvent.syncStatus
    };

    setEvents(prev => prev.map(event => 
      event.id === editingEvent.id ? updatedEvent : event
    ));
    
    setEditingEvent(null);
    setShowEventForm(false);
    
    // 연결된 경우 자동 동기화
    if (isConnected && updatedEvent.isGoogleEvent) {
      syncWithGoogleCalendar();
    }
  };

  // 이벤트 삭제
  const handleDeleteEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    if (event.isGoogleEvent && isConnected) {
      // Google Calendar에서도 삭제
      try {
        // await gapi.client.calendar.events.delete({
        //   calendarId: 'primary',
        //   eventId: event.googleEventId
        // });
        console.log('Google Calendar에서 삭제:', event.title);
      } catch (error) {
        console.error('Google Calendar 삭제 실패:', error);
      }
    }

    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  // 이벤트 타입별 색상
  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'exam': return 'bg-red-100 text-red-800 border-red-200';
      case 'meeting': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 동기화 상태 아이콘
  const getSyncStatusIcon = (status: CalendarEvent['syncStatus']) => {
    switch (status) {
      case 'synced':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <CloudIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  // 날짜 포맷팅
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ko-KR'),
      time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // 선택된 날짜의 이벤트 필터링
  const selectedDateEvents = events.filter(event => {
    const eventDate = new Date(event.startDate).toISOString().split('T')[0];
    return eventDate === selectedDate;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📅 구글 캘린더 연동</h1>
            <p className="text-gray-600">교육 일정을 구글 캘린더와 동기화하여 관리하세요.</p>
          </div>
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <>
                <button
                  onClick={syncWithGoogleCalendar}
                  disabled={isSyncing}
                  className="btn-success px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? '동기화 중...' : '동기화'}</span>
                </button>
                <button
                  onClick={() => setShowEventForm(true)}
                  className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>일정 추가</span>
                </button>
              </>
            ) : (
              <button
                onClick={connectToGoogleCalendar}
                disabled={isConnecting}
                className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
              >
                <LinkIcon className="h-4 w-4" />
                <span>{isConnecting ? '연결 중...' : 'Google Calendar 연결'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 연결 상태 */}
      <div className={`rounded-lg p-4 ${
        connectionStatus.connected 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus.connected ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            <span className={`font-medium ${
              connectionStatus.connected ? 'text-green-900' : 'text-yellow-900'
            }`}>
              {connectionStatus.connected ? 'Google Calendar 연결됨' : 'Google Calendar 연결 안됨'}
            </span>
          </div>
          {connectionStatus.lastSync && (
            <span className="text-sm text-gray-600">
              마지막 동기화: {connectionStatus.lastSync.toLocaleString('ko-KR')}
            </span>
          )}
        </div>
        {connectionStatus.error && (
          <div className="mt-2 text-sm text-red-600">
            {connectionStatus.error}
          </div>
        )}
      </div>

      {/* 캘린더 네비게이션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">날짜 선택:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'day' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              일
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'week' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              주
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'month' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              월
            </button>
          </div>
        </div>
      </div>

      {/* 일정 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {new Date(selectedDate).toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} 일정 ({selectedDateEvents.length})
          </h3>
        </div>

        {selectedDateEvents.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 일정이 없습니다</h3>
            <p className="text-gray-600 mb-4">선택한 날짜에 예정된 일정이 없습니다.</p>
            {isConnected && (
              <button
                onClick={() => setShowEventForm(true)}
                className="btn-primary px-4 py-2 rounded-lg"
              >
                첫 일정 추가하기
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {selectedDateEvents.map((event) => {
              const startTime = formatDateTime(event.startDate);
              const endTime = formatDateTime(event.endDate);
              
              return (
                <div key={event.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{event.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getEventTypeColor(event.type)}`}>
                          {event.type === 'lecture' ? '강의' : 
                           event.type === 'exam' ? '시험' : 
                           event.type === 'meeting' ? '회의' : '기타'}
                        </span>
                        {getSyncStatusIcon(event.syncStatus)}
                        {event.isGoogleEvent && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Google
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {startTime.time} - {endTime.time}
                        </div>
                        {event.location && (
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-2" />
                            {event.location}
                          </div>
                        )}
                        {event.attendees.length > 0 && (
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-2" />
                            {event.attendees.length}명 참석
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-700 mb-3">{event.description}</p>
                      )}

                      {event.attendees.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {event.attendees.slice(0, 3).map((attendee, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {attendee}
                            </span>
                          ))}
                          {event.attendees.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              +{event.attendees.length - 3}명
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingEvent(event);
                          setShowEventForm(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                        title="수정"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        title="삭제"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">전체 일정</p>
              <p className="text-xl font-bold text-gray-900">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">동기화됨</p>
              <p className="text-xl font-bold text-gray-900">
                {events.filter(e => e.syncStatus === 'synced').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">대기 중</p>
              <p className="text-xl font-bold text-gray-900">
                {events.filter(e => e.syncStatus === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CloudIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Google 일정</p>
              <p className="text-xl font-bold text-gray-900">
                {events.filter(e => e.isGoogleEvent).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 사용 안내 */}
      {!isConnected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">🔗 Google Calendar 연동 안내</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• Google Calendar와 연동하여 교육 일정을 자동으로 동기화할 수 있습니다</p>
            <p>• 연결 후 기존 일정들이 Google Calendar에 자동으로 업로드됩니다</p>
            <p>• 양방향 동기화로 Google Calendar에서 수정한 내용도 반영됩니다</p>
            <p>• 무료 Google 계정으로 이용 가능하며 추가 비용이 발생하지 않습니다</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarIntegration;