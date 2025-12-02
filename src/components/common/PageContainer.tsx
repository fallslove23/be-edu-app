import React from 'react';

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'full' | '7xl' | '5xl';
}

export const PageContainer: React.FC<PageContainerProps> = ({
    children,
    className = '',
    maxWidth = 'full'
}) => {
    const maxWidthClass = {
        'full': 'w-full',
        '7xl': 'max-w-7xl',
        '5xl': 'max-w-5xl',
    }[maxWidth];

    return (
        <div className={`p-4 sm:p-6 bg-background min-h-screen touch-manipulation ${className}`}>
            <div className={`${maxWidthClass} space-y-4 sm:space-y-6`}>
                {children}
            </div>
        </div>
    );
};
