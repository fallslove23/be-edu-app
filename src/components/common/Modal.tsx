/**
 * Modal Component
 *
 * Centralized modal dialog component.
 * Replaces native alert/confirm with custom React modals.
 */

import React, { useEffect } from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useModalStore } from '@/stores/modalStore';
import { buttonColors } from '@/design-system/colors';
import { cn } from '@/lib/utils';

const variantIcons = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
};

const variantColors = {
  info: 'text-blue-600 dark:text-blue-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-orange-600 dark:text-orange-400',
  error: 'text-red-600 dark:text-red-400',
};

/**
 * Modal Component
 * Automatically subscribes to modal store
 */
export const Modal: React.FC = () => {
  const {
    isOpen,
    type,
    variant,
    title,
    message,
    customContent,
    confirmLabel,
    cancelLabel,
    showCancel,
    customButtons,
    confirm,
    cancel,
    close,
  } = useModalStore();

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        cancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, cancel]);

  if (!isOpen) return null;

  const Icon = variantIcons[variant];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity"
        onClick={cancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'bg-white dark:bg-gray-800 rounded-lg shadow-xl',
            'max-w-md w-full max-h-[90vh] overflow-y-auto',
            'transform transition-all',
            'animate-in fade-in zoom-in-95 duration-200'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={cn('flex-shrink-0', variantColors[variant])}>
                <Icon className="w-6 h-6" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            </div>

            {/* Close button */}
            <button
              onClick={cancel}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {customContent ? (
              customContent
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {message}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            {customButtons ? (
              // Custom buttons
              customButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.onClick}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    button.variant === 'danger'
                      ? cn(buttonColors.danger.bg, buttonColors.danger.text, buttonColors.danger.hover)
                      : button.variant === 'secondary'
                      ? cn(buttonColors.secondary.bg, buttonColors.secondary.text, buttonColors.secondary.hover)
                      : cn(buttonColors.primary.bg, buttonColors.primary.text, buttonColors.primary.hover)
                  )}
                >
                  {button.label}
                </button>
              ))
            ) : (
              <>
                {/* Cancel button */}
                {showCancel && (
                  <button
                    onClick={cancel}
                    className={cn(
                      'px-4 py-2 rounded-lg font-medium transition-colors',
                      buttonColors.secondary.bg,
                      buttonColors.secondary.text,
                      buttonColors.secondary.hover
                    )}
                  >
                    {cancelLabel}
                  </button>
                )}

                {/* Confirm button */}
                <button
                  onClick={confirm}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    variant === 'error' || variant === 'warning'
                      ? cn(buttonColors.danger.bg, buttonColors.danger.text, buttonColors.danger.hover)
                      : cn(buttonColors.primary.bg, buttonColors.primary.text, buttonColors.primary.hover)
                  )}
                >
                  {confirmLabel}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
