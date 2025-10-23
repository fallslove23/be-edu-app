// BS 활동 일지 타입 정의

export interface BSActivityEntry {
  id: string;
  courseCode: string;
  courseName: string;
  round: number; // 차수 (1차, 2차 등)
  studentId: string;
  studentName: string;
  
  // 활동 내용
  title: string;
  workSite: string; // 현장 업무 장소
  workDate: string; // 업무 수행 날짜
  workContent: string; // 수행한 업무 내용
  learningPoints: string; // 학습 포인트
  challenges: string; // 어려웠던 점
  solutions: string; // 해결 방안
  insights: string; // 배운 점/깨달은 점
  improvementAreas: string; // 개선이 필요한 부분
  nextActions: string; // 다음에 할 일
  
  // 메타데이터
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  status: 'draft' | 'submitted' | 'ready_for_presentation' | 'presented' | 'feedback_received';
  
  // 발표 관련
  presentationDate?: string; // 발표 예정일
  presentationOrder?: number; // 발표 순서
  isSelected: boolean; // 해당 차수에서 발표자로 선정되었는지
  
  // 첨부파일 (모바일에서 촬영한 사진 등)
  attachments: ActivityAttachment[];
  
  // 점수 반영
  scoreReflected: boolean; // 점수 반영 여부
  submissionDeadline: string; // 제출 마감일
  isLateSubmission: boolean; // 늦은 제출 여부
}

export interface ActivityAttachment {
  id: string;
  fileName: string;
  fileType: 'image' | 'document';
  fileUrl: string;
  uploadedAt: string;
}

export interface InstructorFeedback {
  id: string;
  activityId: string;
  instructorId: string;
  instructorName: string;
  
  // 발표 평가
  presentationScore: number; // 1-10점
  contentQuality: number; // 내용의 질 (1-10점)
  presentationSkill: number; // 발표 스킬 (1-10점)
  
  // 피드백 내용
  strengths: string; // 잘한 점
  areasForImprovement: string; // 개선점
  specificSuggestions: string; // 구체적 제안사항
  encouragement: string; // 격려 메시지
  
  // 등급
  overallGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  
  createdAt: string;
  updatedAt: string;
}

export interface PresentationSchedule {
  id: string;
  courseCode: string;
  round: number;
  presentationDate: string;
  deadline: string; // 일지 제출 마감일
  
  // 발표자 정보
  selectedStudents: {
    studentId: string;
    studentName: string;
    activityId: string;
    presentationOrder: number;
    timeSlot?: string; // 발표 시간대
    isPresented?: boolean; // 발표 완료 여부
  }[];
  
  // 스케줄 설정
  maxPresenters: number;
  timePerPresentation: number; // 분 단위
  startTime: string;
  endTime: string;
  location: string;
  notes?: string;
  
  // 상태
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export type ScheduleStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface PresentationDay {
  id: string;
  scheduleId: string;
  actualDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  currentPresenter: {
    studentId: string;
    studentName: string;
    activityId: string;
    presentationOrder: number;
    timeSlot?: string;
  } | null;
  completedPresentations: {
    studentId: string;
    studentName: string;
    activityId: string;
    completedAt: string;
    attended: boolean;
  }[];
  startedAt: string | null;
  endedAt: string | null;
  notes?: string;
}

export interface ActivityJournalFilters {
  courseCode?: string;
  round?: number;
  studentId?: string;
  status?: BSActivityEntry['status'];
  workSite?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  hasAttachments?: boolean;
  scoreReflected?: boolean;
  presentationDate?: string;
}

export interface JournalStatistics {
  totalEntries: number;
  byStatus: Record<BSActivityEntry['status'], number>;
  byRound: Record<number, number>;
  submissionRate: number; // 제출률
  onTimeSubmissionRate: number; // 정시 제출률
  averageScore: number;
  feedbackCoverage: number; // 피드백 완료율
}