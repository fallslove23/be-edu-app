import React from 'react';
import { XMarkIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';

interface CertificateData {
  student_name: string;
  course_name: string;
  session_name: string;
  completion_date: string;
  final_score: number;
  certificate_number: string;
  issued_date: string;
  issuer_name: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
  title_text: string;
  content_template: string;
  signature_fields: string[];
  logo_position: 'top-left' | 'top-center' | 'top-right';
}

interface CertificatePreviewProps {
  certificateData: CertificateData;
  template: CertificateTemplate;
  onClose: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
}

const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  certificateData,
  template,
  onClose,
  onDownload,
  onPrint
}) => {
  // 템플릿 내용 치환
  const replaceTemplateVariables = (content: string): string => {
    return content
      .replace(/{student_name}/g, certificateData.student_name)
      .replace(/{course_name}/g, certificateData.course_name)
      .replace(/{session_name}/g, certificateData.session_name)
      .replace(/{completion_date}/g, certificateData.completion_date)
      .replace(/{final_score}/g, certificateData.final_score.toString())
      .replace(/{certificate_number}/g, certificateData.certificate_number)
      .replace(/{issued_date}/g, certificateData.issued_date)
      .replace(/{issuer_name}/g, certificateData.issuer_name);
  };

  const getLogoPositionClass = (position: string) => {
    switch (position) {
      case 'top-left':
        return 'text-left';
      case 'top-center':
        return 'text-center';
      case 'top-right':
        return 'text-right';
      default:
        return 'text-center';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">수료증 미리보기</h3>
          <div className="flex items-center space-x-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                다운로드
              </button>
            )}
            {onPrint && (
              <button
                onClick={onPrint}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center text-sm"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                인쇄
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 수료증 내용 */}
        <div className="p-8">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-12 max-w-3xl mx-auto" style={{ aspectRatio: '4/3' }}>
            {/* 로고/헤더 영역 */}
            <div className={`mb-8 ${getLogoPositionClass(template.logo_position)}`}>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-gray-600">BS</span>
              </div>
              <div className="text-lg font-medium text-gray-600">BS교육연구소</div>
            </div>

            {/* 제목 */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{template.title_text}</h1>
              <div className="w-24 h-1 bg-gray-600 mx-auto"></div>
            </div>

            {/* 수료자 이름 */}
            <div className="text-center mb-8">
              <div className="text-3xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2 inline-block px-8">
                {certificateData.student_name}
              </div>
            </div>

            {/* 내용 */}
            <div className="text-center mb-8">
              <div className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                {replaceTemplateVariables(template.content_template)}
              </div>
            </div>

            {/* 수료증 번호 및 날짜 */}
            <div className="flex justify-between items-end mb-8">
              <div className="text-left">
                <div className="text-sm text-gray-600">수료증 번호</div>
                <div className="font-medium text-gray-900">{certificateData.certificate_number}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">발급일</div>
                <div className="font-medium text-gray-900">{certificateData.issued_date}</div>
              </div>
            </div>

            {/* 서명 영역 */}
            <div className="flex justify-end">
              <div className="text-center">
                {template.signature_fields.map((field, index) => (
                  <div key={index} className="mb-4">
                    <div className="w-32 border-b border-gray-400 mb-2"></div>
                    <div className="text-sm text-gray-600">{field}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 배경 워터마크 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <div className="text-9xl font-bold text-gray-400 transform -rotate-45">
                BS
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 정보 */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
          <div className="text-sm text-gray-600">
            템플릿: {template.name} • 생성일: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;