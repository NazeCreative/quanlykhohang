import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase'; // Import db từ file firebase.js

const { Title } = Typography;

const Suppliers = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null); // Lưu nhà cung cấp đang sửa
  const [suppliers, setSuppliers] = useState([]); // Lưu danh sách NCC
  const [loading, setLoading] = useState(false);

  // === READ (ĐỌC DỮ LIỆU) ===
  useEffect(() => {
    setLoading(true);
    // Tên collection là 'suppliers'
    const suppliersCollectionRef = collection(db, 'suppliers');

    const unsubscribe = onSnapshot(suppliersCollectionRef, (snapshot) => {
      const suppliersData = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        key: doc.id,
        stt: index + 1,
        ...doc.data(), // { name, phone, email, address }
      }));
      setSuppliers(suppliersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // === CREATE / UPDATE (TẠO / CẬP NHẬT) ===
  const handleFinish = async (values) => {
    // values chứa dữ liệu từ form: { name, phone, email, address }
    try {
      if (editingSupplier) {
        // --- Cập nhật (Update) ---
        const supplierDocRef = doc(db, 'suppliers', editingSupplier.id);
        // Cập nhật tất cả các trường
        await updateDoc(supplierDocRef, values);
        message.success('Cập nhật nhà cung cấp thành công!');
      } else {
        // --- Tạo mới (Create) ---
        const suppliersCollectionRef = collection(db, 'suppliers');
        // Thêm document mới với các trường
        await addDoc(suppliersCollectionRef, values);
        message.success('Thêm nhà cung cấp thành công!');
      }
      closeModal();
    } catch (error) {
      console.error('Lỗi khi lưu nhà cung cấp: ', error);
      message.error('Đã xảy ra lỗi!');
    }
  };

  // === DELETE (XÓA) ===
  const handleDelete = async (id) => {
    try {
      const supplierDocRef = doc(db, 'suppliers', id);
      await deleteDoc(supplierDocRef);
      message.success('Xóa nhà cung cấp thành công!');
    } catch (error) {
      console.error('Lỗi khi xóa nhà cung cấp: ', error);
      message.error('Đã xảy ra lỗi!');
    }
  };

  // --- Hàm xử lý Modal ---
  const showModal = (supplier = null) => {
    if (supplier) {
      // Chế độ Sửa 
      setEditingSupplier(supplier);
      // setFieldsValue dùng để điền dữ liệu cũ vào form
      form.setFieldsValue(supplier); 
    } else {
      // Chế độ Thêm mới 
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

  // --- Cấu hình cột cho Bảng (Giống hình ảnh của bạn) [cite: 11] ---
  const columns = [
    {
      title: 'STT',
      dataIndex: 'stt',
      key: 'stt',
      width: 70,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mobile Number',
      dataIndex: 'phone', // Tên trường trong database là 'phone'
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (text, record) => (
        <Space size="middle">
          {/* Nút Sửa (màu xanh)  */}
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          {/* Nút Xóa (màu đỏ)  */}
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // --- Giao diện (JSX) ---
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Danh sách Nhà cung cấp</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()} // Mở modal thêm mới 
        >
          Thêm mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={suppliers}
        loading={loading}
        bordered
      />

      {/* Modal cho Thêm mới / Sửa (Dựa theo hình Thêm mới/Sửa) [cite: 12, 13] */}
      <Modal
        title={editingSupplier ? 'Sửa thông tin nhà cung cấp' : 'Thêm mới nhà cung cấp'}
        open={isModalVisible}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingSupplier ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
        >
          <Form.Item
            name="name" // Tên trường này phải khớp với 'dataIndex' của cột
            label="Tên nhà cung cấp"
            rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập SĐT!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="Địa chỉ"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Suppliers;