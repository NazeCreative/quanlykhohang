import React, { useState, useEffect } from "react";
import {
  Typography,
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase"; // Import db

const { Title } = Typography;

const Customers = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null); // Lưu khách hàng đang sửa
  const [customers, setCustomers] = useState([]); // Lưu danh sách khách hàng
  const [loading, setLoading] = useState(false);

  // === READ (ĐỌC DỮ LIỆU) ===
  useEffect(() => {
    setLoading(true);
    // Tên collection là 'customers'
    const customersCollectionRef = collection(db, "customers");

    const unsubscribe = onSnapshot(customersCollectionRef, (snapshot) => {
      const customersData = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        key: doc.id,
        stt: index + 1,
        ...doc.data(), // { name, phone, email, address }
      }));
      setCustomers(customersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // === CREATE / UPDATE (TẠO / CẬP NHẬT) ===
  const handleFinish = async (values) => {
    // values chứa dữ liệu từ form: { name, phone, email, address }
    try {
      if (editingCustomer) {
        // --- Cập nhật (Update) ---
        const customerDocRef = doc(db, "customers", editingCustomer.id);
        await updateDoc(customerDocRef, values);
        message.success("Cập nhật khách hàng thành công!");
      } else {
        // --- Tạo mới (Create) ---
        const customersCollectionRef = collection(db, "customers");
        await addDoc(customersCollectionRef, values);
        message.success("Thêm khách hàng thành công!");
      }
      closeModal();
    } catch (error) {
      console.error("Lỗi khi lưu khách hàng: ", error);
      message.error("Đã xảy ra lỗi!");
    }
  };

  // === DELETE (XÓA) ===
  const handleDelete = async (id) => {
    try {
      const customerDocRef = doc(db, "customers", id);
      await deleteDoc(customerDocRef);
      message.success("Xóa khách hàng thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa khách hàng: ", error);
      message.error("Đã xảy ra lỗi!");
    }
  };

  // --- Hàm xử lý Modal ---
  const showModal = (customer = null) => {
    if (customer) {
      // Chế độ Sửa
      setEditingCustomer(customer);
      form.setFieldsValue(customer);
    } else {
      // Chế độ Thêm mới
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

  // --- Cấu hình cột cho Bảng ---
  // (Tôi đã bỏ cột "Avt" (Avatar) vì chúng ta không upload ảnh)
  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      key: "stt",
      width: 70,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
    },
    // Bạn có thể thêm cột "Số điện thoại" nếu muốn
    // {
    //   title: 'Số điện thoại',
    //   dataIndex: 'phone',
    //   key: 'phone',
    // },
    {
      title: "Action",
      key: "action",
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={2}>Danh sách Khách hàng</Title>
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
        dataSource={customers}
        loading={loading}
        bordered
      />

      {/* Modal cho Thêm mới / Sửa (đã bỏ trường Image) */}
      <Modal
        title={
          editingCustomer ? "Sửa thông tin khách hàng" : "Thêm mới khách hàng"
        }
        open={isModalVisible}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingCustomer ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            // Xóa 'required' nếu SĐT không bắt buộc
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", message: "Email không hợp lệ!" }]}
          >
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
