import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Table, Modal, Form, Input, message, Popconfirm, Space, Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext'; // Import Auth

const { Title } = Typography;

const Units = () => {
  const { userRole } = useAuth(); // Lấy quyền
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'units'), (snapshot) => {
      const data = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        key: doc.id,
        stt: index + 1,
        ...doc.data(),
      }));
      setUnits(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFinish = async (values) => {
    try {
      if (editingUnit) {
        await updateDoc(doc(db, 'units', editingUnit.id), { name: values.name });
        message.success('Cập nhật thành công!');
      } else {
        await addDoc(collection(db, 'units'), { name: values.name });
        message.success('Thêm mới thành công!');
      }
      closeModal();
    } catch (error) {
      message.error('Lỗi: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'units', id));
      message.success('Xóa thành công!');
    } catch (error) {
      message.error('Lỗi xóa!');
    }
  };

  const showModal = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      form.setFieldsValue({ name: unit.name });
    } else {
      setEditingUnit(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingUnit(null);
    form.resetFields();
  };

  const columns = [
    { title: 'STT', dataIndex: 'stt', key: 'stt', width: 70 },
    { title: 'Tên đơn vị', dataIndex: 'name', key: 'name' },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (_, record) => {
        // Chặn quyền nhân viên
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
        <Title level={2}>Danh sách Đơn vị</Title>
        {/* Chặn quyền nhân viên */}
        {userRole !== 'employee' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Thêm mới
          </Button>
        )}
      </div>

      <Table columns={columns} dataSource={units} loading={loading} bordered />

      <Modal
        title={editingUnit ? 'Sửa đơn vị' : 'Thêm mới đơn vị'}
        open={isModalVisible}
        onCancel={closeModal}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="name" label="Tên đơn vị" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Units;