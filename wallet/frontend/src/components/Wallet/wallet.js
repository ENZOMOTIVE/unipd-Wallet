// Frontend (src/App.js)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QrReader } from 'react-qr-reader';

function Wallet() {
  const [credentials, setCredentials] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedCredentials = JSON.parse(localStorage.getItem('credentials')) || [];
    setCredentials(storedCredentials);
  }, []);

  const handleScan = async (result) => {
    if (result) {
      setIsScanning(false);
      try {
        const credentialOffer = JSON.parse(result.text);
        await processCredentialOffer(credentialOffer);
      } catch (error) {
        console.error('Error processing QR code:', error);
        setError('Failed to process QR code. Please try again.');
      }
    }
  };

  const processCredentialOffer = async (credentialOffer) => {
    try {
      // Exchange pre-authorized code for access token
      const tokenResponse = await axios.post(
        `${credentialOffer.credential_issuer}/token`,
        {
          grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
          'pre-authorized_code': credentialOffer.grants['urn:ietf:params:oauth:grant-type:pre-authorized_code']['pre-authorized_code'],
        }
      );

      const { access_token } = tokenResponse.data;

      // Request the credential
      const credentialResponse = await axios.post(
        `${credentialOffer.credential_issuer}/credential`,
        { type: credentialOffer.credentials[0] },
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      const newCredential = credentialResponse.data;

      // Store the credential (in a real app, this would be more secure)
      await axios.post('http://localhost:3002/store-credential', { credential: newCredential });

      // Add new credential to state and local storage
      const updatedCredentials = [...credentials, newCredential];
      setCredentials(updatedCredentials);
      localStorage.setItem('credentials', JSON.stringify(updatedCredentials));

      setError(null);
    } catch (error) {
      console.error('Error in credential issuance:', error);
      setError('Failed to issue credential. Please try again.');
    }
  };

  const deleteCredential = (index) => {
    const updatedCredentials = credentials.filter((_, i) => i !== index);
    setCredentials(updatedCredentials);
    localStorage.setItem('credentials', JSON.stringify(updatedCredentials));
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
          style={{ width: '100%' }}
          constraints={{ facingMode: 'environment' }}
        />
      )}
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