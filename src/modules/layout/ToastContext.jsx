import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-notification toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' ? '✓' : '⚠'}
            </div>
            <div className="toast-message">{toast.message}</div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>✕</button>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 9999;
          pointer-events: none;
        }
        .toast-notification {
          background: var(--tb-surface-2);
          border: 1px solid var(--tb-border);
          color: var(--tb-text);
          padding: 16px 20px;
          border-radius: 8px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          animation: toast-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          pointer-events: auto;
          min-width: 280px;
          max-width: 400px;
        }
        .toast-success {
          border-left: 4px solid var(--tb-green);
        }
        .toast-error {
          border-left: 4px solid var(--tb-red);
        }
        .toast-icon {
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .toast-success .toast-icon {
          background: rgba(63, 185, 80, 0.1);
          color: var(--tb-green);
        }
        .toast-error .toast-icon {
          background: rgba(248, 81, 73, 0.1);
          color: var(--tb-red);
        }
        .toast-message {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.5;
          flex: 1;
          white-space: pre-wrap;
          margin-top: 1px;
        }
        .toast-close {
          background: none;
          border: none;
          color: var(--tb-text-2);
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        .toast-close:hover {
          color: var(--tb-text);
        }
        @keyframes toast-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
