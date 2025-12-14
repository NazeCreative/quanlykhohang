import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Import auth và db từ file firebase.js

const { Title } = Typography;

const Register = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    // values là object chứa dữ liệu từ form
    console.log('Received values of form: ', values);
    
    // Chúng ta sẽ dùng email làm phương tiện đăng nhập chính
    // và "username" sẽ là Tên hiển thị (DisplayName)
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email, // Dùng email để đăng ký
        values.password
      );
      
      const user = userCredential.user;

      // Cập nhật Tên hiển thị (DisplayName)
      await updateProfile(user, {
        displayName: values.username,
      });

      // Lưu thông tin (SĐT) vào Firestore
      // Tạo một document trong collection 'users' với ID chính là UID của user
      await setDoc(doc(db, "users", user.uid), {
        username: values.username,
        email: values.email,
        phone: values.phone,
      });

      message.success('Đăng ký thành công!');
      navigate('/login'); // Chuyển hướng về trang đăng nhập

    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      message.error(error.message || 'Đăng ký thất bại, vui lòng thử lại.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>Đăng Ký Tài Khoản</Title>
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          scrollToFirstError
        >
          {/* Yêu cầu của bạn không có Email, nhưng Firebase Auth cần Email
              Chúng ta sẽ dùng Email để đăng nhập, và Username là tên hiển thị
              Vì vậy tôi thêm trường Email ở đây */}
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Vui lòng nhập Email!', type: 'email' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập Username!', whitespace: true }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username (Tên hiển thị)" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng nhập lại Mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Hai mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại Mật khẩu" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            rules={[{ required: true, message: 'Vui lòng nhập Số điện thoại!' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              Đăng ký
            </Button>
            Hoặc <Link to="/login">Đăng nhập ngay!</Link>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Register;