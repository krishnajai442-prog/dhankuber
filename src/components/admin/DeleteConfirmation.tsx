"use client";

import { Modal, ConfirmModal } from "@/components/shared/Modal";

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  loading?: boolean;
}

export function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = "item",
  loading = false,
}: DeleteConfirmationProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${itemType}`}
      message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      variant="danger"
      loading={loading}
    />
  );
}

export function BulkDeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  count,
  itemType = "items",
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  itemType?: string;
  loading?: boolean;
}) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${count} ${itemType}`}
      message={`Are you sure you want to delete ${count} ${itemType}? This action cannot be undone.`}
      confirmText="Delete All"
      cancelText="Cancel"
      variant="danger"
      loading={loading}
    />
  );
}