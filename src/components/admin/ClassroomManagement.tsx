'use client';

import React, { useState, useEffect } from 'react';
import { ClassroomService } from '../../services/resource.services';
import type { Classroom, CreateClassroomData, UpdateClassroomData } from '../../types/resource.types';
import { COMMON_FACILITIES, COMMON_EQUIPMENT } from '../../types/resource.types';

export const ClassroomManagement: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateClassroomData>({
    name: '',
    code: '',
    location: '',
    building: '',
    floor: null,
    capacity: 20,
    facilities: [],
    equipment: [],
    description: '',
    is_available: true,
    photo_url: ''
  });

  // Load classrooms
  const loadClassrooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ClassroomService.getClassrooms();
      console.log('✅ Loaded classrooms:', data.length);
      setClassrooms(data);
    } catch (err) {
      console.error('❌ Failed to load classrooms:', err);
      setError(err instanceof Error ? err.message : '강의실을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  // Handle create
  const handleCreate = async () => {
    try {
      setError(null);
      await ClassroomService.createClassroom(formData);
      console.log('✅ Classroom created');
      await loadClassrooms();
      resetForm();
    } catch (err) {
      console.error('❌ Failed to create classroom:', err);
      setError(err instanceof Error ? err.message : '강의실 생성에 실패했습니다.');
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingClassroom) return;

    try {
      setError(null);
      const updateData: UpdateClassroomData = {
        name: formData.name,
        code: formData.code || null,
        location: formData.location,
        building: formData.building || null,
        floor: formData.floor,
        capacity: formData.capacity,
        facilities: formData.facilities,
        equipment: formData.equipment,
        description: formData.description || null,
        is_available: formData.is_available,
        photo_url: formData.photo_url || null
      };
      await ClassroomService.updateClassroom(editingClassroom.id, updateData);
      console.log('✅ Classroom updated');
      await loadClassrooms();
      resetForm();
    } catch (err) {
      console.error('❌ Failed to update classroom:', err);
      setError(err instanceof Error ? err.message : '강의실 수정에 실패했습니다.');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await ClassroomService.deleteClassroom(id);
      console.log('✅ Classroom deleted');
      await loadClassrooms();
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('❌ Failed to delete classroom:', err);
      setError(err instanceof Error ? err.message : '강의실 삭제에 실패했습니다.');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      location: '',
      building: '',
      floor: null,
      capacity: 20,
      facilities: [],
      equipment: [],
      description: '',
      is_available: true,
      photo_url: ''
    });
    setEditingClassroom(null);
    setIsFormOpen(false);
  };

  // Start editing
  const startEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setFormData({
      name: classroom.name,
      code: classroom.code || '',
      location: classroom.location,
      building: classroom.building || '',
      floor: classroom.floor,
      capacity: classroom.capacity,
      facilities: classroom.facilities || [],
      equipment: classroom.equipment || [],
      description: classroom.description || '',
      is_available: classroom.is_available,
      photo_url: classroom.photo_url || ''
    });
    setIsFormOpen(true);
  };

  // Toggle facility
  const toggleFacility = (facility: string) => {
    setFormData({
      ...formData,
      facilities: formData.facilities.includes(facility)
        ? formData.facilities.filter(f => f !== facility)
        : [...formData.facilities, facility]
    });
  };

  // Toggle equipment
  const toggleEquipment = (equip: string) => {
    setFormData({
      ...formData,
      equipment: formData.equipment.includes(equip)
        ? formData.equipment.filter(e => e !== equip)
        : [...formData.equipment, equip]
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">강의실 관리</h2>
          <p className="text-muted-foreground mt-1">
            강의실을 추가, 수정, 삭제할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
        >
          + 강의실 추가
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Classroom list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classrooms.length === 0 ? (
          <div className="col-span-full text-center p-8 bg-card rounded-lg">
            <p className="text-muted-foreground">등록된 강의실이 없습니다.</p>
          </div>
        ) : (
          classrooms.map((classroom) => (
            <div key={classroom.id} className="bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Classroom header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-card-foreground">{classroom.name}</h3>
                  {classroom.code && (
                    <p className="text-sm text-muted-foreground mt-1">코드: {classroom.code}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!classroom.is_available && (
                    <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded">
                      사용불가
                    </span>
                  )}
                </div>
              </div>

              {/* Location info */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">위치:</span>
                  <span className="text-card-foreground">{classroom.location}</span>
                </div>
                {classroom.building && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">건물:</span>
                    <span className="text-card-foreground">{classroom.building}</span>
                  </div>
                )}
                {classroom.floor !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">층:</span>
                    <span className="text-card-foreground">{classroom.floor}층</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">수용인원:</span>
                  <span className="text-card-foreground font-medium">{classroom.capacity}명</span>
                </div>
              </div>

              {/* Facilities */}
              {classroom.facilities && classroom.facilities.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">시설</p>
                  <div className="flex flex-wrap gap-1">
                    {classroom.facilities.map((facility) => (
                      <span
                        key={facility}
                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment */}
              {classroom.equipment && classroom.equipment.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">장비</p>
                  <div className="flex flex-wrap gap-1">
                    {classroom.equipment.map((equip) => (
                      <span
                        key={equip}
                        className="text-xs px-2 py-1 bg-secondary/50 text-secondary-foreground rounded"
                      >
                        {equip}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {classroom.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {classroom.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <button
                  onClick={() => startEdit(classroom)}
                  className="flex-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => setDeleteConfirmId(classroom.id)}
                  className="flex-1 px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                >
                  삭제
                </button>
              </div>

              {/* Delete confirmation modal */}
              {deleteConfirmId === classroom.id && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">강의실 삭제</h3>
                    <p className="text-muted-foreground mb-4">
                      &quot;{classroom.name}&quot; 강의실을 삭제하시겠습니까?
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleDelete(classroom.id)}
                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Form modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-card-foreground mb-4">
              {editingClassroom ? '강의실 수정' : '강의실 추가'}
            </h3>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    강의실 이름 <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="예: 대강당"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    강의실 코드
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="예: HALL-001"
                  />
                </div>
              </div>

              {/* Location Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    위치 <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="예: 본관 1층"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    건물
                  </label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="예: 본관"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    층
                  </label>
                  <input
                    type="number"
                    value={formData.floor || ''}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  수용인원 <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  min={1}
                  max={1000}
                />
              </div>

              {/* Facilities */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  시설
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_FACILITIES.map((facility) => (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => toggleFacility(facility)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        formData.facilities.includes(facility)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-input hover:border-primary'
                      }`}
                    >
                      {facility}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  장비
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_EQUIPMENT.map((equip) => (
                    <button
                      key={equip}
                      type="button"
                      onClick={() => toggleEquipment(equip)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        formData.equipment.includes(equip)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-input hover:border-primary'
                      }`}
                    >
                      {equip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="강의실에 대한 추가 설명을 입력하세요"
                />
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  사진 URL
                </label>
                <input
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="https://..."
                />
              </div>

              {/* Available status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <label htmlFor="is_available" className="text-sm font-medium text-card-foreground">
                  사용 가능
                </label>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
              >
                취소
              </button>
              <button
                onClick={editingClassroom ? handleUpdate : handleCreate}
                disabled={!formData.name.trim() || !formData.location.trim() || formData.capacity < 1}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingClassroom ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomManagement;
