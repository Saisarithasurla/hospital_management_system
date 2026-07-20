import { createPortal } from "react-dom";

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = "Yes", cancelText = "No" }) {
  if (!isOpen) return null;

  const dialog = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 px-4 py-6">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-black/10 transform transition-all duration-300 ease-out">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

export default ConfirmDialog;
