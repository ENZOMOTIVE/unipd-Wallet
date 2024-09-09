import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Wallet = () => {
  const [credentials, setCredentials] = useState([]);  // Store credentials
  const [jwt, setJwt] = useState('');                  // JWT input value
  const [password, setPassword] = useState('');        // Password input value
  const [decryptedData, setDecryptedData] = useState(null); // Decrypted data
  const [error, setError] = useState(null);            // Error message

  // Retrieve stored credentials on load
  useEffect(() => {
    const storedCredentials = JSON.parse(localStorage.getItem('credentials')) || [];
    setCredentials(storedCredentials);
  }, []);

  // Function to handle credential decryption request
  const addCredential = async (jwtCredential) => {
    try {
      const response = await axios.post('http://localhost:3000/decrypt', {
        token: jwtCredential,
        password: password, // Password from the input field
      });
      setDecryptedData(response.data.data); // Save the decrypted data
      setError(null);  // Reset any errors
    } catch (error) {
      // Handle different error cases
      if (error.response) {
        // Server responded with a status other than 2xx
        setError('Error decrypting token: ' + error.response.data.error);
      } else if (error.request) {
        // Request was made but no response was received
        setError('No response from server. Check the backend server.');
      } else {
        // Something else happened
        setError('Request error: ' + error.message);
      }
      setDecryptedData(null);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    addCredential(jwt); // Call the addCredential function on form submit
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

      {/* Display error message if exists */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Display decrypted data if available */}
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
