import React, { useEffect } from "react";
import { Check, X } from "lucide-react";

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
    <div className="fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
          <Check className="h-4 w-4 text-green-600" strokeWidth={3} />
        </div>

        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-900">
            Archive Successful
          </h2>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            {employeeName ? (
              <>
                <span className="font-semibold text-gray-800">
                  {employeeName}
                </span>{" "}
                has been archived and moved to archived employees.
              </>
            ) : (
              "The employee record has been archived and moved to archived employees."
            )}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-700"
            aria-label="Close archive success toast"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default ArchiveSuccessMessage;
