import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_STYLES = {
  success: { icon: CheckCircle2, color: 'var(--accent-emerald)' },
  error: { icon: AlertCircle, color: 'var(--accent-red)' },
  warn: { icon: AlertTriangle, color: 'var(--accent-amber)' },
  info: { icon: Info, color: 'var(--accent-cyan)' }
};

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map(toast => {
        const { icon: Icon, color } = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

        return (
          <div key={toast.id} className="toast">
            <Icon size={17} style={{ color }} />
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="clear-input-btn"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
