import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Table, Tag, Space, Popconfirm, message, Card, Input 
} from 'antd';
import { CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { collection, onSnapshot, doc, deleteDoc, increment, writeBatch, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PurchasePending = () => {
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'purchases'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.status === 'pending')
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setPendingPurchases(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (record) => {
    try {
      setLoading(true);
      const batch = writeBatch(db);
      for (const item of record.items) {
        if (item.productId) {
          const productRef = doc(db, 'products', item.productId);
          batch.update(productRef, { quantity: increment(item.quantity), lastImportPrice: item.price });
        } else {
          const newProductData = {
            name: item.name, quantity: item.quantity, supplierId: record.supplierId, supplierName: record.supplierName,
            categoryId: item.categoryId, unitId: item.unitId, unitName: item.unitName || '', lastImportPrice: item.price
          };
          await addDoc(collection(db, 'products'), newProductData);
        }
      }
      const purchaseRef = doc(db, 'purchases', record.id);
      batch.update(purchaseRef, { status: 'approved' });
      await batch.commit();
      message.success('Đã duyệt đơn hàng!');
    } catch (error) { message.error('Lỗi khi duyệt.'); } 
    finally { setLoading(false); }
  };

  const handleReject = async (id) => {
    try { await deleteDoc(doc(db, 'purchases', id)); message.success('Đã xóa đơn hàng.'); } 
    catch (error) { message.error('Lỗi khi xóa.'); }
  };

  const filteredData = pendingPurchases.filter(item => {
    const text = searchText.toLowerCase();
    return (
      (item.purchaseNo || '').toLowerCase().includes(text) ||
      (item.supplierName || '').toLowerCase().includes(text) ||
      (item.date || '').includes(text)
    );
  });

  const columns = [
    { title: 'Mã đơn', dataIndex: 'purchaseNo', key: 'purchaseNo', render: t => <Text strong>{t}</Text> },
    { title: 'Ngày', dataIndex: 'date', key: 'date', render: d => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Nhà cung cấp', dataIndex: 'supplierName', key: 'supplierName' },
    {
      title: 'Sản phẩm', dataIndex: 'items', key: 'items', width: 350,
      render: (items) => (
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {items?.map((item, idx) => (
            <li key={idx}>{item.name} {item.productId ? "" : <Tag color="green">Mới</Tag>} (x{item.quantity})</li>
          ))}
        </ul>
      )
    },
    { title: 'Tổng tiền', dataIndex: 'grandTotal', key: 'grandTotal', render: v => v?.toLocaleString() },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center', render: () => <Tag color="orange">Đang chờ</Tag> },
    {
      title: 'Hành động', key: 'action', align: 'center',
      render: (_, record) => (
        <Space>
          <Popconfirm title="Duyệt?" onConfirm={() => handleApprove(record)} okText="Duyệt" cancelText="Hủy"><Button type="primary" icon={<CheckOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }}>Duyệt</Button></Popconfirm>
          <Popconfirm title="Xóa?" onConfirm={() => handleReject(record.id)} okText="Xóa"><Button type="primary" danger icon={<CloseOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* HEADER ĐỒNG BỘ GIAO DIỆN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Xác nhận Đơn hàng nhập</Title>
        <Input 
          placeholder="Tìm theo mã, ngày, NCC..." 
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

export default PurchasePending;