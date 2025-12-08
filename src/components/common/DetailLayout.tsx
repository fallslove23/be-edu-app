import React, { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DetailLayoutProps {
    title: string;
    description?: string;
    onBack?: () => void;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}

export const DetailLayout: React.FC<DetailLayoutProps> = ({
    title,
    description,
    onBack,
    actions,
    children,
    className = ''
}) => {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <div className={`max-w-7xl mx-auto space-y-6 ${className}`}>
            {/* Header Section */}
            <div className="card-premium p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                            aria-label="뒤로 가기"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {actions && (
                        <div className="flex items-center gap-3">
                            {actions}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="animate-fade-in-up">
                {children}
            </div>
        </div>
    );
};

export const DetailSection: React.FC<{
    title?: string;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
    gradientLine?: boolean;
}> = ({ title, icon, children, className = '', gradientLine = false }) => {
    return (
        <div className={`card-premium p-6 ${className}`}>
            {title && (
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700/50">
                    {gradientLine && (
                        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                    )}
                    {icon && <div className="text-indigo-500 dark:text-indigo-400">{icon}</div>}
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {title}
                    </h2>
                </div>
            )}
            {children}
        </div>
    );
};
