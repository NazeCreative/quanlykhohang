import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Form, Input, Select, DatePicker, 
  InputNumber, Table, Space, message, Upload, Card, Row, Col, Tag
} from 'antd';
import { DeleteOutlined, PlusOutlined, UploadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const PurchaseAdd = () => {
  const { currentUser, userRole } = useAuth();
  const [form] = Form.useForm();
  const [productForm] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Dữ liệu gốc
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  
  // Dữ liệu hiển thị
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // State lựa chọn
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [cart, setCart] = useState([]); 

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const supSnap = await getDocs(collection(db, "suppliers"));
        const rawSuppliers = supSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const catSnap = await getDocs(collection(db, "categories"));
        const rawCategories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const prodSnap = await getDocs(collection(db, "products"));
        const rawProducts = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setAllSuppliers(rawSuppliers);
        setAllCategories(rawCategories);
        setAllProducts(rawProducts);

        setFilteredSuppliers([{ id: 'all', name: 'Tất cả (Nhiều NCC)' }, ...rawSuppliers]);
        setFilteredCategories(rawCategories);

        const purchaseSnap = await getDocs(collection(db, "purchases"));
        const nextId = purchaseSnap.size + 1;
        const autoCode = `NH-${nextId.toString().padStart(2, '0')}`;
        form.setFieldsValue({ purchaseNo: autoCode, date: dayjs() });
      } catch (error) { console.error(error); }
    };
    fetchDependencies();
  }, []);

  // --- LOGIC LỌC 2 CHIỀU ---
  const handleSupplierChange = (supplierId) => {
    setSelectedSupplier(supplierId);
    setCart([]); 
    productForm.resetFields();

    if (supplierId === 'all') {
      setFilteredCategories(allCategories);
      updateProductList('all', selectedCategory);
    } else {
      const productsOfSup = allProducts.filter(p => p.supplierId === supplierId);
      const availCatIds = [...new Set(productsOfSup.map(p => p.categoryId))];
      const validCategories = allCategories.filter(c => availCatIds.includes(c.id));
      
      setFilteredCategories(validCategories);
      
      if (selectedCategory && !availCatIds.includes(selectedCategory)) {
        setSelectedCategory(null);
        productForm.setFieldsValue({ categoryId: null });
        updateProductList(supplierId, null);
      } else {
        updateProductList(supplierId, selectedCategory);
      }
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    productForm.setFieldsValue({ productId: null, unitName: '', price: 0, quantity: 1 });

    if (!categoryId) {
      updateProductList(selectedSupplier, null);
      return;
    }

    const productsOfCat = allProducts.filter(p => p.categoryId === categoryId);
    const availSupIds = [...new Set(productsOfCat.map(p => p.supplierId))];
    const validSuppliers = allSuppliers.filter(s => availSupIds.includes(s.id));
    setFilteredSuppliers([{ id: 'all', name: 'Tất cả (Nhiều NCC)' }, ...validSuppliers]);

    updateProductList(selectedSupplier, categoryId);
  };

  const updateProductList = (supId, catId) => {
    let filtered = allProducts;
    if (supId && supId !== 'all') {
      filtered = filtered.filter(p => p.supplierId === supId);
    }
    if (catId) {
      filtered = filtered.filter(p => p.categoryId === catId);
    }
    setFilteredProducts(filtered);
  };
  
  const handleProductChange = (productId) => {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      productForm.setFieldsValue({ 
        unitName: product.unitName || '',
        price: product.lastImportPrice || 0 
      });
    }
  };

  // === IMPORT EXCEL (ĐÃ SỬA: ĐỌC TẤT CẢ CÁC SHEET) ===
  const handleImportExcel = (file) => {
    if (!selectedSupplier) {
      message.error("Vui lòng chọn Nhà cung cấp (hoặc chọn 'Tất cả')!");
      return false; 
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let allNewItems = [];
        let totalSkipped = 0;
        let sheetsRead = 0;

        // --- VÒNG LẶP QUA TẤT CẢ CÁC SHEET ---
        workbook.SheetNames.forEach(sheetName => {
            sheetsRead++;
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            
            jsonData.forEach(row => {
                const rawName = row['Tên sản phẩm'] || row['TenSanPham'] || row['Name'];
                const quantity = Number(row['Số lượng nhập'] || row['SoLuongNhap'] || 0);
                let price = row['Giá'] || row['Gia'] || row['Price'];

                if (!rawName || quantity <= 0) return;

                const cleanName = rawName.toString().trim().toLowerCase();
                
                // Logic tìm sản phẩm
                const product = allProducts.find(p => {
                    const nameMatch = p.name.trim().toLowerCase() === cleanName;
                    const supplierMatch = (selectedSupplier === 'all') ? true : (p.supplierId === selectedSupplier);
                    return nameMatch && supplierMatch;
                });

                if (product) {
                    if (!price) price = product.lastImportPrice || 0;
                    allNewItems.push({
                        key: product.id,
                        productId: product.id,
                        name: product.name,
                        supplierName: product.supplierName,
                        unitName: product.unitName || '',
                        quantity: quantity,
                        price: Number(price),
                        note: `Sheet: ${sheetName}`, // Ghi chú tên sheet để dễ kiểm tra
                        total: quantity * Number(price),
                    });
                } else {
                    totalSkipped++;
                }
            });
        });

        if (allNewItems.length > 0) {
          setCart(prev => {
            const merged = [...prev];
            allNewItems.forEach(newItem => {
              const existingIdx = merged.findIndex(i => i.productId === newItem.productId);
              if (existingIdx > -1) {
                merged[existingIdx].quantity += newItem.quantity; // Cộng dồn số lượng nếu trùng
                merged[existingIdx].total = merged[existingIdx].quantity * merged[existingIdx].price;
                // Nối thêm ghi chú sheet
                if(!merged[existingIdx].note.includes(newItem.note)) {
                    merged[existingIdx].note += `, ${newItem.note}`;
                }
              } else {
                merged.push(newItem);
              }
            });
            return merged;
          });
          message.success(`Đã đọc ${sheetsRead} sheet. Thêm thành công ${allNewItems.length} sản phẩm!`);
        } else {
          message.warning("Không tìm thấy sản phẩm nào hợp lệ trong file Excel.");
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
    const product = allProducts.find(p => p.id === values.productId);
    setCart([...cart, {
      key: product.id,
      productId: product.id,
      name: product.name,
      supplierName: product.supplierName,
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
    
    let finalSupplierName = '';
    let finalSupplierId = values.supplierId;

    if (values.supplierId === 'all') {
      finalSupplierName = 'Nhiều nhà cung cấp';
    } else {
      const sup = allSuppliers.find(s => s.id === values.supplierId);
      finalSupplierName = sup ? sup.name : 'Unknown';
    }
    
    try {
      await addDoc(collection(db, "purchases"), {
        purchaseNo: values.purchaseNo,
        date: dayjs(values.date).format('YYYY-MM-DD'),
        supplierId: finalSupplierId,
        supplierName: finalSupplierName,
        items: cart,
        grandTotal: grandTotal,
        status: "pending", 
        createdBy: {
          name: currentUser?.displayName || 'Unknown',
          role: userRole || 'employee',
          uid: currentUser?.uid
        }
      });
      message.success('Tạo đơn hàng thành công!');
      navigate('/purchases/list');
    } catch (error) { setLoading(false); message.error("Lỗi lưu đơn: " + error.message); }
  };

  const cartColumns = [
    { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name', render: (t, r) => <div><b>{t}</b><br/><span style={{fontSize: 11, color: '#888'}}>{r.supplierName}</span></div> },
    { title: 'Đơn vị', dataIndex: 'unitName', key: 'unitName' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', align: 'center' },
    { title: 'Đơn giá', dataIndex: 'price', key: 'price', render: v => v?.toLocaleString() },
    { title: 'Thành tiền', dataIndex: 'total', key: 'total', render: v => v?.toLocaleString() },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note', render: t => <span style={{fontSize: 12, fontStyle: 'italic'}}>{t}</span> },
    { title: 'Xóa', render: (_, r) => <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveFromCart(r.productId)} /> },
  ];

  return (
    <div>
      <Title level={2}>Thêm đơn hàng mới</Title>
      
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Card bordered={false} style={{marginBottom: 20}}>
            <Row gutter={16}>
                <Col span={6}>
                    <Form.Item name="purchaseNo" label="Mã đơn hàng" rules={[{ required: true }]}>
                        <Input placeholder="Tự động" disabled style={{ fontWeight: 'bold' }} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name="date" label="Ngày nhập" rules={[{ required: true }]}>
                        <DatePicker format="DD/MM/YYYY" style={{width: '100%'}} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true }]}>
                        <Select 
                            placeholder="Chọn nhà cung cấp (hoặc Tất cả)" 
                            onChange={handleSupplierChange}
                            showSearch
                            filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                        >
                        {filteredSuppliers.map(sup => (
                            <Option key={sup.id} value={sup.id}>
                                {sup.id === 'all' ? <span style={{fontWeight: 'bold', color: '#1890ff'}}>{sup.name}</span> : sup.name}
                            </Option>
                        ))}
                        </Select>
                    </Form.Item>
                </Col>
            </Row>
        </Card>
      </Form>

      {/* Khu vực Import Excel */}
      <div style={{ marginBottom: 20, padding: 15, background: '#f0f5ff', border: '1px dashed #1890ff', borderRadius: 8 }}>
        <Space>
          <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />
          <div>
            <div style={{fontWeight: 'bold'}}>Nhập nhanh từ File Báo Cáo (Đa Sheet)</div>
            <div style={{fontSize: 12, color: '#666'}}>
              * Hệ thống sẽ tự động quét <b>TẤT CẢ các Sheet</b> trong file Excel.<br/>
              * Nếu chọn "Tất cả", sản phẩm sẽ được gộp chung từ mọi nhà cung cấp vào đơn hàng này.
            </div>
          </div>
          <Upload beforeUpload={handleImportExcel} showUploadList={false} accept=".xlsx">
              <Button type="primary" icon={<UploadOutlined />} disabled={!selectedSupplier}>
                  {selectedSupplier === 'all' ? 'Nhập file tổng hợp' : 'Nhập file cho NCC này'}
              </Button>
          </Upload>
        </Space>
      </div>

      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #f0f0f0' }}>
        <Title level={4}>Thêm sản phẩm thủ công</Title>
        <Form form={productForm} onFinish={onAddProductToCart} layout="vertical">
          <Row gutter={16} align="bottom">
            <Col span={6}>
                <Form.Item name="categoryId" label="Lọc theo Danh mục">
                    <Select 
                        placeholder="Chọn danh mục" 
                        onChange={handleCategoryChange}
                        allowClear
                        showSearch
                        filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                    >
                        {filteredCategories.map(cat => (<Option key={cat.id} value={cat.id}>{cat.name}</Option>))}
                    </Select>
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item name="productId" label="Sản phẩm" rules={[{ required: true }]}>
                    <Select 
                        placeholder={selectedSupplier ? "Chọn sản phẩm" : "Chọn NCC trước"} 
                        disabled={!selectedSupplier} 
                        onChange={handleProductChange}
                        showSearch
                        optionFilterProp="children"
                    >
                        {filteredProducts.map(prod => (
                            <Option key={prod.id} value={prod.id}>
                                {prod.name} {selectedSupplier === 'all' && <Tag style={{marginLeft: 5}} color="blue">{prod.supplierName}</Tag>}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </Col>
            <Col span={3}>
                <Form.Item name="unitName" label="Đơn vị"><Input readOnly /></Form.Item>
            </Col>
            <Col span={3}>
                <Form.Item name="quantity" label="Số lượng" initialValue={1} rules={[{ required: true }]}><InputNumber min={1} style={{width: '100%'}} /></Form.Item>
            </Col>
            <Col span={4}>
                 <Form.Item name="price" label="Đơn giá" initialValue={0} rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/\$\s?|(,*)/g, '')}/></Form.Item>
            </Col>
          </Row>
          <Row>
             <Col span={24} style={{textAlign: 'right'}}>
                <Space>
                    <Form.Item name="note" noStyle><Input placeholder="Ghi chú sản phẩm (nếu có)" style={{width: 300}} /></Form.Item>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />} disabled={!selectedSupplier}>Thêm vào đơn</Button>
                </Space>
             </Col>
          </Row>
        </Form>
      </div>

      <br />
      
      <Table 
        columns={cartColumns} 
        dataSource={cart} 
        bordered 
        pagination={false} 
        locale={{emptyText: 'Chưa có sản phẩm nào'}}
        summary={(pageData) => {
          const total = pageData.reduce((sum, item) => sum + item.total, 0);
          return (
            <Table.Summary.Row style={{background: '#e6f7ff', fontWeight: 'bold'}}>
              <Table.Summary.Cell index={0} colSpan={4} align="right">Tổng tiền:</Table.Summary.Cell>
              <Table.Summary.Cell index={1}><Text type="danger">{total.toLocaleString()} VNĐ</Text></Table.Summary.Cell>
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