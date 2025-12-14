import React, { useState, useEffect } from 'react';
import {
  Typography, Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Tag
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const { userRole } = useAuth(); // Lấy quyền người đang đăng nhập
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // 1. Lấy danh sách nhân viên
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        key: doc.id,
        ...doc.data()
      }));
      setUsers(data);
    });
    return () => unsubscribe();
  }, []);

  // 2. Xử lý Lưu (Cấp quyền / Sửa thông tin)
  const handleFinish = async (values) => {
    try {
      // LOGIC: Chỉ được duy nhất 1 Quản lí
      if (values.role === 'manager') {
        const q = query(collection(db, "users"), where("role", "==", "manager"));
        const querySnapshot = await getDocs(q);
        
        // Nếu đã có ai đó là quản lí rồi, VÀ người đó không phải là người đang được sửa
        if (!querySnapshot.empty) {
          const existingManager = querySnapshot.docs[0];
          if (existingManager.id !== editingUser.id) {
            message.error("Lỗi: Đã có người làm Quản lí rồi! Chỉ được phép có 1.");
            return;
          }
        }
      }

      // LOGIC: Quản lí không được cấp quyền cho người khác lên làm Quản lí
      if (userRole === 'manager' && values.role === 'manager' && editingUser.role !== 'manager') {
         message.error("Quản lí không có quyền tạo thêm Quản lí mới!");
         return;
      }

      await updateDoc(doc(db, 'users', editingUser.id), {
        displayName: values.displayName,
        phone: values.phone,
        password: values.password, // Lưu text để nhớ (không đổi pass đăng nhập thật)
        role: values.role
      });

      message.success("Cập nhật thành công!");
      setIsModalOpen(false);
    } catch (error) {
      message.error("Lỗi: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      message.success("Đã xóa nhân viên");
    } catch (error) { message.error("Lỗi xóa"); }
  };

  const showEditModal = (record) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const columns = [
    { title: 'Tên nhân viên', dataIndex: 'displayName', key: 'displayName' },
    { title: 'Tài khoản', dataIndex: 'email', key: 'email' },
    { title: 'Mật khẩu (Ghi nhớ)', dataIndex: 'password', key: 'password' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { 
      title: 'Chức vụ', 
      dataIndex: 'role', 
      key: 'role',
      render: (role) => {
        let color = role === 'admin' ? 'red' : role === 'manager' ? 'gold' : role === 'employee' ? 'blue' : 'default';
        let text = role === 'admin' ? 'Admin' : role === 'manager' ? 'Quản lí' : role === 'employee' ? 'Nhân viên' : 'Chưa cấp quyền';
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        // Không ai được sửa/xóa Admin trừ chính Admin
        if (record.role === 'admin' && userRole !== 'admin') return null;

        return (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>Sửa</Button>
            {record.role !== 'admin' && (
              <Popconfirm title="Xóa?" onConfirm={() => handleDelete(record.id)}>
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div>
      <Title level={2}>Quản lí Nhân sự</Title>
      <Table columns={columns} dataSource={users} rowKey="id" bordered />

      <Modal
        title="Chỉnh sửa thông tin & Cấp quyền"
        open={isModalVisible}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item label="Tên nhân viên" name="displayName" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Số điện thoại" name="phone"><Input /></Form.Item>
          <Form.Item label="Mật khẩu (Lưu ý)" name="password"><Input /></Form.Item>
          
          <Form.Item label="Chức vụ" name="role" rules={[{ required: true }]}>
            <Select placeholder="Chọn chức vụ">
              {/* Nếu là Admin mới thấy option Manager, hoặc đang là Manager thì thấy chính mình */}
              <Option value="manager" disabled={userRole !== 'admin' && editingUser?.role !== 'manager'}>Quản lí (Chỉ 1 người)</Option>
              <Option value="employee">Nhân viên</Option>
              <Option value={null}>Hủy quyền</Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit" block>Lưu thay đổi</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;