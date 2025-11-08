import { supabase } from './supabase';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching' | 'ordering';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  bank_id: string;
  type: QuestionType;
  question_text: string;
  question_html?: string;
  options?: any; // JSONB
  correct_answer?: any; // JSONB
  points: number;
  explanation?: string;
  explanation_html?: string;
  difficulty?: QuestionDifficulty;
  tags?: string[];
  estimated_time_seconds?: number;
  usage_count: number;
  avg_score?: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionBank {
  id: string;
  name: string;
  description?: string;
  template_id?: string;
  category?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // 조인 데이터
  questions?: Question[];
  question_count?: number;
  template?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface CreateQuestionBankData {
  name: string;
  description?: string;
  template_id?: string;
  category?: string;
}

export interface CreateQuestionData {
  bank_id: string;
  type: QuestionType;
  question_text: string;
  question_html?: string;
  options?: any;
  correct_answer?: any;
  points?: number;
  explanation?: string;
  explanation_html?: string;
  difficulty?: QuestionDifficulty;
  tags?: string[];
  estimated_time_seconds?: number;
}

/**
 * 문제은행 관리 서비스
 */
export class QuestionBankService {

  // ========================================
  // 문제은행 관리 (CRUD)
  // ========================================

  /**
   * 모든 문제은행 조회
   */
  static async getQuestionBanks(options?: {
    includeQuestions?: boolean;
    template_id?: string;
    category?: string;
  }): Promise<QuestionBank[]> {
    try {
      let query = supabase
        .from('question_banks')
        .select(`
          *,
          template:course_templates(id, name, category)
        `)
        .order('created_at', { ascending: false });

      if (options?.template_id) {
        query = query.eq('template_id', options.template_id);
      }

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[QuestionBankService] ❌ 문제은행 목록 조회 실패:', error);
        throw new Error(`문제은행 목록 조회 실패: ${error.message}`);
      }

      console.log('[QuestionBankService] ✅ 문제은행 목록 조회 성공:', data?.length, '개');

      // 문제 개수 조회 (옵션)
      if (options?.includeQuestions && data) {
        const banksWithCount = await Promise.all(
          data.map(async (bank) => {
            const { count } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('bank_id', bank.id)
              .eq('is_active', true);

            return {
              ...bank,
              question_count: count || 0
            };
          })
        );
        return banksWithCount;
      }

      return data || [];
    } catch (error) {
      console.error('[QuestionBankService] Error:', error);
      throw error;
    }
  }

  /**
   * 문제은행 상세 조회 (문제 포함)
   */
  static async getQuestionBankById(bankId: string): Promise<QuestionBank | null> {
    try {
      // 문제은행 기본 정보
      const { data: bank, error: bankError } = await supabase
        .from('question_banks')
        .select(`
          *,
          template:course_templates(id, name, category)
        `)
        .eq('id', bankId)
        .single();

      if (bankError) {
        console.error('[QuestionBankService] ❌ 문제은행 조회 실패:', bankError);
        throw new Error(`문제은행 조회 실패: ${bankError.message}`);
      }

      if (!bank) return null;

      // 문제 목록 조회
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('bank_id', bankId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (questionsError) {
        console.error('[QuestionBankService] ❌ 문제 목록 조회 실패:', questionsError);
      }

      return {
        ...bank,
        questions: questions || [],
        question_count: questions?.length || 0
      };
    } catch (error) {
      console.error('[QuestionBankService] Error:', error);
      throw error;
    }
  }

  /**
   * 새 문제은행 생성
   */
  static async createQuestionBank(data: CreateQuestionBankData): Promise<QuestionBank> {
    try {
      const { data: newBank, error } = await supabase
        .from('question_banks')
        .insert({
          name: data.name,
          description: data.description,
          template_id: data.template_id,
          category: data.category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[QuestionBankService] ❌ 문제은행 생성 실패:', error);
        throw new Error(`문제은행 생성 실패: ${error.message}`);
      }

      console.log('[QuestionBankService] ✅ 문제은행 생성 성공:', newBank);
      return newBank;
    } catch (error) {
      console.error('[QuestionBankService] Error:', error);
      throw error;
    }
  }

  /**
   * 문제은행 수정
   */
  static async updateQuestionBank(
    bankId: string,
    data: Partial<CreateQuestionBankData>
  ): Promise<QuestionBank> {
    try {
      const { data: updatedBank, error } = await supabase
        .from('question_banks')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', bankId)
        .select()
        .single();

      if (error) {
        console.error('[QuestionBankService] ❌ 문제은행 수정 실패:', error);
        throw new Error(`문제은행 수정 실패: ${error.message}`);
      }

      console.log('[QuestionBankService] ✅ 문제은행 수정 성공:', updatedBank);
      return updatedBank;
    } catch (error) {
      console.error('[QuestionBankService] Error:', error);
      throw error;
    }
  }

  /**
   * 문제은행 삭제
   */
  static async deleteQuestionBank(bankId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('question_banks')
        .delete()
        .eq('id', bankId);

      if (error) {
        console.error('[QuestionBankService] ❌ 문제은행 삭제 실패:', error);
        throw new Error(`문제은행 삭제 실패: ${error.message}`);
      }

      console.log('[QuestionBankService] ✅ 문제은행 삭제 성공:', bankId);
    } catch (error) {
      console.error('[QuestionBankService] Error:', error);
      throw error;
    }
  }

  // ========================================
  // 문제 관리 (CRUD)
  // ========================================

  /**
   * 문제은행의 문제 목록 조회
   */
  static async getQuestions(bankId: string): Promise<Question[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('bank_id', bankId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[QuestionBankService] ❌ 문제 목록 조회 실패:', error);
        throw new Error(`문제 목록 조회 실패: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('[QuestionBankService] Error:', error);
      throw error;
    }
  }

  /**
   * 문제 상세 조회
   */
  static async getQuestionById(questionId: string): Promise<Question | null> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (error) {
        console.error('[QuestionBankService] ❌ 문제 조회 실패:', error);
        throw new Error(`문제 조회 실패: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('[QuestionBankService] Error:', error);
      throw error;
    }
  }

  /**
   * 새 문제 추가
   */
  static async createQuestion(data: CreateQuestionData): Promise<Question> {
    try {
      const { data: newQuestion, error } = await supabase
        .from('questions')
        .insert({
          bank_id: data.bank_id,
          type: data.type,
          question_text: data.question_text,
          question_html: data.question_html,
          options: data.options,
          correct_answer: data.correct_answer,
          points: data.points || 1.0,
          explanation: data.explanation,
          explanation_html: data.explanation_html,
          difficulty: data.difficulty || 'medium',
          tags: data.tags || [],
          estimated_time_seconds: data.estimated_time_seconds,
          usage_count: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[QuestionBankService] ❌ 문제 생성 실패:', error);
        throw new Error(`문제 생성 실패: ${error.message}`);
      }

      console.log('[QuestionBankService] ✅ 문제 생성 성공:', newQuestion);
      return newQuestion;
    } catch (error) {
      console.error('[QuestionBankService] Error:', error);
      throw error;
    }
  }

  /**
   * 문제 수정
   */
  static async updateQuestion(
    questionId: string,
    data: Partial<CreateQuestionData>
  ): Promise<Question> {
    try {
      const { data: updatedQuestion, error } = await supabase
        .from('questions')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', questionId)
        .select()
        .single();

      if (error) {
        console.error('[QuestionBankService] ❌ 문제 수정 실패:', error);
        throw new Error(`문제 수정 실패: ${error.message}`);
      }

      console.log('[QuestionBankService] ✅ 문제 수정 성공:', updatedQuestion);
      return updatedQuestion;
    } catch (error) {
      console.error('[QuestionBankService] Error:', error);
      throw error;
    }
  }

  /**
   * 문제 삭제 (소프트 삭제)
   */
  static async deleteQuestion(questionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', questionId);

      if (error) {
        console.error('[QuestionBankService] ❌ 문제 삭제 실패:', error);
        throw new Error(`문제 삭제 실패: ${error.message}`);
      }

      console.log('[QuestionBankService] ✅ 문제 삭제 성공:', questionId);
    } catch (error) {
      console.error('[QuestionBankService] Error:', error);
      throw error;
    }
  }

  /**
   * 문제 영구 삭제 (하드 삭제)
   */
  static async permanentlyDeleteQuestion(questionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        console.error('[QuestionBankService] ❌ 문제 영구 삭제 실패:', error);
        throw new Error(`문제 영구 삭제 실패: ${error.message}`);
      }

      console.log('[QuestionBankService] ✅ 문제 영구 삭제 성공:', questionId);
    } catch (error) {
      console.error('[QuestionBankService] Error:', error);
      throw error;
    }
  }

  /**
   * 문제 복사
   */
  static async duplicateQuestion(questionId: string): Promise<Question> {
    try {
      // 원본 문제 조회
      const original = await this.getQuestionById(questionId);
      if (!original) {
        throw new Error('원본 문제를 찾을 수 없습니다');
      }

      // 새 문제 생성 (복사)
      const { data: duplicated, error } = await supabase
        .from('questions')
        .insert({
          bank_id: original.bank_id,
          type: original.type,
          question_text: `${original.question_text} (복사본)`,
          question_html: original.question_html,
          options: original.options,
          correct_answer: original.correct_answer,
          points: original.points,
          explanation: original.explanation,
          explanation_html: original.explanation_html,
          difficulty: original.difficulty,
          tags: original.tags,
          estimated_time_seconds: original.estimated_time_seconds,
          usage_count: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[QuestionBankService] ❌ 문제 복사 실패:', error);
        throw new Error(`문제 복사 실패: ${error.message}`);
      }

      console.log('[QuestionBankService] ✅ 문제 복사 성공:', duplicated);
      return duplicated;
    } catch (error) {
      console.error('[QuestionBankService] Error:', error);
      throw error;
    }
  }
}
