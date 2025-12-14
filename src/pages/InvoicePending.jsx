import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Table, Tag, Space, Popconfirm, message, Card, Input 
} from 'antd';
import { CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons'; 
import { collection, onSnapshot, doc, deleteDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const InvoicePending = () => {
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(''); 

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.status === 'pending')
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setPendingInvoices(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (record) => {
    try {
      setLoading(true);
      const batch = writeBatch(db);
      const invoiceRef = doc(db, 'invoices', record.id);
      batch.update(invoiceRef, { status: 'approved' });
      record.items.forEach(item => {
        if (item.productId) {
          const productRef = doc(db, 'products', item.productId);
          batch.update(productRef, { quantity: increment(-item.quantity) });
        }
      });
      await batch.commit();
      message.success('Đã duyệt hóa đơn!');
    } catch (error) { message.error('Lỗi khi duyệt.'); } 
    finally { setLoading(false); }
  };

  const handleReject = async (id) => {
    try { await deleteDoc(doc(db, 'invoices', id)); message.success('Đã hủy hóa đơn.'); } 
    catch (error) { message.error('Lỗi khi hủy.'); }
  };

  const filteredData = pendingInvoices.filter(item => {
    const text = searchText.toLowerCase();
    return (
      (item.invoiceNo || '').toLowerCase().includes(text) ||
      (item.customerName || '').toLowerCase().includes(text) ||
      (item.date || '').includes(text)
    );
  });

  const columns = [
    { title: 'Mã HĐ', dataIndex: 'invoiceNo', key: 'invoiceNo', render: t => <Text strong>{t}</Text> },
    { title: 'Ngày bán', dataIndex: 'date', key: 'date', render: d => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Khách hàng', dataIndex: 'customerName', key: 'customerName' },
    {
      title: 'Sản phẩm', dataIndex: 'items', key: 'items', width: 350,
      render: (items) => (
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {items?.map((item, idx) => (
            <li key={idx}>{item.name} <Text type="secondary">(x{item.quantity})</Text></li>
          ))}
        </ul>
      )
    },
    { title: 'Tổng tiền', dataIndex: 'grandTotal', key: 'grandTotal', align: 'right', render: v => v?.toLocaleString() },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center', render: () => <Tag color="orange">Đang chờ</Tag> },
    {
      title: 'Hành động', key: 'action', align: 'center',
      render: (_, record) => (
        <Space>
          <Popconfirm title="Duyệt?" onConfirm={() => handleApprove(record)} okText="Xuất kho" cancelText="Hủy"><Button type="primary" icon={<CheckOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }}>Duyệt</Button></Popconfirm>
          <Popconfirm title="Hủy?" onConfirm={() => handleReject(record.id)} okText="Xóa"><Button type="primary" danger icon={<CloseOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* HEADER ĐỒNG BỘ GIAO DIỆN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Phê duyệt Hóa đơn xuất</Title>
        <Input 
          placeholder="Tìm theo mã, ngày, khách..." 
          prefix={<SearchOutlined />} 
          value={searchText} 
          onChange={e => setSearchText(e.target.value)} 
          style={{ width: 300 }} // Kích thước chuẩn
          allowClear 
        />
      </div>

      <Card bordered={false} className="criclebox tablespace">
        <Table columns={columns} dataSource={filteredData} loading={loading} rowKey="id" bordered />
      </Card>
    </div>
  );
};

export default InvoicePending;