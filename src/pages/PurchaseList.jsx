import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Table, Tag, Space, Popconfirm, message, Input, Modal, Descriptions 
} from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const PurchaseList = () => {
  const { userRole } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // State cho Modal xem chi tiết
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

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

  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const filteredData = purchases.filter(item => {
    const text = searchText.toLowerCase();
    return (
      (item.purchaseNo || '').toLowerCase().includes(text) ||
      (item.supplierName || '').toLowerCase().includes(text) ||
      (item.date || '').includes(text)
    );
  });

  // Cột cho bảng chi tiết trong Modal
  const detailColumns = [
    { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Đơn vị', dataIndex: 'unitName', key: 'unitName' },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity', align: 'center' },
    { title: 'Giá nhập', dataIndex: 'price', key: 'price', align: 'right', render: v => v?.toLocaleString() },
    { title: 'Thành tiền', dataIndex: 'total', key: 'total', align: 'right', render: v => v?.toLocaleString() }
  ];

  const columns = [
    { title: 'STT', dataIndex: 'stt', key: 'stt', width: 60, align: 'center' },
    { title: 'Mã đơn', dataIndex: 'purchaseNo', key: 'purchaseNo', render: t => <Text strong>{t}</Text> },
    { title: 'Ngày nhập', dataIndex: 'date', key: 'date', render: d => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Nhà cung cấp', dataIndex: 'supplierName', key: 'supplierName' },
    {
      title: 'Sản phẩm nhập',
      dataIndex: 'items',
      key: 'items',
      width: 250,
      render: (items) => {
        // === LOGIC MỚI: Chỉ hiện 3 dòng ===
        if (!items || items.length === 0) return '-';
        const displayItems = items.slice(0, 3);
        const remaining = items.length - 3;
        
        return (
          <div style={{ fontSize: '13px' }}>
            {displayItems.map((item, index) => (
              <div key={index} style={{ marginBottom: 2 }}>
                • {item.name} <span style={{ color: '#888' }}>(x{item.quantity})</span>
              </div>
            ))}
            {remaining > 0 && <div style={{ color: '#1890ff', fontStyle: 'italic' }}>... và {remaining} sản phẩm khác</div>}
          </div>
        );
      },
    },
    { title: 'Tổng tiền', dataIndex: 'grandTotal', key: 'grandTotal', align: 'right', render: v => <Text type="danger" strong>{v?.toLocaleString()}</Text> },
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
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center',
      render: s => <Tag color={s === 'approved' ? 'green' : 'orange'}>{s === 'approved' ? 'Đã duyệt' : 'Đang chờ'}</Tag>
    },
    {
      title: 'Thao tác', key: 'action', align: 'center',
      render: (_, record) => (
        <Space>
           {/* === NÚT XEM CHI TIẾT (Ai cũng thấy) === */}
           <Button type="primary" ghost icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(record)} />
           
           {/* Ẩn nút Xóa nếu là nhân viên */}
           {userRole !== 'employee' && (
              <Popconfirm title="Xóa?" onConfirm={() => handleDelete(record.id)}>
                <Button danger icon={<DeleteOutlined />} size="small" />
              </Popconfirm>
           )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Danh sách Đơn hàng</Title>
        <Space>
          <Input placeholder="Tìm mã đơn, NCC, ngày..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 250 }} allowClear />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/purchases/new')}>Thêm đơn hàng</Button>
        </Space>
      </div>
      
      <Table columns={columns} dataSource={filteredData} loading={loading} bordered />

      {/* === MODAL CHI TIẾT === */}
      <Modal
        title="Chi tiết Đơn hàng nhập"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[<Button key="close" onClick={() => setIsModalOpen(false)}>Đóng</Button>]}
        width={700}
      >
        {selectedRecord && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Mã đơn">{selectedRecord.purchaseNo}</Descriptions.Item>
              <Descriptions.Item label="Ngày nhập">{dayjs(selectedRecord.date).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Nhà cung cấp">{selectedRecord.supplierName}</Descriptions.Item>
              <Descriptions.Item label="Người tạo">{selectedRecord.createdBy?.name || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={selectedRecord.status === 'approved' ? 'green' : 'orange'}>
                  {selectedRecord.status === 'approved' ? 'Đã duyệt' : 'Đang chờ'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            
            <Table 
              columns={detailColumns} 
              dataSource={selectedRecord.items} 
              pagination={false} 
              bordered 
              size="small"
              summary={(pageData) => {
                let total = 0; pageData.forEach(({ total: t }) => { total += t; });
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right"><Text strong>TỔNG TIỀN:</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}><Text type="danger" strong>{total.toLocaleString()} đ</Text></Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseList;