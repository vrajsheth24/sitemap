import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div 
            key={toast.id} 
            className="toast"
            style={{
              borderLeft: `4px solid ${isSuccess ? 'var(--accent-emerald)' : isError ? 'var(--accent-red)' : 'var(--accent-cyan)'}`
            }}
          >
            {isSuccess && <CheckCircle2 size={18} className="text-emerald" />}
            {isError && <AlertCircle size={18} className="text-red" />}
            {!isSuccess && !isError && <Info size={18} className="text-cyan" />}
            
            <span>{toast.message}</span>

            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto', display: 'flex' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
