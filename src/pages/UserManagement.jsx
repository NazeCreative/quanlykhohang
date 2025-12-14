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
  const { userRole } = useAuth(); 
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

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

  const handleFinish = async (values) => {
    try {
      // Logic kiểm tra chỉ có 1 manager
      if (values.role === 'manager') {
        const q = query(collection(db, "users"), where("role", "==", "manager"));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const existingManager = querySnapshot.docs[0];
          if (existingManager.id !== editingUser.id) {
            message.error("Lỗi: Đã có người làm Quản lí rồi! Chỉ được phép có 1.");
            return;
          }
        }
      }

      if (userRole === 'manager' && values.role === 'manager' && editingUser.role !== 'manager') {
         message.error("Quản lí không có quyền tạo thêm Quản lí mới!");
         return;
      }

      await updateDoc(doc(db, 'users', editingUser.id), {
        displayName: values.displayName,
        phone: values.phone,
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
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { 
      title: 'Chức vụ', 
      dataIndex: 'role', 
      key: 'role',
      render: (role) => {
        let color = 'default';
        let text = 'Chưa cấp quyền';
        
        switch(role) {
            case 'admin': color = 'red'; text = 'Admin'; break;
            case 'manager': color = 'gold'; text = 'Quản lí'; break;
            case 'employee': color = 'blue'; text = 'Nhân viên'; break;
            case 'blocked': color = 'volcano'; text = 'Đã khóa'; break;
            case 'unassigned': color = 'default'; text = 'Chưa cấp quyền'; break;
            default: color = 'default'; text = 'Chưa cấp quyền';
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        if (record.role === 'admin') return <Tag>Admin</Tag>;
        return (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>Cấp quyền</Button>
            <Popconfirm title="Xóa tài khoản này?" onConfirm={() => handleDelete(record.id)}>
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={2}>Quản lí Nhân sự & Phân quyền</Title>
        <span style={{ color: '#888' }}>* Tài khoản mới đăng ký sẽ hiển thị "Chưa cấp quyền". Hãy bấm "Cấp quyền" để cho phép họ truy cập.</span>
      </div>
      
      <Table columns={columns} dataSource={users} rowKey="id" bordered />

      <Modal
        title="Cấp quyền / Chỉnh sửa User"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item label="Tên nhân viên" name="displayName" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Số điện thoại" name="phone"><Input /></Form.Item>
          
          <Form.Item label="Chức vụ & Trạng thái" name="role" rules={[{ required: true }]}>
            <Select placeholder="Chọn trạng thái">
              <Option value="unassigned">⛔ Chưa cấp quyền (Không cho đăng nhập)</Option>
              <Option value="employee">🔵 Nhân viên (Được xem & thao tác hạn chế)</Option>
              <Option value="manager" disabled={userRole !== 'admin'}>🟡 Quản lí (Full quyền trừ Admin)</Option>
              <Option value="blocked">🔒 Khóa tài khoản (Cấm truy cập)</Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit" block>Lưu thay đổi</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;