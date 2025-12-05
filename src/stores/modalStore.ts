/**
 * Modal Store - Zustand
 *
 * Centralized modal state management.
 * Replaces native alert/confirm with custom React modals.
 */

import { create } from 'zustand';

export type ModalType = 'alert' | 'confirm' | 'custom';
export type ModalVariant = 'info' | 'success' | 'warning' | 'error';

export interface ModalButton {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

export interface ModalState {
  // Modal state
  isOpen: boolean;
  type: ModalType;
  variant: ModalVariant;
  title: string;
  message: string;
  customContent?: React.ReactNode;

  // Buttons
  confirmLabel: string;
  cancelLabel: string;
  showCancel: boolean;

  // Callbacks
  onConfirm?: () => void;
  onCancel?: () => void;

  // Custom buttons
  customButtons?: ModalButton[];

  // Actions
  openAlert: (title: string, message: string, variant?: ModalVariant) => Promise<void>;
  openConfirm: (title: string, message: string, variant?: ModalVariant) => Promise<boolean>;
  openCustom: (title: string, content: React.ReactNode, buttons?: ModalButton[]) => void;
  close: () => void;
  confirm: () => void;
  cancel: () => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  // Initial state
  isOpen: false,
  type: 'alert',
  variant: 'info',
  title: '',
  message: '',
  customContent: undefined,
  confirmLabel: '확인',
  cancelLabel: '취소',
  showCancel: false,
  onConfirm: undefined,
  onCancel: undefined,
  customButtons: undefined,

  // Open alert modal
  openAlert: (title: string, message: string, variant: ModalVariant = 'info') => {
    return new Promise<void>((resolve) => {
      set({
        isOpen: true,
        type: 'alert',
        variant,
        title,
        message,
        customContent: undefined,
        confirmLabel: '확인',
        cancelLabel: '취소',
        showCancel: false,
        customButtons: undefined,
        onConfirm: () => {
          get().close();
          resolve();
        },
        onCancel: undefined,
      });
    });
  },

  // Open confirm modal
  openConfirm: (title: string, message: string, variant: ModalVariant = 'info') => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        type: 'confirm',
        variant,
        title,
        message,
        customContent: undefined,
        confirmLabel: '확인',
        cancelLabel: '취소',
        showCancel: true,
        customButtons: undefined,
        onConfirm: () => {
          get().close();
          resolve(true);
        },
        onCancel: () => {
          get().close();
          resolve(false);
        },
      });
    });
  },

  // Open custom modal
  openCustom: (title: string, content: React.ReactNode, buttons?: ModalButton[]) => {
    set({
      isOpen: true,
      type: 'custom',
      variant: 'info',
      title,
      message: '',
      customContent: content,
      confirmLabel: '확인',
      cancelLabel: '취소',
      showCancel: false,
      customButtons: buttons,
      onConfirm: undefined,
      onCancel: undefined,
    });
  },

  // Close modal
  close: () => {
    set({
      isOpen: false,
      customContent: undefined,
      customButtons: undefined,
      onConfirm: undefined,
      onCancel: undefined,
    });
  },

  // Confirm action
  confirm: () => {
    const { onConfirm } = get();
    if (onConfirm) {
      onConfirm();
    } else {
      get().close();
    }
  },

  // Cancel action
  cancel: () => {
    const { onCancel } = get();
    if (onCancel) {
      onCancel();
    } else {
      get().close();
    }
  },
}));
