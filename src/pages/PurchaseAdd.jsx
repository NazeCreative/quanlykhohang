import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Form, Input, Select, DatePicker, 
  InputNumber, Table, Space, message, Upload
} from 'antd';
import { DeleteOutlined, PlusOutlined, UploadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext'; // 1. Import Auth

const { Title } = Typography;
const { Option } = Select;

const PurchaseAdd = () => {
  const { currentUser, userRole } = useAuth(); // 2. Lấy thông tin người dùng
  const [form] = Form.useForm();
  const [productForm] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]); 

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const supSnap = await getDocs(collection(db, "suppliers"));
        setSuppliers(supSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const catSnap = await getDocs(collection(db, "categories"));
        setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const prodSnap = await getDocs(collection(db, "products"));
        setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const purchaseSnap = await getDocs(collection(db, "purchases"));
        const nextId = purchaseSnap.size + 1;
        const autoCode = `NH-${nextId.toString().padStart(2, '0')}`;
        form.setFieldsValue({ purchaseNo: autoCode, date: dayjs() });
      } catch (error) { console.error(error); }
    };
    fetchDependencies();
  }, []);

  const handleSupplierChange = (supplierId) => {
    setSelectedSupplier(supplierId);
    productForm.resetFields(); 
    setFilteredProducts([]); 
    setSelectedCategory(null);
    setCart([]); 
  };

  const handleCategoryChange = (categoryId) => {
    if (!selectedSupplier) {
      message.warning("Vui lòng chọn Nhà cung cấp trước!");
      productForm.setFieldsValue({ categoryId: null });
      return;
    }
    setSelectedCategory(categoryId);
    const filtered = products.filter(p => 
      p.categoryId === categoryId && 
      p.supplierId === selectedSupplier
    );
    setFilteredProducts(filtered);
    productForm.setFieldsValue({ productId: null, unitName: null, quantity: 1, price: 0 });
  };
  
  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      productForm.setFieldsValue({ unitName: product.unitName || '' });
    }
  };

  // === IMPORT EXCEL ===
  const handleImportExcel = (file) => {
    if (!selectedSupplier) {
      message.error("Vui lòng chọn Nhà cung cấp trước!");
      return false; 
    }
    const currentSupplierObj = suppliers.find(s => s.id === selectedSupplier);
    const supplierName = currentSupplierObj?.name || "";
    const targetSheetName = supplierName.substring(0, 30).replace(/[\/\\\?\*\[\]]/g, "_");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let sheetName = targetSheetName;
        if (!workbook.Sheets[sheetName]) {
          message.warning(`Không tìm thấy Sheet "${targetSheetName}". Đang đọc Sheet đầu tiên...`);
          sheetName = workbook.SheetNames[0];
        } else {
          message.info(`Đang đọc dữ liệu từ Sheet: ${sheetName}`);
        }

        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const newItems = [];

        jsonData.forEach(row => {
          const rawName = row['Tên sản phẩm'] || row['TenSanPham'] || row['Name'];
          const quantity = Number(row['Số lượng nhập'] || row['SoLuongNhap'] || 0);
          let price = row['Giá'] || row['Gia'] || row['Price'];

          if (!rawName || quantity <= 0) return;

          const cleanName = rawName.toString().trim().toLowerCase();
          const product = products.find(p => 
            p.name.trim().toLowerCase() === cleanName &&
            p.supplierId === selectedSupplier
          );

          if (product) {
            if (!price) price = product.lastImportPrice || 0;
            newItems.push({
              key: product.id,
              productId: product.id,
              name: product.name,
              unitName: product.unitName || '',
              quantity: quantity,
              price: Number(price),
              note: 'Nhập từ Excel',
              total: quantity * Number(price),
            });
          }
        });

        if (newItems.length > 0) {
          setCart(prev => {
            const merged = [...prev];
            newItems.forEach(newItem => {
              const existingIdx = merged.findIndex(i => i.productId === newItem.productId);
              if (existingIdx > -1) {
                merged[existingIdx].quantity = newItem.quantity;
                merged[existingIdx].price = newItem.price;
                merged[existingIdx].total = newItem.quantity * newItem.price;
              } else {
                merged.push(newItem);
              }
            });
            return merged;
          });
          message.success(`Đã thêm ${newItems.length} sản phẩm!`);
        } else {
          message.warning("Không có sản phẩm hợp lệ trong file Excel.");
        }
      } catch (error) { 
        console.error(error);
        message.error("Lỗi đọc file Excel."); 
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const onAddProductToCart = (values) => {
    const product = products.find(p => p.id === values.productId);
    setCart([...cart, {
      key: product.id,
      productId: product.id,
      name: product.name,
      unitName: values.unitName,
      quantity: values.quantity,
      price: values.price,
      note: values.note || '',
      total: values.quantity * values.price,
    }]);
    productForm.resetFields(['productId', 'unitName', 'quantity', 'price', 'note']);
  };

  const handleRemoveFromCart = (productId) => setCart(cart.filter(item => item.productId !== productId));

  const onFinish = async (values) => {
    if (cart.length === 0) { message.error('Giỏ hàng trống!'); return; }
    setLoading(true);
    const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
    const supplier = suppliers.find(s => s.id === values.supplierId);
    
    try {
      await addDoc(collection(db, "purchases"), {
        purchaseNo: values.purchaseNo,
        date: dayjs(values.date).format('YYYY-MM-DD'),
        supplierId: values.supplierId,
        supplierName: supplier.name,
        items: cart,
        grandTotal: grandTotal,
        status: "pending", 
        // 3. LƯU THÔNG TIN NGƯỜI TẠO
        createdBy: {
          name: currentUser?.displayName || 'Unknown',
          role: userRole || 'employee',
          uid: currentUser?.uid
        }
      });
      message.success('Tạo đơn hàng thành công!');
      navigate('/purchases/list');
    } catch (error) { setLoading(false); }
  };

  const cartColumns = [
    { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Đơn vị', dataIndex: 'unitName', key: 'unitName' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Đơn giá', dataIndex: 'price', key: 'price', render: v => v.toLocaleString() },
    { title: 'Thành tiền', dataIndex: 'total', key: 'total', render: v => v.toLocaleString() },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note' },
    { title: 'Xóa', render: (_, r) => <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveFromCart(r.productId)} /> },
  ];

  return (
    <div>
      <Title level={2}>Thêm đơn hàng mới</Title>
      
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Space wrap size="large">
          <Form.Item name="date" label="Ngày nhập" rules={[{ required: true }]}>
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="purchaseNo" label="Mã đơn hàng" rules={[{ required: true }]}>
            <Input placeholder="Tự động" disabled style={{ fontWeight: 'bold' }} />
          </Form.Item>
          <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true }]} style={{width: 250}}>
            <Select placeholder="Chọn nhà cung cấp" onChange={handleSupplierChange}>
              {suppliers.map(sup => (<Option key={sup.id} value={sup.id}>{sup.name}</Option>))}
            </Select>
          </Form.Item>
        </Space>
      </Form>
      <hr style={{margin: '20px 0', border: '1px solid #eee'}} />

      <div style={{ marginBottom: 20, padding: 15, background: '#f0f5ff', border: '1px dashed #1890ff', borderRadius: 8 }}>
        <Space>
          <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />
          <div>
            <div style={{fontWeight: 'bold'}}>Nhập nhanh từ File Báo Cáo</div>
            <div style={{fontSize: 12, color: '#666'}}>
              1. Xuất file từ trang Sản phẩm (điền cột "Số lượng nhập" & "Giá")<br/>
              2. Chọn đúng NCC bên trên rồi upload file đó vào đây.
            </div>
          </div>
          <Upload beforeUpload={handleImportExcel} showUploadList={false} accept=".xlsx"><Button type="primary" icon={<UploadOutlined />} disabled={!selectedSupplier}>Chọn file Excel</Button></Upload>
        </Space>
      </div>

      <div style={{ background: '#fafafa', padding: 20, borderRadius: 8 }}>
        <Title level={4}>Chi tiết nhập hàng</Title>
        <Form form={productForm} onFinish={onAddProductToCart} layout="vertical">
          <Space wrap align="start">
            <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]} style={{width: 180}}>
              <Select placeholder="Chọn danh mục" onChange={handleCategoryChange}>
                {categories.map(cat => (<Option key={cat.id} value={cat.id}>{cat.name}</Option>))}
              </Select>
            </Form.Item>
            
            <Form.Item name="productId" label="Sản phẩm" rules={[{ required: true }]} style={{width: 250}}>
              <Select placeholder={selectedSupplier ? "Chọn sản phẩm" : "Chọn NCC trước"} disabled={!selectedCategory} onChange={handleProductChange}>
                {filteredProducts.map(prod => (<Option key={prod.id} value={prod.id}>{prod.name}</Option>))}
              </Select>
            </Form.Item>
            
            <Form.Item name="unitName" label="Đơn vị" style={{width: 100}}><Input readOnly /></Form.Item>
            <Form.Item name="quantity" label="Số lượng" initialValue={1} rules={[{ required: true }]}><InputNumber min={1} style={{width: 100}} /></Form.Item>
            <Form.Item name="price" label="Đơn giá" initialValue={0} rules={[{ required: true }]}><InputNumber min={0} style={{ width: 150 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/\$\s?|(,*)/g, '')}/></Form.Item>
            <Form.Item name="note" label="Ghi chú"><Input placeholder="Ghi chú" /></Form.Item>
            <Form.Item label=" "><Button type="primary" htmlType="submit" icon={<PlusOutlined />} disabled={!selectedSupplier}>Thêm</Button></Form.Item>
          </Space>
        </Form>
      </div>
      <br />
      <Table columns={cartColumns} dataSource={cart} bordered pagination={false} 
        summary={(pageData) => {
          const total = pageData.reduce((sum, item) => sum + item.total, 0);
          return (
            <Table.Summary.Row style={{background: '#e6f7ff', fontWeight: 'bold'}}>
              <Table.Summary.Cell index={0} colSpan={4} align="right">Tổng tiền:</Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{total.toLocaleString()} VNĐ</Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={2}></Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <Button size="large" onClick={() => navigate('/purchases/list')} style={{marginRight: 10}}>Hủy bỏ</Button>
        <Button type="primary" size="large" loading={loading} onClick={() => form.submit()}>Lưu Đơn Hàng</Button>
      </div>
    </div>
  );
};

export default PurchaseAdd;