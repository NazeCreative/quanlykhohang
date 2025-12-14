import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import 'antd/dist/reset.css';
import './index.css';
import { AuthProvider } from './context/AuthContext';

// --- Import ConfigProvider và theme ---
import { ConfigProvider, theme } from 'antd';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* --- Bọc toàn bộ app trong ConfigProvider --- */}
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm, 
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  </React.StrictMode>,
);