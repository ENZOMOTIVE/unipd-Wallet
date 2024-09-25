import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

function CredentialPresentation({ credentials = [] }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedRequest, setScannedRequest] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleScan = (result) => {
    if (result) {
      console.log('QR code scanned:', result);
      setIsScanning(false);
      processRequest(result.text);
    }
  };

  const processRequest = (requestText) => {
    try {
      const decodedRequest = jwtDecode(requestText);
      console.log('Decoded presentation request:', decodedRequest);
      setScannedRequest(decodedRequest);
      setIsConfirmationModalOpen(true);
      setError(null);
    } catch (error) {
      console.error('Error processing request:', error);
      setError('Failed to process request. Please ensure it\'s a valid JWT.');
    }
  };

  const handleConfirmation = async (confirmed) => {
    setIsConfirmationModalOpen(false);
    if (confirmed) {
      await handlePresentationRequest(scannedRequest);
    }
    setScannedRequest(null);
    setManualInput('');
  };

  const handlePresentationRequest = async (request) => {
    try {
      if (!request || !request.presentation_definition) {
        throw new Error('Invalid presentation request');
      }

      const { presentation_definition, client_id, nonce, state } = request;

      if (!Array.isArray(credentials) || credentials.length === 0) {
        throw new Error('No credentials available');
      }

      const matchingCredential = credentials.find(cred => {
        return presentation_definition.input_descriptors.some(descriptor =>
          cred.type.includes(descriptor.name)
        );
      });

      if (!matchingCredential) {
        throw new Error('No matching credential found');
      }

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

      // In a real-world scenario, you would sign the VP token here

      const response = await axios.post(client_id, {
        vp_token: vpToken,
        state: state
      });

      console.log('Presentation response:', response.data);
      setSuccessMessage('Credential successfully presented to the verifier.');
      setError(null);
    } catch (error) {
      console.error('Error in credential presentation:', error);
      setError(error.message || 'Failed to present credential. Please try again.');
    }
  };

  const handleManualInputSubmit = () => {
    if (manualInput.trim()) {
      processRequest(manualInput);
    } else {
      setError('Please enter a valid JWT.');
    }
  };

  return (
    <div className="credential-presentation">
      <div className="option-buttons">
        {!isScanning && (
          <button onClick={() => setIsScanning(true)} className="scan-button">
            Scan Presentation Request
          </button>
        )}
      </div>

      {isScanning && (
        <QrReader
          onResult={handleScan}
          constraints={{ facingMode: 'environment' }}
          className="qr-reader"
        />
      )}

      <div className="manual-input-section">
        <h3>Or enter the request manually:</h3>
        <textarea
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Paste the JWT here"
          rows="6"
          className="manual-input-textarea"
        />
        <button onClick={handleManualInputSubmit} className="submit-button">
          Submit Request
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      {isConfirmationModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Credential Presentation</h2>
            <p>Do you want to share your credentials with the verifier?</p>
            <div className="modal-buttons">
              <button onClick={() => handleConfirmation(true)}>Yes</button>
              <button onClick={() => handleConfirmation(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CredentialPresentation;