import React from 'react';

interface FadeInUpProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
}

export const FadeInUp: React.FC<FadeInUpProps> = ({
    children,
    delay = 0,
    duration = 0.5,
    className = ''
}) => {
    return (
        <div
            className={`animate-slideUp fill-mode-forwards opacity-0 ${className}`}
            style={{
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                animationFillMode: 'forwards'
            }}
        >
            {children}
        </div>
    );
};

export const StaggerContainer: React.FC<{ children: React.ReactNode; className?: string; staggerDelay?: number }> = ({
    children,
    className = '',
    staggerDelay = 0.1
}) => {
    return (
        <div className={className}>
            {React.Children.map(children, (child, index) => {
                if (React.isValidElement(child)) {
                    return (
                        <div
                            className="animate-slideUp fill-mode-forwards opacity-0"
                            style={{
                                animationDelay: `${index * staggerDelay}s`,
                                animationFillMode: 'forwards'
                            }}
                        >
                            {child}
                        </div>
                    );
                }
                return child;
            })}
        </div>
    );
};
