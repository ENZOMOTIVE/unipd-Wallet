import React, { useState, useEffect } from 'react';

// Main Wallet Component
const Wallet = () => {
  // State to hold the credentials
  const [credentials, setCredentials] = useState([]);

  // Retrieve stored credentials from localStorage when the component first mounts
  useEffect(() => {
    const storedCredentials = JSON.parse(localStorage.getItem('credentials')) || [];
    setCredentials(storedCredentials);
  }, []);

  // Function to add a new JWT credential to the wallet and store it in localStorage
  const addCredential = (jwtCredential) => {
    const updatedCredentials = [...credentials, jwtCredential];
    // Store updated credentials in localStorage
    localStorage.setItem('credentials', JSON.stringify(updatedCredentials));
    // Update the credentials state
    setCredentials(updatedCredentials);
  };

  return (
    <div>
      <h1>My Wallet</h1>
      {/* Render the list of credentials */}
      <ul>
        {credentials.map((cred, index) => (
          <li key={index}>{cred}</li>
        ))}
      </ul>
      {/* Component to Add New Credential */}
      <AddCredentialForm onAdd={addCredential} />
    </div>
  );
};

// Component to handle adding new credentials (JWT)
const AddCredentialForm = ({ onAdd }) => {
  // State to hold the JWT input by the user
  const [jwt, setJwt] = useState('');

  // Handle form submission to add a new JWT credential
  const handleSubmit = (e) => {
    e.preventDefault();
    // Call the onAdd function to add the credential to the Wallet
    onAdd(jwt);
    // Clear the input field after submission
    setJwt('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={jwt}
        onChange={(e) => setJwt(e.target.value)}
        placeholder="Enter JWT Credential"
      />
      <button type="submit">Add Credential</button>
    </form>
  );
};

export default Wallet;
