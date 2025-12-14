import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Table,
  message,
  Card,
  Row,
  Col
} from 'antd';
import { DeleteOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const InvoiceAdd = () => {
  const [form] = Form.useForm();
  const [productForm] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]); 

  // 1. TẢI DỮ LIỆU
  useEffect(() => {
    const fetchData = async () => {
      try {
        const cusSnap = await getDocs(collection(db, "customers"));
        setCustomers(cusSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const prodSnap = await getDocs(collection(db, "products"));
        // Chỉ lấy những sản phẩm có số lượng > 0 (Tùy chọn: Hoặc lấy hết để hiện thông báo hết hàng)
        setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Tự động mã hóa đơn
        const invoiceSnap = await getDocs(collection(db, "invoices"));
        const nextId = invoiceSnap.size + 1;
        const autoCode = `XU-${nextId.toString().padStart(2, '0')}`;
        form.setFieldsValue({ invoiceNo: autoCode, date: dayjs() });

      } catch (error) {
        message.error("Lỗi tải dữ liệu: " + error.message);
      }
    };
    fetchData();
  }, []);

  // 2. CHỌN SẢN PHẨM & KIỂM TRA TỒN KHO
  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    
    // --- KIỂM TRA TỒN KHO ---
    if (!product || product.quantity <= 0) {
      message.error(`Sản phẩm "${product?.name}" đã HẾT HÀNG! Không thể bán.`);
      // Reset form chọn sản phẩm
      productForm.setFieldsValue({ productId: null, unitName: '', price: 0 });
      setSelectedProduct(null);
      return;
    }

    setSelectedProduct(product);

    const importPrice = Number(product?.lastImportPrice) || 0;
    let rawPrice = importPrice * 1.1;
    const sellingPrice = Math.round(rawPrice / 1000) * 1000; 

    productForm.setFieldsValue({ 
      unitName: product?.unitName || '', 
      price: sellingPrice,
      quantity: 1 // Mặc định chọn 1 cái
    });
  };

  // 3. THÊM VÀO GIỎ HÀNG (KIỂM TRA CHẶT CHẼ)
  const onAddProductToCart = (values) => {
    if (!selectedProduct) return;

    // Lấy số lượng nhập
    const inputQty = values.quantity;
    // Lấy số lượng đang có trong kho
    const stockQty = selectedProduct.quantity;

    // --- KIỂM TRA 1: Nhập quá tồn kho ---
    if (inputQty > stockQty) {
      message.error(`Kho chỉ còn ${stockQty} cái. Bạn không thể bán ${inputQty} cái!`);
      return;
    }

    const existingItem = cart.find(item => item.productId === values.productId);

    if (existingItem) {
      // --- KIỂM TRA 2: Cộng dồn quá tồn kho ---
      // Nếu trong giỏ đã có 5 cái, kho có 10 cái, nhập thêm 6 cái -> Tổng 11 > 10 (Lỗi)
      if (existingItem.quantity + inputQty > stockQty) {
        message.error(`Tổng số lượng vượt quá tồn kho! (Đã chọn: ${existingItem.quantity}, Kho còn: ${stockQty})`);
        return;
      }

      setCart(cart.map(item => 
        item.productId === values.productId
          ? { ...item, quantity: item.quantity + inputQty, total: (item.quantity + inputQty) * item.price }
          : item
      ));
    } else {
      setCart([
        ...cart,
        {
          key: selectedProduct.id,
          productId: selectedProduct.id,
          name: selectedProduct.name,
          unitName: values.unitName,
          quantity: inputQty,
          price: values.price,
          total: inputQty * values.price,
          maxStock: stockQty // Lưu lại maxStock để validate nếu sửa số lượng trong bảng
        }
      ]);
    }
    
    productForm.resetFields(['productId', 'unitName', 'quantity', 'price']);
    setSelectedProduct(null);
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // 4. LƯU HÓA ĐƠN
  const handleSaveInvoice = async () => {
    if (cart.length === 0) {
      message.error('Giỏ hàng đang trống!');
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      const sanitizedCart = cart.map(item => ({
        productId: item.productId,
        name: item.name || "Không tên",
        unitName: item.unitName || "",
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        total: Number(item.total) || 0,
      }));

      const grandTotal = sanitizedCart.reduce((sum, item) => sum + item.total, 0);
      const customer = customers.find(c => c.id === values.customerId);
      const customerName = customer ? customer.name : "Khách lẻ";

      const invoiceData = {
        invoiceNo: values.invoiceNo,
        date: values.date.format('YYYY-MM-DD'),
        customerId: values.customerId,
        customerName: customerName,
        paymentMethod: values.paymentMethod,
        items: sanitizedCart,
        grandTotal: grandTotal,
        status: "pending", 
        note: values.note || ''
      };

      await addDoc(collection(db, "invoices"), invoiceData);
      message.success('Lưu thành công! Vui lòng qua trang Phê duyệt.');
      navigate('/invoices/pending'); 

    } catch (error) {
      console.error(error);
      if (error.errorFields) message.error("Vui lòng điền đủ thông tin (*)");
      else message.error(`Lỗi hệ thống: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Đơn vị', dataIndex: 'unitName', key: 'unitName' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Đơn giá', dataIndex: 'price', key: 'price', render: val => val?.toLocaleString() },
    { title: 'Thành tiền', dataIndex: 'total', key: 'total', render: val => val?.toLocaleString() },
    {
      title: 'Xóa',
      key: 'action',
      render: (_, record) => <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveFromCart(record.productId)} />
    }
  ];

  return (
    <div>
      <Title level={2}>Tạo Hóa Đơn Bán Hàng</Title>

      <Row gutter={16}>
        <Col span={8}>
            <Card title="Thông tin hóa đơn" bordered={false}>
                <Form 
                    form={form} 
                    layout="vertical"
                    initialValues={{ date: dayjs(), paymentMethod: "Tiền mặt" }}
                >
                    <Form.Item name="invoiceNo" label="Mã hóa đơn" rules={[{ required: true }]}>
                        <Input disabled style={{ color: '#000', fontWeight: 'bold' }} />
                    </Form.Item>
                    <Form.Item name="date" label="Ngày bán" rules={[{ required: true }]}>
                        <DatePicker style={{width: '100%'}} format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item name="customerId" label="Khách hàng" rules={[{ required: true }]}>
                        <Select placeholder="Chọn khách hàng" showSearch optionFilterProp="children">
                            {customers.map(c => (
                                <Option key={c.id} value={c.id}>{c.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="paymentMethod" label="Thanh toán" rules={[{ required: true }]}>
                        <Select>
                            <Option value="Tiền mặt">Tiền mặt</Option>
                            <Option value="Chuyển khoản">Chuyển khoản</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="note" label="Ghi chú">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Button type="primary" size="large" block loading={loading} icon={<SaveOutlined />} onClick={handleSaveInvoice}>
                        LƯU HÓA ĐƠN
                    </Button>
                </Form>
            </Card>
        </Col>

        <Col span={16}>
            <Card title="Chi tiết đơn hàng" bordered={false}>
                <Form form={productForm} onFinish={onAddProductToCart} layout="vertical">
                    <Row gutter={16} align="bottom">
                        <Col span={10}>
                            <Form.Item name="productId" label="Sản phẩm">
                                <Select 
                                    placeholder="Tìm sản phẩm..." 
                                    showSearch 
                                    optionFilterProp="children"
                                    onChange={handleProductChange}
                                >
                                    {products.map(p => (
                                        // Thêm (SL: 10) vào tên để dễ nhìn tồn kho
                                        <Option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                                            {p.name} {p.quantity <= 0 ? '(HẾT HÀNG)' : `(SL: ${p.quantity})`}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item label="Tồn kho">
                                {/* Hiển thị màu đỏ nếu hết hàng */}
                                <Input 
                                    disabled 
                                    value={selectedProduct ? selectedProduct.quantity : '-'} 
                                    style={{ color: selectedProduct?.quantity <= 0 ? 'red' : 'black', fontWeight: 'bold' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={5}>
                             <Form.Item name="price" label="Đơn giá">
                                <InputNumber style={{width: '100%'}} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Form.Item name="quantity" label="SL" initialValue={1}>
                                {/* Giới hạn max = Tồn kho */}
                                <InputNumber 
                                    min={1} 
                                    max={selectedProduct ? selectedProduct.quantity : 9999}
                                    style={{width: '100%'}} 
                                />
                            </Form.Item>
                        </Col>
                        <Col span={2}>
                             <Form.Item label=" ">
                                <Button type="primary" htmlType="submit" icon={<PlusOutlined />} disabled={!selectedProduct || selectedProduct.quantity <= 0} />
                             </Form.Item>
                        </Col>
                    </Row>
                </Form>

                <Table 
                    columns={columns} 
                    dataSource={cart} 
                    pagination={false} 
                    summary={(pageData) => {
                        const total = pageData.reduce((sum, item) => sum + item.total, 0);
                        return (
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4} align="right">
                                    <Text strong>Tổng thanh toán:</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1}>
                                    <Text type="danger" strong>{total.toLocaleString()} đ</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} />
                            </Table.Summary.Row>
                        );
                    }}
                />
            </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InvoiceAdd;