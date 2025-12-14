import React, { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined, // Dùng icon này cho Nhân sự
  UserOutlined,
  AppstoreOutlined,
  ShopOutlined,
  DropboxOutlined,
  ShoppingCartOutlined,
  FileDoneOutlined,
  AccountBookOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Typography, Tag } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, userRole } = useAuth(); // Lấy thêm userRole
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  // Định nghĩa Menu
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
    // --- MỚI THÊM: Chỉ hiển thị nếu là Admin hoặc Manager ---
    (userRole === 'admin' || userRole === 'manager') ? {
      key: '/users',
      icon: <TeamOutlined />,
      label: <Link to="/users">Quản lý nhân sự</Link>
    } : null,
  ];

  const userMenuItems = [
    {
      key: '1',
      label: <div>Chức vụ: <strong>{userRole?.toUpperCase()}</strong></div>,
    },
    {
      key: '2',
      danger: true,
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#001529' }}>
        <div style={{ height: '32px', margin: '16px', color: 'white', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          {collapsed ? 'QLK' : 'WEB KHO HÀNG'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['/']}
          items={menuItems} // Antd sẽ tự lọc bỏ các item là null
          style={{ background: '#001529' }}
        />
      </Sider>

      <Layout>
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
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                  <Text strong>{currentUser?.displayName || 'User'}</Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}>{userRole === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</Text>
                </div>
              </Space>
            </a>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#f0f2f5',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;