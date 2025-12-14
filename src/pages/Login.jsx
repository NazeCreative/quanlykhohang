import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
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
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Kiểm tra quyền
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let role = 'unassigned';
      if (userDoc.exists()) {
        role = userDoc.data().role || 'unassigned';
      }

      if (role === 'blocked') {
        await signOut(auth);
        setErrorMsg('Tài khoản của bạn đã bị KHÓA. Vui lòng liên hệ Admin.');
        setLoading(false);
        return;
      }

      if (role === 'unassigned') {
        await signOut(auth);
        setErrorMsg('Tài khoản CHƯA ĐƯỢC CẤP QUYỀN truy cập. Vui lòng liên hệ Admin.');
        setLoading(false);
        return;
      }

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
      setLoading(false);
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
            <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
          </Form.Item>

          {/* --- THÊM LINK QUÊN MẬT KHẨU --- */}
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <Link to="/forgot-password" style={{ color: '#1890ff' }}>Quên mật khẩu?</Link>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading} size="large">
              Đăng nhập
            </Button>
            <div style={{ marginTop: 15, textAlign: 'center' }}>
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;