import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // Use QRCodeCanvas for QR code generation
import axios from 'axios';

const App = () => {
  const [sessionId, setSessionId] = useState('session123'); // A sample session ID; you can dynamically generate it.
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifiablePresentation, setVerifiablePresentation] = useState('');

  // Handle submission of the verifiable presentation
  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:3000/verify', {
        verifiablePresentation,
        sessionId,
      });
      setVerificationResult(response.data.message);
    } catch (error) {
      setVerificationResult(
        error.response ? error.response.data.error : 'Verification failed'
      );
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Verifier App</h1>

      {/* QR Code Section */}
      <div>
        <p>Scan this QR code using your wallet to request credentials:</p>
        {/* QRCodeCanvas component generates the QR code with the session data */}
        <QRCodeCanvas value={JSON.stringify({ sessionId })} size={256} />
      </div>

      {/* User Input for Verifiable Presentation */}
      <div style={{ marginTop: '20px' }}>
        <h2>Enter Verifiable Presentation</h2>
        <textarea
          value={verifiablePresentation}
          onChange={(e) => setVerifiablePresentation(e.target.value)}
          rows={10}
          cols={50}
          placeholder="Paste verifiable presentation here..."
          style={{ padding: '10px', fontSize: '16px' }}
        />
      </div>

      {/* Submit Button */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={handleSubmit} style={{ padding: '10px 20px', fontSize: '18px' }}>
          Verify
        </button>
      </div>

      {/* Display the verification result */}
      {verificationResult && (
        <div style={{ marginTop: '20px', color: verificationResult.includes('valid') ? 'green' : 'red' }}>
          <h2>{verificationResult}</h2>
        </div>
      )}
    </div>
  );
};

export default App;
