import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'; // Import signOut
import { doc, getDoc } from 'firebase/firestore'; // Import để đọc dữ liệu user
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

const { Title } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Đăng nhập vào Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Lấy thông tin Role từ Firestore để kiểm tra
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      let role = 'unassigned'; // Mặc định nếu không tìm thấy
      if (userDoc.exists()) {
        role = userDoc.data().role || 'unassigned';
      }

      // 3. KIỂM TRA QUYỀN TRUY CẬP
      if (role === 'blocked') {
        await signOut(auth); // Đăng xuất ngay
        setErrorMsg('Tài khoản của bạn đã bị KHÓA. Vui lòng liên hệ Admin.');
        setLoading(false);
        return;
      }

      if (role === 'unassigned') {
        await signOut(auth); // Đăng xuất ngay
        setErrorMsg('Tài khoản CHƯA ĐƯỢC CẤP QUYỀN truy cập. Vui lòng liên hệ Admin duyệt tài khoản.');
        setLoading(false);
        return;
      }

      // 4. Nếu quyền hợp lệ (admin, manager, employee) -> Cho vào
      message.success('Đăng nhập thành công!');
      navigate('/'); 

    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      let msg = "Email hoặc mật khẩu không đúng!";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        msg = "Tài khoản hoặc mật khẩu không chính xác.";
      } else if (error.code === 'auth/too-many-requests') {
        msg = "Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.";
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false); // Chỉ tắt loading nếu có lỗi, còn thành công thì để nó chuyển trang
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', flexDirection: 'column' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>Đăng Nhập</Title>
        
        {errorMsg && <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Vui lòng nhập Email!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              Đăng nhập
            </Button>
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;