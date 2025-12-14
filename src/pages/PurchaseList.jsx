import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Popconfirm,
  message,
  Input // <-- Import Input
} from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'; // <-- Import SearchOutlined
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PurchaseList = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(''); // State tìm kiếm
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'purchases'), (snapshot) => {
      const data = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        key: doc.id,
        stt: index + 1,
        ...doc.data(),
      }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPurchases(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'purchases', id));
      message.success('Xóa đơn hàng thành công');
    } catch (error) { message.error('Lỗi khi xóa đơn hàng'); }
  };

  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredData = purchases.filter(item => {
    const text = searchText.toLowerCase();
    return (
      (item.purchaseNo || '').toLowerCase().includes(text) || // Tìm theo Mã đơn
      (item.supplierName || '').toLowerCase().includes(text) || // Tìm theo Nhà cung cấp
      (item.date || '').includes(text) // Tìm theo Ngày (định dạng YYYY-MM-DD trong data)
    );
  });

  const columns = [
    { title: 'STT', dataIndex: 'stt', key: 'stt', width: 60, align: 'center' },
    { title: 'Mã đơn', dataIndex: 'purchaseNo', key: 'purchaseNo', render: t => <Text strong>{t}</Text> },
    { title: 'Ngày nhập', dataIndex: 'date', key: 'date', render: d => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Nhà cung cấp', dataIndex: 'supplierName', key: 'supplierName' },
    {
      title: 'Sản phẩm nhập',
      dataIndex: 'items',
      key: 'items',
      width: 300,
      render: (items) => (
        <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
          {items?.map((item, index) => (
            <div key={index} style={{ marginBottom: 4 }}>
              • {item.name} <span style={{ color: '#888', fontSize: '12px' }}>(x{item.quantity})</span>
            </div>
          ))}
        </div>
      ),
    },
    { title: 'Tổng tiền', dataIndex: 'grandTotal', key: 'grandTotal', align: 'right', render: v => <Text type="danger" strong>{v?.toLocaleString()}</Text> },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center',
      render: s => <Tag color={s === 'approved' ? 'green' : 'orange'}>{s === 'approved' ? 'Đã duyệt' : 'Đang chờ'}</Tag>
    },
    {
      title: 'Thao tác', key: 'action', align: 'center',
      render: (_, record) => (
        <Popconfirm title="Xóa?" onConfirm={() => handleDelete(record.id)}>
          <Button danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Danh sách Đơn hàng</Title>
        <Space>
          {/* THANH TÌM KIẾM */}
          <Input
            placeholder="Tìm mã đơn, NCC, ngày..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/purchases/new')}>Thêm đơn hàng</Button>
        </Space>
      </div>
      <Table columns={columns} dataSource={filteredData} loading={loading} bordered />
    </div>
  );
};

export default PurchaseList;