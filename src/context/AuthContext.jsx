import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase'; // Import auth từ file firebase.js
import { Spin } from 'antd'; // Thêm Spin để tạo màn hình loading

// 1. Tạo Context
const AuthContext = createContext();

// 2. Tạo "Nhà cung cấp" (Provider)
// Provider này sẽ bọc toàn bộ ứng dụng của chúng ta
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Thêm trạng thái loading

  // 3. Dùng useEffect để "lắng nghe" trạng thái đăng nhập từ Firebase
  useEffect(() => {
    // onAuthStateChanged sẽ tự động chạy mỗi khi trạng thái đăng nhập thay đổi
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // user sẽ là "null" nếu chưa đăng nhập, hoặc là object "user" nếu đã đăng nhập
      setLoading(false); // Dừng loading khi đã có thông tin user
    });

    // Hủy lắng nghe khi component bị unmount
    return () => {
      unsubscribe();
    };
  }, []); // [] nghĩa là chỉ chạy 1 lần lúc đầu

  // Nếu đang loading, hiển thị màn hình chờ
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 4. Cung cấp "giá trị" (currentUser) cho tất cả component con
  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// 5. Tạo một "hook" tùy chỉnh để dễ dàng lấy thông tin user
// Thay vì phải import useContext và AuthContext ở mọi nơi
// chúng ta chỉ cần gọi useAuth()
export const useAuth = () => {
  return useContext(AuthContext);
};