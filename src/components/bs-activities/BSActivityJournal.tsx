import React, { useState, useCallback, useRef } from 'react';
import {
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  CameraIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  PhotoIcon,
  XMarkIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import type { BSActivity, ActivityDetail, ActivityType, ActivityPhoto } from '../../types/bs-activities.types';
import { ACTIVITY_TYPE_CONFIG } from '../../types/bs-activities.types';

interface BSActivityJournalProps {
  activity?: BSActivity;
  onSave: (activity: Partial<BSActivity>) => Promise<void>;
  onSubmit: (activity: Partial<BSActivity>) => Promise<void>;
  readonly?: boolean;
}

const BSActivityJournal: React.FC<BSActivityJournalProps> = ({
  activity,
  onSave,
  onSubmit,
  readonly = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<BSActivity>>({
    visit_date: activity?.visit_date || new Date().toISOString().split('T')[0],
    clinic_name: activity?.clinic_name || '',
    clinic_address: activity?.clinic_address || '',
    clinic_phone: activity?.clinic_phone || '',
    visit_purpose: activity?.visit_purpose || '',
    activities: activity?.activities || [],
    photos: activity?.photos || [],
    status: activity?.status || 'draft'
  });

  // 새로운 필드들
  const [courseId, setCourseId] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [presentationDate, setPresentationDate] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<string>('');
  const [inspectionProduct, setInspectionProduct] = useState<string>('');
  const [inspectionCount, setInspectionCount] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [detailedActivity, setDetailedActivity] = useState<string>('');
  const [learningReflection, setLearningReflection] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [uploadedPhotos, setUploadedPhotos] = useState<ActivityPhoto[]>([]);

  const [currentActivity, setCurrentActivity] = useState<Partial<ActivityDetail>>({
    type: 'patient_consultation',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    participants: [],
    learning_objectives: [],
    what_learned: '',
    challenges_faced: '',
    how_handled: '',
    reflection: '',
    improvement_areas: '',
    questions_for_instructor: [],
    photos: []
  });

  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivityIndex, setEditingActivityIndex] = useState<number | null>(null);

  // 기본 정보 업데이트
  const updateBasicInfo = useCallback((field: keyof BSActivity, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 활동 추가/수정
  const handleActivitySave = useCallback(() => {
    if (!currentActivity.title || !currentActivity.description) {
      toast.error('활동 제목과 설명을 입력해주세요.');
      return;
    }

    const newActivity: ActivityDetail = {
      id: currentActivity.id || `activity-${Date.now()}`,
      type: currentActivity.type as ActivityType,
      title: currentActivity.title,
      description: currentActivity.description,
      start_time: currentActivity.start_time || '',
      end_time: currentActivity.end_time || '',
      duration_minutes: calculateDuration(currentActivity.start_time || '', currentActivity.end_time || ''),
      participants: currentActivity.participants || [],
      learning_objectives: currentActivity.learning_objectives || [],
      what_learned: currentActivity.what_learned || '',
      challenges_faced: currentActivity.challenges_faced || '',
      how_handled: currentActivity.how_handled || '',
      reflection: currentActivity.reflection || '',
      improvement_areas: currentActivity.improvement_areas || '',
      questions_for_instructor: currentActivity.questions_for_instructor || [],
      photos: currentActivity.photos || []
    };

    const updatedActivities = [...(formData.activities || [])];
    if (editingActivityIndex !== null) {
      updatedActivities[editingActivityIndex] = newActivity;
    } else {
      updatedActivities.push(newActivity);
    }

    setFormData(prev => ({
      ...prev,
      activities: updatedActivities
    }));

    // 폼 초기화
    setCurrentActivity({
      type: 'patient_consultation',
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      participants: [],
      learning_objectives: [],
      what_learned: '',
      challenges_faced: '',
      how_handled: '',
      reflection: '',
      improvement_areas: '',
      questions_for_instructor: [],
      photos: []
    });
    setShowActivityForm(false);
    setEditingActivityIndex(null);
    toast.success('활동이 저장되었습니다.');
  }, [currentActivity, formData.activities, editingActivityIndex]);

  // 시간 계산
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
  };

  // 활동 삭제
  const handleActivityDelete = useCallback((index: number) => {
    const updatedActivities = formData.activities?.filter((_, i) => i !== index) || [];
    setFormData(prev => ({
      ...prev,
      activities: updatedActivities
    }));
    toast.success('활동이 삭제되었습니다.');
  }, [formData.activities]);

  // 활동 편집
  const handleActivityEdit = useCallback((index: number) => {
    const activityToEdit = formData.activities?.[index];
    if (activityToEdit) {
      setCurrentActivity(activityToEdit);
      setEditingActivityIndex(index);
      setShowActivityForm(true);
    }
  }, [formData.activities]);

  // 배열 필드 업데이트 (참여자, 학습목표, 질문 등)
  const updateArrayField = useCallback((field: string, value: string[]) => {
    setCurrentActivity(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 사진 업로드 핸들러
  const handlePhotoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (uploadedPhotos.length + files.length > 5) {
      toast.error('사진은 최대 5장까지 업로드할 수 있습니다.');
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}은 10MB를 초과합니다.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto: ActivityPhoto = {
          id: `photo-${Date.now()}-${Math.random()}`,
          url: e.target?.result as string,
          caption: '',
          uploaded_at: new Date().toISOString()
        };
        setUploadedPhotos(prev => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  }, [uploadedPhotos]);

  // 사진 삭제
  const handlePhotoDelete = useCallback((photoId: string) => {
    setUploadedPhotos(prev => prev.filter(p => p.id !== photoId));
  }, []);

  // 카메라 촬영
  const handleCameraCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // 저장
  const handleSave = useCallback(async () => {
    try {
      const dataToSave = {
        ...formData,
        photos: uploadedPhotos,
        // 추가 필드들을 메타데이터로 저장
        metadata: {
          courseId,
          employeeId,
          department,
          studentName,
          presentationDate,
          completionDate,
          inspectionProduct,
          inspectionCount,
          summary,
          detailedActivity,
          learningReflection,
          specialNotes
        }
      };
      await onSave(dataToSave);
      toast.success('일지가 저장되었습니다.');
    } catch (error) {
      toast.error('저장 중 오류가 발생했습니다.');
    }
  }, [formData, uploadedPhotos, courseId, employeeId, department, studentName, presentationDate,
      completionDate, inspectionProduct, inspectionCount, summary, detailedActivity,
      learningReflection, specialNotes, onSave]);

  // 제출
  const handleSubmit = useCallback(async () => {
    if (!formData.clinic_name || !formData.visit_date) {
      toast.error('방문 치과명과 방문일을 입력해주세요.');
      return;
    }

    if (!courseId) {
      toast.error('교육 과정을 선택해주세요.');
      return;
    }

    if (!summary || !detailedActivity) {
      toast.error('요약과 상세 활동 내용을 입력해주세요.');
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        photos: uploadedPhotos,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        metadata: {
          courseId,
          employeeId,
          department,
          studentName,
          presentationDate,
          completionDate,
          inspectionProduct,
          inspectionCount,
          summary,
          detailedActivity,
          learningReflection,
          specialNotes
        }
      };
      await onSubmit(dataToSubmit);
      toast.success('일지가 제출되었습니다.');
    } catch (error) {
      toast.error('제출 중 오류가 발생했습니다.');
    }
  }, [formData, uploadedPhotos, courseId, employeeId, department, studentName, presentationDate,
      completionDate, inspectionProduct, inspectionCount, summary, detailedActivity,
      learningReflection, specialNotes, onSubmit]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'reviewed': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">BS 활동 일지</h1>
            <p className="text-gray-600">치과 방문 활동 및 학습 내용 기록</p>
          </div>
          {formData.status && (
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(formData.status)}`}>
              {formData.status === 'draft' && '작성 중'}
              {formData.status === 'submitted' && '제출 완료'}
              {formData.status === 'reviewed' && '검토 완료'}
              {formData.status === 'approved' && '승인 완료'}
            </span>
          )}
        </div>

        {/* 교육 과정 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            <AcademicCapIcon className="w-4 h-4 inline mr-2" />
            교육 과정
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            disabled={readonly}
            className="w-full border border-border rounded-lg px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
          >
            <option value="">교육 과정을 선택하세요</option>
            <option value="course-1">BS 기본 과정</option>
            <option value="course-2">BS 심화 과정</option>
            <option value="course-3">BS 전문가 과정</option>
          </select>
        </div>

        {/* 사진 업로드 섹션 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            <PhotoIcon className="w-4 h-4 inline mr-2" />
            사진 ({uploadedPhotos.length}/5)
          </label>
          <div className="space-y-3">
            {!readonly && (
              <div className="flex space-x-2">
                <button
                  onClick={handleCameraCapture}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center font-medium shadow-sm"
                >
                  <CameraIcon className="w-5 h-5 mr-2" />
                  사진 촬영/업로드
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {uploadedPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.caption || '활동 사진'}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    {!readonly && (
                      <button
                        onClick={() => handlePhotoDelete(photo.id)}
                        className="btn-danger absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BS 교육생 회복 섹션 */}
        <div className="border-t border-border pt-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">BS 교육생 회복</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">사번</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={readonly}
                placeholder="사번을 입력하세요"
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">소속</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={readonly}
                placeholder="소속을 입력하세요"
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">이름</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                disabled={readonly}
                placeholder="이름을 입력하세요"
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* BS 활동 입력 섹션 */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">BS 활동 입력</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <CalendarDaysIcon className="w-4 h-4 inline mr-2" />
                발표일
              </label>
              <input
                type="date"
                value={presentationDate}
                onChange={(e) => setPresentationDate(e.target.value)}
                disabled={readonly}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <CalendarDaysIcon className="w-4 h-4 inline mr-2" />
                방문일
              </label>
              <input
                type="date"
                value={formData.visit_date || ''}
                onChange={(e) => updateBasicInfo('visit_date', e.target.value)}
                disabled={readonly}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <CalendarDaysIcon className="w-4 h-4 inline mr-2" />
                완료일
              </label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                disabled={readonly}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <MapPinIcon className="w-4 h-4 inline mr-2" />
                방문 치과명
              </label>
              <input
                type="text"
                value={formData.clinic_name || ''}
                onChange={(e) => updateBasicInfo('clinic_name', e.target.value)}
                disabled={readonly}
                placeholder="방문한 치과/병원명을 입력하세요"
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">주소</label>
              <input
                type="text"
                value={formData.clinic_address || ''}
                onChange={(e) => updateBasicInfo('clinic_address', e.target.value)}
                disabled={readonly}
                placeholder="치과/병원 주소"
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">점검 제/상품</label>
              <input
                type="text"
                value={inspectionProduct}
                onChange={(e) => setInspectionProduct(e.target.value)}
                disabled={readonly}
                placeholder="점검한 제품/상품을 입력하세요"
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">점검 대수</label>
              <input
                type="text"
                value={inspectionCount}
                onChange={(e) => setInspectionCount(e.target.value)}
                disabled={readonly}
                placeholder="점검 대수를 입력하세요"
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">요약</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                disabled={readonly}
                placeholder="활동 내용을 간단히 요약해주세요"
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">상세 활동 내용</label>
              <textarea
                value={detailedActivity}
                onChange={(e) => setDetailedActivity(e.target.value)}
                disabled={readonly}
                placeholder="활동 내용을 자세히 설명해주세요"
                rows={5}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">학습/느낀 점</label>
              <textarea
                value={learningReflection}
                onChange={(e) => setLearningReflection(e.target.value)}
                disabled={readonly}
                placeholder="이 활동을 통해 배우고 느낀 점을 써주세요"
                rows={4}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">특이사항</label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                disabled={readonly}
                placeholder="특이사항이 있다면 기록해주세요"
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 활동 목록 */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">활동 내역</h2>
          {!readonly && (
            <button
              onClick={() => setShowActivityForm(true)}
              className="btn-primary"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              활동 추가
            </button>
          )}
        </div>

        {/* 활동 리스트 */}
        {formData.activities && formData.activities.length > 0 ? (
          <div className="space-y-4">
            {formData.activities.map((activity, index) => (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg text-white text-sm font-medium`} 
                         style={{ backgroundColor: ACTIVITY_TYPE_CONFIG[activity.type].color === 'blue' ? '#3B82F6' : 
                                                   ACTIVITY_TYPE_CONFIG[activity.type].color === 'green' ? '#10B981' : 
                                                   ACTIVITY_TYPE_CONFIG[activity.type].color === 'purple' ? '#8B5CF6' : '#6B7280' }}>
                      {ACTIVITY_TYPE_CONFIG[activity.type].icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                      <p className="text-sm text-gray-600">{ACTIVITY_TYPE_CONFIG[activity.type].label}</p>
                    </div>
                  </div>
                  {!readonly && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleActivityEdit(index)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        편집
                      </button>
                      <button
                        onClick={() => handleActivityDelete(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {activity.start_time} - {activity.end_time} ({activity.duration_minutes}분)
                  </div>
                  <div className="text-gray-600">
                    참여자: {activity.participants.join(', ')}
                  </div>
                  <div className="text-gray-600">
                    사진: {activity.photos?.length || 0}장
                  </div>
                </div>
                
                <p className="mt-3 text-gray-700">{activity.description}</p>
                
                {activity.what_learned && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1">배운 내용</p>
                    <p className="text-sm text-blue-700">{activity.what_learned}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>아직 등록된 활동이 없습니다.</p>
            {!readonly && <p className="text-sm">활동을 추가해서 일지를 작성해보세요.</p>}
          </div>
        )}
      </div>

      {/* 활동 추가/편집 폼 */}
      {showActivityForm && !readonly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {editingActivityIndex !== null ? '활동 편집' : '새 활동 추가'}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 활동 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">활동 유형</label>
                  <select
                    value={currentActivity.type}
                    onChange={(e) => setCurrentActivity(prev => ({ ...prev, type: e.target.value as ActivityType }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(ACTIVITY_TYPE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">활동 제목</label>
                  <input
                    type="text"
                    value={currentActivity.title || ''}
                    onChange={(e) => setCurrentActivity(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="활동 제목을 입력하세요"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">시작 시간</label>
                  <input
                    type="time"
                    value={currentActivity.start_time || ''}
                    onChange={(e) => setCurrentActivity(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">종료 시간</label>
                  <input
                    type="time"
                    value={currentActivity.end_time || ''}
                    onChange={(e) => setCurrentActivity(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">활동 설명</label>
                <textarea
                  value={currentActivity.description || ''}
                  onChange={(e) => setCurrentActivity(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="어떤 활동을 했는지 자세히 설명해주세요"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 학습 내용 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">배운 내용</label>
                  <textarea
                    value={currentActivity.what_learned || ''}
                    onChange={(e) => setCurrentActivity(prev => ({ ...prev, what_learned: e.target.value }))}
                    placeholder="이 활동을 통해 무엇을 배웠나요?"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">어려웠던 점</label>
                  <textarea
                    value={currentActivity.challenges_faced || ''}
                    onChange={(e) => setCurrentActivity(prev => ({ ...prev, challenges_faced: e.target.value }))}
                    placeholder="어떤 어려움이 있었나요?"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">대처 방법</label>
                  <textarea
                    value={currentActivity.how_handled || ''}
                    onChange={(e) => setCurrentActivity(prev => ({ ...prev, how_handled: e.target.value }))}
                    placeholder="어려움을 어떻게 해결했나요?"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">성찰/느낀점</label>
                  <textarea
                    value={currentActivity.reflection || ''}
                    onChange={(e) => setCurrentActivity(prev => ({ ...prev, reflection: e.target.value }))}
                    placeholder="이 경험을 통해 느낀 점이나 깨달은 점을 써주세요"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">개선할 점</label>
                  <textarea
                    value={currentActivity.improvement_areas || ''}
                    onChange={(e) => setCurrentActivity(prev => ({ ...prev, improvement_areas: e.target.value }))}
                    placeholder="앞으로 개선하고 싶은 부분이 있다면 써주세요"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowActivityForm(false);
                  setEditingActivityIndex(null);
                  setCurrentActivity({
                    type: 'patient_consultation',
                    title: '',
                    description: '',
                    start_time: '',
                    end_time: '',
                    participants: [],
                    learning_objectives: [],
                    what_learned: '',
                    challenges_faced: '',
                    how_handled: '',
                    reflection: '',
                    improvement_areas: '',
                    questions_for_instructor: [],
                    photos: []
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleActivitySave}
                className="btn-primary"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      {!readonly && (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
            >
              임시 저장
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center font-medium shadow-sm"
            >
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              제출하기
            </button>
          </div>
        </div>
      )}

      {/* 피드백 섹션 (검토된 일지의 경우) */}
      {activity?.instructor_feedback && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">강사 피드백</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">전체 평점:</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={`text-lg ${star <= activity.instructor_feedback!.overall_rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-600">({activity.instructor_feedback.overall_rating}/5)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-green-800 mb-2">잘한 점</h3>
                <ul className="space-y-1">
                  {activity.instructor_feedback.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-start">
                      <CheckCircleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-orange-800 mb-2">개선할 점</h3>
                <ul className="space-y-1">
                  {activity.instructor_feedback.areas_for_improvement.map((area, index) => (
                    <li key={index} className="text-sm text-orange-700 flex items-start">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-blue-800 mb-2">다음 목표</h3>
              <ul className="space-y-1">
                {activity.instructor_feedback.next_goals.map((goal, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start">
                    <QuestionMarkCircleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BSActivityJournal;