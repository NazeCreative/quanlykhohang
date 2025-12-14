import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd';
import { LockOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; 

const { Title } = Typography;

const Register = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      // 1. Tạo user bên Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Cập nhật tên hiển thị
      await updateProfile(user, { displayName: values.username });

      // 3. Lưu vào Firestore
      // === QUAN TRỌNG: Mặc định là 'unassigned' (Chưa cấp quyền) ===
      await setDoc(doc(db, "users", user.uid), {
        displayName: values.username,
        email: values.email,
        phone: values.phone,
        role: 'unassigned', // <--- ĐỔI TỪ 'employee' THÀNH 'unassigned'
        createdAt: new Date().toISOString()
      });

      message.success('Đăng ký thành công! Vui lòng chờ Admin cấp quyền để đăng nhập.');
      setTimeout(() => navigate('/login'), 2000);

    } catch (error) {
      console.error("Lỗi chi tiết:", error);
      let msg = "Lỗi không xác định: " + error.message;
      if (error.code === 'auth/email-already-in-use') msg = "Email này đã được đăng ký rồi.";
      else if (error.code === 'auth/weak-password') msg = "Mật khẩu quá yếu (cần ít nhất 6 ký tự).";
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', flexDirection: 'column' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>Đăng Ký Tài Khoản</Title>
        {errorMsg && <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form form={form} name="register" onFinish={onFinish} scrollToFirstError>
          <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập Email!', type: 'email' }]}>
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập Tên hiển thị!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Tên hiển thị (Họ Tên)" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>
          <Form.Item name="confirm" dependencies={['password']} rules={[
              { required: true, message: 'Vui lòng nhập lại Mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Mật khẩu không khớp!'));
                },
              }),
            ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại Mật khẩu" />
          </Form.Item>
          <Form.Item name="phone" rules={[{ required: true, message: 'Vui lòng nhập SĐT!' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              Đăng ký
            </Button>
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              Hoặc <Link to="/login">Đăng nhập ngay!</Link>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Register;