import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  };

  const notify = (message, type = "success") => {
    const id = Date.now() + Math.random();

    setToasts((current) => [
      ...current,
      {
        id,
        message,
        type,
      },
    ]);

    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}

      {createPortal(
        <div className="toast-layer">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast ${toast.type}`}
              role="alert"
            >
              <span className="toast-message">
                {toast.message}
              </span>

              <button
                type="button"
                className="toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);