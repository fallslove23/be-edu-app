import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  subject: string;
  subTopic?: string;
  instructorId: string;
  instructorName: string;
  room?: string;
  equipment?: string[];
  materials?: string[];
  description?: string;
  type: 'lecture' | 'practice' | 'break' | 'exam';
}

interface DaySchedule {
  date: string;
  dayOfWeek: string;
  timeSlots: TimeSlot[];
}

interface CourseTemplate {
  id: string;
  name: string;
  category: 'BS-BASIC' | 'BS-ADVANCED' | 'BS-LEADERSHIP';
  defaultDuration: number; // 일수
  subjects: CourseSubject[];
}

interface CourseSubject {
  id: string;
  name: string;
  code: string;
  description: string;
  requiredHours: number;
  topics: SubjectTopic[];
}

interface SubjectTopic {
  id: string;
  name: string;
  duration: number; // 분
  type: 'lecture' | 'practice';
  requiredEquipment?: string[];
  preferredInstructors?: string[];
}

interface Instructor {
  id: string;
  name: string;
  specialties: string[];
  availability: {
    [date: string]: string[]; // 시간대 배열
  };
}

const EnhancedCourseCreation: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: 'BS-BASIC' as const,
    startDate: '',
    endDate: '',
    maxStudents: 20,
    templateId: ''
  });

  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>([]);

  useEffect(() => {
    loadTemplates();
    loadInstructors();
    loadResources();
  }, []);

  const loadTemplates = async () => {
    // 실제로는 API 호출
    const mockTemplates: CourseTemplate[] = [
      {
        id: 'bs-basic-template',
        name: 'BS 기초 과정 표준 템플릿',
        category: 'BS-BASIC',
        defaultDuration: 7,
        subjects: [
          {
            id: 'bs-understanding',
            name: 'BS 이해',
            code: 'BS001',
            description: 'BS의 기본 개념과 중요성',
            requiredHours: 4,
            topics: [
              {
                id: 'bs-intro',
                name: 'BS 기초 이론',
                duration: 60,
                type: 'lecture'
              },
              {
                id: 'bs-practice',
                name: 'BS 실습',
                duration: 120,
                type: 'practice',
                requiredEquipment: ['Kavo', 'NSK']
              }
            ]
          },
          {
            id: 'pc-basics',
            name: 'PC 기초',
            code: 'PC001',
            description: '컴퓨터 기초 활용',
            requiredHours: 2,
            topics: [
              {
                id: 'pc-intro',
                name: '컴퓨터 기초 사용법',
                duration: 60,
                type: 'lecture'
              },
              {
                id: 'pc-practice',
                name: '실습 및 활용',
                duration: 60,
                type: 'practice'
              }
            ]
          },
          {
            id: 'snap-system',
            name: 'SNAP 구축',
            code: 'SNAP001',
            description: 'SNAP 시스템 구축 및 활용',
            requiredHours: 6,
            topics: [
              {
                id: 'snap-theory',
                name: 'SNAP 이론',
                duration: 120,
                type: 'lecture'
              },
              {
                id: 'snap-practice',
                name: 'SNAP 실습',
                duration: 240,
                type: 'practice',
                requiredEquipment: ['SNAP 키트']
              }
            ]
          }
        ]
      }
    ];
    setTemplates(mockTemplates);
  };

  const loadInstructors = async () => {
    // 실제로는 API 호출
    const mockInstructors: Instructor[] = [
      {
        id: 'instructor-1',
        name: '김영희 강사',
        specialties: ['BS 이해', 'PC 기초'],
        availability: {
          '2025-08-22': ['09:00-10:00', '10:00-11:00', '13:00-14:00'],
          '2025-08-23': ['09:00-12:00', '14:00-17:00']
        }
      },
      {
        id: 'instructor-2',
        name: '박철수 강사',
        specialties: ['SNAP 구축', 'OneClick 이해'],
        availability: {
          '2025-08-22': ['11:00-12:00', '14:00-17:00'],
          '2025-08-23': ['09:00-12:00', '13:00-16:00']
        }
      },
      {
        id: 'instructor-3',
        name: '이미영 강사',
        specialties: ['Kavo 실습', 'NSK 실습'],
        availability: {
          '2025-08-22': ['09:00-12:00', '13:00-17:00'],
          '2025-08-23': ['10:00-12:00', '14:00-16:00']
        }
      }
    ];
    setInstructors(mockInstructors);
  };

  const loadResources = async () => {
    setAvailableRooms(['101호 강의실', '102호 실습실', '201호 컴퓨터실', '301호 실습실']);
    setAvailableEquipment([
      'Kavo', 'NSK', 'SNAP 키트', 'OneClick 시스템',
      'PC', '프로젝터', '실습용 모델', 'K3 시스템', 'K5 시스템'
    ]);
  };

  const generateScheduleFromTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || !courseData.startDate) return;

    const startDate = new Date(courseData.startDate);
    const generatedSchedules: DaySchedule[] = [];

    // 7일간의 스케줄 생성
    for (let day = 0; day < template.defaultDuration; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      // 주말 제외
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        continue;
      }

      const daySchedule: DaySchedule = {
        date: currentDate.toISOString().split('T')[0],
        dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][currentDate.getDay()],
        timeSlots: []
      };

      // 기본 시간표 구성 (9:00-18:00)
      const timeSlots = [
        { start: '09:00', end: '10:00', defaultSubject: 'BS 이해' },
        { start: '10:00', end: '11:00', defaultSubject: 'PC 기초' },
        { start: '11:00', end: '12:00', defaultSubject: 'CS 이해' },
        { start: '12:00', end: '13:00', defaultSubject: '점심 시간' },
        { start: '13:00', end: '14:00', defaultSubject: 'SNAP 구축' },
        { start: '14:00', end: '15:00', defaultSubject: 'T2 구축' },
        { start: '15:00', end: '16:00', defaultSubject: 'OneClick 이해' },
        { start: '16:00', end: '17:00', defaultSubject: 'Kavo 실습' },
        { start: '17:00', end: '18:00', defaultSubject: 'K3 정리' }
      ];

      timeSlots.forEach((slot, index) => {
        const timeSlot: TimeSlot = {
          id: `${day}-${index}`,
          startTime: slot.start,
          endTime: slot.end,
          subject: slot.defaultSubject,
          instructorId: '',
          instructorName: '',
          type: slot.defaultSubject === '점심 시간' ? 'break' : 'lecture'
        };

        // 과목에 따른 추천 강사 자동 배정
        const recommendedInstructor = instructors.find(inst => 
          inst.specialties.some(spec => slot.defaultSubject.includes(spec.split(' ')[0]))
        );

        if (recommendedInstructor) {
          timeSlot.instructorId = recommendedInstructor.id;
          timeSlot.instructorName = recommendedInstructor.name;
        }

        daySchedule.timeSlots.push(timeSlot);
      });

      generatedSchedules.push(daySchedule);
    }

    setSchedules(generatedSchedules);
  };

  const updateTimeSlot = (dayIndex: number, slotIndex: number, updates: Partial<TimeSlot>) => {
    setSchedules(prev => prev.map((schedule, dIndex) => {
      if (dIndex === dayIndex) {
        return {
          ...schedule,
          timeSlots: schedule.timeSlots.map((slot, sIndex) => {
            if (sIndex === slotIndex) {
              return { ...slot, ...updates };
            }
            return slot;
          })
        };
      }
      return schedule;
    }));
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSlot: TimeSlot = {
      id: `${dayIndex}-${Date.now()}`,
      startTime: '18:00',
      endTime: '19:00',
      subject: '',
      instructorId: '',
      instructorName: '',
      type: 'lecture'
    };

    setSchedules(prev => prev.map((schedule, index) => {
      if (index === dayIndex) {
        return {
          ...schedule,
          timeSlots: [...schedule.timeSlots, newSlot]
        };
      }
      return schedule;
    }));
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    setSchedules(prev => prev.map((schedule, index) => {
      if (index === dayIndex) {
        return {
          ...schedule,
          timeSlots: schedule.timeSlots.filter((_, sIndex) => sIndex !== slotIndex)
        };
      }
      return schedule;
    }));
  };

  const handleSaveCourse = async () => {
    try {
      const coursePayload = {
        ...courseData,
        schedules
      };
      
      console.log('과정 저장:', coursePayload);
      // 실제로는 API 호출
      
      alert('과정이 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('과정 생성 실패:', error);
      alert('과정 생성에 실패했습니다.');
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-card-foreground">기본 정보</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            과정명 <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={courseData.title}
            onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="예: 신입 영업사원 기초 교육"
            className="w-full px-3 py-2 border border-border rounded-full bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            과정 카테고리
          </label>
          <select
            value={courseData.category}
            onChange={(e) => setCourseData(prev => ({ ...prev, category: e.target.value as any }))}
            className="w-full px-3 py-2 border border-border rounded-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="BS-BASIC">BS 기초 과정</option>
            <option value="BS-ADVANCED">BS 고급 과정</option>
            <option value="BS-LEADERSHIP">BS 리더십 과정</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            시작일 <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={courseData.startDate}
            onChange={(e) => setCourseData(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            종료일 <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={courseData.endDate}
            onChange={(e) => setCourseData(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            최대 수강 인원
          </label>
          <input
            type="number"
            value={courseData.maxStudents}
            onChange={(e) => setCourseData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
            min="1"
            max="50"
            className="w-full px-3 py-2 border border-border rounded-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            템플릿 선택
          </label>
          <select
            value={courseData.templateId}
            onChange={(e) => {
              setCourseData(prev => ({ ...prev, templateId: e.target.value }));
              if (e.target.value) {
                generateScheduleFromTemplate(e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-border rounded-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">템플릿 선택 (선택사항)</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          과정 설명
        </label>
        <textarea
          value={courseData.description}
          onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="과정에 대한 상세 설명을 입력하세요."
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-full bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">시간표 구성</h3>
        {courseData.templateId && (
          <button
            onClick={() => generateScheduleFromTemplate(courseData.templateId)}
            className="btn-ghost flex items-center space-x-2"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            <span>템플릿 다시 적용</span>
          </button>
        )}
      </div>

      {schedules.map((daySchedule, dayIndex) => (
        <div key={daySchedule.date} className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-card-foreground">
              {daySchedule.date} ({daySchedule.dayOfWeek})
            </h4>
            <button
              onClick={() => addTimeSlot(dayIndex)}
              className="btn-ghost flex items-center space-x-1"
            >
              <PlusIcon className="h-4 w-4" />
              <span>시간 추가</span>
            </button>
          </div>

          <div className="space-y-3">
            {daySchedule.timeSlots.map((slot, slotIndex) => (
              <div key={slot.id} className="grid grid-cols-12 gap-3 items-center p-3 border border-border rounded-lg">
                {/* 시간 */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-1">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateTimeSlot(dayIndex, slotIndex, { startTime: e.target.value })}
                      className="text-xs border border-border rounded px-1 py-1 bg-background text-foreground"
                    />
                    <span className="text-xs text-muted-foreground">~</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateTimeSlot(dayIndex, slotIndex, { endTime: e.target.value })}
                      className="text-xs border border-border rounded px-1 py-1 bg-background text-foreground"
                    />
                  </div>
                </div>

                {/* 주제 */}
                <div className="col-span-3">
                  <input
                    type="text"
                    value={slot.subject}
                    onChange={(e) => updateTimeSlot(dayIndex, slotIndex, { subject: e.target.value })}
                    placeholder="과목명"
                    className="w-full text-sm border border-border rounded px-2 py-1 bg-background text-foreground placeholder-muted-foreground"
                  />
                </div>

                {/* 세부 주제 */}
                <div className="col-span-2">
                  <input
                    type="text"
                    value={slot.subTopic || ''}
                    onChange={(e) => updateTimeSlot(dayIndex, slotIndex, { subTopic: e.target.value })}
                    placeholder="세부 주제"
                    className="w-full text-sm border border-border rounded px-2 py-1 bg-background text-foreground placeholder-muted-foreground"
                  />
                </div>

                {/* 강사 */}
                <div className="col-span-2">
                  <select
                    value={slot.instructorId}
                    onChange={(e) => {
                      const instructor = instructors.find(i => i.id === e.target.value);
                      updateTimeSlot(dayIndex, slotIndex, {
                        instructorId: e.target.value,
                        instructorName: instructor?.name || ''
                      });
                    }}
                    className="w-full text-sm border border-border rounded px-2 py-1 bg-background text-foreground"
                  >
                    <option value="">강사 선택</option>
                    {instructors.map(instructor => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 강의실 */}
                <div className="col-span-2">
                  <select
                    value={slot.room || ''}
                    onChange={(e) => updateTimeSlot(dayIndex, slotIndex, { room: e.target.value })}
                    className="w-full text-sm border border-border rounded px-2 py-1 bg-background text-foreground"
                  >
                    <option value="">강의실 선택</option>
                    {availableRooms.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>

                {/* 삭제 버튼 */}
                <div className="col-span-1">
                  <button
                    onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                    className="text-destructive hover:text-destructive-hover"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto bg-card rounded-lg shadow-sm border border-border">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-semibold text-card-foreground">새 과정 생성</h2>
        <p className="text-sm text-muted-foreground">실제 운영에 맞는 상세한 과정을 생성합니다</p>
      </div>

      {/* 스텝 표시 */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              1
            </div>
            <span className="font-medium">기본 정보</span>
          </div>
          <div className="flex-1 h-px bg-border"></div>
          <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              2
            </div>
            <span className="font-medium">시간표 구성</span>
          </div>
        </div>
      </div>

      {/* 내용 */}
      <div className="px-6 py-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 py-4 border-t border-border flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>

        <div className="flex space-x-3">
          {currentStep === 1 && (
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!courseData.title || !courseData.startDate}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          )}

          {currentStep === 2 && (
            <button
              onClick={handleSaveCourse}
              className="btn-primary"
            >
              과정 생성
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCourseCreation;