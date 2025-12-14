import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp } from 'antd'; 
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword'; // 1. Import file mới
import { useAuth } from './context/AuthContext';

// Import các component
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Units from './pages/Units';
import Categories from './pages/Categories';
import Products from './pages/Products';
import PurchaseList from './pages/PurchaseList';
import PurchaseAdd from './pages/PurchaseAdd';
import PurchasePending from './pages/PurchasePending';
import InvoiceList from './pages/InvoiceList';
import InvoiceAdd from './pages/InvoiceAdd';
import InvoicePending from './pages/InvoicePending';
import InventoryReport from './pages/InventoryReport';
import UserManagement from './pages/UserManagement';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userRole !== 'admin' && userRole !== 'manager') return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <AntApp> 
      <BrowserRouter>
        <Routes>
          {/* === CÁC ROUTE CÔNG KHAI === */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          
          {/* 2. Thêm Route Quên mật khẩu */}
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          
          {/* === CÁC ROUTE NỘI BỘ === */}
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} /> 
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="units" element={<Units />} />
            <Route path="categories" element={<Categories />} />
            <Route path="products" element={<Products />} />
            
            <Route path="purchases/new" element={<PurchaseAdd />} />
            <Route path="purchases/list" element={<PurchaseList />} />
            <Route path="purchases/pending" element={<PurchasePending />} />
            
            <Route path="invoices/list" element={<InvoiceList />} />
            <Route path="invoices/new" element={<InvoiceAdd />} />
            <Route path="invoices/pending" element={<InvoicePending />} />
            
            <Route path="inventory/report" element={<InventoryReport />} />
            
            <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AntApp>
  );
}

export default App;