'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Classroom {
  id: string;
  name: string;
  capacity: number;
  location?: string;
  equipment?: string[]; // ["프로젝터", "화이트보드", "컴퓨터"]
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ClassroomForm {
  name: string;
  capacity: number;
  location: string;
  equipment: string[];
  notes: string;
}

interface ClassroomSchedule {
  date: string;
  schedules: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    course_name: string;
    instructor_name: string;
  }>;
}

const commonEquipment = [
  '프로젝터',
  '화이트보드',
  '컴퓨터',
  '스피커',
  'TV',
  '마이크',
  '레이저 포인터',
  '공기청정기',
  '에어컨',
];

export default function ClassroomsPage() {
  const [loading, setLoading] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClassroomForm>({
    name: '',
    capacity: 30,
    location: '',
    equipment: [],
    notes: '',
  });

  // 강의실별 일정 현황
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [classroomSchedules, setClassroomSchedules] = useState<ClassroomSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  useEffect(() => {
    loadClassrooms();
  }, []);

  useEffect(() => {
    if (selectedClassroomId) {
      loadClassroomSchedules(selectedClassroomId);
    }
  }, [selectedClassroomId]);

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      // TODO: 실제 API 호출
      // const data = await classroomService.getAll();
      setClassrooms([]);
    } catch (error) {
      console.error('강의실 조회 실패:', error);
      toast.error('강의실 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadClassroomSchedules = async (classroomId: string) => {
    try {
      setLoadingSchedules(true);
      // TODO: 실제 API 호출
      // const data = await scheduleService.getByClassroomId(classroomId, startDate, endDate);
      setClassroomSchedules([]);
    } catch (error) {
      console.error('강의실 일정 조회 실패:', error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleOpenForm = (classroom?: Classroom) => {
    if (classroom) {
      setEditingId(classroom.id);
      setFormData({
        name: classroom.name,
        capacity: classroom.capacity,
        location: classroom.location || '',
        equipment: classroom.equipment || [],
        notes: classroom.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        capacity: 30,
        location: '',
        equipment: [],
        notes: '',
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      capacity: 30,
      location: '',
      equipment: [],
      notes: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('강의실 이름을 입력해주세요.');
      return;
    }

    if (formData.capacity < 1) {
      toast.error('수용 인원은 1명 이상이어야 합니다.');
      return;
    }

    try {
      if (editingId) {
        // 수정
        // TODO: 실제 API 호출
        // await classroomService.update(editingId, formData);

        setClassrooms(
          classrooms.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  ...formData,
                  updated_at: new Date().toISOString(),
                }
              : c
          )
        );
        toast.success('강의실이 수정되었습니다.');
      } else {
        // 추가
        // TODO: 실제 API 호출
        // const newClassroom = await classroomService.create(formData);

        const newClassroom: Classroom = {
          id: Math.random().toString(),
          ...formData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setClassrooms([...classrooms, newClassroom]);
        toast.success('강의실이 추가되었습니다.');
      }

      handleCloseForm();
    } catch (error) {
      console.error('강의실 저장 실패:', error);
      toast.error('강의실 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 강의실을 삭제하시겠습니까?')) {
      return;
    }

    try {
      // TODO: 실제 API 호출
      // await classroomService.delete(id);

      setClassrooms(classrooms.filter((c) => c.id !== id));
      toast.success('강의실이 삭제되었습니다.');
    } catch (error) {
      console.error('강의실 삭제 실패:', error);
      toast.error('강의실 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      // TODO: 실제 API 호출
      // await classroomService.update(id, { is_active: !isActive });

      setClassrooms(
        classrooms.map((c) =>
          c.id === id
            ? { ...c, is_active: !isActive, updated_at: new Date().toISOString() }
            : c
        )
      );
      toast.success(isActive ? '강의실이 비활성화되었습니다.' : '강의실이 활성화되었습니다.');
    } catch (error) {
      console.error('상태 변경 실패:', error);
      toast.error('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const toggleEquipment = (item: string) => {
    if (formData.equipment.includes(item)) {
      setFormData({
        ...formData,
        equipment: formData.equipment.filter((e) => e !== item),
      });
    } else {
      setFormData({
        ...formData,
        equipment: [...formData.equipment, item],
      });
    }
  };

  return (
    <PageContainer>
      <PageHeader title="🏢 강의실 관리" description="강의실 및 장비를 관리합니다.">
        <button onClick={() => handleOpenForm()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          강의실 추가
        </button>
      </PageHeader>

      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">강의실 목록을 불러오는 중...</p>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <BuildingOfficeIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">등록된 강의실이 없습니다</h3>
          <p className="text-muted-foreground mb-6">새로운 강의실을 추가해주세요.</p>
          <button onClick={() => handleOpenForm()} className="btn-primary">
            강의실 추가
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 강의실 목록 */}
          <div className="space-y-4">
            {classrooms.map((classroom) => (
              <div
                key={classroom.id}
                className={`bg-card rounded-2xl border p-6 transition-all ${
                  classroom.is_active
                    ? 'border-border hover:shadow-md'
                    : 'border-border bg-muted/30 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-foreground">{classroom.name}</h3>
                      {!classroom.is_active && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          비활성
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {classroom.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPinIcon className="h-4 w-4" />
                          {classroom.location}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UsersIcon className="h-4 w-4" />
                        수용 인원: {classroom.capacity}명
                      </div>

                      {classroom.equipment && classroom.equipment.length > 0 && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <WrenchScrewdriverIcon className="h-4 w-4 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {classroom.equipment.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {classroom.notes && (
                        <p className="text-sm text-muted-foreground pt-2">{classroom.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 ml-4">
                    <button
                      onClick={() =>
                        selectedClassroomId === classroom.id
                          ? setSelectedClassroomId(null)
                          : setSelectedClassroomId(classroom.id)
                      }
                      className="p-2 rounded-lg hover:bg-muted/50 transition-all"
                      title="일정 현황"
                    >
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleOpenForm(classroom)}
                      className="p-2 rounded-lg hover:bg-muted/50 transition-all"
                      title="수정"
                    >
                      <PencilIcon className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(classroom.id, classroom.is_active)}
                      className="p-2 rounded-lg hover:bg-muted/50 transition-all"
                      title={classroom.is_active ? '비활성화' : '활성화'}
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {classroom.is_active ? '비활성' : '활성'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(classroom.id)}
                      className="p-2 rounded-lg hover:bg-destructive/20 transition-all"
                      title="삭제"
                    >
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 강의실별 일정 현황 */}
          {selectedClassroomId && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {classrooms.find((c) => c.id === selectedClassroomId)?.name} 일정 현황
              </h3>

              {loadingSchedules ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">일정을 불러오는 중...</p>
                </div>
              ) : classroomSchedules.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">예정된 일정이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {classroomSchedules.map((schedule) => (
                    <div key={schedule.date}>
                      <h4 className="font-medium text-foreground mb-2">
                        {new Date(schedule.date).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </h4>
                      <div className="space-y-2">
                        {schedule.schedules.map((item) => (
                          <div
                            key={item.id}
                            className="border border-border rounded-lg p-3 hover:bg-muted/30 transition-all"
                          >
                            <div className="font-medium text-foreground">{item.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(item.start_time).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {new Date(item.end_time).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.course_name} • {item.instructor_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 강의실 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground mb-4">
              {editingId ? '강의실 수정' : '강의실 추가'}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    강의실 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 강의실 A"
                    className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    수용 인원 *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">위치</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="예: 본관 3층"
                  className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">장비</label>
                <div className="grid grid-cols-3 gap-2">
                  {commonEquipment.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.equipment.includes(item)}
                        onChange={() => toggleEquipment(item)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">메모</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="강의실에 대한 추가 정보"
                  className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCloseForm}
                className="flex-1 px-4 py-2 rounded-xl border border-border bg-background text-foreground hover:bg-muted/50 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all"
              >
                {editingId ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
