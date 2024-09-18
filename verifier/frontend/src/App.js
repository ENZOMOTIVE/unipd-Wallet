import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';

const credentialTypes = [
  'UniversityDegreeCredential',
  'DriverLicenseCredential',
  'PIDCredential',
  'ResidenceCertificateCredential'
];

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState([]);

  const handleCredentialSelection = (credType) => {
    setSelectedCredentials(prev => 
      prev.includes(credType) 
        ? prev.filter(type => type !== credType)
        : [...prev, credType]
    );
  };

  const generateSession = async () => {
    if (selectedCredentials.length === 0) {
      alert('Please select at least one credential type.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3004/create-session', { selectedCredentials });
      const { sessionId, qrCodeData } = response.data;
      setSessionId(sessionId);
      setQrCodeData(qrCodeData);
    } catch (error) {
      console.error('Error generating session:', error);
      alert('Error generating session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:3004/verify-status/${sessionId}`);
      if (response.data.status === 'completed') {
        setVerificationResult(response.data);
      } else {
        setTimeout(checkVerificationStatus, 2000);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const handleScan = () => {
    checkVerificationStatus();
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>OID4VP Verifier App</h1>
      <div style={{ marginBottom: '20px' }}>
        <h3>Select Credentials to Request:</h3>
        {credentialTypes.map(credType => (
          <label key={credType} style={{ display: 'block', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={selectedCredentials.includes(credType)}
              onChange={() => handleCredentialSelection(credType)}
            />
            {credType}
          </label>
        ))}
        <button 
          onClick={generateSession} 
          disabled={isLoading}
          style={{ marginTop: '10px', padding: '10px 20px', fontSize: '16px' }}
        >
          {isLoading ? 'Generating...' : 'Generate Request'}
        </button>
      </div>
      {qrCodeData && (
        <div>
          <p>Scan this QR code using your OID4VP-compatible wallet:</p>
          <QRCodeCanvas value={qrCodeData} size={256} />
          <button 
            onClick={handleScan} 
            style={{ marginTop: '20px', padding: '10px 20px', fontSize: '18px' }}
          >
            I've scanned the QR code
          </button>
        </div>
      )}
      {verificationResult && (
        <div style={{ marginTop: '20px', color: verificationResult.isValid ? 'green' : 'red' }}>
          <h2>{verificationResult.isValid ? 'Verification Successful' : 'Verification Failed'}</h2>
          {verificationResult.error && <p>Error: {verificationResult.error}</p>}
          {verificationResult.sharedCredentials && (
            <div>
              <h3>Shared Credentials:</h3>
              <pre>{JSON.stringify(verificationResult.sharedCredentials, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;