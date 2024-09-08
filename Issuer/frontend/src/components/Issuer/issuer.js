import React, { useState } from 'react';
import axios from 'axios';

const Issuer = () => {
  const [userId, setUserId] = useState('');
  const [degree, setDegree] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issuedCredential, setIssuedCredential] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(''); // To store the QR code data

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Sending POST request to backend to issue the JWT credential
      const response = await axios.post('http://localhost:3001/issue', {
        userId,
        degree,
        issuer,
      });

      // Store the issued JWT credential, QR code URL, and QR code data
      setIssuedCredential(response.data.credential);
      setQrCodeUrl(response.data.qrCodeUrl);
      setQrCodeData(response.data.credential); // Assuming QR code contains the JWT

      console.log('QR Code URL:', response.data.qrCodeUrl); // Debugging line
    } catch (error) {
      console.error('Error issuing credential:', error);
    }
  };

  const handleCopyClick = () => {
    // Copy QR code data to clipboard
    navigator.clipboard.writeText(qrCodeData)
      .then(() => alert('QR code data copied to clipboard!'))
      .catch((error) => console.error('Error copying QR code data:', error));
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
          {qrCodeUrl && (
            <div>
              <h2>QR Code:</h2>
              <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '100%', height: 'auto' }} />
              <button onClick={handleCopyClick}>Copy QR Code Data</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Issuer;
