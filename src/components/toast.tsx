import { Box, Text } from "zmp-ui";
import { useState, useEffect } from "react";

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

const Toast = ({ message, type, isVisible, onClose }: ToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Tự động đóng sau 3 giây

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          borderColor: '#059669',
          color: 'white'
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
          color: 'white'
        };
      case 'info':
        return {
          backgroundColor: '#04A1B3',
          borderColor: '#04A1B3',
          color: 'white'
        };
      default:
        return {
          backgroundColor: '#6B7280',
          borderColor: '#4B5563',
          color: 'white'
        };
    }
  };

  return (
    <Box
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 rounded-lg shadow-lg px-4 py-3 min-w-64 max-w-sm"
      style={getToastStyle()}
    >
      <Text className="text-sm font-medium text-center">
        {message}
      </Text>
    </Box>
  );
};

export default Toast;
