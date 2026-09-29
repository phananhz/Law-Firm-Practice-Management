'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  confirmVariant?: 'primary' | 'destructive';
  isLoading?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  onConfirm,
  confirmVariant = 'primary',
  isLoading = false,
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md text-slate-400 hover:text-slate-500 focus:outline-none cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {description && <p className="mt-3 text-sm text-slate-500">{description}</p>}
            {children && <div className="mt-4">{children}</div>}
          </div>

          <div className="bg-slate-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-slate-100">
            {onConfirm && (
              <Button variant={confirmVariant} size="md" isLoading={isLoading} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            )}
            <Button variant="outline" size="md" disabled={isLoading} onClick={onClose}>
              {cancelLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
