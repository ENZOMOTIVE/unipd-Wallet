import React, { useState } from 'react';
import axios from 'axios';

const Issuer = () => {
  const [userId, setUserId] = useState('');
  const [degree, setDegree] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issuedCredential, setIssuedCredential] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Sending POST request to backend to issue the JWT credential
      const response = await axios.post('http://localhost:3001/issue', {
        userId,
        degree,
        issuer,
      });

      // Store the issued JWT credential
      setIssuedCredential(response.data.credential);
    } catch (error) {
      console.error('Error issuing credential:', error);
    }
  };

  return (
    <div>
      <h1>Issuer Application</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>User ID:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Degree:</label>
          <input
            type="text"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Issuer:</label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            required
          />
        </div>
        <button type="submit">Issue Credential</button>
      </form>

      {issuedCredential && (
        <div>
          <h2>Issued Credential (JWT):</h2>
          <textarea
            rows="5"
            value={issuedCredential}
            readOnly
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );
};

export default Issuer;
