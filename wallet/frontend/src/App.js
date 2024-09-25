import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Wallet from './components/Wallet/wallet';
import OID4VP from './components/OID4VP/OID4VP';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/oid4vc" element={<Wallet />} />
            <Route path="/oid4vp" element={<OID4VP />} />
            <Route path="/" element={<Navigate to="/oid4vc" replace />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>© 2024 Digital Credential Wallet. All rights reserved.</p>
          <p>Made with ❤️ by Aayushman</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;