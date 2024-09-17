import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QrReader } from 'react-qr-reader';

function Modal({ children, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '5px',
        maxWidth: '400px',
        width: '100%'
      }}>
        {children}
        <button onClick={onClose} style={{ marginTop: '10px' }}>Close</button>
      </div>
    </div>
  );
}

function Wallet() {
  const [credentials, setCredentials] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scannedOffer, setScannedOffer] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [issuerInfo, setIssuerInfo] = useState('');

  useEffect(() => {
    const storedCredentials = JSON.parse(localStorage.getItem('credentials')) || [];
    setCredentials(storedCredentials);
  }, []);

  const handleScan = (result) => {
    if (result) {
      setIsScanning(false);
      try {
        const credentialOffer = JSON.parse(result.text);
        setScannedOffer(credentialOffer);
        setIssuerInfo(credentialOffer.credential_issuer);
        setIsPasswordModalOpen(true);
      } catch (error) {
        console.error('Error processing QR code:', error);
        setError('Failed to process QR code. Please try again.');
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3002/verify-password', { password });
      if (response.data.success) {
        setIsPasswordModalOpen(false);
        setIsConfirmationModalOpen(true);
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setError('Failed to verify password. Please try again.');
    }
  };

  const handleConfirmation = async (confirmed) => {
    setIsConfirmationModalOpen(false);
    if (confirmed) {
      await processCredentialOffer(scannedOffer);
    }
    setScannedOffer(null);
  };

  const processCredentialOffer = async (credentialOffer) => {
    try {
      const tokenResponse = await axios.post(
        `${credentialOffer.credential_issuer}/token`,
        {
          grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
          'pre-authorized_code': credentialOffer.grants['urn:ietf:params:oauth:grant-type:pre-authorized_code']['pre-authorized_code'],
        }
      );

      const { access_token } = tokenResponse.data;

      const credentialResponse = await axios.post(
        `${credentialOffer.credential_issuer}/credential`,
        { type: credentialOffer.credentials[0] },
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      const newCredential = credentialResponse.data;

      await axios.post('http://localhost:3002/store-credential', { credential: newCredential });

      setCredentials(prevCredentials => {
        const updatedCredentials = [...prevCredentials, newCredential];
        localStorage.setItem('credentials', JSON.stringify(updatedCredentials));
        return updatedCredentials;
      });

      setError(null);
    } catch (error) {
      console.error('Error in credential issuance:', error);
      setError('Failed to issue credential. Please try again.');
    }
  };

  const deleteCredential = (index) => {
    setCredentials(prevCredentials => {
      const updatedCredentials = prevCredentials.filter((_, i) => i !== index);
      localStorage.setItem('credentials', JSON.stringify(updatedCredentials));
      return updatedCredentials;
    });
  };

  return (
    <div className="App">
      <h1>My OID4VCI Wallet</h1>
      {!isScanning && (
        <button onClick={() => setIsScanning(true)}>Scan QR Code</button>
      )}
      {isScanning && (
        <QrReader
          onResult={handleScan}
          constraints={{ facingMode: 'environment' }}
        />
      )}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)}>
        <h2>Authorization Required</h2>
        <form onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          <button type="submit">Submit</button>
        </form>
      </Modal>
      <Modal isOpen={isConfirmationModalOpen} onClose={() => setIsConfirmationModalOpen(false)}>
        <h2>Confirm Credential Reception</h2>
        <p>Do you want to receive verifiable credentials from the Issuer: {issuerInfo}?</p>
        <button onClick={() => handleConfirmation(true)}>Confirm</button>
        <button onClick={() => handleConfirmation(false)}>Reject</button>
      </Modal>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="cards-container">
        {credentials.map((credential, index) => (
          <div className="card" key={index}>
            <h3>Credential {index + 1}</h3>
            <pre>{JSON.stringify(credential, null, 2)}</pre>
            <button onClick={() => deleteCredential(index)} style={{ backgroundColor: 'red', color: 'white', padding: '8px', borderRadius: '5px', border: 'none' }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Wallet;