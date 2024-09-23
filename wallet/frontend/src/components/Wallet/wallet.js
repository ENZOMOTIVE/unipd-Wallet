import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import './wallet.css';

const FIXED_PUBLIC_KEY = '1234';

function Wallet() {
  const [credentials, setCredentials] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scannedOffer, setScannedOffer] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [issuerInfo, setIssuerInfo] = useState('');
  const [expandedCredential, setExpandedCredential] = useState(null);

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

  const verifyProof = (credential) => {
    if (!credential.proof) {
      return false;
    }
    const { proof, ...credentialWithoutProof } = credential;
    const calculatedProof = crypto.createHmac('sha256', FIXED_PUBLIC_KEY)
      .update(JSON.stringify(credentialWithoutProof))
      .digest('hex');
    return calculatedProof === proof.proofValue;
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
    setExpandedCredential(null);
  };

  const renderCredentialCard = (jwtCredential, index) => {
    try {
      const decodedCredential = jwtDecode(jwtCredential);
      const credentialType = Array.isArray(decodedCredential.type) 
        ? decodedCredential.type.find(t => t !== 'VerifiableCredential') 
        : decodedCredential.type;

      return (
        <div 
          key={index} 
          className="credential-card" 
          onClick={() => setExpandedCredential(index)}
        >
          <h3>{credentialType || 'Unknown Credential'}</h3>
          <p>Issuer: {decodedCredential.iss || 'Unknown'}</p>
          <button 
            onClick={(e) => { e.stopPropagation(); deleteCredential(index); }} 
            className="delete-button"
          >
            Delete
          </button>
        </div>
      );
    } catch (error) {
      console.error('Error decoding credential:', error);
      return (
        <div key={index} className="credential-card error">
          <h3>Error Decoding Credential</h3>
          <p>Details: {error.message}</p>
        </div>
      );
    }
  };

  const renderExpandedCredential = (jwtCredential) => {
    try {
      const decodedCredential = jwtDecode(jwtCredential);

      return (
        <div className="expanded-credential">
          <h2>{Array.isArray(decodedCredential.type) ? decodedCredential.type.join(', ') : decodedCredential.type}</h2>
          <p><strong>Issuer:</strong> {decodedCredential.iss || 'Unknown'}</p>
          <p><strong>Issued At:</strong> {decodedCredential.iat ? new Date(decodedCredential.iat * 1000).toLocaleString() : 'Unknown'}</p>
          <p><strong>Expires At:</strong> {decodedCredential.exp ? new Date(decodedCredential.exp * 1000).toLocaleString() : 'Unknown'}</p>
          <h3>Credential Subject:</h3>
          <pre>{JSON.stringify(decodedCredential.credentialSubject, null, 2)}</pre>
          <h3>Proof:</h3>
          {decodedCredential.proof ? (
            <div>
              <p><strong>Type:</strong> {decodedCredential.proof.type}</p>
              <p><strong>Created:</strong> {decodedCredential.proof.created}</p>
              <p><strong>Verification Method:</strong> {decodedCredential.proof.verificationMethod}</p>
              <p><strong>Proof Purpose:</strong> {decodedCredential.proof.proofPurpose}</p>
              <p><strong>Proof Value:</strong> {decodedCredential.proof.proofValue}</p>
            </div>
          ) : (
            <p>No proof available</p>
          )}
          <button onClick={() => setExpandedCredential(null)} className="close-button">Close</button>
        </div>
      );
    } catch (error) {
      console.error('Error decoding credential:', error);
      return (
        <div className="expanded-credential error">
          <h2>Error Decoding Credential</h2>
          <p>Details: {error.message}</p>
          <p>Raw JWT:</p>
          <pre>{jwtCredential}</pre>
          <button onClick={() => setExpandedCredential(null)} className="close-button">Close</button>
        </div>
      );
    }
  };

  return (
    <div className="wallet-container">
      <header className="wallet-header">
        <div className="eu-stars">★★★★★</div>
        <h1>Digital Credential Wallet</h1>
      </header>
      <main className="wallet-content">
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
        {error && <p className="error-message">{error}</p>}
        <div className="credentials-list">
          {credentials.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📂</div>
              <p>No credentials yet. Scan a QR code to add a credential.</p>
            </div>
          ) : (
            credentials.map((jwtCredential, index) => renderCredentialCard(jwtCredential, index))
          )}
        </div>
      </main>
      {isConfirmationModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Credential Reception</h2>
            <p>Do you want to receive a credential from {issuerInfo}?</p>
            <div className="modal-buttons">
              <button onClick={() => handleConfirmation(true)}>Yes</button>
              <button onClick={() => handleConfirmation(false)}>No</button>
            </div>
          </div>
        </div>
      )}
      {expandedCredential !== null && (
        <div className="modal">
          <div className="modal-content expanded-credential-modal">
            {renderExpandedCredential(credentials[expandedCredential])}
          </div>
        </div>
      )}
      <footer className="wallet-footer">
        <p>© 2024 Digital Credential Wallet. All rights reserved.</p>
        <p>Made with ❤️ by Aayushman</p>
      </footer>
    </div>
  );
}

export default Wallet;