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
  onSnapshot, // Dùng onSnapshot để dữ liệu tự động cập nhật
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase'; // Import db từ file firebase.js

const { Title } = Typography;

// Chỉ đổi tên 'Units' thành 'Categories'
const Categories = () => { 
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // Đổi tên
  const [categories, setCategories] = useState([]); // Đổi tên
  const [loading, setLoading] = useState(false);

  // === READ (ĐỌC DỮ LIỆU) ===
  useEffect(() => {
    setLoading(true);
    // Đổi tên collection thành 'categories'
    const categoriesCollectionRef = collection(db, 'categories'); 

    const unsubscribe = onSnapshot(categoriesCollectionRef, (snapshot) => {
      const categoriesData = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        key: doc.id,
        stt: index + 1,
        ...doc.data(),
      }));
      setCategories(categoriesData); // Đổi tên
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // === CREATE / UPDATE (TẠO / CẬP NHẬT) ===
  const handleFinish = async (values) => {
    try {
      if (editingCategory) { // Đổi tên
        // --- Cập nhật (Update) ---
        const categoryDocRef = doc(db, 'categories', editingCategory.id); // Đổi tên
        await updateDoc(categoryDocRef, {
          name: values.name,
        });
        message.success('Cập nhật danh mục thành công!'); // Đổi tên
      } else {
        // --- Tạo mới (Create) ---
        const categoriesCollectionRef = collection(db, 'categories'); // Đổi tên
        await addDoc(categoriesCollectionRef, {
          name: values.name,
        });
        message.success('Thêm danh mục thành công!'); // Đổi tên
      }
      closeModal();
    } catch (error) {
      console.error('Lỗi khi lưu danh mục: ', error); // Đổi tên
      message.error('Đã xảy ra lỗi!');
    }
  };

  // === DELETE (XÓA) ===
  const handleDelete = async (id) => {
    try {
      const categoryDocRef = doc(db, 'categories', id); // Đổi tên
      await deleteDoc(categoryDocRef);
      message.success('Xóa danh mục thành công!'); // Đổi tên
    } catch (error) {
      console.error('Lỗi khi xóa danh mục: ', error); // Đổi tên
      message.error('Đã xảy ra lỗi!');
    }
  };

  // --- Hàm xử lý Modal ---
  const showModal = (category = null) => { // Đổi tên
    if (category) {
      setEditingCategory(category); // Đổi tên
      form.setFieldsValue({ name: category.name });
    } else {
      setEditingCategory(null); // Đổi tên
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingCategory(null); // Đổi tên
    form.resetFields();
  };

  // --- Cấu hình cột cho Bảng ---
  const columns = [
    {
      title: 'STT',
      dataIndex: 'stt',
      key: 'stt',
      width: 70,
    },
    {
      title: 'Tên danh mục', // Đổi tên
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (text, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
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
        <Title level={2}>Danh sách Danh mục</Title> {/* Đổi tên */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Thêm mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories} // Đổi tên
        loading={loading}
        bordered
      />

      <Modal
        title={editingCategory ? 'Sửa danh mục' : 'Thêm mới danh mục'} // Đổi tên
        open={isModalVisible}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingCategory ? 'Cập nhật' : 'Thêm mới'} // Đổi tên
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
        >
          <Form.Item
            name="name"
            label="Tên danh mục" // Đổi tên
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]} // Đổi tên
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;