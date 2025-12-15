import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Table,
  Tag,
  Card,
  Input,
  Space
} from 'antd';
import { 
  PrinterOutlined, 
  SearchOutlined
} from '@ant-design/icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const { Title } = Typography;

const InventoryReport = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Đã xóa phần useRef và logic tính toán trend (xu hướng tăng giảm)

  useEffect(() => {
    setLoading(true);
    // Lắng nghe dữ liệu realtime từ Firestore
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const currentData = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        return {
          id: doc.id,
          key: doc.id,
          stt: index + 1,
          ...data
        };
      });

      setInventory(currentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Logic tìm kiếm
  const filteredData = inventory.filter(item => {
    const text = searchTerm.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(text) ||
      (item.categoryName || '').toLowerCase().includes(text) ||
      (item.supplierName || '').toLowerCase().includes(text)
    );
  });

  const columns = [
    { title: 'STT', dataIndex: 'stt', key: 'stt', width: 60, align: 'center' },
    { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name', render: t => <b>{t}</b> },
    { title: 'Danh mục', dataIndex: 'categoryName', key: 'categoryName' },
    { title: 'Nhà cung cấp', dataIndex: 'supplierName', key: 'supplierName' },
    { title: 'Đơn vị', dataIndex: 'unitName', key: 'unitName', align: 'center' },
    { 
      title: 'Tồn kho', 
      dataIndex: 'quantity', 
      key: 'quantity',
      align: 'center',
      sorter: (a, b) => a.quantity - b.quantity,
      render: (qty) => {
        // --- 1. Mặc định ---
        let color = '#000000'; 
        let borderColor = '#d9d9d9'; 
        let backgroundColor = '#fafafa'; 
        
        // --- 2. LOGIC MÀU SẮC (Xanh, Vàng, Đỏ) ---
        // Giữ nguyên logic màu sắc để cảnh báo
        const numQty = Number(qty); // Đảm bảo là số
        if (numQty > 20) {
          color = '#3f8600'; // Xanh lá
          borderColor = '#b7eb8f'; 
          backgroundColor = '#f6ffed'; 
        } else if (numQty > 10) { 
          color = '#faad14'; // Vàng
          borderColor = '#ffe58f'; 
          backgroundColor = '#fffbe6'; 
        } else {
          color = '#cf1322'; // Đỏ
          borderColor = '#ffa39e'; 
          backgroundColor = '#fff1f0'; 
        }

        return (
          <Tag 
            style={{ 
              color: color, 
              borderColor: borderColor, 
              background: backgroundColor,
              borderWidth: '1px',
              borderStyle: 'solid',
              fontSize: 13, 
              padding: '2px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 60
            }}
          >
            <span style={{ fontWeight: 600 }}>{qty}</span>
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="inventory-report-page">
      <div className="screen-only">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={2}>Báo cáo Tồn kho</Title>
          <Space>
            <Input 
              placeholder="Tìm tên, danh mục, NCC..." 
              prefix={<SearchOutlined />} 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              In báo cáo tồn kho
            </Button>
          </Space>
        </div>

        <Card>
          <Table 
            columns={columns} 
            dataSource={filteredData} 
            loading={loading} 
            bordered 
            pagination={{ pageSize: 10 }} 
          />
        </Card>
      </div>

      {/* Phần này chỉ hiện khi in (Ctrl + P) */}
      <div className="print-only">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={3}>BÁO CÁO TỒN KHO CHI TIẾT</Title>
          <p>Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          loading={loading} 
          bordered 
          pagination={false} 
        />
      </div>

      <style>{`
        .print-only { display: none; }
        @media print {
          body * { visibility: hidden; }
          .screen-only { display: none !important; }
          .inventory-report-page, .print-only, .print-only * { visibility: visible; }
          .print-only { display: block !important; position: absolute; left: 0; top: 0; width: 100%; background: white; }
        }
      `}</style>
    </div>
  );
};

export default InventoryReport;