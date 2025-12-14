import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Table, Tag, Space, Popconfirm, message, Card, Input, Modal, Descriptions 
} from 'antd';
import { CheckOutlined, CloseOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'; 
import { collection, onSnapshot, doc, deleteDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const InvoicePending = () => {
  const { userRole } = useAuth();
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(''); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

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
      setIsModalOpen(false);
    } catch (error) { message.error('Lỗi khi duyệt.'); } 
    finally { setLoading(false); }
  };

  const handleReject = async (id) => {
    try { await deleteDoc(doc(db, 'invoices', id)); message.success('Đã hủy hóa đơn.'); setIsModalOpen(false); } 
    catch (error) { message.error('Lỗi khi hủy.'); }
  };

  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const filteredData = pendingInvoices.filter(item => {
    const text = searchText.toLowerCase();
    return (
      (item.invoiceNo || '').toLowerCase().includes(text) ||
      (item.customerName || '').toLowerCase().includes(text) ||
      (item.date || '').includes(text)
    );
  });

  const detailColumns = [
    { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Đơn vị', dataIndex: 'unitName', key: 'unitName' },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity', align: 'center' },
    { title: 'Đơn giá', dataIndex: 'price', key: 'price', align: 'right', render: v => v?.toLocaleString() },
    { title: 'Thành tiền', dataIndex: 'total', key: 'total', align: 'right', render: v => v?.toLocaleString() }
  ];

  const columns = [
    { title: 'Mã HĐ', dataIndex: 'invoiceNo', key: 'invoiceNo', render: t => <Text strong>{t}</Text> },
    { title: 'Ngày bán', dataIndex: 'date', key: 'date', render: d => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Khách hàng', dataIndex: 'customerName', key: 'customerName' },
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
                • {item.name} <Text type="secondary">(x{item.quantity})</Text>
              </div>
            ))}
            {remaining > 0 && <div style={{ color: '#1890ff', fontStyle: 'italic' }}>... và {remaining} sản phẩm khác</div>}
          </div>
        );
      }
    },
    { title: 'Tổng tiền', dataIndex: 'grandTotal', key: 'grandTotal', align: 'right', render: v => v?.toLocaleString() },
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
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>Chi tiết</Button>

          {userRole !== 'employee' && (
            <>
              <Popconfirm title="Duyệt?" onConfirm={() => handleApprove(record)} okText="Xuất kho" cancelText="Hủy">
                  <Button type="primary" icon={<CheckOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }} />
              </Popconfirm>
              <Popconfirm title="Hủy?" onConfirm={() => handleReject(record.id)} okText="Xóa">
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
        <Title level={2}>Phê duyệt Hóa đơn xuất</Title>
        <Input placeholder="Tìm theo mã, ngày, khách..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 300 }} allowClear />
      </div>
      <Card bordered={false} className="criclebox tablespace">
        <Table columns={columns} dataSource={filteredData} loading={loading} rowKey="id" bordered />
      </Card>

      {/* === MODAL === */}
      <Modal
        title="Chi tiết Hóa Đơn (Chờ Duyệt)"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>Đóng</Button>,
          userRole !== 'employee' && (
            <Popconfirm key="appr" title="Duyệt hóa đơn này?" onConfirm={() => handleApprove(selectedRecord)}>
              <Button type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }}>Duyệt & Xuất kho</Button>
            </Popconfirm>
          )
        ]}
        width={700}
      >
        {selectedRecord && (
          <div>
            <Descriptions column={2} bordered size="small" style={{marginBottom: 20}}>
              <Descriptions.Item label="Mã HĐ">{selectedRecord.invoiceNo}</Descriptions.Item>
              <Descriptions.Item label="Ngày bán">{dayjs(selectedRecord.date).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Khách hàng">{selectedRecord.customerName}</Descriptions.Item>
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

export default InvoicePending;