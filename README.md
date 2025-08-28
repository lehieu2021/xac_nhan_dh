# Ứng dụng Xác nhận Đơn hàng - NCC

Ứng dụng Zalo Mini App cho phép Nhà Cung Cấp (NCC) xác nhận hoặc từ chối đơn hàng từ hệ thống.

## 🚀 Tính năng chính

### ✅ Đã hoàn thành:
- **Đăng nhập/Đăng xuất** với mã NCC
- **Xem danh sách đơn hàng** chưa xác nhận
- **Xác nhận đơn hàng** với số lượng và ngày giao
- **Từ chối đơn hàng** với lý do bắt buộc
- **Validation** số lượng và ngày giao
- **Toast notifications** cho thông báo
- **Responsive design** cho mobile

### 🎯 Chức năng từ chối đơn hàng:
- **Input lý do từ chối** bắt buộc
- **Validation** real-time
- **Dialog xác nhận** trước khi từ chối
- **Lưu lý do vào DB** (field `crdfd_ghi_chu_ncc`)
- **Nút từ chối màu đỏ** với disable state
- **Thông báo thành công** với lý do đã nhập

## 🛠️ Công nghệ sử dụng

- **React 18** + **TypeScript**
- **ZMP UI** (Zalo Mini Program UI)
- **Tailwind CSS** cho styling
- **Dynamics 365 CRM** API
- **Azure Logic Apps** cho authentication

## 📱 Cách sử dụng

1. **Đăng nhập** với mã NCC
2. **Xem danh sách** đơn hàng chưa xác nhận
3. **Nhập số lượng** và **ngày giao** (nếu xác nhận)
4. **Nhập lý do từ chối** (nếu từ chối)
5. **Click nút** "Xác nhận" hoặc "Từ chối"

## 🔧 Cài đặt và chạy

```bash
# Cài đặt dependencies
npm install

# Chạy dev server
npm run dev

# Deploy lên Zalo
npm run deploy
```

## 📊 Trạng thái đơn hàng

- **191920000**: Chưa xác nhận
- **191920001**: Đã xác nhận  
- **191920002**: Từ chối nhận đơn

## 🗄️ Database Fields

- `crdfd_ncc_nhan_don`: Trạng thái NCC nhận đơn
- `crdfd_ngay_xac_nhan_ncc`: Ngày giờ xác nhận/từ chối
- `crdfd_ghi_chu_ncc`: Lý do từ chối từ NCC
- `crdfd_xac_nhan_so_luong_ncc`: Số lượng đã xác nhận
- `crdfd_xac_nhan_ngay_giao_ncc`: Ngày giao đã xác nhận

## 🎨 UI/UX Features

- **Modern design** với Tailwind CSS
- **Real-time validation** với visual feedback
- **Loading states** và error handling
- **Toast notifications** cho user feedback
- **Responsive layout** cho mobile devices
- **Accessibility** với proper ARIA labels

## 🔒 Security

- **Azure AD authentication** thông qua Logic Apps
- **Token-based API calls** với automatic refresh
- **Input validation** và sanitization
- **Error handling** không expose sensitive data

## 📝 Changelog

### v1.0.0 (Latest)
- ✅ Hoàn thành chức năng từ chối đơn hàng
- ✅ Thêm validation lý do từ chối bắt buộc
- ✅ Cải thiện UI với nút từ chối màu đỏ
- ✅ Fix TypeScript errors
- ✅ Dọn dẹp code và file không cần thiết

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

UNLICENSED - Private project
