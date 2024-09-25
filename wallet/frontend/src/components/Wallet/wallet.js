import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import './wallet.css';
import { SignJWT } from 'jose';

const FIXED_PUBLIC_KEY = '1234';

function Wallet() {
  const [credentials, setCredentials] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [issuerInfo, setIssuerInfo] = useState('');
  const [expandedCredential, setExpandedCredential] = useState(null);
  const [scanMode, setScanMode] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [inputMethod, setInputMethod] = useState('qr');
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    const storedCredentials = JSON.parse(localStorage.getItem('credentials')) || [];
    setCredentials(storedCredentials);
  }, []);

  const handleScan = (result) => {
    if (result) {
      console.log('QR code scanned:', result);
      setIsScanning(false);
      processInput(result.text);
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      processInput(manualInput);
    } else {
      setError('Please enter valid data before submitting.');
    }
  };

  const processInput = (inputData) => {
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(inputData);
      } catch {
        parsedData = jwtDecode(inputData);
      }
      console.log('Parsed input data:', parsedData);
      setScannedData(parsedData);
      if (scanMode === 'issuance') {
        setIssuerInfo(parsedData.credential_issuer || 'Unknown Issuer');
      }
      setIsConfirmationModalOpen(true);
      setError(null);
    } catch (error) {
      console.error('Error processing input:', error);
      setError('Failed to process input. Please ensure it\'s valid JSON or JWT.');
    }
  };

  const handleConfirmation = async (confirmed) => {
    setIsConfirmationModalOpen(false);
    if (confirmed) {
      if (scanMode === 'issuance') {
        await processCredentialOffer(scannedData);
      } else if (scanMode === 'presentation') {
        await handlePresentationRequest(scannedData);
      }
    }
    setScannedData(null);
    setScanMode(null);
    setManualInput('');
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

      setSuccessMessage('Credential successfully issued and stored.');
      setError(null);
    } catch (error) {
      console.error('Error in credential issuance:', error.response || error);
      setError(error.response?.data?.error || error.message || 'Failed to issue credential. Please try again.');
    }
  };

  const handlePresentationRequest = async (request) => {
    try {
      console.log('Received presentation request:', request);
      const { presentation_definition, client_id, nonce, state } = request;
  
      if (!presentation_definition || !client_id || !nonce || !state) {
        throw new Error('Invalid presentation request: missing required fields');
      }
  
      const matchingCredential = credentials.find(cred => {
        const decodedCred = jwtDecode(cred);
        return presentation_definition.input_descriptors.some(descriptor =>
          decodedCred.type.includes(descriptor.name)
        );
      });
  
      if (!matchingCredential) {
        throw new Error('No matching credential found');
      }
  
      console.log('Matching credential found:', matchingCredential);
  
      const vpToken = {
        iss: 'self',
        aud: client_id,
        nonce: nonce,
        vp: {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiablePresentation'],
          verifiableCredential: [matchingCredential]
        }
      };
  
      console.log('Created VP token payload:', vpToken);
  
      // Sign the VP token
      const signedVpToken = await signVpToken(vpToken);
  
      console.log('Sending presentation to:', client_id);
      const response = await axios.post(client_id, {
        vp_token: signedVpToken,
        state: state
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      console.log('Presentation response:', response.data);
      setSuccessMessage('Credential successfully presented to the verifier.');
      setError(null);
    } catch (error) {
      console.error('Error in credential presentation:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      setError(error.message || 'Failed to present credential. Please try again.');
    }
  };
  
  // Function to sign the VP token
  const signVpToken = async (vpToken) => {
    // In a real-world scenario, you would use a proper key pair for signing
    // For this example, we'll use a dummy key
    const secretKey = new TextEncoder().encode('your-secret-key');
  
    const jwt = await new SignJWT(vpToken)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);
  
    return jwt;
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
        <h1>Wallet</h1>
      </header>
      <main className="wallet-content">
        <div className="input-method-toggle">
          <button 
            onClick={() => setInputMethod('qr')} 
            className={inputMethod === 'qr' ? 'active' : ''}
          >
            QR Scan
          </button>
          <button 
            onClick={() => setInputMethod('manual')} 
            className={inputMethod === 'manual' ? 'active' : ''}
          >
            Manual Input
          </button>
        </div>
        
        {inputMethod === 'qr' ? (
          <div className="scan-buttons">
            <button onClick={() => { setIsScanning(true); setScanMode('issuance'); }} className="scan-button">
              Scan for Credential Issuance
            </button>
            <button onClick={() => { setIsScanning(true); setScanMode('presentation'); }} className="scan-button">
              Scan for Credential Presentation
            </button>
            {isScanning && (
              <QrReader
                onResult={handleScan}
                constraints={{ facingMode: 'environment' }}
                className="qr-reader"
              />
            )}
          </div>
        ) : (
          <div className="manual-input">
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter credential offer or presentation request (JSON or JWT)"
              rows="6"
              className="manual-input-textarea"
            />
            <div className="manual-input-buttons">
              <button onClick={() => { setScanMode('issuance'); handleManualSubmit(); }} className="submit-button">
                Submit for Issuance
              </button>
              <button onClick={() => { setScanMode('presentation'); handleManualSubmit(); }} className="submit-button">
                Submit for Presentation
              </button>
            </div>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        
        <div className="credentials-list">
          <h2>Your Credentials</h2>
          {credentials.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📂</div>
              <p>No credentials yet. Scan a QR code or enter data manually to add a credential.</p>
            </div>
          ) : (
            credentials.map((jwtCredential, index) => renderCredentialCard(jwtCredential, index))
          )}
        </div>
      </main>
      {isConfirmationModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Action</h2>
            <p>
              {scanMode === 'issuance' 
                ? `Do you want to receive a credential from ${issuerInfo}?`
                : 'Do you want to present your credential to the verifier?'}
            </p>
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
    </div>
  );
}

export default Wallet;