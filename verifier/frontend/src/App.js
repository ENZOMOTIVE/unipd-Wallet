import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import './App.css';

const credentialTypes = {
  'UniversityDegree': ['name', 'degreeType', 'university', 'graduationDate'],
  'DriverLicense': ['name', 'licenseNumber', 'issueDate', 'expiryDate'],
  'PID': ['name', 'idNumber', 'dateOfBirth', 'address'],
  'ResidenceCertificate': ['name', 'address', 'issueDate', 'validUntil']
};

function App() {
  const [selectedCredential, setSelectedCredential] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  const generateCredentialRequest = async () => {
    if (!selectedCredential) {
      setError('Please select a credential type');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3006/generate-request', {
        credentialType: selectedCredential
      });

      setQrCodeData(response.data.request);
      setVerificationResult(null);
    } catch (error) {
      console.error('Error generating credential request:', error);
      setError('Failed to generate credential request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.get('http://localhost:3006/verification-status');
      setVerificationResult(response.data);
    } catch (error) {
      console.error('Error checking verification status:', error);
      setError('Failed to check verification status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCodeData)
      .then(() => {
        setCopySuccess('QR Code data copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 2000); // Clear the message after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy text:', err);
        setError('Failed to copy QR Code data.');
      });
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Credential Verifier</h1>
      </header>
      
      <main className="main-content">
        <div className="credential-selector">
          <label htmlFor="credentialType">Select Credential Type:</label>
          <select
            id="credentialType"
            value={selectedCredential}
            onChange={(e) => setSelectedCredential(e.target.value)}
          >
            <option value="">Select a credential type</option>
            {Object.keys(credentialTypes).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="button-group">
          <button
            onClick={generateCredentialRequest}
            disabled={isLoading}
            className="primary-button"
          >
            {isLoading ? 'Generating...' : 'Generate Credential Request'}
          </button>
          <button
            onClick={checkVerificationStatus}
            disabled={isLoading}
            className="secondary-button"
          >
            Check Verification Status
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {qrCodeData && (
          <div className="qr-code-container">
            <h2>Scan this QR Code:</h2>
            <QRCodeSVG value={qrCodeData} size={256} onClick={copyToClipboard} className="qr-code" />
            <p className="click-instruction">Click on the QR code to copy the data</p>
            {copySuccess && <p className="copy-success">{copySuccess}</p>}
          </div>
        )}

        {verificationResult && (
          <div className="verification-result">
            <h2>Verification Result:</h2>
            <pre>{JSON.stringify(verificationResult, null, 2)}</pre>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2024 Credential Verifier. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
