'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import {
  ClockIcon,
  PlusIcon,
  TrashIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface InstructorAvailability {
  id: string;
  instructor_id: string;
  day_of_week: number; // 0=일요일, 6=토요일
  start_time: string; // "09:00:00"
  end_time: string; // "18:00:00"
  is_available: boolean;
  recurring: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PersonalEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  event_type: 'personal' | 'holiday' | 'vacation' | 'meeting';
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  created_at: string;
  updated_at: string;
}

interface TimeSlotForm {
  day_of_week: number;
  start_time: string;
  end_time: string;
  notes: string;
}

interface PersonalEventForm {
  title: string;
  description: string;
  event_type: 'personal' | 'vacation' | 'meeting';
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
}

export default function InstructorAvailabilityPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 주간 가용 시간
  const [availabilities, setAvailabilities] = useState<InstructorAvailability[]>([]);
  const [editingSlot, setEditingSlot] = useState<TimeSlotForm | null>(null);

  // 일시적 불가능 시간 (휴가, 개인 일정)
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState<PersonalEventForm>({
    title: '',
    description: '',
    event_type: 'vacation',
    start_date: '',
    end_date: '',
    start_time: '09:00',
    end_time: '18:00',
    is_all_day: false,
  });

  const weekDays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const weekDaysShort = ['일', '월', '화', '수', '목', '금', '토'];

  useEffect(() => {
    if (user) {
      loadAvailabilities();
      loadPersonalEvents();
    }
  }, [user]);

  const loadAvailabilities = async () => {
    try {
      setLoading(true);
      // TODO: 실제 API 호출
      // const data = await instructorAvailabilityService.getByInstructorId(user.id);
      setAvailabilities([]);
    } catch (error) {
      console.error('가용 시간 조회 실패:', error);
      toast.error('가용 시간을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalEvents = async () => {
    try {
      // TODO: 실제 API 호출
      // const data = await personalEventService.getByUserId(user.id);
      setPersonalEvents([]);
    } catch (error) {
      console.error('개인 일정 조회 실패:', error);
    }
  };

  const handleAddTimeSlot = (dayOfWeek: number) => {
    setEditingSlot({
      day_of_week: dayOfWeek,
      start_time: '09:00',
      end_time: '18:00',
      notes: '',
    });
  };

  const handleSaveTimeSlot = async () => {
    if (!editingSlot || !user) {
      return;
    }

    if (editingSlot.start_time >= editingSlot.end_time) {
      toast.error('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    try {
      setSaving(true);

      // TODO: 실제 API 호출
      // await instructorAvailabilityService.create({
      //   instructor_id: user.id,
      //   day_of_week: editingSlot.day_of_week,
      //   start_time: editingSlot.start_time,
      //   end_time: editingSlot.end_time,
      //   is_available: true,
      //   recurring: true,
      //   notes: editingSlot.notes,
      // });

      // 로컬 상태 업데이트
      const newSlot: InstructorAvailability = {
        id: Math.random().toString(),
        instructor_id: user.id,
        day_of_week: editingSlot.day_of_week,
        start_time: editingSlot.start_time + ':00',
        end_time: editingSlot.end_time + ':00',
        is_available: true,
        recurring: true,
        notes: editingSlot.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setAvailabilities([...availabilities, newSlot]);
      setEditingSlot(null);
      toast.success('가용 시간이 추가되었습니다.');
    } catch (error) {
      console.error('가용 시간 추가 실패:', error);
      toast.error('가용 시간 추가 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTimeSlot = async (id: string) => {
    if (!confirm('이 가용 시간을 삭제하시겠습니까?')) {
      return;
    }

    try {
      // TODO: 실제 API 호출
      // await instructorAvailabilityService.delete(id);

      setAvailabilities(availabilities.filter((a) => a.id !== id));
      toast.success('가용 시간이 삭제되었습니다.');
    } catch (error) {
      console.error('가용 시간 삭제 실패:', error);
      toast.error('가용 시간 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSavePersonalEvent = async () => {
    if (!eventForm.title || !eventForm.start_date || !eventForm.end_date || !user) {
      toast.error('모든 필수 항목을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);

      const startDateTime = eventForm.is_all_day
        ? new Date(eventForm.start_date + 'T00:00:00')
        : new Date(eventForm.start_date + 'T' + eventForm.start_time + ':00');

      const endDateTime = eventForm.is_all_day
        ? new Date(eventForm.end_date + 'T23:59:59')
        : new Date(eventForm.end_date + 'T' + eventForm.end_time + ':00');

      // TODO: 실제 API 호출
      // await personalEventService.create({
      //   user_id: user.id,
      //   title: eventForm.title,
      //   description: eventForm.description,
      //   event_type: eventForm.event_type,
      //   start_time: startDateTime.toISOString(),
      //   end_time: endDateTime.toISOString(),
      //   is_all_day: eventForm.is_all_day,
      // });

      // 로컬 상태 업데이트
      const newEvent: PersonalEvent = {
        id: Math.random().toString(),
        user_id: user.id,
        title: eventForm.title,
        description: eventForm.description,
        event_type: eventForm.event_type,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_all_day: eventForm.is_all_day,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setPersonalEvents([...personalEvents, newEvent]);
      setShowEventForm(false);
      setEventForm({
        title: '',
        description: '',
        event_type: 'vacation',
        start_date: '',
        end_date: '',
        start_time: '09:00',
        end_time: '18:00',
        is_all_day: false,
      });
      toast.success('일정이 추가되었습니다.');
    } catch (error) {
      console.error('일정 추가 실패:', error);
      toast.error('일정 추가 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePersonalEvent = async (id: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) {
      return;
    }

    try {
      // TODO: 실제 API 호출
      // await personalEventService.delete(id);

      setPersonalEvents(personalEvents.filter((e) => e.id !== id));
      toast.success('일정이 삭제되었습니다.');
    } catch (error) {
      console.error('일정 삭제 실패:', error);
      toast.error('일정 삭제 중 오류가 발생했습니다.');
    }
  };

  const getSlotsForDay = (dayOfWeek: number) => {
    return availabilities.filter((a) => a.day_of_week === dayOfWeek).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // "09:00:00" -> "09:00"
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      personal: '개인 일정',
      vacation: '휴가',
      meeting: '회의',
      holiday: '공휴일',
    };
    return labels[type] || type;
  };

  return (
    <PageContainer>
      <PageHeader title="⏰ 강사 가용 시간 관리" description="주간 가용 시간표와 일시적 불가능 시간을 관리합니다." />

      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <>
          {/* 주간 가용 시간표 */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-foreground">주간 가용 시간표</h2>
              </div>
              <p className="text-sm text-muted-foreground">매주 반복되는 가용 시간을 설정합니다.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
              {weekDays.map((day, index) => {
                const daySlots = getSlotsForDay(index);
                return (
                  <div key={index} className="border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-bold ${index === 0 ? 'text-destructive' : index === 6 ? 'text-primary' : 'text-foreground'}`}>
                        {weekDaysShort[index]}
                      </h3>
                      <button
                        onClick={() => handleAddTimeSlot(index)}
                        className="p-1 rounded-lg hover:bg-muted/50 transition-all"
                        title="시간대 추가"
                      >
                        <PlusIcon className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {daySlots.length > 0 ? (
                        daySlots.map((slot) => (
                          <div key={slot.id} className="bg-primary/10 border border-primary/20 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-primary">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                              <button
                                onClick={() => handleDeleteTimeSlot(slot.id)}
                                className="p-0.5 rounded hover:bg-destructive/20 transition-all"
                              >
                                <TrashIcon className="h-3 w-3 text-destructive" />
                              </button>
                            </div>
                            {slot.notes && <p className="text-xs text-muted-foreground">{slot.notes}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">시간대 없음</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 시간대 추가 모달 */}
            {editingSlot && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    {weekDays[editingSlot.day_of_week]} 시간대 추가
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">시작 시간</label>
                      <input
                        type="time"
                        value={editingSlot.start_time}
                        onChange={(e) => setEditingSlot({ ...editingSlot, start_time: e.target.value })}
                        className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">종료 시간</label>
                      <input
                        type="time"
                        value={editingSlot.end_time}
                        onChange={(e) => setEditingSlot({ ...editingSlot, end_time: e.target.value })}
                        className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">메모 (선택)</label>
                      <input
                        type="text"
                        value={editingSlot.notes}
                        onChange={(e) => setEditingSlot({ ...editingSlot, notes: e.target.value })}
                        placeholder="예: 오전만 가능"
                        className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingSlot(null)}
                      className="flex-1 px-4 py-2 rounded-xl border border-border bg-background text-foreground hover:bg-muted/50 transition-all"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveTimeSlot}
                      disabled={saving}
                      className="flex-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      {saving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 일시적 불가능 시간 (휴가, 개인 일정) */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-foreground">일시적 불가능 시간</h2>
              </div>
              <button onClick={() => setShowEventForm(true)} className="btn-primary flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                일정 추가
              </button>
            </div>

            {personalEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`border rounded-xl p-4 ${
                      event.event_type === 'vacation'
                        ? 'border-blue-500/20 bg-blue-500/10'
                        : event.event_type === 'meeting'
                        ? 'border-purple-500/20 bg-purple-500/10'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-foreground">{event.title}</h3>
                        <span className="text-xs text-muted-foreground">{getEventTypeLabel(event.event_type)}</span>
                      </div>
                      <button
                        onClick={() => handleDeletePersonalEvent(event.id)}
                        className="p-1 rounded hover:bg-destructive/20 transition-all"
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </button>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        {new Date(event.start_time).toLocaleDateString('ko-KR')}
                        {!event.is_all_day && ` ${new Date(event.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                      <p>
                        ~ {new Date(event.end_time).toLocaleDateString('ko-KR')}
                        {!event.is_all_day && ` ${new Date(event.end_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                      {event.description && <p className="text-xs pt-2">{event.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">등록된 일정이 없습니다.</p>
              </div>
            )}

            {/* 일정 추가 모달 */}
            {showEventForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-bold text-foreground mb-4">일정 추가</h3>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">제목 *</label>
                      <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        placeholder="예: 여름 휴가"
                        className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">유형 *</label>
                      <select
                        value={eventForm.event_type}
                        onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value as any })}
                        className="w-full appearance-none border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        <option value="vacation">휴가</option>
                        <option value="meeting">회의</option>
                        <option value="personal">개인 일정</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">시작 날짜 *</label>
                        <input
                          type="date"
                          value={eventForm.start_date}
                          onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                          className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">종료 날짜 *</label>
                        <input
                          type="date"
                          value={eventForm.end_date}
                          onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                          className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eventForm.is_all_day}
                          onChange={(e) => setEventForm({ ...eventForm, is_all_day: e.target.checked })}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">종일</span>
                      </label>
                    </div>

                    {!eventForm.is_all_day && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">시작 시간</label>
                          <input
                            type="time"
                            value={eventForm.start_time}
                            onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                            className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">종료 시간</label>
                          <input
                            type="time"
                            value={eventForm.end_time}
                            onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                            className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">설명 (선택)</label>
                      <textarea
                        value={eventForm.description}
                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        rows={3}
                        placeholder="일정에 대한 추가 설명"
                        className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEventForm(false)}
                      className="flex-1 px-4 py-2 rounded-xl border border-border bg-background text-foreground hover:bg-muted/50 transition-all"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSavePersonalEvent}
                      disabled={saving}
                      className="flex-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      {saving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}
