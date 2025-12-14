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

const Units = () => {
  const [form] = Form.useForm(); // Dùng cho Form trong Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null); // Lưu trữ unit đang sửa
  const [units, setUnits] = useState([]); // Lưu danh sách đơn vị
  const [loading, setLoading] = useState(false); // Trạng thái loading cho bảng

  // === READ (ĐỌC DỮ LIỆU) ===
  useEffect(() => {
    setLoading(true);
    // 'units' là tên collection của chúng ta trong Firestore
    const unitsCollectionRef = collection(db, 'units');

    // onSnapshot lắng nghe thay đổi thời gian thực
    const unsubscribe = onSnapshot(unitsCollectionRef, (snapshot) => {
      const unitsData = snapshot.docs.map((doc, index) => ({
        id: doc.id, // ID của document
        key: doc.id, // key cho bảng Antd
        stt: index + 1, // Số thứ tự
        ...doc.data(), // Dữ liệu (ví dụ: { name: 'Kg' })
      }));
      setUnits(unitsData);
      setLoading(false);
    });

    // Hủy lắng nghe khi component unmount
    return () => unsubscribe();
  }, []);

  // === CREATE / UPDATE (TẠO / CẬP NHẬT) ===
  const handleFinish = async (values) => {
    try {
      if (editingUnit) {
        // --- Cập nhật (Update) ---
        const unitDocRef = doc(db, 'units', editingUnit.id);
        await updateDoc(unitDocRef, {
          name: values.name,
        });
        message.success('Cập nhật đơn vị thành công!');
      } else {
        // --- Tạo mới (Create) ---
        const unitsCollectionRef = collection(db, 'units');
        await addDoc(unitsCollectionRef, {
          name: values.name,
        });
        message.success('Thêm đơn vị thành công!');
      }
      closeModal();
    } catch (error) {
      console.error('Lỗi khi lưu đơn vị: ', error);
      message.error('Đã xảy ra lỗi!');
    }
  };

  // === DELETE (XÓA) ===
  const handleDelete = async (id) => {
    try {
      const unitDocRef = doc(db, 'units', id);
      await deleteDoc(unitDocRef);
      message.success('Xóa đơn vị thành công!');
    } catch (error) {
      console.error('Lỗi khi xóa đơn vị: ', error);
      message.error('Đã xảy ra lỗi!');
    }
  };

  // --- Hàm xử lý Modal ---
  const showModal = (unit = null) => {
    if (unit) {
      // Chế độ Sửa
      setEditingUnit(unit);
      form.setFieldsValue({ name: unit.name });
    } else {
      // Chế độ Thêm mới
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

  // --- Cấu hình cột cho Bảng ---
  const columns = [
    {
      title: 'STT',
      dataIndex: 'stt',
      key: 'stt',
      width: 70,
    },
    {
      title: 'Tên đơn vị',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (text, record) => (
        <Space size="middle">
          {/* Nút Sửa (màu xanh) */}
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showModal(record)} // Mở modal với dữ liệu của record
          />
          {/* Nút Xóa (màu đỏ) */}
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
        <Title level={2}>Danh sách Đơn vị</Title>
        {/* Nút "Thêm mới" */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()} // Mở modal ở chế độ thêm mới
        >
          Thêm mới
        </Button>
      </div>

      {/* Bảng hiển thị dữ liệu */}
      <Table
        columns={columns}
        dataSource={units}
        loading={loading}
        bordered
      />

      {/* Modal (Pop-up) cho Thêm mới / Sửa */}
      <Modal
        title={editingUnit ? 'Sửa đơn vị' : 'Thêm mới đơn vị'}
        open={isModalVisible}
        onCancel={closeModal}
        onOk={() => form.submit()} // Khi nhấn OK, submit form
        okText={editingUnit ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
        >
          <Form.Item
            name="name"
            label="Tên đơn vị"
            rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị!' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Units;