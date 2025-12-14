import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Table, Modal, Form, Input, message, Popconfirm, Space, Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext'; // Import Auth

const { Title } = Typography;

const Suppliers = () => {
  const { userRole } = useAuth(); // Lấy quyền user
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      const data = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        key: doc.id,
        stt: index + 1,
        ...doc.data(),
      }));
      setSuppliers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFinish = async (values) => {
    try {
      if (editingSupplier) {
        await updateDoc(doc(db, 'suppliers', editingSupplier.id), values);
        message.success('Cập nhật thành công!');
      } else {
        await addDoc(collection(db, 'suppliers'), values);
        message.success('Thêm mới thành công!');
      }
      closeModal();
    } catch (error) {
      message.error('Lỗi: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
      message.success('Xóa thành công!');
    } catch (error) {
      message.error('Lỗi xóa!');
    }
  };

  const showModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      form.setFieldsValue(supplier);
    } else {
      setEditingSupplier(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingSupplier(null);
    form.resetFields();
  };

  const columns = [
    { title: 'STT', dataIndex: 'stt', key: 'stt', width: 70 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Mobile Number', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (_, record) => {
        // Nếu là nhân viên thì không hiện nút Sửa/Xóa
        if (userRole === 'employee') return <Tag color="default">Chỉ xem</Tag>;

        return (
          <Space size="middle">
            <Button type="primary" icon={<EditOutlined />} onClick={() => showModal(record)} />
            <Popconfirm title="Xóa?" onConfirm={() => handleDelete(record.id)}>
              <Button type="primary" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Danh sách Nhà cung cấp</Title>
        {/* Chỉ hiện nút Thêm nếu KHÔNG phải là nhân viên */}
        {userRole !== 'employee' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Thêm mới
          </Button>
        )}
      </div>

      <Table columns={columns} dataSource={suppliers} loading={loading} bordered />

      <Modal
        title={editingSupplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
        open={isModalVisible}
        onCancel={closeModal}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="name" label="Tên nhà cung cấp" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Suppliers;