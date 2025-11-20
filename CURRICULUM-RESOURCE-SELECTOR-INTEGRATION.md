# CurriculumManager에 ResourceSelector 통합 가이드

ResourceSelector를 CurriculumManager의 세션 추가/수정 모달에 통합하는 방법입니다.

## 1. Import 추가

`src/components/schedule/CurriculumManager.tsx` 파일 상단에 추가:

```tsx
import { ResourceSelector } from '@/components/schedule/ResourceSelector';
```

## 2. State 확장

sessionForm에 classroom_id 추가:

```tsx
const [sessionForm, setSessionForm] = useState({
  day_number: 1,
  title: '',
  session_date: '',
  start_time: '09:00',
  end_time: '17:00',
  classroom: '',
  classroom_id: '',  // ✨ 추가
  actual_instructor_id: '',
  subject_id: '',    // ✨ 추가 (선택)
});
```

## 3. 일정 추가 모달 수정

기존 강의실/강사 선택 드롭다운을 ResourceSelector로 교체:

### Before (기존 코드):
```tsx
{/* 일정 추가 모달 */}
{showSessionModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
      {/* ... 헤더 ... */}

      <div className="space-y-4">
        {/* 날짜, 시간 입력 필드 */}

        {/* 강의실 선택 - 제거 */}
        <div>
          <label>강의실 *</label>
          <select value={sessionForm.classroom} ...>
            {/* ... */}
          </select>
        </div>

        {/* 강사 선택 - 제거 */}
        <div>
          <label>강사</label>
          <select value={sessionForm.actual_instructor_id} ...>
            {/* ... */}
          </select>
        </div>
      </div>
    </div>
  </div>
)}
```

### After (ResourceSelector 사용):
```tsx
{/* 일정 추가 모달 */}
{showSessionModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      {/* ... 헤더 ... */}

      <div className="space-y-4">
        {/* 기본 정보 (일차, 날짜, 제목, 시간) */}
        <div className="grid grid-cols-2 gap-4">
          {/* 일차, 날짜 */}
        </div>

        <div>
          {/* 제목 */}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 시작 시간, 종료 시간 */}
        </div>

        {/* ✨ ResourceSelector 추가 */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-4">자원 선택</h3>
          <ResourceSelector
            sessionDate={sessionForm.session_date}
            startTime={sessionForm.start_time}
            endTime={sessionForm.end_time}
            subjectId={sessionForm.subject_id}
            selectedInstructorId={sessionForm.actual_instructor_id}
            selectedClassroomId={sessionForm.classroom_id}
            onInstructorChange={(id) =>
              setSessionForm({...sessionForm, actual_instructor_id: id})
            }
            onClassroomChange={(id) => {
              // classroom_id와 classroom(name) 둘 다 설정
              const classroom = classrooms.find(c => c.id === id);
              setSessionForm({
                ...sessionForm,
                classroom_id: id,
                classroom: classroom?.name || ''
              });
            }}
            showRecommendations={true}
          />
        </div>
      </div>

      {/* ... 버튼 ... */}
    </div>
  </div>
)}
```

## 4. 일정 수정 모달 수정

동일한 방식으로 일정 수정 모달(`showEditModal`)에도 적용:

```tsx
{showEditModal && selectedSession && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      {/* ... */}

      {/* ✨ ResourceSelector 추가 */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-semibold mb-4">자원 선택</h3>
        <ResourceSelector
          sessionDate={sessionForm.session_date}
          startTime={sessionForm.start_time}
          endTime={sessionForm.end_time}
          selectedInstructorId={sessionForm.actual_instructor_id}
          selectedClassroomId={sessionForm.classroom_id}
          onInstructorChange={(id) =>
            setSessionForm({...sessionForm, actual_instructor_id: id})
          }
          onClassroomChange={(id) => {
            const classroom = classrooms.find(c => c.id === id);
            setSessionForm({
              ...sessionForm,
              classroom_id: id,
              classroom: classroom?.name || ''
            });
          }}
          excludeSessionId={selectedSession.id}
          showRecommendations={true}
        />
      </div>
    </div>
  </div>
)}
```

## 5. 세션 저장 시 classroom_id 포함

handleAddSession과 handleUpdateSession 함수에서 classroom_id도 함께 저장:

```tsx
const handleAddSession = async () => {
  if (!selectedRound) return;

  try {
    const { error } = await supabase
      .from('course_sessions')
      .insert([{
        round_id: selectedRound.id,
        ...sessionForm,
        classroom_id: sessionForm.classroom_id,  // ✨ 추가
        status: 'scheduled',
      }]);

    // ...
  } catch (error: any) {
    // ...
  }
};
```

## 6. 스타일 조정

모달 크기를 조정하여 ResourceSelector가 잘 보이도록:

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
  {/* max-w-2xl → max-w-3xl로 변경 */}
  {/* max-h-[90vh] overflow-y-auto 추가 */}
</div>
```

## 7. 테스트

1. **일정 추가 테스트**
   - 날짜와 시간을 입력
   - 사용 가능한 강사/강의실이 실시간으로 표시되는지 확인
   - 충돌하는 자원 선택 시 경고가 표시되는지 확인
   - 스마트 추천 기능 동작 확인

2. **충돌 감지 테스트**
   - 이미 다른 일정이 있는 시간대에 같은 강사/강의실 선택
   - 충돌 경고 메시지 확인
   - 그래도 저장 가능한지 확인

3. **데이터 저장 확인**
   - Supabase에서 course_sessions 테이블 확인
   - classroom_id가 올바르게 저장되었는지 확인
   - resource_bookings 테이블에 자동으로 예약이 생성되었는지 확인

## 참고사항

- ResourceSelector는 `sessionDate`, `startTime`, `endTime`이 모두 입력되어야 동작합니다
- `showRecommendations={false}`로 설정하면 추천 기능을 끌 수 있습니다
- `excludeSessionId`는 수정 모달에서 현재 세션을 충돌 체크에서 제외하기 위해 사용합니다

## 완료 체크리스트

- [ ] Import 추가
- [ ] State 확장 (classroom_id, subject_id)
- [ ] 일정 추가 모달에 ResourceSelector 통합
- [ ] 일정 수정 모달에 ResourceSelector 통합
- [ ] 세션 저장 시 classroom_id 포함
- [ ] 모달 크기 조정
- [ ] 테스트 완료
