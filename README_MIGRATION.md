# Hướng dẫn chuyển đổi code từ myapp2 sang xac_nhan_dh

## Tổng quan
Project `xac_nhan_dh` đã được cập nhật để sử dụng code từ `myapp2` với các thay đổi chính sau:

## Các thay đổi chính

### 1. API Service
- **Thêm thư mục**: `src/services/`
- **File mới**: `src/services/api.ts` - Chứa toàn bộ logic gọi API Dynamics 365 CRM
- **Chức năng**:
  - Xác thực nhà cung cấp
  - Lấy thông tin profile
  - Lấy danh sách đơn hàng
  - Lấy chi tiết đơn hàng
  - Cập nhật/xác nhận đơn hàng
  - Từ chối đơn hàng
  - Đổi mật khẩu

### 2. Components được cập nhật

#### Login Component (`src/components/Login.tsx`)
- Sử dụng API service thay vì mock data
- Xác thực qua Dynamics 365 CRM
- Xử lý lỗi đăng nhập

#### Order Components
- **OrderCard** (`src/components/order-card.tsx`): Hiển thị thông tin đơn hàng với cấu trúc API
- **OrderDetail** (`src/components/order-detail.tsx`): Chi tiết đơn hàng với chức năng xác nhận/từ chối

#### Profile Component (`src/components/profile.tsx`)
- Lấy thông tin nhà cung cấp từ API
- Chức năng đổi mật khẩu
- Thống kê đơn hàng

#### ChangePassword Component (`src/components/ChangePassword.tsx`)
- Modal đổi mật khẩu
- Validation form
- Gọi API đổi mật khẩu

### 3. Pages được cập nhật

#### Main Page (`src/pages/index.tsx`)
- Quản lý state đăng nhập
- Fetch dữ liệu từ API
- Xử lý các chức năng CRUD đơn hàng
- Filter và search đơn hàng

### 4. Layout được đơn giản hóa

#### Layout Component (`src/components/layout.tsx`)
- Loại bỏ AuthProvider và ProtectedRoute
- Sử dụng HomePage trực tiếp
- Quản lý authentication trong component

## Cấu trúc dữ liệu API

### Supplier Interface
```typescript
interface Supplier {
  crdfd_supplierid: string;
  crdfd_suppliername: string;
  crdfd_misaname: string;
  crdfd_supplierphone: string;
  crdfd_password: string;
}
```

### Order Interface
```typescript
interface Order {
  crdfd_orderid: string;
  crdfd_ordernumber: string;
  crdfd_customername: string;
  crdfd_customerphone: string;
  crdfd_customeraddress: string;
  crdfd_orderdate: string;
  crdfd_requesteddeliverydate: string;
  crdfd_status: 'pending' | 'confirmed' | 'rejected';
  crdfd_totalamount: number;
  crdfd_suppliernotes: string;
  items?: OrderItem[];
}
```

### OrderItem Interface
```typescript
interface OrderItem {
  crdfd_orderitemid: string;
  crdfd_productname: string;
  crdfd_requestedquantity: number;
  crdfd_confirmedquantity: number;
  crdfd_unitprice: number;
  crdfd_unit: string;
  crdfd_notes: string;
  crdfd_deliverydate: string;
}
```

## Cấu hình API

### Endpoints
- **Base URL**: `https://wecare-ii.crm5.dynamics.com/api/data/v9.2`
- **Access Token URL**: Azure Logic App endpoint
- **Authentication**: Bearer token từ Azure Logic App

### Các API chính
1. **Xác thực**: `authenticateSupplier(phone, password)`
2. **Profile**: `getSupplierProfile(supplierId)`
3. **Orders**: `getSupplierOrders(supplierId)`
4. **Order Details**: `getOrderDetails(orderId)`
5. **Update Order**: `updateOrder(orderId, items, notes)`
6. **Reject Order**: `rejectOrder(orderId, reason)`
7. **Change Password**: `changePassword(supplierId, newPassword)`

## Cách sử dụng

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy development server
```bash
npm run dev
```

### 3. Build production
```bash
npm run build
```

## Lưu ý quan trọng

1. **Authentication**: Hệ thống sử dụng xác thực qua Dynamics 365 CRM
2. **Error Handling**: Tất cả API calls đều có error handling
3. **State Management**: Sử dụng React hooks để quản lý state
4. **TypeScript**: Toàn bộ code được viết bằng TypeScript với type safety
5. **Responsive Design**: UI được thiết kế responsive cho mobile

## Files đã xóa
- `src/contexts/AuthContext.tsx` - Không còn cần thiết
- `src/components/ProtectedRoute.tsx` - Không còn cần thiết

## Files đã thêm
- `src/services/api.ts` - API service mới
- `README_MIGRATION.md` - File hướng dẫn này

## Troubleshooting

### Lỗi thường gặp
1. **API Connection Error**: Kiểm tra kết nối internet và endpoint URLs
2. **Authentication Error**: Kiểm tra thông tin đăng nhập
3. **TypeScript Errors**: Chạy `npm run type-check` để kiểm tra types

### Debug
- Sử dụng browser developer tools để xem network requests
- Kiểm tra console logs để debug API calls
- Sử dụng React Developer Tools để debug component state
