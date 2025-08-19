import { useState } from "react";
import { Box, Text, Button, Input } from "zmp-ui";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string, confirmPassword: string) => void;
}

const ChangePasswordModal = ({ isOpen, onClose, onSubmit }: ChangePasswordModalProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await onSubmit(newPassword, confirmPassword);
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (error) {
      console.error("Error changing password:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Box className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Box className="bg-white rounded-xl p-6 mx-4 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <Box className="flex justify-between items-center mb-6">
          <Text className="text-lg font-medium text-gray-900">Đổi mật khẩu</Text>
          <Button
            variant="secondary"
            size="small"
            onClick={handleClose}
            className="bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 p-2"
          >
            ✕
          </Button>
        </Box>

        <Box className="space-y-4">
          <Text className="text-gray-600 text-sm">
            Vui lòng nhập mật khẩu mới để thay đổi
          </Text>

          {/* New Password */}
          <Box>
            <Text className="text-gray-700 mb-2 block text-sm font-medium">Mật khẩu mới</Text>
            <Input
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              className={errors.newPassword ? "border-red-300" : ""}
            />
            {errors.newPassword && (
              <Text className="text-red-500 text-xs mt-1">{errors.newPassword}</Text>
            )}
          </Box>

          {/* Confirm New Password */}
          <Box>
            <Text className="text-gray-700 mb-2 block text-sm font-medium">Xác nhận mật khẩu mới</Text>
            <Input
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              className={errors.confirmPassword ? "border-red-300" : ""}
            />
            {errors.confirmPassword && (
              <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword}</Text>
            )}
          </Box>

          {/* Password Requirements */}
          <Box className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <Text className="text-blue-800 text-sm font-medium mb-2">Yêu cầu mật khẩu:</Text>
            <Box className="space-y-1">
              <Text className="text-blue-700 text-xs">• Tối thiểu 6 ký tự</Text>
              <Text className="text-blue-700 text-xs">• Nên sử dụng kết hợp chữ hoa, chữ thường, số</Text>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleClose}
              className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ChangePasswordModal;
