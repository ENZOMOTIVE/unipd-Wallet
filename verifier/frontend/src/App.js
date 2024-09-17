import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate a new session and QR code data when the component mounts
    generateSession();
  }, []);

  const generateSession = async () => {
    try {
      const response = await axios.post('http://localhost:3004/create-session');
      const { sessionId, authorizationRequest } = response.data;
      setSessionId(sessionId);
      setQrCodeData(JSON.stringify(authorizationRequest));
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating session:', error);
      setIsLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:3004/verify-status/${sessionId}`);
      if (response.data.status === 'completed') {
        setVerificationResult(response.data.result);
      } else {
        // If not completed, check again after a short delay
        setTimeout(checkVerificationStatus, 2000);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const handleScan = () => {
    // Start checking for verification status
    checkVerificationStatus();
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Verifier App</h1>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>Scan this QR code using your wallet to share credentials:</p>
          <QRCodeCanvas value={qrCodeData} size={256} />
          <button onClick={handleScan} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '18px' }}>
            I've scanned the QR code
          </button>
        </div>
      )}

      {verificationResult && (
        <div style={{ marginTop: '20px', color: verificationResult.isValid ? 'green' : 'red' }}>
          <h2>{verificationResult.isValid ? 'Verification Successful' : 'Verification Failed'}</h2>
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