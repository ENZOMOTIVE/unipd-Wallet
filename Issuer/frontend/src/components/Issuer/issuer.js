import React, { useState, useEffect } from 'react';
import axios from 'axios';

const credentialTypes = {
  'UniversityDegree': ['name', 'degreeType', 'university', 'graduationDate'],
  'DriverLicense': ['name', 'licenseNumber', 'issueDate', 'expiryDate'],
  'PID': ['name', 'idNumber', 'dateOfBirth', 'address'],
  'ResidenceCertificate': ['name', 'address', 'issueDate', 'validUntil']
};

function Issuer() {
  const [userId, setUserId] = useState('');
  const [credentialType, setCredentialType] = useState('');
  const [credentialFields, setCredentialFields] = useState({});
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (credentialType) {
      const initialFields = credentialTypes[credentialType].reduce((acc, field) => {
        acc[field] = '';
        return acc;
      }, {});
      setCredentialFields(initialFields);
    }
  }, [credentialType]);

  const handleFieldChange = (field, value) => {
    setCredentialFields(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/create-offer', {
        userId,
        credentialType,
        credentialFields
      });
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
          <label htmlFor="credentialType">Credential Type:</label>
          <select
            id="credentialType"
            value={credentialType}
            onChange={(e) => setCredentialType(e.target.value)}
            required
          >
            <option value="">Select a type</option>
            {Object.keys(credentialTypes).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        {credentialType && credentialTypes[credentialType].map(field => (
          <div key={field}>
            <label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
            <input
              type="text"
              id={field}
              value={credentialFields[field]}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              required
            />
          </div>
        ))}
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