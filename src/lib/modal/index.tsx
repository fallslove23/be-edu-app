/**
 * Modal Utility Functions
 *
 * Drop-in replacements for native alert/confirm.
 * Usage: Replace `alert()` with `modal.alert()` and `confirm()` with `modal.confirm()`
 */

import { useModalStore } from '@/stores/modalStore';
import type { ModalVariant, ModalButton } from '@/stores/modalStore';

/**
 * Show alert modal
 * Drop-in replacement for native alert()
 *
 * @example
 * await modal.alert('성공', '저장되었습니다.');
 * await modal.alert('오류', '저장에 실패했습니다.', 'error');
 */
export async function alert(
  title: string,
  message: string,
  variant: ModalVariant = 'info'
): Promise<void> {
  return useModalStore.getState().openAlert(title, message, variant);
}

/**
 * Show confirm modal
 * Drop-in replacement for native confirm()
 *
 * @example
 * const confirmed = await modal.confirm('삭제 확인', '정말 삭제하시겠습니까?');
 * if (confirmed) {
 *   // Delete logic
 * }
 *
 * @example
 * const confirmed = await modal.confirm(
 *   '위험한 작업',
 *   '이 작업은 되돌릴 수 없습니다.',
 *   'warning'
 * );
 */
export async function confirm(
  title: string,
  message: string,
  variant: ModalVariant = 'warning'
): Promise<boolean> {
  return useModalStore.getState().openConfirm(title, message, variant);
}

/**
 * Show custom modal with custom content and buttons
 *
 * @example
 * modal.custom(
 *   '고급 옵션',
 *   <div>Custom content here</div>,
 *   [
 *     { label: '옵션 1', onClick: () => console.log('1') },
 *     { label: '옵션 2', variant: 'danger', onClick: () => console.log('2') },
 *   ]
 * );
 */
export function custom(
  title: string,
  content: React.ReactNode,
  buttons?: ModalButton[]
): void {
  useModalStore.getState().openCustom(title, content, buttons);
}

/**
 * Close current modal
 */
export function close(): void {
  useModalStore.getState().close();
}

/**
 * Success alert (green)
 */
export async function success(title: string, message: string): Promise<void> {
  return alert(title, message, 'success');
}

/**
 * Error alert (red)
 */
export async function error(title: string, message: string): Promise<void> {
  return alert(title, message, 'error');
}

/**
 * Warning alert (orange)
 */
export async function warning(title: string, message: string): Promise<void> {
  return alert(title, message, 'warning');
}

/**
 * Info alert (blue)
 */
export async function info(title: string, message: string): Promise<void> {
  return alert(title, message, 'info');
}

/**
 * Delete confirmation (red warning)
 */
export async function confirmDelete(
  itemName: string = '항목'
): Promise<boolean> {
  return confirm(
    '삭제 확인',
    `${itemName}을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`,
    'error'
  );
}

/**
 * Discard changes confirmation
 */
export async function confirmDiscard(): Promise<boolean> {
  return confirm(
    '변경사항 취소',
    '저장하지 않은 변경사항이 있습니다.\n정말 취소하시겠습니까?',
    'warning'
  );
}

/**
 * Export all functions as modal object
 */
export const modal = {
  alert,
  confirm,
  custom,
  close,
  success,
  error,
  warning,
  info,
  confirmDelete,
  confirmDiscard,
};

export default modal;
