import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Import auth từ file firebase.js

const { Title } = Typography;

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email, // Đăng nhập bằng email
        values.password
      );
      
      // Đăng nhập thành công
      const user = userCredential.user;
      console.log("Đăng nhập thành công:", user);
      message.success('Đăng nhập thành công!');
      
      // Lưu trạng thái đăng nhập (sẽ làm ở bước sau)
      // Tạm thời chuyển hướng thẳng
      navigate('/'); // Chuyển về trang chủ (Dashboard)

    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      message.error('Email hoặc Mật khẩu không đúng.');
    }
  };

  return (
    // Bạn yêu cầu background là màu, không phải hình
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#2d3748' /* Đây là một màu nền tối */ }}>
      <Card style={{ width: 400 }}>
        {/* Bạn có thể thêm logo "UPCUBE" ở đây */}
        <Title level={3} style={{ textAlign: 'center' }}>Sign In</Title>
        <Form
          name="login"
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Vui lòng nhập Email!' }]}
          >
            {/* Chúng ta dùng Email thay cho Username để đăng nhập */}
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          
          <Form.Item>
            <a href="#">Forgot your password?</a>
            <Link to="/register" style={{ float: 'right' }}>
              Create an account
            </Link>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%', background: '#00B894', borderColor: '#00B894' }}>
              Log In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;