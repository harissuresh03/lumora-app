// frontend/src/pages/components/ToastNotification.js
import { Toaster, toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Info, AlertTriangle, Heart } from 'lucide-react';

// Toast notification component wrapper
export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          color: '#1e293b',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: 'white',
          },
        },
      }}
    />
  );
};

// Toast helper functions
export const showSuccessToast = (message, icon = true) => {
  toast.success(message, {
    icon: icon ? '✅' : undefined,
    duration: 3000,
  });
};

export const showErrorToast = (message) => {
  toast.error(message, {
    icon: '❌',
    duration: 4000,
  });
};

export const showInfoToast = (message) => {
  toast(message, {
    icon: 'ℹ️',
    duration: 3000,
  });
};

export const showWarningToast = (message) => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-slide-in' : 'opacity-0'
      } glass-toast warning-toast`}
      style={{
        background: 'linear-gradient(135deg, #fef3c7, #fffbeb)',
        border: '1px solid #f59e0b',
        padding: '12px 20px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      }}
    >
      <AlertTriangle size={20} color="#f59e0b" />
      <span style={{ color: '#92400e' }}>{message}</span>
    </div>
  ), { duration: 4000 });
};

export const showHeartToast = (message) => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-slide-in' : 'opacity-0'
      } glass-toast heart-toast`}
      style={{
        background: 'linear-gradient(135deg, #fef2f2, #fff5f5)',
        border: '1px solid #ef4444',
        padding: '12px 20px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Heart size={20} color="#ef4444" />
      <span style={{ color: '#991b1b' }}>{message}</span>
    </div>
  ), { duration: 5000 });
};

export default ToastProvider;