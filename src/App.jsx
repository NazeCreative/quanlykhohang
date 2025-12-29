import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp, message } from 'antd'; // Thêm message để thông báo
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';

import MainLayout from './components/MainLayout';
// ... Import các trang cũ của bạn ...
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
import UserManagement from './pages/UserManagement'; // <-- Import trang UserManagement

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/" replace />;
  return children;
};

// --- LOGIC MỚI: Route dành riêng cho Admin ---
const AdminRoute = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" replace />;
  
  // Nếu đã đăng nhập nhưng không phải admin -> Đá về trang chủ
  if (userRole !== 'admin') {
    // Có thể hiện thông báo nếu muốn (cần useEffect)
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AntApp> 
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} /> 
            
            {/* ... Các route cũ giữ nguyên ... */}
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

            {/* --- ROUTE MỚI: Chỉ Admin mới vào được --- */}
            <Route 
              path="users" 
              element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              } 
            />

          </Route>
        </Routes>
      </BrowserRouter>
    </AntApp>
  );
}

export default App;