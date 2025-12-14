import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Typography, Table, Tag } from 'antd';
import {
  ShopOutlined,
  ShoppingCartOutlined,
  UsergroupAddOutlined,
  DollarCircleOutlined,
  TrophyOutlined,
  LineChartOutlined // Icon cho biểu đồ mới
} from '@ant-design/icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line // <-- Import thêm LineChart
} from 'recharts';
import dayjs from 'dayjs';

const { Title } = Typography;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStock: 0, totalImport: 0, totalExport: 0, totalCustomers: 0, totalSuppliers: 0
  });

  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [lineData, setLineData] = useState([]); // <-- State cho biểu đồ đường
  const [topCustomers, setTopCustomers] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      const productsSnap = await getDocs(collection(db, 'products'));
      const purchaseSnap = await getDocs(collection(db, 'purchases'));
      const invoiceSnap = await getDocs(collection(db, 'invoices'));
      const customerSnap = await getDocs(collection(db, 'customers'));
      const supplierSnap = await getDocs(collection(db, 'suppliers'));

      // 1. TÍNH TỒN KHO & PIE CHART
      let stock = 0;
      const categoryCount = {}; 
      productsSnap.forEach(doc => {
        const data = doc.data();
        const qty = Number(data.quantity) || 0;
        stock += qty;
        const catName = data.categoryName || "Khác";
        categoryCount[catName] = (categoryCount[catName] || 0) + qty;
      });

      // 2. TÍNH NHẬP KHO
      let importVal = 0;
      purchaseSnap.forEach(doc => {
        if (doc.data().status === 'approved') {
          importVal += Number(doc.data().grandTotal) || 0;
        }
      });

      // 3. TÍNH XUẤT KHO, TOP KHÁCH & BIỂU ĐỒ ĐƯỜNG (TIME SERIES)
      let exportVal = 0;
      const customerMap = {}; 
      const timeSeriesMap = {}; // Dùng để gom nhóm theo ngày

      invoiceSnap.forEach(doc => {
        const data = doc.data();
        // Chỉ tính đơn đã duyệt
        if (data.status === 'approved') {
          const total = Number(data.grandTotal) || 0;
          exportVal += total;

          // A. Logic Top Khách
          const cusName = data.customerName || "Khách lẻ";
          if (!customerMap[cusName]) customerMap[cusName] = { name: cusName, count: 0, totalMoney: 0 };
          customerMap[cusName].count += 1;
          customerMap[cusName].totalMoney += total;

          // B. Logic Biểu đồ Đường (Gom theo ngày)
          // data.date đang là chuỗi 'YYYY-MM-DD'
          const dateKey = data.date; 
          if (!timeSeriesMap[dateKey]) {
            timeSeriesMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
          }
          timeSeriesMap[dateKey].revenue += total; // Cộng dồn tiền
          timeSeriesMap[dateKey].orders += 1;      // Cộng dồn số đơn
        }
      });

      // Xử lý dữ liệu Biểu đồ Đường: Chuyển object thành mảng & Sắp xếp theo ngày
      const sortedLineData = Object.values(timeSeriesMap).sort((a, b) => new Date(a.date) - new Date(b.date));
      // Format lại ngày cho đẹp (VD: 15/08)
      const finalLineData = sortedLineData.map(item => ({
        ...item,
        displayDate: dayjs(item.date).format('DD/MM')
      }));

      // Xử lý Top Khách
      const topCusList = Object.values(customerMap)
        .sort((a, b) => b.totalMoney - a.totalMoney)
        .slice(0, 5);

      // CẬP NHẬT STATE
      setStats({
        totalStock: stock,
        totalImport: importVal,
        totalExport: exportVal,
        totalCustomers: customerSnap.size,
        totalSuppliers: supplierSnap.size
      });

      setBarData([{ name: 'Tài chính', "Chi phí Nhập": importVal, "Doanh thu Xuất": exportVal }]);
      
      setPieData(Object.keys(categoryCount).map(key => ({ name: key, value: categoryCount[key] })));
      
      setLineData(finalLineData); // <-- Lưu dữ liệu biểu đồ đường
      
      setTopCustomers(topCusList);
    };

    fetchStats();
  }, []);

  const customerColumns = [
    { 
      title: 'STT', key: 'stt', align: 'center', width: 60,
      render: (_, __, index) => <Tag color={index === 0 ? 'gold' : 'default'}>#{index + 1}</Tag>
    },
    { title: 'Tên Khách Hàng', dataIndex: 'name', key: 'name', render: t => <b>{t}</b> },
    { title: 'Số đơn hàng', dataIndex: 'count', key: 'count', align: 'center' },
    { title: 'Tổng chi tiêu', dataIndex: 'totalMoney', key: 'totalMoney', align: 'right', render: v => <span style={{color: '#cf1322', fontWeight: 'bold'}}>{v.toLocaleString()} đ</span> },
  ];

  return (
    <div>
      <Title level={2}>Tổng quan (Dashboard)</Title>
      
      {/* 1. CARDS THỐNG KÊ */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#e6f7ff' }}><Statistic title="Doanh thu bán hàng" value={stats.totalExport} precision={0} valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} prefix={<DollarCircleOutlined />} suffix="đ" /></Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#fff1f0' }}><Statistic title="Chi phí nhập hàng" value={stats.totalImport} precision={0} valueStyle={{ color: '#cf1322', fontWeight: 'bold' }} prefix={<ShoppingCartOutlined />} suffix="đ" /></Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#f6ffed' }}><Statistic title="Tổng tồn kho" value={stats.totalStock} valueStyle={{ color: '#237804', fontWeight: 'bold' }} prefix={<ShopOutlined />} suffix="SP" /></Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#fff7e6' }}><Statistic title="Tổng khách hàng" value={stats.totalCustomers} valueStyle={{ color: '#d46b08', fontWeight: 'bold' }} prefix={<UsergroupAddOutlined />} suffix="người" /></Card>
        </Col>
      </Row>

      {/* 2. BIỂU ĐỒ ĐƯỜNG (TĂNG GIẢM THEO NGÀY) - MỚI */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card 
            title={<span><LineChartOutlined style={{color: '#1890ff', marginRight: 8}} />Biểu đồ biến động doanh thu theo ngày</span>} 
            bordered={false}
          >
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" />
                  <YAxis yAxisId="left" tickFormatter={(val) => new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(val)} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [
                    name === "Doanh thu" ? value.toLocaleString() + " đ" : value, 
                    name
                  ]} />
                  <Legend />
                  {/* Đường Doanh thu (Trục trái) */}
                  <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
                  {/* Đường Số đơn hàng (Trục phải) */}
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Số đơn hàng" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. BIỂU ĐỒ CỘT & TRÒN */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="So sánh Tài chính (Tổng)" bordered={false}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(val)} />
                  <Tooltip formatter={(val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)} />
                  <Legend />
                  <Bar dataKey="Chi phí Nhập" fill="#cf1322" />
                  <Bar dataKey="Doanh thu Xuất" fill="#3f8600" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Tỷ lệ Tồn kho theo Danh mục" bordered={false}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(val) => `${val} sản phẩm`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;