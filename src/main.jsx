import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1828',
          color: '#e8e6f0',
          border: '1px solid #2e2a45',
          borderRadius: '10px',
          fontSize: '13px',
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#1a1828' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#1a1828' } },
      }}
    />
  </React.StrictMode>
);
