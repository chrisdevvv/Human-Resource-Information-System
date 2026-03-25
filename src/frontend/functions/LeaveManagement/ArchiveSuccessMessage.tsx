import React, { useEffect } from "react";
import { Check } from "lucide-react";

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
  useEffect(() => {
    if (!isVisible || !onClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [isVisible, onClose, autoCloseDuration]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl p-8">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Success Icon with Animation */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 animate-pulse">
            <Check className="h-10 w-10 text-green-600" strokeWidth={3} />
          </div>

          {/* Success Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Archive Successful!
          </h2>

          {/* Success Message */}
          <p className="text-gray-700 mb-8 leading-relaxed">
            {employeeName ? (
              <>
                <span className="font-semibold text-gray-900">
                  {employeeName}
                </span>{" "}
                has been successfully archived. The employee record has been
                moved to the archived employees section and will no longer
                appear in the active employee list.
              </>
            ) : (
              "The employee record has been successfully archived and moved to the archived employees section."
            )}
          </p>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArchiveSuccessMessage;
