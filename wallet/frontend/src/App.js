import React from 'react';
import Wallet from './components/Wallet/wallet';  // Import the Wallet component

// Main App Component
const App = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Credential Wallet</h1>
      </header>
      <main style={styles.main}>
        <Wallet />
      </main>
    </div>
  );
};

// Basic styles to enhance the look and feel
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
    minHeight: '100vh',
    padding: '20px'
  },
  header: {
    backgroundColor: '#282c34',
    padding: '20px',
    color: 'white'
  },
  title: {
    fontSize: '2.5rem',
    margin: '0'
  },
  main: {
    marginTop: '40px'
  }
};

export default App;
