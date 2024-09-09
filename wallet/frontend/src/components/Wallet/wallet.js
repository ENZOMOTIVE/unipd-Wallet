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

  // Function to check for duplicates before adding a new credential
  const isDuplicateCredential = (newCredential) => {
    return credentials.some(credential => credential.token === newCredential.token);
  };

  // Function to handle credential decryption request
  const addCredential = async (jwtCredential) => {
    try {
      const response = await axios.post('http://localhost:3000/decrypt', {
        token: jwtCredential,
        password: password, // Password from the input field
      });

      const decryptedCredential = { token: jwtCredential, data: response.data.data };

      // Check if the credential already exists
      if (!isDuplicateCredential(decryptedCredential)) {
        const updatedCredentials = [...credentials, decryptedCredential];
        setCredentials(updatedCredentials); // Add the new decrypted credential to the list
        
        // Save updated credentials to localStorage
        localStorage.setItem('credentials', JSON.stringify(updatedCredentials));

        setDecryptedData(decryptedCredential); // Save the decrypted data
        setError(null);  // Reset any errors
      } else {
        setError('Duplicate credential detected!'); // Error for duplicate
      }

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

  // Function to delete a credential
  const deleteCredential = (index) => {
    const updatedCredentials = credentials.filter((_, i) => i !== index);
    setCredentials(updatedCredentials);
    localStorage.setItem('credentials', JSON.stringify(updatedCredentials));
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

      <div className="cards-container">
        {/* Map through credentials and display each in a card format */}
        {credentials.map((credential, index) => (
          <div className="card" key={index}>
            <h3>Credential {index + 1}</h3>
            <pre>{JSON.stringify(credential.data, null, 2)}</pre>
            <button onClick={() => deleteCredential(index)} style={{ backgroundColor: 'red', color: 'white', padding: '8px', borderRadius: '5px', border: 'none' }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wallet;
