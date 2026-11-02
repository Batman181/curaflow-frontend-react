import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(() => {});

/** showToast(message, "info" | "success" | "error") — available via useToast(). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const showToast = useCallback((message, type = "info") => {
    const id = ++nextId.current;
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div id="toast-container" className="toast-container" aria-live="assertive">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast${t.type === "error" ? " toast--error" : ""}${t.type === "success" ? " toast--success" : ""}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
