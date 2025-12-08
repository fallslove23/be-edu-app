import React, { useState } from 'react';
import {
    Download,
    Users,
    GraduationCap,
    ClipboardCheck,
    BarChart2,
    BookOpen,
    Calendar,
    Award,
    FileText
} from 'lucide-react';
import type { StudentReport } from '../../types/report.types';
import { DetailLayout, DetailSection } from '../common/DetailLayout';

interface StudentDetailViewProps {
    report: StudentReport;
    onBack: () => void;
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ report, onBack }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'grades' | 'attendance' | 'certificates'>('overview');

    const handleExportPDF = () => {
        // TODO: PDF 내보내기 구현
        alert('PDF 내보내기 기능은 추후 구현 예정입니다.');
    };

    return (
        <DetailLayout
            title={`${report.trainee.name} 리포트`}
            description="교육생의 학습 현황 및 성과 상세 리포트입니다."
            onBack={onBack}
            actions={
                <button
                    onClick={handleExportPDF}
                    className="btn-primary flex items-center gap-2"
                >
                    <Download className="h-4 w-4" />
                    <span>PDF 내보내기</span>
                </button>
            }
        >
            {/* 교육생 정보 요약 카드 */}
            <div className="glass-panel p-6 rounded-2xl mb-6">
                <div className="flex items-start gap-6">
                    {report.trainee.profile_image_url ? (
                        <img
                            src={report.trainee.profile_image_url}
                            alt={report.trainee.name}
                            className="w-20 h-20 rounded-xl object-cover shadow-sm border border-gray-100 dark:border-gray-700"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center shadow-inner">
                            <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                {report.trainee.name.charAt(0)}
                            </span>
                        </div>
                    )}
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{report.trainee.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-8 text-sm">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <span className="font-semibold w-16">이메일</span>
                                <span>{report.trainee.email}</span>
                            </div>
                            {report.trainee.phone && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                    <span className="font-semibold w-16">전화번호</span>
                                    <span>{report.trainee.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <span className="font-semibold w-16">가입일</span>
                                <span>{new Date(report.trainee.joined_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex flex-wrap gap-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl w-fit">
                {[
                    { id: 'overview', label: '개요', icon: <FileText className="w-4 h-4" /> },
                    { id: 'courses', label: '과정 이수', icon: <BookOpen className="w-4 h-4" /> },
                    { id: 'grades', label: '성적', icon: <BarChart2 className="w-4 h-4" /> },
                    { id: 'attendance', label: '출석', icon: <Calendar className="w-4 h-4" /> },
                    { id: 'certificates', label: '인증서', icon: <Award className="w-4 h-4" /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 탭 컨텐츠 */}
            <div className="animate-fade-in-up">
                {activeTab === 'overview' && <OverviewTab report={report} />}
                {activeTab === 'courses' && <CoursesTab report={report} />}
                {activeTab === 'grades' && <GradesTab report={report} />}
                {activeTab === 'attendance' && <AttendanceTab report={report} />}
                {activeTab === 'certificates' && <CertificatesTab report={report} />}
            </div>
        </DetailLayout>
    );
};

export default StudentDetailView;

/**
 * 개요 탭
 */
const OverviewTab: React.FC<{ report: StudentReport }> = ({ report }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailSection title="학습 요약" className="col-span-full">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard label="총 과정" value={report.overall_statistics.total_courses} />
                    <StatCard label="이수 완료" value={report.overall_statistics.completed_courses} color="text-green-600" />
                    <StatCard label="수강 중" value={report.overall_statistics.in_progress_courses} color="text-blue-600" />
                    <StatCard label="평균 성적" value={`${report.overall_statistics.average_score.toFixed(1)}점`} color="text-orange-600" />
                    <StatCard label="평균 출석률" value={`${report.overall_statistics.average_attendance_rate.toFixed(1)}%`} color="text-teal-600" />
                    <StatCard label="인증서" value={`${report.overall_statistics.total_certificates}개`} color="text-indigo-600" />
                </div>
            </DetailSection>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = 'text-gray-900 dark:text-white' }) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

/**
 * 과정 이수 탭
 */
const CoursesTab: React.FC<{ report: StudentReport }> = ({ report }) => {
    const getStatusBadge = (status: string) => {
        const badges = {
            completed: { label: '완료', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            in_progress: { label: '수강중', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
            dropped: { label: '중도포기', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
            pending: { label: '대기', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' }
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        return (
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${badge.className}`}>
                {badge.label}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            {report.course_completions.map((course) => (
                <DetailSection key={course.id}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{course.course_name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {course.session_code}
                                {course.division_name && ` - ${course.division_name}`}
                            </p>
                        </div>
                        {getStatusBadge(course.completion_status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                        <div>
                            <span className="block text-gray-500 dark:text-gray-400 mb-1">시작일</span>
                            <span className="font-medium text-gray-900 dark:text-white">{new Date(course.start_date).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 dark:text-gray-400 mb-1">종료일</span>
                            <span className="font-medium text-gray-900 dark:text-white">{new Date(course.end_date).toLocaleDateString('ko-KR')}</span>
                        </div>
                        {course.completion_date && (
                            <div>
                                <span className="block text-gray-500 dark:text-gray-400 mb-1">이수일</span>
                                <span className="font-medium text-gray-900 dark:text-white">{new Date(course.completion_date).toLocaleDateString('ko-KR')}</span>
                            </div>
                        )}
                        {course.certificate_issued && (
                            <div>
                                <span className="block text-gray-500 dark:text-gray-400 mb-1">인증서 번호</span>
                                <span className="font-medium text-gray-900 dark:text-white font-mono">{course.certificate_number}</span>
                            </div>
                        )}
                    </div>
                </DetailSection>
            ))}
            {report.course_completions.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">이수 과정이 없습니다.</div>
            )}
        </div>
    );
};

/**
 * 성적 탭
 */
const GradesTab: React.FC<{ report: StudentReport }> = ({ report }) => {
    return (
        <DetailSection title="성적 내역">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="py-3 px-4 rounded-l-lg">과목</th>
                            <th className="py-3 px-4 text-center">점수</th>
                            <th className="py-3 px-4 text-center">백분율</th>
                            <th className="py-3 px-4 text-center">등급</th>
                            <th className="py-3 px-4 rounded-r-lg text-center">평가일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {report.grades.map((grade, index) => (
                            <tr key={index} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{grade.subject}</td>
                                <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">
                                    {grade.score}/{grade.max_score}
                                </td>
                                <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">{grade.percentage.toFixed(1)}%</td>
                                <td className="text-center py-3 px-4">
                                    <span className={`inline-block w-8 py-0.5 rounded text-xs font-bold ${grade.grade === 'A' ? 'bg-green-100 text-green-700' :
                                        grade.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>{grade.grade}</span>
                                </td>
                                <td className="text-center py-3 px-4 text-gray-500 dark:text-gray-400">
                                    {new Date(grade.evaluation_date).toLocaleDateString('ko-KR')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {report.grades.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">성적 정보가 없습니다.</div>
            )}
        </DetailSection>
    );
};

/**
 * 출석 탭
 */
const AttendanceTab: React.FC<{ report: StudentReport }> = ({ report }) => {
    const { attendance_summary } = report;

    return (
        <div className="space-y-6">
            <DetailSection title="출석 현황">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <StatCard label="총 일수" value={attendance_summary.total_days} />
                    <StatCard label="출석" value={attendance_summary.present_days} color="text-green-600 dark:text-green-400" />
                    <StatCard label="지각" value={attendance_summary.late_days} color="text-yellow-600 dark:text-yellow-400" />
                    <StatCard label="결석" value={attendance_summary.absent_days} color="text-red-600 dark:text-red-400" />
                    <StatCard label="출석률" value={`${attendance_summary.attendance_rate.toFixed(1)}%`} color="text-blue-600 dark:text-blue-400" />
                </div>

                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">전체 출석률 진행도</p>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-indigo-500 h-4 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${attendance_summary.attendance_rate}%` }}
                        />
                    </div>
                </div>
            </DetailSection>
        </div>
    );
};

/**
 * 인증서 탭
 */
const CertificatesTab: React.FC<{ report: StudentReport }> = ({ report }) => {
    return (
        <div className="space-y-4">
            {report.certificates.map((cert) => (
                <DetailSection key={cert.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{cert.course_name}</h3>
                        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>번호: {cert.certificate_number}</span>
                            <span>발급일: {new Date(cert.issued_date).toLocaleDateString('ko-KR')}</span>
                        </div>
                    </div>
                    {cert.pdf_url && (
                        <a
                            href={cert.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg"
                        >
                            <Download className="h-4 w-4" />
                            다운로드
                        </a>
                    )}
                </DetailSection>
            ))}
            {report.certificates.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">발급된 인증서가 없습니다.</div>
            )}
        </div>
    );
};
