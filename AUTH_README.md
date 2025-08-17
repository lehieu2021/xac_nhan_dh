# Hệ thống Authentication - Zalo Mini App

## Tổng quan
Dự án đã được tích hợp đầy đủ hệ thống authentication bao gồm:
- ✅ Đăng nhập/Đăng xuất
- ✅ Kiểm tra trạng thái đăng nhập
- ✅ Bảo vệ route (Protected Routes)
- ✅ Đổi mật khẩu
- ✅ Tự động chuyển hướng khi chưa đăng nhập

## Cách sử dụng

### 1. Thông tin đăng nhập demo
- **Tài khoản:** `admin`
- **Mật khẩu:** `123456`

### 2. Luồng hoạt động
1. **Khi vào app lần đầu:** Kiểm tra token trong localStorage
2. **Nếu chưa đăng nhập:** Tự động chuyển đến trang Login
3. **Sau khi đăng nhập thành công:** Chuyển đến trang chính
4. **Khi đổi mật khẩu:** Tự động logout và chuyển về trang Login

### 3. Các component chính

#### AuthContext (`src/contexts/AuthContext.tsx`)
- Quản lý trạng thái đăng nhập
- Cung cấp các function: `login`, `logout`, `changePassword`
- Kiểm tra token khi khởi động app

#### Login (`src/components/Login.tsx`)
- Form đăng nhập với validation
- Hiển thị thông tin demo
- Xử lý lỗi đăng nhập

#### ChangePassword (`src/components/ChangePassword.tsx`)
- Form đổi mật khẩu với validation
- Kiểm tra mật khẩu cũ
- Tự động logout sau khi đổi mật khẩu thành công

#### ProtectedRoute (`src/components/ProtectedRoute.tsx`)
- Bảo vệ các route cần đăng nhập
- Hiển thị loading spinner khi kiểm tra
- Chuyển hướng đến Login nếu chưa đăng nhập

#### Profile (`src/components/profile.tsx`)
- Hiển thị thông tin user
- Nút đổi mật khẩu
- Nút đăng xuất

### 4. Tích hợp vào Layout
```tsx
// src/components/layout.tsx
<AuthProvider>
  <SnackbarProvider>
    <ZMPRouter>
      <AnimationRoutes>
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>}></Route>
      </AnimationRoutes>
    </ZMPRouter>
  </SnackbarProvider>
</AuthProvider>
```

### 5. Sử dụng trong component
```tsx
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  // Sử dụng thông tin user
  console.log(user?.companyName);
  
  // Kiểm tra trạng thái đăng nhập
  if (!isAuthenticated) return null;
  
  // Logout
  const handleLogout = () => logout();
};
```

## Tính năng bảo mật

### 1. Token Management
- Token được lưu trong localStorage
- Tự động kiểm tra khi khởi động app
- Xóa token khi logout

### 2. Route Protection
- Tất cả route đều được bảo vệ
- Tự động chuyển hướng nếu chưa đăng nhập
- Loading state khi kiểm tra authentication

### 3. Password Validation
- Mật khẩu mới phải có ít nhất 6 ký tự
- Kiểm tra mật khẩu xác nhận
- Không cho phép trùng mật khẩu cũ

## Cấu trúc file
```
src/
├── contexts/
│   └── AuthContext.tsx          # Context quản lý authentication
├── components/
│   ├── Login.tsx                # Component đăng nhập
│   ├── ChangePassword.tsx       # Component đổi mật khẩu
│   ├── ProtectedRoute.tsx       # Component bảo vệ route
│   ├── Profile.tsx              # Component hồ sơ (đã cập nhật)
│   └── ...
└── pages/
    └── index.tsx                # Trang chính (đã tích hợp)
```

## Lưu ý khi phát triển

### 1. API Integration
- Thay thế mock data bằng API calls thật
- Cập nhật AuthContext để gọi API verify token
- Xử lý refresh token nếu cần

### 2. Error Handling
- Thêm xử lý lỗi network
- Thêm retry mechanism
- Thêm offline support

### 3. Security
- Sử dụng HTTPS
- Implement rate limiting
- Thêm 2FA nếu cần

## Chạy dự án
```bash
# Cài đặt dependencies
npm install

# Chạy development server
zmp start

# Build production
zmp build

# Deploy
zmp deploy
```

## Troubleshooting

### Lỗi import path alias
- Kiểm tra `tsconfig.json` và `vite.config.mts`
- Đảm bảo path alias `@/*` được cấu hình đúng

### Lỗi authentication
- Kiểm tra localStorage có token không
- Xem console log để debug
- Kiểm tra AuthContext state

### Lỗi routing
- Đảm bảo ProtectedRoute được wrap đúng
- Kiểm tra ZMPRouter configuration
