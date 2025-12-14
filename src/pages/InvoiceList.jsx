import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Table, Tag, Space, Popconfirm, message, Modal, Descriptions, Divider, Input 
} from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons'; 
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext'; // Import Auth

const { Title, Text } = Typography;

const InvoiceList = () => {
  const { userRole } = useAuth(); // Lấy quyền
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(''); 
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const data = snapshot.docs.map((doc, index) => ({ id: doc.id, key: doc.id, stt: index + 1, ...doc.data() }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setInvoices(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    try { await deleteDoc(doc(db, 'invoices', id)); message.success('Đã xóa hóa đơn'); } 
    catch (error) { message.error('Lỗi khi xóa'); }
  };

  const handleViewDetail = (record) => { setSelectedInvoice(record); setIsModalOpen(true); };
  const handlePrint = () => { window.print(); };

  const filteredData = invoices.filter(item => {
    const text = searchText.toLowerCase();
    return (
      (item.invoiceNo || '').toLowerCase().includes(text) || 
      (item.customerName || '').toLowerCase().includes(text) || 
      (item.date || '').includes(text) 
    );
  });

  const columns = [
    { title: 'Mã HĐ', dataIndex: 'invoiceNo', key: 'invoiceNo', render: t => <Text strong>{t}</Text> },
    { title: 'Ngày', dataIndex: 'date', key: 'date', render: d => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Khách hàng', dataIndex: 'customerName', key: 'customerName' },
    { title: 'Tổng tiền', dataIndex: 'grandTotal', key: 'grandTotal', align: 'right', render: v => <Text type="danger" strong>{v?.toLocaleString()} đ</Text> },
    {
        // === CỘT MỚI: NGƯỜI THỰC HIỆN ===
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
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center', render: s => <Tag color={s === 'approved' ? 'green' : 'orange'}>{s === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}</Tag> },
    {
      title: 'Action', key: 'action', align: 'center',
      render: (_, record) => (
        <Space>
          <Button type="primary" ghost icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          {/* === LOGIC: Ẩn nút Xóa nếu là nhân viên === */}
          {userRole !== 'employee' && (
            <Popconfirm title="Xóa?" onConfirm={() => handleDelete(record.id)}><Button danger icon={<DeleteOutlined />} /></Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const detailColumns = [
    { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Đơn vị', dataIndex: 'unitName', key: 'unitName' },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Đơn giá', dataIndex: 'price', key: 'price', render: v => v?.toLocaleString() },
    { title: 'Thành tiền', dataIndex: 'total', key: 'total', render: v => v?.toLocaleString() }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Danh sách Hóa đơn</Title>
        <Space>
          <Input placeholder="Tìm mã, khách, ngày..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 250 }} allowClear />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/invoices/new')}>Thêm hóa đơn</Button>
        </Space>
      </div>

      <Table columns={columns} dataSource={filteredData} loading={loading} bordered />

      <Modal
        title={<Title level={4}>Chi tiết hóa đơn: {selectedInvoice?.invoiceNo}</Title>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>In Hóa Đơn</Button>,
          <Button key="close" onClick={() => setIsModalOpen(false)}>Đóng</Button>
        ]}
      >
        {selectedInvoice && (
          <div id="invoice-print-area">
            <div className="print-header" style={{ display: 'none', textAlign: 'center', marginBottom: 20 }}>
              <h2>HÓA ĐƠN BÁN HÀNG</h2>
              <p>Mã hóa đơn: {selectedInvoice.invoiceNo}</p>
            </div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Khách hàng">{selectedInvoice.customerName}</Descriptions.Item>
              <Descriptions.Item label="Ngày lập">{dayjs(selectedInvoice.date).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Thanh toán">{selectedInvoice.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">{selectedInvoice.status === 'approved' ? 'Đã thanh toán' : 'Chờ xử lý'}</Descriptions.Item>
              <Descriptions.Item label="Người tạo">{selectedInvoice.createdBy?.name || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>{selectedInvoice.note || 'Không có'}</Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">Chi tiết sản phẩm</Divider>
            <Table 
              columns={detailColumns} dataSource={selectedInvoice.items} pagination={false} bordered size="small"
              summary={(pageData) => {
                let total = 0; pageData.forEach(({ total: t }) => { total += t; });
                return (<Table.Summary.Row><Table.Summary.Cell index={0} colSpan={4} align="right"><Text strong>TỔNG CỘNG:</Text></Table.Summary.Cell><Table.Summary.Cell index={1}><Text type="danger" strong style={{fontSize: 16}}>{total.toLocaleString()} đ</Text></Table.Summary.Cell></Table.Summary.Row>);
              }}
            />
            <div className="print-footer" style={{ display: 'none', marginTop: 40, display: 'flex', justifyContent: 'space-between' }}>
                <div style={{textAlign: 'center', width: '40%'}}><p><strong>Người mua hàng</strong></p><p>(Ký, ghi rõ họ tên)</p></div>
                <div style={{textAlign: 'center', width: '40%'}}><p><strong>Người bán hàng</strong></p><p>(Ký, ghi rõ họ tên)</p></div>
            </div>
          </div>
        )}
      </Modal>
      <style>{`@media print { body * { visibility: hidden; } #invoice-print-area, #invoice-print-area * { visibility: visible; } #invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; background: white; } .print-header, .print-footer { display: flex !important; } .ant-modal-footer, .ant-modal-close { display: none; } }`}</style>
    </div>
  );
};

export default InvoiceList;