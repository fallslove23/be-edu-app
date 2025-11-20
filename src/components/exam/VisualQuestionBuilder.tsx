import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Bars3Icon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { QuestionType } from '@/types/exam.types';

export interface QuestionFormData {
  question_type: QuestionType;
  question_text: string;
  points: number;
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

interface VisualQuestionBuilderProps {
  questions: QuestionFormData[];
  onQuestionsChange: (questions: QuestionFormData[]) => void;
  onEditQuestion: (index: number) => void;
  onDeleteQuestion: (index: number) => void;
}

// 문제 타입 아이콘 및 색상
const getQuestionTypeInfo = (type: QuestionType) => {
  const info = {
    multiple_choice: {
      label: '객관식',
      color: 'bg-blue-100 text-blue-800',
      icon: '📝'
    },
    true_false: {
      label: 'O/X',
      color: 'bg-green-500/10 text-green-700',
      icon: '✓✗'
    },
    short_answer: {
      label: '단답형',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '📄'
    },
    essay: {
      label: '서술형',
      color: 'bg-purple-100 text-purple-800',
      icon: '📖'
    }
  };
  return info[type] || info.multiple_choice;
};

// 개별 문제 카드 (드래그 가능)
function SortableQuestionCard({
  question,
  index,
  onEdit,
  onDelete,
}: {
  question: QuestionFormData;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `question-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeInfo = getQuestionTypeInfo(question.question_type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-white rounded-lg border-2 p-5 transition-all ${
        isDragging
          ? 'border-blue-400 shadow-2xl z-50'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
      }`}
    >
      {/* 드래그 핸들 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Bars3Icon className="h-5 w-5" />
      </div>

      {/* 카드 내용 */}
      <div className="pl-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg shadow-md">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                  {typeInfo.icon} {typeInfo.label}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {question.points}점
                </span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="편집"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
              title="삭제"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 문제 텍스트 */}
        <div className="mb-3">
          <p className="text-gray-900 font-medium line-clamp-2">
            {question.question_text}
          </p>
        </div>

        {/* 객관식 선택지 미리보기 */}
        {question.question_type === 'multiple_choice' && question.options && (
          <div className="grid grid-cols-2 gap-2">
            {question.options.slice(0, 4).map((option, i) => {
              const isCorrect = question.correct_answer === String(i + 1);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
                    isCorrect
                      ? 'bg-green-500/10 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`truncate ${isCorrect ? 'font-medium text-green-900' : 'text-gray-700'}`}>
                    {option || '(비어있음)'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* O/X 문제 미리보기 */}
        {question.question_type === 'true_false' && (
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                question.correct_answer === 'true'
                  ? 'bg-green-500/10 text-green-700 font-semibold'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <CheckCircleIcon className="h-5 w-5" />O
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                question.correct_answer === 'false'
                  ? 'bg-destructive/10 text-destructive font-semibold'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <XCircleIcon className="h-5 w-5" />X
            </div>
          </div>
        )}

        {/* 설명 미리보기 */}
        {question.explanation && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 line-clamp-1">
              💡 {question.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// 메인 컴포넌트
export default function VisualQuestionBuilder({
  questions,
  onQuestionsChange,
  onEditQuestion,
  onDeleteQuestion,
}: VisualQuestionBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 후 드래그 시작 (클릭과 구분)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(String(active.id).replace('question-', ''));
      const newIndex = parseInt(String(over.id).replace('question-', ''));

      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      onQuestionsChange(newQuestions);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600 mb-2">문제가 없습니다</p>
        <p className="text-sm text-gray-500">문제은행에서 가져오거나 새 문제를 추가하세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 안내 메시지 */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Bars3Icon className="h-5 w-5 text-blue-600" />
        <p className="text-sm text-blue-900">
          <span className="font-semibold">드래그</span>하여 문제 순서를 변경할 수 있습니다
        </p>
      </div>

      {/* 드래그 가능한 문제 목록 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map((_, i) => `question-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {questions.map((question, index) => (
              <SortableQuestionCard
                key={`question-${index}`}
                question={question}
                index={index}
                onEdit={() => onEditQuestion(index)}
                onDelete={() => onDeleteQuestion(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* 통계 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{questions.length}</div>
            <div className="text-xs text-gray-600">총 문제</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {questions.reduce((sum, q) => sum + q.points, 0)}
            </div>
            <div className="text-xs text-gray-600">총 배점</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(questions.reduce((sum, q) => sum + q.points, 0) / questions.length) || 0}
            </div>
            <div className="text-xs text-gray-600">평균 배점</div>
          </div>
        </div>
      </div>
    </div>
  );
}
