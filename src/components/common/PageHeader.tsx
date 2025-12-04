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
        <div className="flex items-start gap-6 mb-10">
            {Icon && (
                <div className="relative group">
                    {/* Glow effect */}
                    <div className="absolute -inset-0.5 bg-blue-600 rounded-[1.25rem] blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                    {/* Icon container */}
                    <div className="relative w-16 h-16 bg-[#2563EB] rounded-[1.25rem] flex items-center justify-center shadow-xl border border-white/10">
                        <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                </div>
            )}
            <div className="flex flex-col pt-1">
                {badge && (
                    <div className="flex items-center mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-gray-900 dark:bg-[#0F172A] text-blue-400 border border-blue-800/50 uppercase tracking-widest shadow-sm">
                            {badge}
                        </span>
                    </div>
                )}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    {title}
                </h1>
                <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
};
