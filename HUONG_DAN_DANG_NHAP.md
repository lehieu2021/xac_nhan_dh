# Hướng Dẫn Đăng Nhập Hệ Thống Wecare

## 🔐 **Thông Tin Đăng Nhập**

### **Chế Độ Production (Khuyến nghị):**
- **Số điện thoại:** Số điện thoại đã đăng ký trong hệ thống Wecare
- **Mật khẩu:** 
  - **Tài khoản mới:** Sử dụng mật khẩu mặc định `Wecare`
  - **Tài khoản cũ:** Mật khẩu đã được cấp từ admin hệ thống

### **Chế Độ Test (Chỉ để demo):**
- **Số điện thoại:** `0123456789`
- **Mật khẩu:** `123456`

## 📱 **Cách Đăng Nhập**

### **Bước 1: Mở ứng dụng**
- Chạy lệnh: `npm run dev` hoặc `npm start`
- Mở trình duyệt và truy cập ứng dụng

### **Bước 2: Chọn chế độ**
- **🌐 Chế độ Production:** Để đăng nhập với thông tin thật
- **🔧 Chế độ Test:** Để demo với dữ liệu mẫu

### **Bước 3: Nhập thông tin**
- **Số điện thoại:** Nhập số điện thoại đã đăng ký
- **Mật khẩu:** 
  - Nếu là tài khoản mới: Nhập `Wecare`
  - Nếu là tài khoản cũ: Nhập mật khẩu đã có

### **Bước 4: Đăng nhập**
- Click nút "Đăng nhập"
- Hệ thống sẽ xác thực với Dynamics 365 CRM

## ⚠️ **Lưu Ý Quan Trọng**

### **Đối với Tài Khoản Mới:**
- **Password mặc định:** `Wecare`
- **Lưu ý:** Sau khi đăng nhập lần đầu, vui lòng đổi mật khẩu trong phần Hồ sơ
- **Hệ thống sẽ tự động cập nhật** password mặc định vào database
- **Mã NCC:** Sử dụng cột `cr44a_manhacungcap` thay vì ID của table

### **Đối với Tài Khoản Cũ:**
- Số điện thoại phải tồn tại trong bảng `crdfd_suppliers`
- Mật khẩu phải khớp với cột `crdfd_password` trong database
- **Mã NCC:** Sử dụng cột `cr44a_manhacungcap` để query đơn hàng
- Hệ thống sẽ kết nối trực tiếp với API Dynamics 365

### **Đối với Test:**
- Sử dụng dữ liệu mẫu có sẵn
- Không cần kết nối internet
- Chỉ để demo và test giao diện

## 🔍 **Troubleshooting**

### **Lỗi "Không tìm thấy nhà cung cấp":**
- Kiểm tra số điện thoại có đúng không
- Số điện thoại phải tồn tại trong hệ thống

### **Lỗi "Tài khoản mới cần sử dụng mật khẩu mặc định Wecare":**
- Đây là tài khoản mới với password = null
- Sử dụng mật khẩu mặc định: `Wecare`

### **Lỗi "Mật khẩu không chính xác":**
- Kiểm tra mật khẩu có đúng không
- Mật khẩu phải khớp với database hoặc là `Wecare` cho tài khoản mới

### **Lỗi kết nối:**
- Kiểm tra internet connection
- Kiểm tra API Dynamics 365 có hoạt động không

## 🔄 **Đổi Mật Khẩu**

### **Sau khi đăng nhập thành công:**
1. Vào phần **Hồ sơ** (Profile)
2. Click **"Đổi mật khẩu"**
3. Nhập mật khẩu mới
4. Xác nhận mật khẩu mới
5. Click **"Lưu"**

### **Lưu ý:**
- Mật khẩu mới sẽ được lưu vào database
- Lần sau đăng nhập sẽ sử dụng mật khẩu mới
- Không thể quay lại sử dụng `Wecare`

## 📞 **Hỗ Trợ**

Nếu gặp vấn đề, vui lòng liên hệ:
- **Admin hệ thống:** Để được cấp tài khoản
- **IT Support:** Để được hỗ trợ kỹ thuật

---

**© 2024 Wecare - Hệ thống quản lý đơn hàng nhà cung cấp**
