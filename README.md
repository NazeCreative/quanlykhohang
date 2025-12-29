# 📦 Hệ Thống Web Quản Lý Kho Hàng (Inventory Management System)

> **Đồ án Thực tập Tốt nghiệp** > Ứng dụng web Single Page Application (SPA) hỗ trợ quản lý toàn diện quy trình kho vận, theo dõi tồn kho thời gian thực và phân quyền chặt chẽ.

## 🌟 Giới thiệu

Hệ thống được xây dựng nhằm giải quyết bài toán quản lý kho hàng cho doanh nghiệp vừa và nhỏ. Ứng dụng tập trung vào tính chính xác của số liệu thông qua quy trình phê duyệt 2 bước (Maker - Checker), giao diện trực quan và khả năng báo cáo tức thì.

**Điểm mạnh chính:**
* 🛡️ **Quy trình chặt chẽ:** Cơ chế phê duyệt Nhập/Xuất kho minh bạch.
* 🔐 **Bảo mật cao:** Phân quyền người dùng (RBAC) rõ ràng.
* ⚡ **Real-time:** Cập nhật dữ liệu tồn kho tức thì với Firestore.
* 🎨 **UI/UX hiện đại:** Giao diện Ant Design thân thiện, dễ sử dụng.

---

## 🚀 Tính năng nổi bật

### 1️⃣ Dashboard – Quản lý tổng quan
* Thống kê nhanh tình hình nhập/xuất kho trong ngày/tháng.
* Biểu đồ trực quan (Chart) giúp theo dõi xu hướng kinh doanh và biến động kho.

### 2️⃣ Quản lý Danh mục & Sản phẩm
* **Thông tin chi tiết:** Tên, hình ảnh, giá vốn, giá bán, số lượng tồn.
* **Phân loại:** Quản lý theo Nhà cung cấp, Khách hàng, Đơn vị tính và Danh mục sản phẩm.

### 3️⃣ Quy trình Nhập & Xuất kho (Maker – Checker)
Áp dụng quy trình kiểm soát 2 bước để hạn chế sai sót:

* **Nhập hàng (Purchase Order):**
    `Nhân viên tạo đơn` ➡️ `Quản lý duyệt` ➡️ `Hệ thống tăng tồn kho`
* **Xuất hàng (Invoice):**
    `Nhân viên tạo hóa đơn` ➡️ `Quản lý duyệt` ➡️ `Hệ thống trừ tồn kho`
* **Trạng thái đơn:**
    * ⏳ **Pending:** Chờ duyệt.
    * ✅ **Approved:** Đã duyệt (Hoàn tất).

### 4️⃣ Báo cáo tồn kho thông minh

### 5️⃣ Phân quyền hệ thống (RBAC)

| Vai trò (Role) | Mô tả & Quyền hạn |
| :--- | :--- |
| **🔴 Admin** | Quyền cao nhất. Quản lý tài khoản người dùng (Thêm/Sửa/Xóa/Phân quyền). |
| **🟡 Manager** | Quản lý kho. Phê duyệt đơn nhập/xuất, xem báo cáo thống kê. |
| **🔵 Employee** | Nhân viên kho. Tạo đơn nhập/xuất, nhập dữ liệu cơ bản. |

---

## 🛠️ Công nghệ sử dụng

Dự án được xây dựng trên nền tảng công nghệ hiện đại, tối ưu hiệu năng:

**Frontend:**
* ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) **React.js**
* ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) **Vite** (Build Tool)
* ![Ant Design](https://img.shields.io/badge/Ant%20Design-0170FE?style=flat&logo=antdesign&logoColor=white) **Ant Design** (UI Framework)
* **React Router DOM v6**

**Backend & Database:**
* ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black) **Google Firebase**
* **Firebase Authentication** (Xác thực người dùng)
* **Cloud Firestore** (NoSQL Database - Realtime)

---

## ⚙️ Hướng dẫn cài đặt & Chạy dự án

Thực hiện các bước sau để chạy dự án dưới máy local (Yêu cầu đã cài đặt **Node.js**).

### Bước 1: Clone repository
```bash
git clone [https://github.com/username/quanlykhohang.git](https://github.com/username/quanlykhohang.git)
cd quanlykhohang
```
### Bước 2: Cài đặt thư viện
```bash
npm install
```
### Bước 3: Cấu hình môi trường
Tạo file .env tại thư mục gốc của dự án và điền thông tin cấu hình Firebase của bạn:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
⚠️ Lưu ý: Không public file .env hoặc để lộ API Key lên GitHub.
### Bước 4: Chạy dự án
```bash
npm run dev
```
Truy cập trình duyệt tại đường dẫn: 👉 http://localhost:5173
