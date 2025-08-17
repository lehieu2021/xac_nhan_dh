import { useState } from "react";
import { Box, Text, Button, Input, Page } from "zmp-ui";
import { apiService } from "../services/api";

interface LoginProps {
  onLogin: (supplierId: string, supplierData: any) => void;
  onError: (message: string) => void;
}

const Login = ({ onLogin, onError }: LoginProps) => {
  const [phone, setPhone] = useState(""); // Không pre-fill, để user nhập
  const [password, setPassword] = useState(""); // Không pre-fill, để user nhập
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      onError("Vui lòng nhập đầy đủ số điện thoại và mật khẩu");
      return;
    }

    setIsLoading(true);
    
    try {
      // Authenticate with API service
      const supplier = await apiService.authenticateSupplier(phone, password);
      onLogin(supplier.crdfd_supplierid, supplier);
    } catch (error: any) {
      onError(error.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
      <Box className="w-full max-w-md">
        {/* Logo/Header */}
        <Box className="text-center mb-8">
          <Text className="text-3xl font-bold" style={{ color: '#04A1B3' }}>
            Wecare
          </Text>
          <Text className="text-gray-600 mt-2">
            Hệ thống quản lý đơn hàng nhà cung cấp
          </Text>
        </Box>

        {/* Login Form */}
        <Box className="bg-white rounded-lg p-6 shadow-lg">
          <Text className="text-xl font-semibold text-center mb-6 text-gray-900">
            Đăng nhập
          </Text>

          {/* Default Password Notice */}
          <Box className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <Text className="text-yellow-800 text-sm font-medium mb-1">
              💡 Thông tin quan trọng
            </Text>
            <Text className="text-yellow-700 text-xs">
              • Tài khoản mới: Sử dụng mật khẩu mặc định <strong>"Wecare"</strong><br/>
              • Sau khi đăng nhập lần đầu, vui lòng đổi mật khẩu trong phần Hồ sơ
            </Text>
          </Box>

          <Box className="space-y-4">
            <Box>
              <Text className="text-gray-700 mb-2 block">Số điện thoại</Text>
              <Input
                placeholder="Nhập số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="text"
                style={{
                  backgroundColor: '#F9FAFB',
                  borderColor: '#E5E7EB',
                  color: '#374151'
                }}
              />
            </Box>

            <Box>
              <Text className="text-gray-700 mb-2 block">Mật khẩu</Text>
              <Input
                placeholder="Nhập mật khẩu (tài khoản mới: Wecare)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                style={{
                  backgroundColor: '#F9FAFB',
                  borderColor: '#E5E7EB',
                  color: '#374151'
                }}
              />
            </Box>

            <Button
              variant="primary"
              fullWidth
              onClick={handleLogin}
              disabled={isLoading}
              style={{
                backgroundColor: '#04A1B3',
                borderColor: '#04A1B3',
                color: 'white',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                height: '48px'
              }}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </Box>

          <Box className="mt-4 text-center">
            <Text className="text-sm text-gray-500">
              Quên mật khẩu? Liên hệ admin để được hỗ trợ
            </Text>
          </Box>
        </Box>

        {/* Footer */}
        <Box className="text-center mt-6">
          <Text className="text-xs text-gray-400">
            © 2024 Wecare. Tất cả quyền được bảo lưu.
          </Text>
        </Box>
      </Box>
    </Page>
  );
};

export default Login;
