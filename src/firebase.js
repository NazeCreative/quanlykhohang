// Import các hàm cần thiết
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Thay thế bằng config dự án của bạn
const firebaseConfig = {
  apiKey: "AIzaSyAT_JuTgcap2T3rCvlIZG4vvQMB89RjCkg",
  authDomain: "quanlykhohang-cf30d.firebaseapp.com",
  projectId: "quanlykhohang-cf30d",
  storageBucket: "quanlykhohang-cf30d.firebasestorage.app",
  messagingSenderId: "217485695589",
  appId: "1:217485695589:web:30b2fe710e4d9c9028c48c"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Export các dịch vụ bạn sẽ dùng
// db: Dùng cho cơ sở dữ liệu Firestore
// auth: Dùng cho việc Đăng nhập/Đăng ký
export const auth = getAuth(app);
export const db = getFirestore(app);