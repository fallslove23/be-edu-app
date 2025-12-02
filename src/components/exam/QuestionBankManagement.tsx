import React, { useState, useEffect } from 'react';
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { QuestionBankService } from '../../services/question-bank.service';
import type { QuestionBank, Question } from '../../services/question-bank.service';
import { PageContainer } from '../common/PageContainer';

interface QuestionBankManagementProps {
  onBack: () => void;
  onSelectBank?: (bank: QuestionBank) => void;
}

type ViewType = 'list' | 'bank-form' | 'question-list' | 'question-form';

const QuestionBankManagement: React.FC<QuestionBankManagementProps> = ({ onBack, onSelectBank }) => {
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 문제은행 목록 로드
  useEffect(() => {
    loadQuestionBanks();
  }, []);

  const loadQuestionBanks = async () => {
    try {
      setLoading(true);
      console.log('📚 Loading question banks...');
      const banks = await QuestionBankService.getQuestionBanks({ includeQuestions: true });
      console.log('✅ Loaded question banks:', banks);
      setQuestionBanks(banks);
    } catch (error) {
      console.error('❌ Failed to load question banks:', error);
      alert('문제은행 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 문제은행 저장
  const handleSaveBank = async (bankData: { name: string; description?: string; category?: string; template_id?: string }) => {
    try {
      setLoading(true);
      if (selectedBank) {
        // 수정
        console.log('📝 Updating question bank:', selectedBank.id);
        await QuestionBankService.updateQuestionBank(selectedBank.id, bankData);
        alert('문제은행이 수정되었습니다.');
      } else {
        // 생성
        console.log('➕ Creating new question bank');
        await QuestionBankService.createQuestionBank(bankData);
        alert('문제은행이 생성되었습니다.');
      }
      await loadQuestionBanks();
      setCurrentView('list');
      setSelectedBank(null);
    } catch (error) {
      console.error('❌ Failed to save question bank:', error);
      alert('문제은행 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 문제은행 삭제
  const handleDeleteBank = async (bankId: string, bankName: string) => {
    if (!confirm(`"${bankName}" 문제은행을 삭제하시겠습니까?\n\n⚠️ 문제은행 내의 모든 문제도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ Deleting question bank:', bankId);
      await QuestionBankService.deleteQuestionBank(bankId);
      alert('문제은행이 삭제되었습니다.');
      await loadQuestionBanks();
    } catch (error) {
      console.error('❌ Failed to delete question bank:', error);
      alert('문제은행 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 문제은행 편집
  const handleEditBank = (bank: QuestionBank) => {
    setSelectedBank(bank);
    setCurrentView('bank-form');
  };

  // 문제은행 선택 (문제 관리)
  const handleViewQuestions = async (bank: QuestionBank) => {
    try {
      setLoading(true);
      console.log('📝 Loading questions for bank:', bank.id);
      const fullBank = await QuestionBankService.getQuestionBankById(bank.id);
      setSelectedBank(fullBank);
      setCurrentView('question-list');
    } catch (error) {
      console.error('❌ Failed to load questions:', error);
      alert('문제 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 필터링
  const filteredBanks = questionBanks.filter(bank => {
    if (!searchTerm) return true;
    return bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.category?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 문제은행 생성/수정 폼
  if (currentView === 'bank-form') {
    return <BankForm
      bank={selectedBank}
      onSave={handleSaveBank}
      onCancel={() => {
        setCurrentView('list');
        setSelectedBank(null);
      }}
    />;
  }

  // 문제 목록 및 관리
  if (currentView === 'question-list' && selectedBank) {
    return <QuestionList
      bank={selectedBank}
      onBack={() => {
        setCurrentView('list');
        setSelectedBank(null);
      }}
      onRefresh={loadQuestionBanks}
    />;
  }

  // 문제은행 목록 뷰
  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={onBack}
                className="mb-4 btn-ghost flex items-center transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                뒤로 가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BookOpenIcon className="h-8 w-8 mr-3 text-gray-600" />
                문제은행 관리
              </h1>
              <p className="mt-2 text-gray-600">
                시험 문제를 체계적으로 관리하고 재사용하세요.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedBank(null);
                setCurrentView('bank-form');
              }}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              새 문제은행
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="문제은행 검색..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
        </div>

        {/* 문제은행 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">문제은행 목록</h2>
            <div className="text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{filteredBanks.length}</span>개
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-gray-600"></div>
              <span className="ml-3 text-gray-600">문제은행을 불러오는 중...</span>
            </div>
          ) : filteredBanks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpenIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {searchTerm ? '검색 결과가 없습니다.' : '문제은행이 없습니다.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setCurrentView('bank-form')}
                  className="btn-primary"
                >
                  첫 문제은행 만들기
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBanks.map((bank) => (
                <div
                  key={bank.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 line-clamp-1">
                        {bank.name}
                      </h3>
                      {bank.category && (
                        <p className="text-sm text-gray-600 mt-1">{bank.category}</p>
                      )}
                    </div>
                  </div>

                  {bank.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {bank.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span>📝 {bank.question_count || 0}개 문제</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      📅 {new Date(bank.updated_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewQuestions(bank)}
                      className="flex-1 btn-secondary text-sm"
                    >
                      문제 관리
                    </button>
                    <button
                      onClick={() => handleEditBank(bank)}
                      className="btn-outline p-2"
                      title="편집"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {onSelectBank && (
                      <button
                        onClick={() => onSelectBank(bank)}
                        className="btn-outline p-2"
                        title="시험 생성"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteBank(bank.id, bank.name)}
                      className="btn-danger p-2"
                      title="삭제"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

// 문제은행 생성/수정 폼 컴포넌트
interface BankFormProps {
  bank: QuestionBank | null;
  onSave: (data: { name: string; description?: string; category?: string; template_id?: string }) => void;
  onCancel: () => void;
}

const BankForm: React.FC<BankFormProps> = ({ bank, onSave, onCancel }) => {
  const [name, setName] = useState(bank?.name || '');
  const [description, setDescription] = useState(bank?.description || '');
  const [category, setCategory] = useState(bank?.category || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('문제은행 이름을 입력해주세요.');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined
    });
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={onCancel}
                className="mb-4 btn-ghost flex items-center transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                뒤로 가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {bank ? '문제은행 수정' : '새 문제은행'}
              </h1>
            </div>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              문제은행 이름 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: BS 영업 기초 문제은행"
              className="w-full border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="예: BS 영업 기초과정"
              className="w-full border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="문제은행에 대한 설명을 입력하세요..."
              rows={4}
              className="w-full border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="btn-outline"
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {bank ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer >
  );
};

// 문제 목록 컴포넌트
interface QuestionListProps {
  bank: QuestionBank;
  onBack: () => void;
  onRefresh: () => void;
}

const QuestionList: React.FC<QuestionListProps> = ({ bank, onBack, onRefresh }) => {
  const [questions, setQuestions] = useState<Question[]>(bank.questions || []);
  const [loading, setLoading] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // 문제 목록 새로고침
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const updatedQuestions = await QuestionBankService.getQuestions(bank.id);
      setQuestions(updatedQuestions);
    } catch (error) {
      console.error('❌ Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  // 문제 삭제
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('이 문제를 삭제하시겠습니까?')) return;

    try {
      setLoading(true);
      await QuestionBankService.deleteQuestion(questionId);
      alert('문제가 삭제되었습니다.');
      await loadQuestions();
      onRefresh();
    } catch (error) {
      console.error('❌ Failed to delete question:', error);
      alert('문제 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 문제 복사
  const handleDuplicateQuestion = async (questionId: string) => {
    try {
      setLoading(true);
      await QuestionBankService.duplicateQuestion(questionId);
      alert('문제가 복사되었습니다.');
      await loadQuestions();
      onRefresh();
    } catch (error) {
      console.error('❌ Failed to duplicate question:', error);
      alert('문제 복사에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 문제 저장
  const handleSaveQuestion = async (questionData: any) => {
    try {
      setLoading(true);
      if (selectedQuestion) {
        await QuestionBankService.updateQuestion(selectedQuestion.id, questionData);
        alert('문제가 수정되었습니다.');
      } else {
        await QuestionBankService.createQuestion({
          ...questionData,
          bank_id: bank.id
        });
        alert('문제가 생성되었습니다.');
      }
      await loadQuestions();
      onRefresh();
      setShowQuestionForm(false);
      setSelectedQuestion(null);
    } catch (error) {
      console.error('❌ Failed to save question:', error);
      alert('문제 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (showQuestionForm) {
    return <QuestionForm
      bankId={bank.id}
      question={selectedQuestion}
      onSave={handleSaveQuestion}
      onCancel={() => {
        setShowQuestionForm(false);
        setSelectedQuestion(null);
      }}
    />;
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={onBack}
                className="mb-4 btn-ghost flex items-center transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                문제은행 목록으로
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {bank.name}
              </h1>
              <p className="mt-2 text-gray-600">
                {bank.description || '문제를 추가하고 관리하세요.'}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedQuestion(null);
                setShowQuestionForm(true);
              }}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              새 문제
            </button>
          </div>
        </div>

        {/* 문제 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">문제 목록</h2>
            <div className="text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{questions.length}</span>개
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-gray-600"></div>
              <span className="ml-3 text-gray-600">문제를 불러오는 중...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">문제가 없습니다.</p>
              <button
                onClick={() => setShowQuestionForm(true)}
                className="btn-primary"
              >
                첫 문제 만들기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${question.type === 'multiple_choice' ? 'bg-blue-100 text-blue-700' :
                          question.type === 'true_false' ? 'bg-green-500/10 text-green-700' :
                            question.type === 'short_answer' ? 'bg-yellow-100 text-orange-700' :
                              'bg-purple-100 text-purple-700'
                          }`}>
                          {question.type === 'multiple_choice' ? '객관식' :
                            question.type === 'true_false' ? 'O/X' :
                              question.type === 'short_answer' ? '단답형' : '서술형'}
                        </span>
                        {question.difficulty && (
                          <span className={`px-2 py-1 text-xs rounded-full ${question.difficulty === 'easy' ? 'bg-green-500/10 text-green-700' :
                            question.difficulty === 'medium' ? 'bg-yellow-100 text-orange-700' :
                              'bg-destructive/10 text-destructive'
                            }`}>
                            {question.difficulty === 'easy' ? '쉬움' :
                              question.difficulty === 'medium' ? '보통' : '어려움'}
                          </span>
                        )}
                        <span className="text-sm text-gray-600">{question.points}점</span>
                      </div>
                      <p className="text-gray-900 mb-2">{question.question_text}</p>
                      {question.explanation && (
                        <p className="text-sm text-gray-600">💡 {question.explanation}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedQuestion(question);
                          setShowQuestionForm(true);
                        }}
                        className="btn-ghost p-2"
                        title="편집"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateQuestion(question.id)}
                        className="btn-ghost p-2"
                        title="복사"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="btn-ghost p-2 text-destructive hover:text-destructive"
                        title="삭제"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer >
  );
};

// 문제 생성/수정 폼 컴포넌트
interface QuestionFormProps {
  bankId: string;
  question: Question | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ bankId, question, onSave, onCancel }) => {
  const [type, setType] = useState<'multiple_choice' | 'true_false' | 'short_answer' | 'essay'>(
    (question?.type === 'multiple_choice' || question?.type === 'true_false' ||
      question?.type === 'short_answer' || question?.type === 'essay')
      ? question.type
      : 'multiple_choice'
  );
  const [questionText, setQuestionText] = useState(question?.question_text || '');
  const [options, setOptions] = useState<string[]>(
    question?.options as string[] || ['', '', '', '']
  );
  const [correctAnswer, setCorrectAnswer] = useState<any>(question?.correct_answer || 0);
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [points, setPoints] = useState(question?.points || 10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    question?.difficulty || 'medium'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim()) {
      alert('문제 내용을 입력해주세요.');
      return;
    }

    if (type === 'multiple_choice' && options.some(opt => !opt.trim())) {
      alert('모든 선택지를 입력해주세요.');
      return;
    }

    const questionData: any = {
      type,
      question_text: questionText.trim(),
      points,
      difficulty,
      explanation: explanation.trim() || undefined
    };

    if (type === 'multiple_choice') {
      questionData.options = options.map(opt => opt.trim());
      questionData.correct_answer = correctAnswer;
    } else if (type === 'true_false') {
      questionData.correct_answer = correctAnswer;
    } else {
      questionData.correct_answer = correctAnswer;
    }

    onSave(questionData);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <button
            onClick={onCancel}
            className="mb-4 btn-ghost flex items-center transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            뒤로 가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {question ? '문제 수정' : '새 문제'}
          </h1>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문제 유형 <span className="text-destructive">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="multiple_choice">객관식</option>
                <option value="true_false">O/X</option>
                <option value="short_answer">단답형</option>
                <option value="essay">서술형</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                난이도
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="easy">쉬움</option>
                <option value="medium">보통</option>
                <option value="hard">어려움</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                배점 <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                min="1"
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              문제 내용 <span className="text-destructive">*</span>
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="문제를 입력하세요..."
              rows={3}
              className="w-full border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>

          {/* 객관식 선택지 */}
          {type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선택지 <span className="text-destructive">*</span>
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={correctAnswer === index}
                      onChange={() => setCorrectAnswer(index)}
                      className="w-4 h-4 text-gray-600"
                    />
                    <span className="text-sm font-medium text-gray-700 w-8">{index + 1}.</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }}
                      placeholder={`선택지 ${index + 1}`}
                      className="flex-1 border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* O/X 답 */}
          {type === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정답 <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={correctAnswer === true}
                    onChange={() => setCorrectAnswer(true)}
                    className="w-4 h-4 text-gray-600 mr-2"
                  />
                  <span>O (참)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={correctAnswer === false}
                    onChange={() => setCorrectAnswer(false)}
                    className="w-4 h-4 text-gray-600 mr-2"
                  />
                  <span>X (거짓)</span>
                </label>
              </div>
            </div>
          )}

          {/* 단답형/서술형 모범답안 */}
          {(type === 'short_answer' || type === 'essay') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                모범 답안
              </label>
              <textarea
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="모범 답안을 입력하세요..."
                rows={type === 'essay' ? 5 : 2}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              해설
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="문제에 대한 해설을 입력하세요..."
              rows={3}
              className="w-full border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="btn-outline"
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {question ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};

export default QuestionBankManagement;
