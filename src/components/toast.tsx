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
      }, 3000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#F0FDF4',
          borderColor: '#BBF7D0',
          textColor: '#166534',
          icon: '✅'
        };
      case 'error':
        return {
          backgroundColor: '#FEF2F2',
          borderColor: '#FECACA',
          textColor: '#DC2626',
          icon: '❌'
        };
      case 'info':
        return {
          backgroundColor: '#F0F9FF',
          borderColor: '#BAE6FD',
          textColor: '#0369A1',
          icon: 'ℹ️'
        };
      default:
        return {
          backgroundColor: '#F9FAFB',
          borderColor: '#E5E7EB',
          textColor: '#374151',
          icon: '💡'
        };
    }
  };

  const style = getToastStyle();

  return (
    <Box
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 rounded-xl shadow-lg px-4 py-3 min-w-64 max-w-sm border"
      style={{
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor
      }}
    >
      <Box className="flex items-center space-x-2">
        <Text className="text-sm">{style.icon}</Text>
        <Text className="text-sm font-medium" style={{ color: style.textColor }}>
          {message}
        </Text>
      </Box>
    </Box>
  );
};

export default Toast;
