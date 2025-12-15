import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import type { User, UserRole, UserStatus } from '../../types/auth.types';
import { roleLabels, userStatusLabels } from '../../types/auth.types';

interface UserFormProps {
  user: User | null;
  onBack: () => void;
  onSave: (userData: Partial<User>) => void;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  employee_id: string;
  role: UserRole;
  division?: string; // 본부/연구소 (선택사항)
  office?: string; // 실 (선택사항)
  team: string; // 팀 (필수)
  position: string;
  hire_date: string;
  status: UserStatus;
}

const UserForm: React.FC<UserFormProps> = ({ user, onBack, onSave }) => {
  // 로딩 상태
  const [loading, setLoading] = useState(false);

  // 조직 구조 자동완성 상태
  const [divisionInput, setDivisionInput] = useState(user?.department?.split(' > ')[0] || '');
  const [officeInput, setOfficeInput] = useState(user?.department?.split(' > ')[1] || '');
  const [teamInput, setTeamInput] = useState(user?.department?.split(' > ')[2] || user?.department || '');
  const [showDivisionSuggestions, setShowDivisionSuggestions] = useState(false);
  const [showOfficeSuggestions, setShowOfficeSuggestions] = useState(false);
  const [showTeamSuggestions, setShowTeamSuggestions] = useState(false);
  const [divisionHistory, setDivisionHistory] = useState<string[]>([]);
  const [officeHistory, setOfficeHistory] = useState<string[]>([]);
  const [teamHistory, setTeamHistory] = useState<string[]>([]);

  // 직급 자동완성 상태
  const [positionInput, setPositionInput] = useState(user?.position || '');
  const [showPositionSuggestions, setShowPositionSuggestions] = useState(false);
  const [positionHistory, setPositionHistory] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<UserFormData>({
    defaultValues: user ? {
      name: user.name,
      email: user.email,
      phone: user.phone,
      employee_id: user.employee_id,
      role: user.role,
      division: '',
      office: '',
      team: user.department || '',
      position: user.position,
      hire_date: user.hire_date,
      status: user.status,
    } : {
      name: '',
      email: '',
      phone: '',
      employee_id: '',
      role: 'trainee',
      division: '',
      office: '',
      team: '',
      position: '',
      hire_date: new Date().toISOString().split('T')[0],
      status: 'active',
    }
  });

  const selectedRole = watch('role');


  // 조직 구조 히스토리 로드
  useEffect(() => {
    // 본부/연구소 히스토리
    const savedDivisionHistory = localStorage.getItem('divisionHistory');
    if (savedDivisionHistory) {
      try {
        setDivisionHistory(JSON.parse(savedDivisionHistory));
      } catch (error) {
        console.error('본부/연구소 히스토리 로드 실패:', error);
      }
    }

    // 실 히스토리
    const savedOfficeHistory = localStorage.getItem('officeHistory');
    if (savedOfficeHistory) {
      try {
        setOfficeHistory(JSON.parse(savedOfficeHistory));
      } catch (error) {
        console.error('실 히스토리 로드 실패:', error);
      }
    }

    // 팀 히스토리
    const savedTeamHistory = localStorage.getItem('teamHistory');
    if (savedTeamHistory) {
      try {
        setTeamHistory(JSON.parse(savedTeamHistory));
      } catch (error) {
        console.error('팀 히스토리 로드 실패:', error);
      }
    }
  }, []);

  // 직급 히스토리 로드
  useEffect(() => {
    const savedHistory = localStorage.getItem('positionHistory');
    if (savedHistory) {
      try {
        setPositionHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('직급 히스토리 로드 실패:', error);
      }
    }

    // 기본 직급 목록 초기화 (히스토리가 없을 경우)
    if (!savedHistory) {
      const defaultPositions = ['사원', '주임', '대리', '과장', '차장', '부장', '이사', '상무', '전무', '부사장', '사장', '대표이사'];
      setPositionHistory(defaultPositions);
      localStorage.setItem('positionHistory', JSON.stringify(defaultPositions));
    }
  }, []);

  // 본부/연구소 입력값 변경 핸들러
  const handleDivisionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDivisionInput(value);
    setShowDivisionSuggestions(true);
  };

  const handleSelectDivision = (division: string) => {
    setDivisionInput(division);
    setShowDivisionSuggestions(false);
  };

  const saveDivisionToHistory = (division: string) => {
    if (!division || division.trim() === '') return;
    const trimmed = division.trim();
    const newHistory = [trimmed, ...divisionHistory.filter(d => d !== trimmed)].slice(0, 10);
    setDivisionHistory(newHistory);
    localStorage.setItem('divisionHistory', JSON.stringify(newHistory));
  };

  const getDivisionSuggestions = () => {
    if (!divisionInput.trim()) return divisionHistory.slice(0, 10);
    return divisionHistory.filter(d => d.toLowerCase().includes(divisionInput.toLowerCase())).slice(0, 10);
  };

  // 실 입력값 변경 핸들러
  const handleOfficeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOfficeInput(value);
    setShowOfficeSuggestions(true);
  };

  const handleSelectOffice = (office: string) => {
    setOfficeInput(office);
    setShowOfficeSuggestions(false);
  };

  const saveOfficeToHistory = (office: string) => {
    if (!office || office.trim() === '') return;
    const trimmed = office.trim();
    const newHistory = [trimmed, ...officeHistory.filter(d => d !== trimmed)].slice(0, 10);
    setOfficeHistory(newHistory);
    localStorage.setItem('officeHistory', JSON.stringify(newHistory));
  };

  const getOfficeSuggestions = () => {
    if (!officeInput.trim()) return officeHistory.slice(0, 10);
    return officeHistory.filter(o => o.toLowerCase().includes(officeInput.toLowerCase())).slice(0, 10);
  };

  // 팀 입력값 변경 핸들러
  const handleTeamInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTeamInput(value);
    setShowTeamSuggestions(true);
  };

  const handleSelectTeam = (team: string) => {
    setTeamInput(team);
    setShowTeamSuggestions(false);
  };

  const saveTeamToHistory = (team: string) => {
    if (!team || team.trim() === '') return;
    const trimmed = team.trim();
    const newHistory = [trimmed, ...teamHistory.filter(d => d !== trimmed)].slice(0, 10);
    setTeamHistory(newHistory);
    localStorage.setItem('teamHistory', JSON.stringify(newHistory));
  };

  const getTeamSuggestions = () => {
    if (!teamInput.trim()) return teamHistory.slice(0, 10);
    return teamHistory.filter(t => t.toLowerCase().includes(teamInput.toLowerCase())).slice(0, 10);
  };

  // 직급 입력값 변경 핸들러
  const handlePositionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPositionInput(value);
    setShowPositionSuggestions(true);
  };

  // 직급 제안 선택 핸들러
  const handleSelectPosition = (pos: string) => {
    setPositionInput(pos);
    setShowPositionSuggestions(false);
  };

  // 직급 히스토리 저장
  const savePositionToHistory = (pos: string) => {
    if (!pos || pos.trim() === '') return;

    const trimmedPos = pos.trim();
    const newHistory = [trimmedPos, ...positionHistory.filter(p => p !== trimmedPos)].slice(0, 15);
    setPositionHistory(newHistory);
    localStorage.setItem('positionHistory', JSON.stringify(newHistory));
  };

  // 필터링된 직급 제안 목록
  const getPositionSuggestions = () => {
    if (!positionInput.trim()) {
      return positionHistory.slice(0, 15);
    }

    return positionHistory.filter(pos =>
      pos.toLowerCase().includes(positionInput.toLowerCase())
    ).slice(0, 15);
  };

  const onSubmit = async (data: UserFormData) => {
    // 조직 구조 및 직급을 히스토리에 저장
    saveDivisionToHistory(divisionInput);
    saveOfficeToHistory(officeInput);
    saveTeamToHistory(teamInput);
    savePositionToHistory(positionInput);

    // 부서 정보를 "본부/연구소 > 실 > 팀" 형식으로 조합
    const departmentParts = [divisionInput, officeInput, teamInput].filter(p => p.trim());
    const departmentString = departmentParts.join(' > ');

    const userData: Partial<User> = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      employee_id: data.employee_id,
      role: data.role,
      department: departmentString || teamInput, // 최소한 팀 정보는 포함
      position: positionInput,
      hire_date: data.hire_date,
      status: data.status
    };

    onSave(userData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user ? '사용자 정보 수정' : '새 사용자 등록'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {user ? '기존 사용자 정보를 수정합니다.' : '새로운 시스템 사용자를 등록합니다.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="w-1 h-6 bg-blue-600 rounded-full mr-3"></span>
            기본 정보
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name', { required: '이름을 입력해주세요.' })}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="홍길동"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email', {
                  required: '이메일을 입력해주세요.',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '올바른 이메일 형식을 입력해주세요.'
                  }
                })}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="example@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register('phone', {
                  required: '전화번호를 입력해주세요.',
                  pattern: {
                    value: /^010-\d{4}-\d{4}$/,
                    message: '올바른 전화번호 형식을 입력해주세요. (010-0000-0000)'
                  }
                })}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="010-1234-5678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500 font-medium">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                사번 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('employee_id', { required: '사번을 입력해주세요.' })}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="20240001"
              />
              {errors.employee_id && (
                <p className="mt-1 text-sm text-red-500 font-medium">{errors.employee_id.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* 회사 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="w-1 h-6 bg-blue-600 rounded-full mr-3"></span>
            회사 정보
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                역할 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('role', { required: '역할을 선택해주세요.' })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-4 pr-10 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  {(Object.keys(roleLabels) as UserRole[]).map(role => (
                    <option key={role} value={role}>{roleLabels[role]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-500 font-medium">{errors.role.message}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                상태 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('status', { required: '상태를 선택해주세요.' })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-4 pr-10 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  {(Object.keys(userStatusLabels) as UserStatus[]).map(status => (
                    <option key={status} value={status}>{userStatusLabels[status]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              {/* 본부/연구소 (선택사항) */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  본부/연구소
                </label>
                <input
                  type="text"
                  value={divisionInput}
                  onChange={handleDivisionInputChange}
                  onFocus={() => setShowDivisionSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDivisionSuggestions(false), 200)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="예: 기술본부, 경영본부, 연구소 (선택사항)"
                  disabled={loading}
                />
                {showDivisionSuggestions && getDivisionSuggestions().length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {getDivisionSuggestions().map((division, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectDivision(division)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {division}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 실 (선택사항) */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  실
                </label>
                <input
                  type="text"
                  value={officeInput}
                  onChange={handleOfficeInputChange}
                  onFocus={() => setShowOfficeSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowOfficeSuggestions(false), 200)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="예: 개발실, 기획실, 관리실 (선택사항)"
                  disabled={loading}
                />
                {showOfficeSuggestions && getOfficeSuggestions().length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {getOfficeSuggestions().map((office, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectOffice(office)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {office}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 팀 (필수) */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  팀 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={teamInput}
                  onChange={handleTeamInputChange}
                  onFocus={() => setShowTeamSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTeamSuggestions(false), 200)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="예: 프론트엔드팀, 백엔드팀, 인프라팀"
                  disabled={loading}
                />
                {showTeamSuggestions && getTeamSuggestions().length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {getTeamSuggestions().map((team, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectTeam(team)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {team}
                      </button>
                    ))}
                  </div>
                )}
                {!teamInput.trim() && (
                  <p className="mt-1 text-sm text-red-500 font-medium">팀을 입력해주세요.</p>
                )}
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                직급 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={positionInput}
                onChange={handlePositionInputChange}
                onFocus={() => setShowPositionSuggestions(true)}
                onBlur={() => setTimeout(() => setShowPositionSuggestions(false), 200)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="직급을 입력하세요 (예: 사원, 과장, 부장)"
                disabled={loading}
              />
              {showPositionSuggestions && getPositionSuggestions().length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {getPositionSuggestions().map((pos, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectPosition(pos)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              )}
              {!positionInput.trim() && (
                <p className="mt-1 text-sm text-red-500 font-medium">직급을 입력해주세요.</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                입사일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('hire_date', { required: '입사일을 선택해주세요.' })}
                className="w-full md:w-1/2 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {errors.hire_date && (
                <p className="mt-1 text-sm text-red-500 font-medium">{errors.hire_date.message}</p>
              )}
            </div>
          </div>
        </div>


        {/* 액션 버튼 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky bottom-6 z-10">
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="btn-outline px-6 py-3"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-8 py-3 flex items-center"
            >
              <Check className="h-5 w-5 mr-2" />
              {isSubmitting ? '저장 중...' : (user ? '수정 완료' : '사용자 등록')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserForm;