'use client';

import React, { useState, useEffect } from 'react';
import { ClassroomService } from '../../services/resource.services';
import type { Classroom, CreateClassroomData, UpdateClassroomData } from '../../types/resource.types';
import { COMMON_FACILITIES, COMMON_EQUIPMENT } from '../../types/resource.types';
import { PageContainer } from '../common/PageContainer';
import { PlusIcon, MapPinIcon, BuildingOfficeIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
      <PageContainer>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">강의실 관리</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                강의실을 추가, 수정, 삭제할 수 있습니다.
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              강의실 추가
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Classroom list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.length === 0 ? (
            <div className="col-span-full text-center p-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">등록된 강의실이 없습니다.</p>
            </div>
          ) : (
            classrooms.map((classroom) => (
              <div key={classroom.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
                {/* Classroom header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{classroom.name}</h3>
                    {classroom.code && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">코드: {classroom.code}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!classroom.is_available && (
                      <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-medium">
                        사용불가
                      </span>
                    )}
                  </div>
                </div>

                {/* Location info */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">위치:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{classroom.location}</span>
                  </div>
                  {classroom.building && (
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">건물:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{classroom.building}</span>
                    </div>
                  )}
                  {classroom.floor !== null && (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-300 rounded-sm">F</span>
                      <span className="text-gray-500 dark:text-gray-400">층:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{classroom.floor}층</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">수용인원:</span>
                    <span className="text-gray-900 dark:text-white font-bold">{classroom.capacity}명</span>
                  </div>
                </div>

                {/* Facilities */}
                {classroom.facilities && classroom.facilities.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">시설</p>
                    <div className="flex flex-wrap gap-1">
                      {classroom.facilities.map((facility) => (
                        <span
                          key={facility}
                          className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg font-medium"
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
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">장비</p>
                    <div className="flex flex-wrap gap-1">
                      {classroom.equipment.map((equip) => (
                        <span
                          key={equip}
                          className="text-xs px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg font-medium"
                        >
                          {equip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {classroom.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {classroom.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => startEdit(classroom)}
                    className="btn-outline flex-1 py-2 text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(classroom.id)}
                    className="btn-danger flex-1 py-2 text-sm"
                  >
                    삭제
                  </button>
                </div>

                {/* Delete confirmation modal */}
                {deleteConfirmId === classroom.id && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">강의실 삭제</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        &quot;{classroom.name}&quot; 강의실을 삭제하시겠습니까?
                      </p>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="btn-outline"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleDelete(classroom.id)}
                          className="btn-danger"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingClassroom ? '강의실 수정' : '강의실 추가'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      강의실 이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                      placeholder="예: 대강당"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      강의실 코드
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                      placeholder="예: HALL-001"
                    />
                  </div>
                </div>

                {/* Location Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      위치 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                      placeholder="예: 본관 1층"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      건물
                    </label>
                    <input
                      type="text"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                      placeholder="예: 본관"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      층
                    </label>
                    <input
                      type="number"
                      value={formData.floor || ''}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                      placeholder="1"
                    />
                  </div>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    수용인원 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                    min={1}
                    max={1000}
                  />
                </div>

                {/* Facilities */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    시설
                  </label>
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600">
                    {COMMON_FACILITIES.map((facility) => (
                      <button
                        key={facility}
                        type="button"
                        onClick={() => toggleFacility(facility)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${formData.facilities.includes(facility)
                          ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                          }`}
                      >
                        {facility}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    장비
                  </label>
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600">
                    {COMMON_EQUIPMENT.map((equip) => (
                      <button
                        key={equip}
                        type="button"
                        onClick={() => toggleEquipment(equip)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${formData.equipment.includes(equip)
                          ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400'
                          }`}
                      >
                        {equip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="강의실에 대한 추가 설명을 입력하세요"
                  />
                </div>

                {/* Photo URL */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    사진 URL
                  </label>
                  <input
                    type="url"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>

                {/* Available status */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_available" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                    사용 가능 상태로 설정
                  </label>
                </div>
              </div>

              {/* Form actions */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={resetForm}
                  className="btn-outline"
                >
                  취소
                </button>
                <button
                  onClick={editingClassroom ? handleUpdate : handleCreate}
                  disabled={!formData.name.trim() || !formData.location.trim() || formData.capacity < 1}
                  className="btn-primary"
                >
                  {editingClassroom ? '수정 완료' : '강의실 추가'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ClassroomManagement;
