import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    
    try {
      // Hàm có sẵn của Firebase để gửi email reset
      await sendPasswordResetEmail(auth, values.email);
      setSuccessMsg('Link đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra email (cả mục Spam/Rác).');
    } catch (error) {
      console.error("Lỗi gửi email:", error);
      let msg = "Lỗi: " + error.message;
      
      // Vietsub các lỗi phổ biến
      if (error.code === 'auth/user-not-found') {
        msg = "Email này chưa được đăng ký trong hệ thống.";
      } else if (error.code === 'auth/invalid-email') {
        msg = "Email không đúng định dạng.";
      }
      
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', flexDirection: 'column' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>Quên Mật Khẩu</Title>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <Text type="secondary">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</Text>
        </div>

        {errorMsg && <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16 }} />}
        {successMsg && <Alert message={successMsg} type="success" showIcon style={{ marginBottom: 16 }} />}

        <Form
          name="forgot_password"
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[
                { required: true, message: 'Vui lòng nhập Email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập Email của bạn" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading} size="large">
              Gửi yêu cầu
            </Button>
            <div style={{ marginTop: 15, textAlign: 'center' }}>
              <Link to="/login"> <ArrowLeftOutlined /> Quay lại Đăng nhập</Link>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ForgotPassword;