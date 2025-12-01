import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar } from 'react-native-paper';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');

  const showToast = useCallback((msg: string, toastType: ToastType = 'info') => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);
  }, []);

  const onDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const getColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={3000}
        style={{ backgroundColor: getColor() }}
      >
        {message}
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

