import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Table, Tag, Space, Popconfirm, message, Card, Input, Modal, Descriptions 
} from 'antd';
import { CheckOutlined, CloseOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { collection, onSnapshot, doc, deleteDoc, increment, writeBatch, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const PurchasePending = () => {
  const { userRole } = useAuth();
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

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
      setIsModalOpen(false); // Đóng modal nếu đang mở
    } catch (error) { message.error('Lỗi khi duyệt.'); } 
    finally { setLoading(false); }
  };

  const handleReject = async (id) => {
    try { await deleteDoc(doc(db, 'purchases', id)); message.success('Đã xóa đơn hàng.'); setIsModalOpen(false); } 
    catch (error) { message.error('Lỗi khi xóa.'); }
  };

  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const filteredData = pendingPurchases.filter(item => {
    const text = searchText.toLowerCase();
    return (
      (item.purchaseNo || '').toLowerCase().includes(text) ||
      (item.supplierName || '').toLowerCase().includes(text) ||
      (item.date || '').includes(text)
    );
  });

  // Cột cho Modal Detail
  const detailColumns = [
    { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Đơn vị', dataIndex: 'unitName', key: 'unitName' },
    { title: 'SL Nhập', dataIndex: 'quantity', key: 'quantity', align: 'center' },
    { title: 'Giá nhập', dataIndex: 'price', key: 'price', align: 'right', render: v => v?.toLocaleString() },
    { title: 'Thành tiền', dataIndex: 'total', key: 'total', align: 'right', render: v => v?.toLocaleString() }
  ];

  const columns = [
    { title: 'Mã đơn', dataIndex: 'purchaseNo', key: 'purchaseNo', render: t => <Text strong>{t}</Text> },
    { title: 'Ngày', dataIndex: 'date', key: 'date', render: d => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Nhà cung cấp', dataIndex: 'supplierName', key: 'supplierName' },
    {
      title: 'Sản phẩm', dataIndex: 'items', key: 'items', width: 300,
      render: (items) => {
        // === LOGIC MỚI: Chỉ hiện 3 dòng ===
        if (!items || items.length === 0) return '-';
        const displayItems = items.slice(0, 3);
        const remaining = items.length - 3;
        
        return (
          <div style={{ fontSize: '13px' }}>
            {displayItems.map((item, index) => (
              <div key={index} style={{ marginBottom: 2 }}>
                • {item.name} {item.productId ? "" : <Tag color="green" style={{fontSize: 10}}>Mới</Tag>} <span style={{ color: '#888' }}>(x{item.quantity})</span>
              </div>
            ))}
            {remaining > 0 && <div style={{ color: '#1890ff', fontStyle: 'italic' }}>... và {remaining} sản phẩm khác</div>}
          </div>
        );
      }
    },
    { title: 'Tổng tiền', dataIndex: 'grandTotal', key: 'grandTotal', render: v => v?.toLocaleString() },
    {
        title: 'Người thực hiện',
        key: 'createdBy',
        render: (_, record) => {
            if (!record.createdBy) return <Text type="secondary">N/A</Text>;
            let roleName = 'Nhân viên';
            let color = 'default';
            if (record.createdBy.role === 'admin') { roleName = 'Admin'; color = 'red'; }
            else if (record.createdBy.role === 'manager') { roleName = 'Quản lí'; color = 'gold'; }
            return (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.createdBy.name}</Text>
                    <Tag color={color} style={{marginRight: 0}}>{roleName}</Tag>
                </Space>
            );
        }
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center', render: () => <Tag color="orange">Đang chờ</Tag> },
    {
      title: 'Hành động', key: 'action', align: 'center',
      render: (_, record) => (
        <Space>
          {/* Nút xem chi tiết */}
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>Chi tiết</Button>

          {/* Các nút xử lý chỉ hiện nếu KHÔNG phải nhân viên */}
          {userRole !== 'employee' && (
             <>
               <Popconfirm title="Duyệt?" onConfirm={() => handleApprove(record)} okText="Duyệt" cancelText="Hủy">
                  <Button type="primary" icon={<CheckOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }} />
               </Popconfirm>
               <Popconfirm title="Xóa?" onConfirm={() => handleReject(record.id)} okText="Xóa">
                  <Button type="primary" danger icon={<CloseOutlined />} />
               </Popconfirm>
             </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Xác nhận Đơn hàng nhập</Title>
        <Input placeholder="Tìm theo mã, ngày, NCC..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 300 }} allowClear />
      </div>
      <Card bordered={false} className="criclebox tablespace">
        <Table columns={columns} dataSource={filteredData} loading={loading} rowKey="id" bordered />
      </Card>

      {/* === MODAL DUYỆT ĐƠN === */}
      <Modal
        title="Chi tiết & Duyệt Đơn Hàng"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
           <Button key="close" onClick={() => setIsModalOpen(false)}>Đóng</Button>,
           // Nếu không phải nhân viên thì mới hiện nút duyệt trong Modal
           userRole !== 'employee' && (
             <Popconfirm key="approve" title="Duyệt đơn này?" onConfirm={() => handleApprove(selectedRecord)}>
               <Button type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }}>Duyệt Đơn Hàng</Button>
             </Popconfirm>
           )
        ]}
        width={700}
      >
        {selectedRecord && (
          <div>
            <Descriptions column={2} bordered size="small" style={{marginBottom: 20}}>
              <Descriptions.Item label="Mã đơn">{selectedRecord.purchaseNo}</Descriptions.Item>
              <Descriptions.Item label="Ngày nhập">{dayjs(selectedRecord.date).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Nhà cung cấp">{selectedRecord.supplierName}</Descriptions.Item>
              <Descriptions.Item label="Người tạo">{selectedRecord.createdBy?.name || 'N/A'}</Descriptions.Item>
            </Descriptions>
            <Table 
              columns={detailColumns} 
              dataSource={selectedRecord.items} 
              pagination={false} 
              bordered size="small"
              summary={(pageData) => {
                let total = 0; pageData.forEach(({ total: t }) => { total += t; });
                return (<Table.Summary.Row><Table.Summary.Cell index={0} colSpan={4} align="right"><Text strong>TỔNG CỘNG:</Text></Table.Summary.Cell><Table.Summary.Cell index={1}><Text type="danger" strong>{total.toLocaleString()} đ</Text></Table.Summary.Cell></Table.Summary.Row>);
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchasePending;