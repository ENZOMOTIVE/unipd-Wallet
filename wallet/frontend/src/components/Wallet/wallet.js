import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QrReader } from 'react-qr-reader';
import { jwtDecode } from 'jwt-decode';

export default function Wallet() {
  const [credentials, setCredentials] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scannedOffer, setScannedOffer] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [issuerInfo, setIssuerInfo] = useState('');

  useEffect(() => {
    const storedCredentials = JSON.parse(localStorage.getItem('credentials')) || [];
    setCredentials(storedCredentials);
  }, []);

  const handleScan = (result) => {
    if (result) {
      console.log('QR code scanned:', result);
      setIsScanning(false);
      try {
        const credentialOffer = JSON.parse(result.text);
        console.log('Parsed credential offer:', credentialOffer);
        setScannedOffer(credentialOffer);
        setIssuerInfo(credentialOffer.credential_issuer);
        setIsConfirmationModalOpen(true);
      } catch (error) {
        console.error('Error processing QR code:', error);
        setError('Failed to process QR code. Please try again.');
      }
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
      console.log('Processing credential offer:', credentialOffer);
      const tokenResponse = await axios.post(
        `${credentialOffer.credential_issuer}/token`,
        {
          grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
          pre_authorized_code: credentialOffer.grants['urn:ietf:params:oauth:grant-type:pre-authorized_code']['pre-authorized_code'],
        }
      );

      console.log('Token response:', tokenResponse.data);
      const { access_token, c_nonce } = tokenResponse.data;

      // In a real implementation, generate a proper proof here
      const proof = { proof_type: 'jwt', jwt: 'dummy_proof' };

      const credentialResponse = await axios.post(
        `${credentialOffer.credential_issuer}/credential`,
        { 
          format: 'jwt_vc',
          proof: proof
        },
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      console.log('Credential response:', credentialResponse.data);

      if (credentialResponse.data.format !== 'jwt_vc' || !credentialResponse.data.credential) {
        throw new Error('Received credential is not in the expected JWT_VC format');
      }

      const jwtCredential = credentialResponse.data.credential;

      setCredentials(prevCredentials => {
        const updatedCredentials = [...prevCredentials, jwtCredential];
        localStorage.setItem('credentials', JSON.stringify(updatedCredentials));
        return updatedCredentials;
      });

      setError(null);
    } catch (error) {
      console.error('Error in credential issuance:', error.response || error);
      setError(error.response?.data?.error || error.message || 'Failed to issue credential. Please try again.');
    }
  };

  const deleteCredential = (index) => {
    setCredentials(prevCredentials => {
      const updatedCredentials = prevCredentials.filter((_, i) => i !== index);
      localStorage.setItem('credentials', JSON.stringify(updatedCredentials));
      return updatedCredentials;
    });
  };

  const renderCredential = (jwtCredential) => {
    try {
      const decodedCredential = jwtDecode(jwtCredential);

      if (!decodedCredential.type || !decodedCredential.credentialSubject) {
        throw new Error('Credential does not have the expected structure');
      }

      return (
        <div className="credential-card">
          <h4>{Array.isArray(decodedCredential.type) ? decodedCredential.type.join(', ') : decodedCredential.type}</h4>
          <p>Issuer: {decodedCredential.iss || 'Unknown'}</p>
          <p>Issued At: {decodedCredential.iat ? new Date(decodedCredential.iat * 1000).toLocaleString() : 'Unknown'}</p>
          <p>Expires At: {decodedCredential.exp ? new Date(decodedCredential.exp * 1000).toLocaleString() : 'Unknown'}</p>
          <h5>Credential Subject:</h5>
          <pre>{JSON.stringify(decodedCredential.credentialSubject, null, 2)}</pre>
        </div>
      );
    } catch (error) {
      console.error('Error decoding credential:', error);
      return (
        <div className="credential-card error">
          <h4>Error Decoding Credential</h4>
          <p>Details: {error.message}</p>
          <p>Raw JWT:</p>
          <pre>{jwtCredential}</pre>
        </div>
      );
    }
  };

  return (
    <div className="wallet-container">
      <h1>My OID4VCI Wallet</h1>
      {!isScanning && (
        <button onClick={() => setIsScanning(true)} className="scan-button">Scan QR Code</button>
      )}
      {isScanning && (
        <QrReader
          onResult={handleScan}
          constraints={{ facingMode: 'environment' }}
          className="qr-reader"
        />
      )}
      {isConfirmationModalOpen && (
        <div className="modal">
          <h2>Confirm Credential Reception</h2>
          <p>Do you want to receive a credential from {issuerInfo}?</p>
          <button onClick={() => handleConfirmation(true)}>Yes</button>
          <button onClick={() => handleConfirmation(false)}>No</button>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
      <div className="credentials-list">
        {credentials.map((jwtCredential, index) => (
          <div key={index} className="credential-item">
            <h3>Credential {index + 1}</h3>
            {renderCredential(jwtCredential)}
            <button onClick={() => deleteCredential(index)} className="delete-button">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}