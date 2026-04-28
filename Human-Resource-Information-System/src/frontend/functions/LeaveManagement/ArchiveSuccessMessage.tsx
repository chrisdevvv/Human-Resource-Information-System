import React from "react";
import ToastMessage from "../../components/ToastMessage";

type ArchiveSuccessMessageProps = {
  isVisible: boolean;
  employeeName?: string;
  onClose?: () => void;
  autoCloseDuration?: number; // in milliseconds, default 2000
};

function ArchiveSuccessMessage({
  isVisible,
  employeeName,
  onClose,
  autoCloseDuration = 2000,
}: ArchiveSuccessMessageProps) {
  const message = employeeName ? (
    <>
      <span className="font-semibold text-gray-800">{employeeName}</span> has
      been archived and moved to archived employees.
    </>
  ) : (
    "The employee record has been archived and moved to archived employees."
  );

  if (!isVisible) return null;

  return (
    <ToastMessage
      isVisible={isVisible}
      title="Archive Successful"
      message={message}
      variant="success"
      onClose={onClose}
      autoCloseDuration={autoCloseDuration}
    />
  );
}

export default ArchiveSuccessMessage;
