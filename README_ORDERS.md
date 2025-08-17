# 📦 Trang Đơn hàng - Hướng dẫn sử dụng

## 🎯 Tổng quan
Trang "Đơn hàng" mới được tích hợp với API Dynamics CRM để hiển thị danh sách đơn hàng từ bảng `crdfd_kehoachhangve_drafts`.

## 🔗 API Endpoint
```
GET https://wecare-ii.crm5.dynamics.com/api/data/v9.2/crdfd_kehoachhangve_drafts
```

### Query Parameters:
- `$select`: Chọn các trường cần thiết
- `$top=10`: Giới hạn 10 bản ghi
- `$filter`: Lọc theo điều kiện
  - `statecode eq 0`: Chỉ lấy bản ghi active
  - `crdfd_trang_thai eq 191920000`: Trạng thái cụ thể
  - `crdfd_mancc eq '{supplierCode}'`: Lọc theo mã NCC đã đăng nhập

## 📊 Cấu trúc dữ liệu

### Interface DraftOrder
```typescript
interface DraftOrder {
  crdfd_kehoachhangve_draftid: string;  // ID đơn hàng
  cr1bb_tensanpham: string;            // Tên sản phẩm
  cr1bb_onvical: string;               // Đơn vị tính
  crdfd_soluong: number;               // Số lượng
  crdfd_gia: number;                   // Đơn giá
  cr1bb_ngaygiaodukien: string;        // Ngày giao dự kiến
  crdfd_mancc: string;                 // Mã NCC
}
```

## 🎨 Tính năng chính

### 1. **Thống kê tổng quan**
- Tổng số đơn hàng
- Số đơn sắp đến hạn (≤ 3 ngày)
- Số đơn quá hạn

### 2. **Tìm kiếm**
- Tìm kiếm theo tên sản phẩm
- Tìm kiếm real-time

### 3. **Hiển thị trạng thái**
- **Đúng hạn**: Màu xanh
- **Sắp đến hạn** (≤ 3 ngày): Màu vàng
- **Quá hạn**: Màu đỏ

### 4. **Thông tin chi tiết**
- Tên sản phẩm và mã đơn hàng
- Số lượng và đơn vị tính
- Đơn giá và tổng tiền
- Ngày giao dự kiến

### 5. **Actions**
- Nút "Xác nhận" đơn hàng
- Nút "Chi tiết" để xem thêm thông tin

## 🔧 Cách sử dụng

### 1. **Truy cập trang**
- Đăng nhập vào hệ thống
- Chọn tab "Đơn hàng" ở bottom navigation
- Hoặc nhấn "Xem tất cả đơn hàng" từ trang chủ

### 2. **Lọc và tìm kiếm**
- Sử dụng ô tìm kiếm để tìm sản phẩm
- Dữ liệu được lọc tự động theo mã NCC đã đăng nhập

### 3. **Xử lý đơn hàng**
- Nhấn "Xác nhận" để xác nhận đơn hàng
- Nhấn "Chi tiết" để xem thông tin chi tiết

## 🚀 Tích hợp

### 1. **API Service**
```typescript
// Thêm vào apiService
async getDraftOrders(supplierCode: string): Promise<DraftOrder[]>
```

### 2. **Component**
```typescript
// Sử dụng component
<OrdersPage 
  supplierCode={userInfo?.cr44a_manhacungcap || ""}
  onBack={() => setCurrentView('home')}
/>
```

## 📱 Responsive Design
- Tối ưu cho mobile
- Card layout dễ đọc
- Loading states và error handling
- Pull-to-refresh functionality

## 🔒 Bảo mật
- Chỉ hiển thị đơn hàng của NCC đã đăng nhập
- Filter được áp dụng ở API level
- Token authentication required

## 🐛 Troubleshooting

### Lỗi thường gặp:
1. **Không hiển thị đơn hàng**: Kiểm tra mã NCC và quyền truy cập
2. **Lỗi API**: Kiểm tra token và kết nối mạng
3. **Dữ liệu không cập nhật**: Nhấn nút refresh

### Debug:
- Kiểm tra console logs
- Verify API response format
- Confirm supplier code mapping
