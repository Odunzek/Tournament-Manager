"use client";

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      closeOnBackdrop={!isLoading}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4 py-2">
        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                        ${isDestructive
                          ? 'bg-red-500/15 text-red-500'
                          : 'bg-yellow-500/15 text-yellow-500'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-light-900 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-light-600 dark:text-gray-400">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
