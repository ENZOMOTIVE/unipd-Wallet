import React, { useState } from 'react';
import axios from 'axios';

function Issuer() {
  const [userId, setUserId] = useState('');
  const [degree, setDegree] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/create-offer', { userId, degree });
      setQrCodeUrl(response.data.qrCodeUrl);
      setError(null);
    } catch (error) {
      console.error('Error creating credential offer:', error);
      setError('Failed to create credential offer. Please try again.');
    }
  };

  return (
    <div className="App">
      <h1>Credential Issuer</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="userId">User ID:</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="degree">Degree:</label>
          <input
            type="text"
            id="degree"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            required
          />
        </div>
        <button type="submit">Generate Credential Offer</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {qrCodeUrl && (
        <div>
          <h2>Scan this QR Code with your wallet app:</h2>
          <img src={qrCodeUrl} alt="Credential Offer QR Code" />
        </div>
      )}
    </div>
  );
}

export default Issuer;