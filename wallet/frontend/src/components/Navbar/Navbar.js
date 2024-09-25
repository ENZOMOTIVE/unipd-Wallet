import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-title">User Wallet</h1>
        <div className="navbar-links">
          <Link to="/oid4vc" className="navbar-link">OID4VC</Link>
          <Link to="/oid4vp" className="navbar-link">OID4VP</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;