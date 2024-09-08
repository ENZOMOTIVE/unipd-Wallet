import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Main Wallet Component
const Wallet = () => {
  const [credentials, setCredentials] = useState([]);
  const [jwt, setJwt] = useState('');
  const [password, setPassword] = useState('');
  const [decryptedData, setDecryptedData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedCredentials = JSON.parse(localStorage.getItem('credentials')) || [];
    setCredentials(storedCredentials);
  }, []);

  const addCredential = async (jwtCredential) => {
    try {
      const response = await axios.post('http://localhost:3000/decrypt', {
        token: jwtCredential,
        password: '1234', // Example password, adjust if needed
      });
      setDecryptedData(response.data.data);
      setError(null);
    } catch (error) {
      setError('Error decrypting token: ' + error.response?.data?.error || error.message);
      setDecryptedData(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addCredential(jwt);
  };

  return (
    <div>
      <h1>My Wallet</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
          placeholder="Enter JWT Credential"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter Password"
        />
        <button type="submit">Add Credential</button>
      </form>
      {error && <p>{error}</p>}
      {decryptedData && (
        <div>
          <h2>Decrypted Data:</h2>
          <pre>{JSON.stringify(decryptedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Wallet;
