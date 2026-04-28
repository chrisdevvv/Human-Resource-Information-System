"use client";

import React from "react";
import ConfirmationModal from "../../components/ConfirmationModal";

type ConfirmEditProps = {
  visible: boolean;
  loading: boolean;
  employeeName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmEdit({
  visible,
  loading,
  employeeName,
  onConfirm,
  onCancel,
}: ConfirmEditProps) {
  return (
    <ConfirmationModal
      visible={visible}
      title="Confirm Edit"
      message={`Are you sure you want to save changes for ${employeeName || "this employee"}?`}
      confirmLabel="Save Changes"
      cancelLabel="Cancel"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
