/**
 * Utility functions for handling form clearing with confirmation
 */

export interface ClearFormOptions {
  onConfirm: () => void;
  hasUnsavedData: boolean;
  confirmationMessage?: string;
}

export type ClearFormDialogRequest = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

type ClearFormDialogOpener = (
  request: ClearFormDialogRequest,
) => Promise<boolean>;

let clearFormDialogOpener: ClearFormDialogOpener | null = null;

export function registerClearFormConfirmation(
  opener: ClearFormDialogOpener | null,
): void {
  clearFormDialogOpener = opener;
}

/**
 * Handles form clearing with confirmation when there is unsaved data
 * Shows confirmation dialog only if data exists, otherwise clears immediately
 *
 * @param options - Configuration for clearing behavior
 */
export function handleClearForm(options: ClearFormOptions): void {
  const {
    onConfirm,
    hasUnsavedData,
    confirmationMessage = "You have unsaved changes. Are you sure you want to clear all fields?",
  } = options;

  if (!hasUnsavedData) {
    onConfirm();
    return;
  }

  if (clearFormDialogOpener) {
    void clearFormDialogOpener({ message: confirmationMessage }).then(
      (confirmed) => {
        if (confirmed) {
          onConfirm();
        }
      },
    );
    return;
  }

  if (window.confirm(confirmationMessage)) {
    onConfirm();
  }
}

/**
 * Detects if form has any user-entered data by comparing current state with initial state
 *
 * @param currentState - Current form state object
 * @param initialState - Initial/empty form state object
 * @returns true if form has unsaved data, false otherwise
 */
export function hasFormData(
  currentState: Record<string, unknown>,
  initialState: Record<string, unknown>,
): boolean {
  for (const key in currentState) {
    if (Object.prototype.hasOwnProperty.call(currentState, key)) {
      const current = currentState[key];
      const initial = initialState[key];

      // Compare values
      if (JSON.stringify(current) !== JSON.stringify(initial)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Creates a clear handler function for a form
 * Useful for wrapping in onClick handlers
 *
 * @param onConfirm - Callback to execute when form should be cleared
 * @param hasUnsavedData - Whether form has unsaved data
 * @param confirmationMessage - Custom confirmation message
 * @returns A function suitable for onClick handlers
 */
export function createClearHandler(
  onConfirm: () => void,
  hasUnsavedData: boolean,
  confirmationMessage?: string,
): () => void {
  return () => {
    handleClearForm({
      onConfirm,
      hasUnsavedData,
      confirmationMessage,
    });
  };
}
