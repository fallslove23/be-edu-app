import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import type { Trainee, TraineeStatus, TraineeProgress } from '../../types/trainee.types';
import { traineeStatusLabels } from '../../types/trainee.types';
import TraineeForm from './TraineeForm';
import TraineeDetail from './TraineeDetail';

type ViewType = 'list' | 'form' | 'detail';

const TraineeManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [filteredTrainees, setFilteredTrainees] = useState<Trainee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TraineeStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Mock data - 실제로는 API에서 가져옴
  useEffect(() => {
    const mockTrainees: Trainee[] = [
      {
        id: '1',
        name: '김영희',
        email: 'kim.younghee@company.com',
        phone: '010-1234-5678',
        employee_id: 'EMP001',
        department: '영업팀',
        position: '주임',
        hire_date: '2023-03-15',
        enrolled_courses: ['course-1', 'course-2'],
        status: 'active',
        emergency_contact: {
          name: '김부모',
          relationship: '부모',
          phone: '010-9876-5432'
        },
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: '2',
        name: '박철수',
        email: 'park.chulsoo@company.com',
        phone: '010-2345-6789',
        employee_id: 'EMP002',
        department: '마케팅팀',
        position: '대리',
        hire_date: '2022-08-20',
        enrolled_courses: ['course-1'],
        status: 'active',
        emergency_contact: {
          name: '박배우자',
          relationship: '배우자',
          phone: '010-8765-4321'
        },
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-18T16:15:00Z'
      },
      {
        id: '3',
        name: '이민정',
        email: 'lee.minjeong@company.com',
        phone: '010-3456-7890',
        employee_id: 'EMP003',
        department: '고객서비스팀',
        position: '사원',
        hire_date: '2024-01-05',
        enrolled_courses: ['course-2', 'course-3'],
        status: 'graduated',
        emergency_contact: {
          name: '이형제',
          relationship: '형제',
          phone: '010-7654-3210'
        },
        created_at: '2024-01-05T08:30:00Z',
        updated_at: '2024-01-25T11:45:00Z'
      }
    ];

    setTrainees(mockTrainees);
    setFilteredTrainees(mockTrainees);
  }, []);

  // 필터링 로직
  useEffect(() => {
    let filtered = trainees;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(trainee =>
        trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trainee => trainee.status === statusFilter);
    }

    // 부서 필터
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(trainee => trainee.department === departmentFilter);
    }

    setFilteredTrainees(filtered);
  }, [trainees, searchTerm, statusFilter, departmentFilter]);

  const handleCreateTrainee = () => {
    setSelectedTrainee(null);
    setCurrentView('form');
  };

  const handleEditTrainee = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setCurrentView('form');
  };

  const handleViewTrainee = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setCurrentView('detail');
  };

  const handleSaveTrainee = (traineeData: Partial<Trainee>) => {
    if (selectedTrainee) {
      // 수정
      const updatedTrainees = trainees.map(t =>
        t.id === selectedTrainee.id ? { ...t, ...traineeData, updated_at: new Date().toISOString() } : t
      );
      setTrainees(updatedTrainees);
    } else {
      // 새 교육생 생성
      const newTrainee: Trainee = {
        ...traineeData as Trainee,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTrainees([...trainees, newTrainee]);
    }
    setCurrentView('list');
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedTrainee(null);
  };

  // 부서 목록 생성
  const departments = Array.from(new Set(trainees.map(t => t.department)));

  if (currentView === 'form') {
    return (
      <TraineeForm
        trainee={selectedTrainee}
        onBack={handleBack}
        onSave={handleSaveTrainee}
      />
    );
  }

  if (currentView === 'detail' && selectedTrainee) {
    return (
      <TraineeDetail
        trainee={selectedTrainee}
        onBack={handleBack}
        onEdit={handleEditTrainee}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">교육생 관리</h1>
            <p className="text-gray-600">교육생 정보를 관리하고 학습 진도를 추적합니다.</p>
          </div>
          <button
            onClick={handleCreateTrainee}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            새 교육생 추가
          </button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="이름, 이메일, 사번, 부서 검색..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TraineeStatus | 'all')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">모든 상태</option>
            {(Object.keys(traineeStatusLabels) as TraineeStatus[]).map(status => (
              <option key={status} value={status}>{traineeStatusLabels[status]}</option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">모든 부서</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <div className="flex items-center text-sm text-gray-500">
            <FunnelIcon className="h-4 w-4 mr-1" />
            총 {filteredTrainees.length}명
          </div>
        </div>
      </div>

      {/* 교육생 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  교육생 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  부서/직급
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수강 과정
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrainees.map((trainee) => (
                <tr key={trainee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{trainee.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <EnvelopeIcon className="h-3 w-3 mr-1" />
                          {trainee.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <PhoneIcon className="h-3 w-3 mr-1" />
                          {trainee.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{trainee.department}</div>
                    <div className="text-sm text-gray-500">{trainee.position}</div>
                    <div className="text-xs text-gray-400">사번: {trainee.employee_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <AcademicCapIcon className="h-4 w-4 mr-1" />
                      {trainee.enrolled_courses.length}개 과정
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      trainee.status === 'active' ? 'bg-green-100 text-green-800' :
                      trainee.status === 'graduated' ? 'bg-blue-100 text-blue-800' :
                      trainee.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {traineeStatusLabels[trainee.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(trainee.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewTrainee(trainee)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      상세보기
                    </button>
                    <button
                      onClick={() => handleEditTrainee(trainee)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTrainees.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">교육생이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">새 교육생을 추가해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraineeManagement;