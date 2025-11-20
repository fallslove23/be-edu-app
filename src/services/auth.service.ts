import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import type { User } from '@/types/auth.types';

/**
 * 인증 서비스
 * 사번 기반 로그인 및 비밀번호 관리
 */
export class AuthService {
  private static readonly SALT_ROUNDS = 10;
  private static readonly DEFAULT_PASSWORD = 'osstem';

  /**
   * 사번으로 로그인
   * @param employee_id 사번 (예: 20031409, A20031409)
   * @param password 비밀번호
   * @returns 사용자 정보 또는 null
   */
  static async loginWithEmployeeId(
    employee_id: string,
    password: string
  ): Promise<{ user: User; firstLogin: boolean } | null> {
    try {
      console.log('[AuthService] 로그인 시도:', employee_id);

      // 1. 사번으로 사용자 조회
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('employee_id', employee_id)
        .eq('status', 'active')
        .single();

      if (error || !user) {
        console.error('[AuthService] 사용자를 찾을 수 없음:', error);
        return null;
      }

      // 2. 비밀번호 확인
      // password_hash가 없으면 초기 비밀번호(osstem)로 설정
      let passwordMatch = false;

      if (!user.password_hash) {
        // 초기 비밀번호로 로그인 시도
        passwordMatch = password === this.DEFAULT_PASSWORD;

        if (passwordMatch) {
          // 비밀번호 해시 생성 및 저장
          const hash = await bcrypt.hash(password, this.SALT_ROUNDS);
          await supabase
            .from('users')
            .update({ password_hash: hash })
            .eq('id', user.id);
        }
      } else {
        // 기존 해시와 비교
        passwordMatch = await bcrypt.compare(password, user.password_hash);
      }

      if (!passwordMatch) {
        console.error('[AuthService] 비밀번호 불일치');
        return null;
      }

      // 3. 마지막 로그인 시간 업데이트
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      console.log('[AuthService] 로그인 성공:', user.name);

      return {
        user: user as User,
        firstLogin: user.first_login ?? false,
      };
    } catch (error) {
      console.error('[AuthService] 로그인 중 오류:', error);
      return null;
    }
  }

  /**
   * 비밀번호 변경
   * @param userId 사용자 ID
   * @param oldPassword 기존 비밀번호
   * @param newPassword 새 비밀번호
   * @returns 성공 여부
   */
  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      console.log('[AuthService] 비밀번호 변경 시도:', userId);

      // 1. 사용자 조회
      const { data: user, error } = await supabase
        .from('users')
        .select('password_hash, first_login')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('[AuthService] 사용자를 찾을 수 없음:', error);
        return false;
      }

      // 2. 기존 비밀번호 확인
      // 최초 로그인인 경우 기본 비밀번호와 비교
      let oldPasswordMatch = false;

      if (user.first_login && !user.password_hash) {
        oldPasswordMatch = oldPassword === this.DEFAULT_PASSWORD;
      } else if (user.password_hash) {
        oldPasswordMatch = await bcrypt.compare(oldPassword, user.password_hash);
      }

      if (!oldPasswordMatch) {
        console.error('[AuthService] 기존 비밀번호 불일치');
        return false;
      }

      // 3. 새 비밀번호 해시 생성
      const newHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // 4. 비밀번호 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: newHash,
          first_login: false,
          password_changed_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[AuthService] 비밀번호 업데이트 실패:', updateError);
        return false;
      }

      // 5. 변경 로그 기록
      await this.logPasswordChange(userId, userId);

      console.log('[AuthService] 비밀번호 변경 성공');
      return true;
    } catch (error) {
      console.error('[AuthService] 비밀번호 변경 중 오류:', error);
      return false;
    }
  }

  /**
   * 최초 로그인 여부 확인
   * @param userId 사용자 ID
   * @returns 최초 로그인 여부
   */
  static async checkFirstLogin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('first_login')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.first_login ?? false;
    } catch (error) {
      console.error('[AuthService] 최초 로그인 확인 중 오류:', error);
      return false;
    }
  }

  /**
   * 비밀번호 변경 완료 처리
   * @param userId 사용자 ID
   * @returns 성공 여부
   */
  static async markPasswordChanged(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_login: false,
          password_changed_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('[AuthService] 비밀번호 변경 처리 실패:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AuthService] 비밀번호 변경 처리 중 오류:', error);
      return false;
    }
  }

  /**
   * 비밀번호 변경 로그 기록
   * @param userId 사용자 ID
   * @param changedBy 변경한 사용자 ID
   * @param ipAddress IP 주소 (선택)
   * @param userAgent User Agent (선택)
   */
  private static async logPasswordChange(
    userId: string,
    changedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await supabase.from('password_change_logs').insert({
        user_id: userId,
        changed_by: changedBy,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (error) {
      console.error('[AuthService] 비밀번호 변경 로그 기록 실패:', error);
      // 로그 기록 실패는 무시 (중요한 작업이 아니므로)
    }
  }

  /**
   * 사용자 초기 비밀번호 설정 (관리자용)
   * @param userId 사용자 ID
   * @param password 초기 비밀번호 (기본값: 'osstem')
   * @returns 성공 여부
   */
  static async setInitialPassword(
    userId: string,
    password: string = this.DEFAULT_PASSWORD
  ): Promise<boolean> {
    try {
      const hash = await bcrypt.hash(password, this.SALT_ROUNDS);

      const { error } = await supabase
        .from('users')
        .update({
          password_hash: hash,
          first_login: true,
        })
        .eq('id', userId);

      if (error) {
        console.error('[AuthService] 초기 비밀번호 설정 실패:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AuthService] 초기 비밀번호 설정 중 오류:', error);
      return false;
    }
  }

  /**
   * 로그아웃
   */
  static async logout(): Promise<void> {
    try {
      // 로컬 스토리지 정리
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('[AuthService] 로그아웃 중 오류:', error);
    }
  }
}
