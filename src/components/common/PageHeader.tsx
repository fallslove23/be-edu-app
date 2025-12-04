import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description: string;
    badge?: string;
    icon?: LucideIcon;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    badge,
    icon: Icon
}) => {
    return (
        <div className="flex items-start gap-5 mb-8">
            {Icon && (
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                    <Icon className="w-7 h-7 text-white" />
                </div>
            )}
            <div className="flex flex-col pt-0.5">
                {badge && (
                    <div className="flex items-center mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider">
                            {badge}
                        </span>
                    </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5 leading-none">
                    {title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
};
