import React, { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  AppstoreOutlined,
  ShopOutlined,
  DropboxOutlined,
  ShoppingCartOutlined,
  FileDoneOutlined,
  AccountBookOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Typography } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Lấy thông tin user
import { auth } from '../firebase'; // Để xử lý đăng xuất
import { signOut } from 'firebase/auth';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// Định nghĩa các mục menu dựa trên file của bạn
const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
  { key: '/suppliers', icon: <ShopOutlined />, label: <Link to="/suppliers">Nhà cung cấp</Link> },
  { key: '/customers', icon: <UserOutlined />, label: <Link to="/customers">Khách hàng</Link> },
  { key: '/units', icon: <AppstoreOutlined />, label: <Link to="/units">Đơn vị</Link> },
  { key: '/categories', icon: <AppstoreOutlined />, label: <Link to="/categories">Danh mục</Link> },
  { key: '/products', icon: <DropboxOutlined />, label: <Link to="/products">Sản phẩm</Link> },
  { 
    key: 'purchases', 
    icon: <ShoppingCartOutlined />, 
    label: 'Đơn hàng',
    children: [
      { key: '/purchases/list', label: <Link to="/purchases/list">Đơn hàng</Link> },
      { key: '/purchases/pending', label: <Link to="/purchases/pending">Xác nhận đơn hàng</Link> },
    ]
  },
  { 
    key: 'invoices', 
    icon: <FileDoneOutlined />, 
    label: 'Quản lý hóa đơn',
    children: [
      { key: '/invoices/list', label: <Link to="/invoices/list">Danh sách hóa đơn</Link> },
      { key: '/invoices/pending', label: <Link to="/invoices/pending">Phê duyệt hóa đơn</Link> },
    ]
  },
  { 
    key: 'inventory', 
    icon: <AccountBookOutlined />, 
    label: 'Quản lý tồn kho',
    children: [
      { key: '/inventory/report', label: <Link to="/inventory/report">Báo cáo tồn kho</Link> },
    ]
  },
];


const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser } = useAuth(); // Lấy thông tin user
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Đăng xuất xong thì về trang login
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  // Menu cho Dropdown ở góc phải
const userMenuItems = [ // Đổi tên và bỏ <Menu>
  {
    key: '1',
    label: 'Thông tin tài khoản',
  },
  {
    key: '2',
    danger: true,
    label: 'Đăng xuất',
    icon: <LogoutOutlined />,
    onClick: handleLogout, // Giữ nguyên hàm này
  },
];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* THANH MENU BÊN TRÁI (SIDER) */}
      <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#001529' /* Màu tối của menu */ }}>
        <div style={{ height: '32px', margin: '16px', color: 'white', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          {collapsed ? 'QLK' : 'WEB KHO HÀNG'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['/']}
          items={menuItems}
          style={{ background: '#001529' }}
        />
      </Sider>

      <Layout>
        {/* THANH HEADER BÊN TRÊN */}
        <Header style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
            <a onClick={(e) => e.preventDefault()}>
              <Space>
                <Avatar icon={<UserOutlined />} />
                {/* Sử dụng displayName mà ta đã lưu lúc đăng ký */}
                <Text strong>{currentUser?.displayName || 'User'}</Text>
              </Space>
            </a>
          </Dropdown>
        </Header>

        {/* PHẦN NỘI DUNG CHÍNH (CONTENT) */}
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#f0f2f5', // Màu nền của nội dung
          }}
        >
          {/* Outlet là nơi các trang (Dashboard, Product...) sẽ được "vẽ" ra */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;