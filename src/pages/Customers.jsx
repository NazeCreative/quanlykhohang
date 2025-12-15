import React, { useState, useEffect } from "react";
import {
  Typography, Button, Table, Modal, Form, Input, message, Popconfirm, Space, Tag
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext"; 

const { Title } = Typography;

const Customers = () => {
  const { userRole } = useAuth(); 
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "customers"), (snapshot) => {
      const data = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        key: doc.id,
        stt: index + 1,
        ...doc.data(),
      }));
      setCustomers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFinish = async (values) => {
    try {
      if (editingCustomer) {
        await updateDoc(doc(db, "customers", editingCustomer.id), values);
        message.success("Cập nhật thành công!");
      } else {
        // Nhân viên được phép thêm
        await addDoc(collection(db, "customers"), values);
        message.success("Thêm mới thành công!");
      }
      closeModal();
    } catch (error) {
      message.error("Lỗi: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "customers", id));
      message.success("Xóa thành công!");
    } catch (error) {
      message.error("Lỗi xóa!");
    }
  };

  const showModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      form.setFieldsValue(customer);
    } else {
      setEditingCustomer(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingCustomer(null);
    form.resetFields();
  };

  const columns = [
    { title: "STT", dataIndex: "stt", key: "stt", width: 70 },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Địa chỉ", dataIndex: "address", key: "address" },
    {
      title: "Action",
      key: "action",
      width: 150,
      render: (_, record) => {
        // Vẫn chặn Sửa/Xóa đối với nhân viên
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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={2}>Danh sách Khách hàng</Title>
        {/* ĐÃ SỬA: Luôn hiện nút Thêm mới cho tất cả mọi người */}
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          Thêm mới
        </Button>
      </div>

      <Table columns={columns} dataSource={customers} loading={loading} bordered />

      <Modal
        title={editingCustomer ? "Sửa khách hàng" : "Thêm khách hàng"}
        open={isModalVisible}
        onCancel={closeModal}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
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

export default Customers;