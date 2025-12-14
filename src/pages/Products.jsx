import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Table, Modal, Form, Input, Select, 
  message, Popconfirm, Space, InputNumber, Tag
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, 
  SearchOutlined, FileExcelOutlined
} from '@ant-design/icons';
import {
  collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDocs 
} from 'firebase/firestore';
import { db } from '../firebase'; 
import { useAuth } from '../context/AuthContext'; // 1. Import Auth
import * as XLSX from 'xlsx';

const { Title } = Typography;
const { Option } = Select;

const Products = () => {
  const { userRole } = useAuth(); // 2. Lấy quyền user
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  const fetchDependencies = async () => {
    try {
      const supSnap = await getDocs(collection(db, "suppliers"));
      setSuppliers(supSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const catSnap = await getDocs(collection(db, "categories"));
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const unitSnap = await getDocs(collection(db, "units"));
      setUnits(unitSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchDependencies(); 
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productsData = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        key: doc.id,
        stt: index + 1,
        ...doc.data(),
      }));
      setProducts(productsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // === XUẤT EXCEL (CÓ CỘT ĐỂ NHẬP LIỆU) ===
  const handleExportExcel = () => {
    if (products.length === 0) {
      message.warning("Không có dữ liệu!");
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      const groupedData = {};
      
      products.forEach(product => {
        const supplierName = product.supplierName || "Khác";
        if (!groupedData[supplierName]) groupedData[supplierName] = [];

        // Thêm 2 cột "Số lượng nhập" và "Giá" (để trống hoặc lấy giá cũ gợi ý)
        groupedData[supplierName].push({
          "Tên sản phẩm": product.name,
          "Danh mục": product.categoryName,
          "Đơn vị": product.unitName,
          "Giá nhập cũ": product.lastImportPrice, // Để tham khảo
          "Số lượng tồn": product.quantity,       // Để tham khảo
          "Số lượng nhập": "",                    // <-- CỘT MỚI (Để người dùng điền)
          "Giá": ""                               // <-- CỘT MỚI (Để người dùng điền)
        });
      });

      Object.keys(groupedData).forEach(supplierName => {
        const ws = XLSX.utils.json_to_sheet(groupedData[supplierName]);
        // Tên sheet an toàn (Excel không cho phép ký tự đặc biệt)
        const safeSheetName = supplierName.substring(0, 30).replace(/[\/\\\?\*\[\]]/g, "_");
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
      });

      XLSX.writeFile(wb, "Phieu_Nhap_Hang_Mau.xlsx");
      message.success("Đã xuất file! Hãy điền số lượng và giá rồi qua trang Đơn hàng để nhập.");

    } catch (error) {
      console.error(error);
      message.error("Lỗi xuất file.");
    }
  };

  const handleFinish = async (values) => {
    try {
      const productData = {
        name: values.name,
        quantity: editingProduct ? editingProduct.quantity : 0, 
        supplierId: values.supplierId,
        categoryId: values.categoryId,
        unitId: values.unitId,
        supplierName: suppliers.find(s => s.id === values.supplierId)?.name || '',
        categoryName: categories.find(c => c.id === values.categoryId)?.name || '',
        unitName: units.find(u => u.id === values.unitId)?.name || '',
        lastImportPrice: values.lastImportPrice || 0
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        message.success('Cập nhật thành công!');
      } else {
        await addDoc(collection(db, 'products'), productData);
        message.success('Thêm mới thành công!');
      }
      closeModal();
    } catch (error) { message.error('Lỗi!'); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      message.success('Đã xóa!');
    } catch (error) { message.error('Lỗi xóa!'); }
  };

  const showModal = (product = null) => {
    setEditingProduct(product);
    form.setFieldsValue(product || {});
    setIsModalVisible(true); 
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
    form.resetFields();
  };

  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    return (product.name || '').toLowerCase().includes(term) ||
           (product.supplierName || '').toLowerCase().includes(term) ||
           (product.categoryName || '').toLowerCase().includes(term);
  });

  const columns = [
    { title: 'STT', dataIndex: 'stt', key: 'stt', width: 60, align: 'center' },
    { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name', render: t => <b>{t}</b> },
    { title: 'Nhà cung cấp', dataIndex: 'supplierName', key: 'supplierName' },
    { title: 'Đơn vị', dataIndex: 'unitName', key: 'unitName', align: 'center' },
    { title: 'Danh mục', dataIndex: 'categoryName', key: 'categoryName' },
    { 
      title: 'Giá nhập', 
      dataIndex: 'lastImportPrice', 
      key: 'lastImportPrice', 
      align: 'right',
      render: (price) => price ? <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{price.toLocaleString()} đ</span> : '-'
    },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', align: 'center' },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (text, record) => {
        // 3. Logic: Nếu là nhân viên thì ẩn nút Sửa/Xóa
        if (userRole === 'employee') {
          return <Tag color="default">Chỉ xem</Tag>;
        }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Danh sách Sản phẩm</Title>
        <Space>
          <Input 
            placeholder="Tìm kiếm..." 
            prefix={<SearchOutlined />} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }} allowClear 
          />
          
          {/* Nút Xuất Excel vẫn hiển thị cho mọi người */}
          <Button 
            onClick={handleExportExcel} 
            icon={<FileExcelOutlined />} 
            style={{ background: '#217346', color: 'white', borderColor: '#217346' }}
          >
            Xuất file nhập hàng
          </Button>

          {/* 4. Logic: Chỉ hiện nút Thêm nếu KHÔNG phải nhân viên */}
          {userRole !== 'employee' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
              Thêm sản phẩm
            </Button>
          )}
        </Space>
      </div>

      <Table columns={columns} dataSource={filteredProducts} loading={loading} bordered />

      <Modal
        title={editingProduct ? 'Sửa thông tin' : 'Thêm mới'}
        open={isModalVisible} 
        onCancel={closeModal}
        footer={[
          <Button key="back" onClick={closeModal}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>Lưu</Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="supplierId" label="Tên nhà cung cấp" rules={[{ required: true }]}>
            <Select placeholder="Chọn NCC">
              {suppliers.map(sup => (<Option key={sup.id} value={sup.id}>{sup.name}</Option>))}
            </Select>
          </Form.Item>
          <Form.Item name="unitId" label="Tên đơn vị" rules={[{ required: true }]}>
            <Select placeholder="Chọn đơn vị">
              {units.map(unit => (<Option key={unit.id} value={unit.id}>{unit.name}</Option>))}
            </Select>
          </Form.Item>
           <Form.Item name="categoryId" label="Tên danh mục" rules={[{ required: true }]}>
            <Select placeholder="Chọn danh mục">
              {categories.map(cat => (<Option key={cat.id} value={cat.id}>{cat.name}</Option>))}
            </Select>
          </Form.Item>
          <Form.Item name="lastImportPrice" label="Giá nhập (VNĐ)">
            <InputNumber 
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;