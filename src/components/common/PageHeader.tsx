import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description: string;
    badge?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    badge
}) => {
    return (
        <div className="flex flex-col items-start mb-8">
            {badge && (
                <div className="flex items-center mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 uppercase tracking-wider">
                        {badge}
                    </span>
                </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                {title}
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                {description}
            </p>
        </div>
    );
};
