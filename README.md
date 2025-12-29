📦 Hệ Thống Web Quản Lý Kho Hàng

Inventory Management System

Đồ án Thực tập Tốt nghiệp
Ứng dụng web quản lý kho hàng trực tuyến, hỗ trợ quy trình nhập/xuất kho có phê duyệt, theo dõi tồn kho thời gian thực và phân quyền người dùng rõ ràng.

🌟 Giới thiệu

Hệ thống là một Single Page Application (SPA) giúp doanh nghiệp quản lý toàn diện hoạt động kho vận.
Ứng dụng tập trung vào:

Quy trình nhập/xuất kho chặt chẽ

Bảo mật và phân quyền người dùng

Giao diện hiện đại, dễ sử dụng

🚀 Tính năng nổi bật
1️⃣ Dashboard – Quản lý tổng quan

Thống kê nhanh tình hình nhập/xuất kho

Biểu đồ trực quan giúp theo dõi xu hướng kinh doanh

2️⃣ Quản lý Danh mục & Sản phẩm

Sản phẩm:

Tên sản phẩm

Hình ảnh

Giá vốn, giá bán

Số lượng tồn kho

Danh mục & Thuộc tính:

Nhà cung cấp

Khách hàng

Đơn vị tính

Danh mục sản phẩm

3️⃣ Quy trình Nhập & Xuất kho (Maker – Checker)

Áp dụng quy trình kiểm soát 2 bước nhằm hạn chế sai sót:

Nhập hàng (Purchase Order)
Nhân viên tạo đơn → Quản lý duyệt → Tăng tồn kho

Xuất hàng (Invoice)
Nhân viên tạo hóa đơn → Quản lý duyệt → Trừ tồn kho

Trạng thái đơn hàng:

⏳ Pending (Chờ duyệt)

✅ Approved (Đã duyệt)

4️⃣ Báo cáo tồn kho thông minh (Real-time)

Theo dõi tồn kho thời gian thực

Cảnh báo trực quan bằng màu sắc:

🟢 Xanh: Tồn kho an toàn (> 20)

🟡 Vàng: Tồn kho thấp (10 – 20)

🔴 Đỏ: Nguy hiểm (< 10)

Hỗ trợ in báo cáo trực tiếp từ trình duyệt

5️⃣ Quản trị hệ thống & Phân quyền (RBAC)

Hệ thống phân quyền theo vai trò:

🔴 Admin

Quyền cao nhất

Quản lý tài khoản người dùng

Truy cập toàn bộ chức năng

🟡 Manager (Quản lý)

Phê duyệt đơn nhập/xuất

Xem báo cáo

Giới hạn: chỉ 1 Manager trong hệ thống

🔵 Employee (Nhân viên)

Tạo đơn nhập/xuất

Nhập dữ liệu cơ bản

🛠️ Công nghệ sử dụng

Frontend:

React.js

Vite (Build Tool)

UI Framework:

Ant Design (Antd)

Routing:

React Router DOM v6

Backend & Database:

Google Firebase

Firebase Authentication

Firestore (NoSQL – Real-time)

⚙️ Hướng dẫn cài đặt & chạy dự án
🔹 Bước 1: Clone repository
git clone https://github.com/username/quanlykhohang.git
cd quanlykhohang

🔹 Bước 2: Cài đặt thư viện

Yêu cầu: đã cài Node.js

npm install

🔹 Bước 3: Cấu hình môi trường

Tạo file .env tại thư mục gốc và điền thông tin Firebase:

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id


⚠️ Lưu ý: Không public file .env lên GitHub.

🔹 Bước 4: Chạy dự án
npm run dev


Truy cập trình duyệt tại:
👉 http://localhost:5173
