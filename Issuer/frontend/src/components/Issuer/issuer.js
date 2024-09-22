import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Issuer.css';

// The backend API deployed on render
// const base_url= "https://unipd-wallet.onrender.com";

//The backend when hosted on local server
const local_server="http://localhost:3001";

const credentialTypes = {
  'UniversityDegree': ['name', 'degreeType', 'university', 'graduationDate'],
  'DriverLicense': ['name', 'licenseNumber', 'issueDate', 'expiryDate'],
  'PID': ['name', 'idNumber', 'dateOfBirth', 'address'],
  'ResidenceCertificate': ['name', 'address', 'issueDate', 'validUntil']
};

export default function Issuer() {
  const [userId, setUserId] = useState('');
  const [credentialType, setCredentialType] = useState('');
  const [credentialFields, setCredentialFields] = useState({});
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    try {
      const response = await axios.post(`${local_server}/create-offer`, {
        userId,
        credentialType,
        credentialFields
      });
      if (response.data.qrCodeUrl) {
        setQrCodeUrl(response.data.qrCodeUrl);
        setError(null);
      } else {
        throw new Error('QR code URL not received');
      }
    } catch (error) {
      console.error('Error creating credential offer:', error);
      setError(error.response?.data?.error || 'Failed to create credential offer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="issuer-container">
      <div className="issuer-card">
        <h1 className="issuer-title">Credential Issuer</h1>
        <form onSubmit={handleSubmit} className="issuer-form">
          <div className="form-group">
            <label htmlFor="userId">User ID:</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
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
          {credentialType && (
            <div className="dynamic-fields">
              {credentialTypes[credentialType].map(field => (
                <div key={field} className="form-group">
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
            </div>
          )}
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Credential Offer'}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
        {qrCodeUrl && (
          <div className="qr-code-container">
            <h2>Scan this QR Code with your wallet app:</h2>
            <img src={qrCodeUrl} alt="Credential Offer QR Code" className="qr-code" />
          </div>
        )}
      </div>
    </div>
  );
}