# 📦 Hệ Thống Web Quản Lý Kho Hàng (Inventory Management System)

> **Đồ án Thực tập Tốt nghiệp**
>
> Xây dựng hệ thống quản lý kho hàng trực tuyến hiện đại, hỗ trợ quy trình nhập/xuất kho chặt chẽ, báo cáo tồn kho thời gian thực và phân quyền người dùng chi tiết.

## 🌟 Giới thiệu

Dự án là một ứng dụng web (Single Page Application - SPA) giúp doanh nghiệp quản lý toàn diện quy trình kho vận. Hệ thống tập trung vào tính bảo mật, quy trình phê duyệt đơn hàng minh bạch và giao diện người dùng thân thiện.

---

## 🚀 Tính năng nổi bật

### 1. Quản lý Tổng quan (Dashboard)
- Hiển thị thống kê nhanh về tình hình kinh doanh và kho bãi.
- Biểu đồ trực quan giúp nắm bắt xu hướng nhập/xuất.

### 2. Quản lý Danh mục & Sản phẩm
- **Sản phẩm:** Quản lý thông tin chi tiết, hình ảnh, giá vốn, giá bán.
- **Thuộc tính:** Quản lý Nhà cung cấp, Khách hàng, Đơn vị tính, Danh mục sản phẩm.

### 3. Quy trình Nhập & Xuất (Có phê duyệt)
Hệ thống áp dụng quy trình kiểm soát chặt chẽ "Maker - Checker":
- **Nhập hàng (Purchase):** Nhân viên tạo đơn nhập -> Quản lý duyệt -> Tăng tồn kho.
- **Xuất hàng (Invoice):** Nhân viên tạo hóa đơn -> Quản lý duyệt -> Trừ tồn kho.
- **Trạng thái:** Theo dõi đơn hàng qua các trạng thái: *Chờ duyệt (Pending)* và *Đã duyệt*.

### 4. Báo cáo Tồn kho Thông minh
- Theo dõi số lượng tồn kho theo thời gian thực (Real-time).
- Hỗ trợ in ấn báo cáo trực tiếp.

### 5. Quản trị Hệ thống & Phân quyền (RBAC)
Hệ thống phân quyền chi tiết 3 cấp độ bảo mật:
- 🔴 **Admin:** Quyền cao nhất, quản lý tài khoản nhân viên, truy cập mọi chức năng.
- 🟡 **Manager (Quản lí):** Phê duyệt đơn hàng, xem báo cáo (Giới hạn duy nhất 1 Quản lí trong hệ thống).
- 🔵 **Employee (Nhân viên):** Thực hiện thao tác nhập liệu, tạo đơn hàng.

---

## 🛠️ Công nghệ sử dụng

- **Frontend:** [React.js](https://reactjs.org/) (Vite Build Tool) - Tốc độ cao.
- **UI Library:** [Ant Design (Antd)](https://ant.design/) - Giao diện chuyên nghiệp, UX tốt.
- **Routing:** React Router DOM v6.
- **Backend / Database:** [Google Firebase](https://firebase.google.com/)
    - **Authentication:** Đăng nhập/Đăng ký bảo mật.
    - **Firestore:** Cơ sở dữ liệu NoSQL thời gian thực.

---

## ⚙️ Hướng dẫn Cài đặt & Chạy dự án

### Bước 1: Clone dự án
```bash
git clone [https://github.com/username/quanlykhohang.git](https://github.com/username/quanlykhohang.git)
cd quanlykhohang
### Bước 2: Cài đặt thư viện
Yêu cầu máy tính đã cài đặt Node.js.
